// whatsapp-bot/index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal'); // <-- Import qrcode-terminal
const express = require('express');
// const ngrok = require('ngrok');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const BOT_NAME = SHAPES_USERNAME || 'Bot';

if (!SHAPES_API_KEY || !SHAPES_USERNAME) {
    console.error("Missing SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME in environment variables");
    process.exit(1);
}

const app = express();
const server = createServer(app);
const io = new Server(server);

let currentQr = null;

app.get('/', (_req, res) => {
    if (currentQr) {
        qrcode.toDataURL(currentQr, (err, url) => {
            if (err) {
                return res.status(500).send('Error generating QR');
            }
            res.send(`<img src="${url}"><p>Scan with WhatsApp</p><p>Or connect via WebSocket for real-time updates.</p>`);
        });
    } else {
         res.send('WhatsApp Bot backend is running. Waiting for QR code or client ready state.');
    }
});


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}. Socket.IO is running.`);
    console.log(`QR Code data will be emitted via WebSocket on port ${PORT} and displayed in logs.`); // <-- Updated log
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully.');
    if (server) {
        server.close(() => {
            console.log('HTTP server closed.');
            if (io) {
                 io.close(() => console.log('Socket.IO server closed.'));
            }
            if (client && client.destroy) {
                 client.destroy().then(() => {
                     console.log('WhatsApp client destroyed.');
                     process.exit(0);
                 }).catch(err => {
                     console.error('Error destroying WhatsApp client:', err);
                     process.exit(1);
                 });
            } else {
                 process.exit(0);
            }
        });
    } else {
        process.exit(0);
    }
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down.');
    process.kill(process.pid, 'SIGTERM');
});

io.on('connection', (socket) => {
    console.log('Frontend connected via WebSocket');
    if (currentQr) {
        qrcode.toDataURL(currentQr, (err, url) => {
            if (err) {
                console.error('Error generating QR Data URL for new client:', err);
                return;
            }
            socket.emit('qrCode', url);
            console.log('Sent existing QR to new frontend connection.');
        });
    }
    socket.on('disconnect', () => {
        console.log('Frontend disconnected');
    });
});


const shapes = new OpenAI({
    apiKey: SHAPES_API_KEY,
    baseURL: 'https://api.shapes.inc/v1',
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--no-zygote',
            '--disable-extensions',
            '--disable-dev-shm-usage'
        ],
        headless: true
    }
});

client.on('qr', qr => {
    currentQr = qr;
    console.log('QR Code received.'); // <-- Simplified log
    qrcodeTerminal.generate(qr, { small: true }); // <-- Display QR in console logs!

    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Error generating QR Data URL for Socket.IO:', err);
            return;
        }
        io.emit('qrCode', url); // <-- Continue emitting via Socket.IO
        console.log('Emitted QR Data URL via WebSocket.'); // <-- Specific log for Socket.IO
    });
});

client.on('ready', () => {
    console.log(`Client is ready! Logged in as ${client.info.wid.user}`);
    currentQr = null;
    io.emit('ready', { message: 'WhatsApp client is ready!' });
});

client.on('authenticated', () => {
    console.log('Authenticated successfully');
});

client.on('auth_failure', msg => {
    console.error('Authentication failed:', msg);
    io.emit('auth_failure', { message: 'WhatsApp authentication failed', details: msg });
});

client.on('disconnected', reason => {
    console.warn('Disconnected:', reason);
});


async function processWithShapes(content, userId, threadId) {
    if (!content || content.trim() === '') return "Please provide some text.";
    try {
        const headers = {
            "X-User-Id": userId,
            ...(threadId && { "X-Channel-Id": threadId }),
        };
        const response = await shapes.chat.completions.create({
            model: `shapesinc/${SHAPES_USERNAME}`,
            messages: [{ role: "user", content }],
        }, { headers });

        return response.choices[0]?.message?.content || "I didn't get that.";
    } catch (error) {
        console.error(' Shapes API Error:', error.message);
        return "AI failed to respond. Try again later.";
    }
}

function isDirectedToBot(msg, botInfo) {
    const messageBody = msg.body.toLowerCase().trim();
    const mentionedUsers = msg.mentionedIds || [];
    const isMentionedDirectly = mentionedUsers.includes(botInfo?.wid?._serialized);
    const botNameRegex = new RegExp(`\\b${BOT_NAME.toLowerCase()}\\b`);
    return isMentionedDirectly || botNameRegex.test(messageBody);
}

client.on('message', async (msg) => {
    if (msg.fromMe || !client.info) return;

    const chat = await msg.getChat();
    const messageBody = msg.body.toLowerCase().trim();
    const userId = msg.from;
    const threadId = chat.id._serialized;
    const isGroup = chat.isGroup;
    const isDirectMessage = !isGroup;


    if (messageBody.startsWith('!ask ')) {
        const query = msg.body.slice(5).trim();
        if (!query) return msg.reply("Please provide a query after `!ask`");
        await chat.sendStateTyping();
        const reply = await processWithShapes(query, userId, threadId);
        await chat.clearState();
        return msg.reply(reply); 
    }

    if (isGroup && messageBody.startsWith('!shape ')) {
        const query = msg.body.slice(7).trim();
        if (!query) return msg.reply("Please provide a query after `!shape`");
        await chat.sendStateTyping();
        const reply = await processWithShapes(query, userId, threadId);
        await chat.clearState();
        return msg.reply(reply); 
    }

    const isDirectlyAddressed = isDirectedToBot(msg, client.info);
    if (isDirectMessage || (isGroup && isDirectlyAddressed)) {
        let contentToProcess = msg.body;
        if (isGroup) {
            contentToProcess = contentToProcess.replace(new RegExp(`@${client.info.wid._serialized}`, 'gi'), '');
            contentToProcess = contentToProcess.replace(new RegExp(`\\b${BOT_NAME}\\b`, 'gi'), '').trim();
        }

        if (!contentToProcess) return;
        await chat.sendStateTyping();
        const reply = await processWithShapes(contentToProcess, userId, threadId);
        await chat.clearState();
        return msg.reply(reply); // Reply directly to the message
    }
});


client.on('message_create', async message => { 
	if (message.body === '!ping') {
        const userId = message.from;
        const chat = await message.getChat(); 
        const threadId = chat.id._serialized;
        const content = message.body; 

        const reply = await processWithShapes(content, userId, threadId);
		message.reply(reply);
	}
});

client.initialize();
