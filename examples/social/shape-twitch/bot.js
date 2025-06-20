import WebSocket from 'ws';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const CONFIG = {
  RESPONSE_MODE: process.env.RESPONSE_MODE || 'COMMAND_ONLY',
  COMMAND_PREFIX: '!',
  COOLDOWN_SECONDS: parseInt(process.env.COOLDOWN_SECONDS) || 15,
  MAX_RESPONSE_LENGTH: parseInt(process.env.MAX_RESPONSE_LENGTH) || 500,
  SELECTIVE_CHANCE: parseFloat(process.env.SELECTIVE_CHANCE) || 0.3
};

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const OAUTH_TOKEN = process.env.TWITCH_OAUTH;
const TWITCH_CHANNEL = process.env.TWITCH_CHANNEL;

if (!SHAPES_API_KEY || !SHAPES_USERNAME || !OAUTH_TOKEN || !TWITCH_CHANNEL) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1',
});

const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
let lastResponseTime = 0;
const userCooldowns = new Map();

const SHAPES_COMMANDS = {
  ask: "Ask a question: !ask [question]",
  reset: "Reset long-term memory",
  sleep: "Generate long-term memory",
  info: "Get Shape information",
  web: "Search the web: !web [query]",
  help: "Show this help message",
  imagine: "Generate images: !imagine [prompt]",
  wack: "Reset short-term memory"
};

socket.on('open', () => {
  console.log(`Connecting to #${TWITCH_CHANNEL}`);
  socket.send(`PASS ${OAUTH_TOKEN}`);
  socket.send(`NICK ${SHAPES_USERNAME}`);
  socket.send(`JOIN #${TWITCH_CHANNEL}`);
  sendMessage(`🤖 ShapeBot activated! Mode: ${CONFIG.RESPONSE_MODE}`);
});

socket.on('message', async (data) => {
  const raw = data.toString().trim();
  
  if (raw === 'PING :tmi.twitch.tv') {
    socket.send('PONG :tmi.twitch.tv');
    return;
  }
  
  const parsed = parseMessage(raw);
  if (!parsed || parsed.username === SHAPES_USERNAME) return;
  
  console.log(`[${parsed.username}]: ${parsed.content}`);
 
  if (parsed.content.startsWith(CONFIG.COMMAND_PREFIX)) {
    const [cmd, ...args] = parsed.content.slice(1).split(' ');
    const command = cmd.toLowerCase();
    
    if (command === 'help') {
      showHelp(parsed.username);
      return;
    }
    
    if (SHAPES_COMMANDS[command]) {
      await handleCommand(parsed, command, args.join(' '));
      return;
    }
  }
  
  if (CONFIG.RESPONSE_MODE === 'ALL_MESSAGES') {
    await generateResponse(parsed);
  } 
  else if (CONFIG.RESPONSE_MODE === 'SELECTIVE' && Math.random() < CONFIG.SELECTIVE_CHANCE) {
    await generateResponse(parsed);
  }
});

function showHelp(username) {
  let helpText = "📚 Available commands: ";
  for (const [cmd, desc] of Object.entries(SHAPES_COMMANDS)) {
    helpText += `!${cmd} - ${desc}, `;
  }
  helpText = helpText.slice(0, -2); 
  
  if (helpText.length > CONFIG.MAX_RESPONSE_LENGTH) {
    helpText = helpText.substring(0, CONFIG.MAX_RESPONSE_LENGTH - 3) + '...';
  }
  
  sendMessage(`@${username} ${helpText}`);
}

async function handleCommand(parsed, command, args) {
  if (isOnCooldown(parsed.username)) return;
  
  try {
    const fullCommand = `${CONFIG.COMMAND_PREFIX}${command}${args ? ' ' + args : ''}`;
    
    const response = await queryShapes(
      fullCommand, 
      parsed.username, 
      `twitch_${TWITCH_CHANNEL}`
    );
    
    if (command === 'imagine') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = response.match(urlRegex) || [];
      
      if (urls.length > 0) {
        urls.forEach(url => {
          sendMessage(`🎨 Image for @${parsed.username}: ${url}`);
        });
      } else {
        sendMessage(`@${parsed.username} ${response}`);
      }
    } 
    else if (command === 'voice') {
      if (response.startsWith('http')) {
        sendMessage(`🔊 Voice for @${parsed.username}: ${response}`);
      } else {
        sendMessage(`@${parsed.username} ${response}`);
      }
    } 
    else {
      sendMessage(`${command === 'ask' ? `@${parsed.username} ` : ''}${response}`);
    }
    
    updateCooldown(parsed.username);
  } catch (error) {
    console.error(`Command error: ${error.message}`);
    sendMessage(`⚠️ Error with !${command}`);
  }
}

async function generateResponse(parsed) {
  if (isOnCooldown(parsed.username)) return;
  
  try {
    const response = await queryShapes(
      `Respond to this in 1-2 sentences: ${parsed.content}`,
      parsed.username,
      `twitch_${TWITCH_CHANNEL}`
    );
    
    sendMessage(`@${parsed.username} ${response}`);
    updateCooldown(parsed.username);
  } catch (error) {
    console.error(`Response error: ${error.message}`);
  }
}

async function queryShapes(prompt, userId, channelId) {
  try {
    const response = await shapes.chat.completions.create({
      model: `shapesinc/${SHAPES_USERNAME}`,
      messages: [{ role: "user", content: prompt }],
      max_tokens: CONFIG.MAX_RESPONSE_LENGTH
    }, {
      headers: {
        "X-User-Id": userId,
        "X-Channel-Id": channelId
      }
    });

    let text = response.choices[0].message.content;
    return text.length > CONFIG.MAX_RESPONSE_LENGTH 
      ? text.substring(0, CONFIG.MAX_RESPONSE_LENGTH) + '...' 
      : text;
  } catch (error) {
    console.error('Shapes API Error:', error.status, error.message);
    return error.status === 429 
      ? "⏳ Too many requests! Try again later." 
      : "⚠️ Error processing request";
  }
}

function parseMessage(raw) {
  const match = raw.match(/:(.+)!.+@.+ PRIVMSG #(.+) :(.+)/);
  return match ? { username: match[1], channel: match[2], content: match[3] } : null;
}

function sendMessage(text) {
  if (Date.now() - lastResponseTime < CONFIG.COOLDOWN_SECONDS * 1000) return;
  if (!text.trim()) return;
  
  const message = `PRIVMSG #${TWITCH_CHANNEL} :${text}`;
  socket.send(message);
  lastResponseTime = Date.now();
  console.log(`[BOT]: ${text}`);
}

function isOnCooldown(username) {
  const last = userCooldowns.get(username) || 0;
  return Date.now() - last < CONFIG.COOLDOWN_SECONDS * 1000;
}

function updateCooldown(username) {
  userCooldowns.set(username, Date.now());
}

process.on('SIGINT', () => {
  sendMessage("🛑 ShapeBot signing off!");
  setTimeout(() => process.exit(), 1000);
});
