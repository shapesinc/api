const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const express = require("express");
const { createServer } = require("http");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const ngrok = require("ngrok"); 
dotenv.config();

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN; 


const BOT_NAME = SHAPES_USERNAME || "Bot";

// Check if required environment variables are set
if (!SHAPES_API_KEY || !SHAPES_USERNAME) {
  console.error(
    "Missing SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME in environment variables"
  );
  process.exit(1); // Exit if essential variables are missing
}

// Port for the local web server
const PORT = 3000;

// --- Express App and HTTP Server ---
const app = express();
const server = createServer(app);

let currentQr = null; // Variable to store the latest QR code data
let ngrokUrl = null; // Variable to store the ngrok URL

// Serve static files from 'public' directory
app.use(express.static("public"));

// Serve a basic page indicating the server is running and showing QR code
app.get("/", (_req, res) => {
  if (currentQr) {
    // Show QR on the web page if available
    qrcode.toDataURL(currentQr, (err, url) => {
      if (err) {
        return res.status(500).send("Error generating QR");
      }
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Bot QR Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
            img { max-width: 300px; margin: 20px auto; display: block; }
            .container { max-width: 600px; margin: 0 auto; }
            .status { padding: 10px; background-color: #f0f0f0; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>WhatsApp Bot</h1>
            <div class="status">Status: Waiting for QR scan</div>
            <img src="${url}" alt="QR Code">
            <p>Scan this QR code with WhatsApp to connect the bot</p>
            <p>This page will automatically refresh when the status changes</p>
          </div>
          <script>
            // Refresh page every 30 seconds to check for new status
            setTimeout(() => { location.reload(); }, 30000);
          </script>
        </body>
        </html>
      `);
    });
  } else if (client && client.info) {
    // Show ready state if client is connected
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Bot Status</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .status { padding: 10px; background-color: #d4edda; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>WhatsApp Bot</h1>
          <div class="status">Status: Connected</div>
          <p>Bot is ready and running as ${client.info.wid.user}</p>
          <p>Access this dashboard at: <a href="${ngrokUrl}">${ngrokUrl}</a></p>
        </div>
      </body>
      </html>
    `);
  } else {
    // Show initializing state
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Bot Status</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .status { padding: 10px; background-color: #fff3cd; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>WhatsApp Bot</h1>
          <div class="status">Status: Initializing</div>
          <p>WhatsApp Bot backend is starting up...</p>
          <p>This page will refresh automatically</p>
          <script>
            // Refresh page every 5 seconds during initialization
            setTimeout(() => { location.reload(); }, 5000);
          </script>
        </div>
      </body>
      </html>
    `);
  }
});

// Endpoint to get the current QR code as an image
app.get("/qr", (_req, res) => {
  if (currentQr) {
    qrcode.toDataURL(currentQr, (err, url) => {
      if (err) {
        return res.status(500).send("Error generating QR");
      }
      res.send(`<img src="${url}" alt="QR Code">`);
    });
  } else {
    res.status(404).send("No QR code available");
  }
});

// API endpoint to get the client status
app.get("/api/status", (_req, res) => {
  if (client && client.info) {
    res.json({
      status: "connected",
      user: client.info.wid.user,
      ngrokUrl: ngrokUrl
    });
  } else if (currentQr) {
    res.json({
      status: "waiting_for_scan",
      qrAvailable: true
    });
  } else {
    res.json({
      status: "initializing"
    });
  }
});

// Start the HTTP server and initialize ngrok
async function startServer() {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  try {
    // Configure and start ngrok
    if (NGROK_AUTH_TOKEN) {
      await ngrok.authtoken(NGROK_AUTH_TOKEN);
    }
    
    ngrokUrl = await ngrok.connect({
      addr: PORT,
      region: 'us', // or choose appropriate region
    });
    
    console.log(`Ngrok tunnel created at: ${ngrokUrl}`);
    console.log(`QR Code will be available at: ${ngrokUrl}/qr`);
  } catch (error) {
    console.error("Error starting ngrok:", error);
    console.log("Continuing with local server only");
  }
}

// --- Graceful Shutdown ---
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down gracefully.");
  
  // Close ngrok tunnel if it exists
  if (ngrokUrl) {
    try {
      await ngrok.disconnect();
      console.log("Ngrok tunnel closed.");
    } catch (err) {
      console.error("Error closing ngrok tunnel:", err);
    }
  }
  
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      if (client && client.destroy) {
        client
          .destroy()
          .then(() => {
            console.log("WhatsApp client destroyed.");
            process.exit(0);
          })
          .catch((err) => {
            console.error("Error destroying WhatsApp client:", err);
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

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down.");
  process.kill(process.pid, "SIGTERM"); // Send SIGTERM to trigger graceful shutdown
});

// --- Shapes API Client ---
const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: "https://api.shapes.inc/v1",
});

// --- WhatsApp Web Client ---
const client = new Client({
  authStrategy: new LocalAuth(), // Use local authentication to save session
  puppeteer: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--no-zygote",
      "--disable-extensions",
      "--disable-dev-shm-usage",
    ],
    headless: true, // Run in headless mode (no browser window)
  },
});

// --- WhatsApp Client Event Handlers ---

// Event: QR code received
client.on("qr", (qr) => {
  currentQr = qr; // Store the QR code data
  console.log("QR Code received."); // Simplified log
  qrcodeTerminal.generate(qr, { small: true }); // Display QR in console logs
  
  console.log(`QR Code available at: ${ngrokUrl}/qr`);
  console.log(`Scan QR code to connect WhatsApp or visit ${ngrokUrl}`);
});

// Event: Client is ready
client.on("ready", () => {
  console.log(`Client is ready! Logged in as ${client.info.wid.user}`);
  currentQr = null; // Clear the QR code once ready
  console.log(`Access dashboard at: ${ngrokUrl}`);
});

// Event: Authentication successful
client.on("authenticated", () => {
  console.log("Authenticated successfully");
});

// Event: Authentication failed
client.on("auth_failure", (msg) => {
  console.error("Authentication failed:", msg);
});

// Event: Client disconnected
client.on("disconnected", (reason) => {
  console.warn("Disconnected:", reason);
  // You might want to add logic here to attempt reconnection
});

// --- Chat History Management ---
// Store chat histories in memory
const chatHistories = {};

// Limit the chat history length per chat
const maxHistoryLength = 15;

// Function to add a message to chat history
function addMessageToHistory(chatId, message) {
  if (!chatHistories[chatId]) {
    chatHistories[chatId] = [];
  }
  chatHistories[chatId].push({
    author: message.author,
    body: message.body,
    timestamp: message.timestamp,
  });
  // Trim history to the maximum length
  if (chatHistories[chatId].length > maxHistoryLength) {
    chatHistories[chatId].shift(); // Remove the oldest message
  }
}

// Function to get chat history for a given chat ID
function getChatHistory(chatId) {
  return chatHistories[chatId] || [];
}

// --- Rate Limiting for Shapes API ---
let requestQueue = []; // Queue for API requests
let isProcessing = false; // Flag to indicate if a request is being processed

// Function to process the request queue with a delay
async function processQueue() {
  if (isProcessing) return; // If already processing, wait
  if (requestQueue.length === 0) return; // If queue is empty, stop

  isProcessing = true; // Set processing flag
  const request = requestQueue.shift(); // Get the next request from the queue
  await request(); // Execute the request

  isProcessing = false; // Reset processing flag

  // Process the next request after a delay to respect rate limits (5 RPM = 12 seconds delay)
  setTimeout(() => {
    processQueue();
  }, 12000); // 12 seconds delay
}

// --- Shapes API Interaction ---
// Function to send a message to the Shapes API and get a response
async function processWithShapes(content, userId, threadId, chatHistory) {
  return new Promise((resolve) => {
    // Add the request to the queue
    requestQueue.push(async () => {
      try {
        if (!content || content.trim() === "") {
          resolve("Please provide some text.");
          return;
        }

        // Format chat history for the API
        const messages = chatHistory.map((message) => ({
          role: message.author === userId ? "user" : "assistant",
          content: message.body,
        }));

        // Add the current user message
        messages.push({ role: "user", content });

        // Set custom headers for user and channel identification
        const headers = {
          "X-User-Id": userId,
          ...(threadId && { "X-Channel-Id": threadId }),
        };

        // Call the Shapes API
        const response = await shapes.chat.completions.create(
          {
            model: `shapesinc/${SHAPES_USERNAME}`, // Use the configured shape username
            messages: messages,
          },
          { headers },
        );

        // Resolve the promise with the API response content
        resolve(response.choices[0]?.message?.content || "I didn't get that.");
      } catch (error) {
        console.error("Shapes API Error:", error.message);
        // Resolve with an error message if API call fails
        resolve(
          "I couldn't understand your last request can you send it again?"
        );
      }
    });

    // Start processing the queue if not already running
    processQueue();
  });
}

// Helper function to check if the message is directly addressed to the bot
function isDirectedToBot(msg, botInfo) {
  const messageBody = msg.body.toLowerCase().trim();
  const mentionedUsers = msg.mentionedIds || [];
  const isMentionedDirectly = mentionedUsers.includes(
    botInfo?.wid?._serialized
  );
  const botNameRegex = new RegExp(`^${BOT_NAME.toLowerCase()}[\\s\\?\\!\\.]`); // Bot name at the beginning, followed by space or punctuation
  const isNameCalled = botNameRegex.test(messageBody);
  console.log(`isDirectedToBot: messageBody=${messageBody}, isMentionedDirectly=${isMentionedDirectly}, isNameCalled=${isNameCalled}`);
  return isMentionedDirectly || isNameCalled;
}

// --- Main Message Handling ---
// Event: Message received
client.on("message", async (msg) => {
  // Ignore messages sent by the bot itself or before the client is ready
  if (msg.fromMe || !client.info) return;

  const chat = await msg.getChat(); // Get the chat object
  const chatId = chat.id._serialized; // Get the unique chat ID

  // Add the incoming message to the chat history
  addMessageToHistory(chatId, msg);

  const messageBody = msg.body.toLowerCase().trim(); // Get and format message body
  const userId = msg.from; // Get the message author's user ID
  const threadId = chat.id._serialized; // Use chat ID as thread ID for API
  const isGroup = chat.isGroup; // Check if it's a group chat
  const isDirectMessage = !isGroup; // Check if it's a direct message

  // Check if the message is a reply to the bot
  const quotedMessage = await msg.getQuotedMessage();
  const isReplyToBot = quotedMessage && quotedMessage.fromMe;

  // Check if the bot's name is mentioned anywhere in the message (case-insensitive, whole word)
  const botNameMentioned = new RegExp(`\\b${BOT_NAME.toLowerCase()}\\b`).test(messageBody);
  
  // Check if directly addressed to the bot
  const isDirectlyAddressed = isDirectedToBot(msg, client.info);

  // --- Command Handling ---
  // Handle the !ask command (for direct queries)
  if (messageBody.startsWith("!ask ")) {
    const query = msg.body.slice(5).trim(); // Extract the query after "!ask "
    if (!query) return msg.reply("Please provide a query after `!ask`"); // Reply if query is empty
    await chat.sendStateTyping(); // Show typing indicator
    // Process the query with Shapes API, using current chat history
    const reply = await processWithShapes(
      query,
      userId,
      threadId,
      getChatHistory(chatId)
    );
    await chat.clearState(); // Clear typing indicator
    return msg.reply(reply); // Reply with the API response
  }

  // Handle the !shape command (similar to !ask, possibly for group use)
  if (isGroup && messageBody.startsWith("!shape ")) {
    const query = msg.body.slice(7).trim(); // Extract the query after "!shape "
    if (!query) return msg.reply("Please provide a query after `!shape`"); // Reply if query is empty
    await chat.sendStateTyping(); // Show typing indicator
    // Process the query with Shapes API, using current chat history
    const reply = await processWithShapes(
      query,
      userId,
      threadId,
      getChatHistory(chatId)
    );
    await chat.clearState(); // Clear typing indicator
    return msg.reply(reply); // Reply with the API response
  }

  // --- Response Triggering (when directly addressed or replied to) ---
  const shouldRespond =
    isDirectMessage ||
    (isGroup &&
      (isDirectlyAddressed ||
       isReplyToBot ||
       botNameMentioned
      )
    );

  console.log(`Message Trigger Check: isDirectMessage=${isDirectMessage}, isGroup=${isGroup}, isDirectlyAddressed=${isDirectlyAddressed}, isReplyToBot=${isReplyToBot}, botNameMentioned=${botNameMentioned}, shouldRespond=${shouldRespond}`);

  if (shouldRespond) {
    let contentToProcess = msg.body;

    // In group chats, remove mentions of the bot and the bot's name from the message body
    if (isGroup) {
      if (client.info?.wid?._serialized) {
         contentToProcess = contentToProcess.replace(
           new RegExp(`@${client.info.wid._serialized}`, "gi"),
           "",
         );
      }
      contentToProcess = contentToProcess
        .replace(new RegExp(`\\b${BOT_NAME}\\b`, "gi"), "")
        .trim();
    }

    // If the content is empty after removing mentions/name, don't process
    if (!contentToProcess) {
        console.log("Content empty after cleaning, not processing.");
        return;
    }

    await chat.sendStateTyping(); // Show typing indicator
    // Process the cleaned message content with Shapes API
    const reply = await processWithShapes(
      contentToProcess,
      userId,
      threadId,
      getChatHistory(chatId)
    );
    await chat.clearState(); // Clear typing indicator
    return msg.reply(reply); // Reply directly to the message
  }
});

// Event: Message created (useful for commands sent by the bot itself, like !ping)
client.on("message_create", async (message) => {
  // Only process messages that are !ping and sent by the bot itself
  if (message.body === "!ping" && message.fromMe) {
    const userId = message.from;
    const chat = await message.getChat();
    const threadId = chat.id._serialized;
    const content = message.body;

    const reply = await processWithShapes(
      content,
      userId,
      threadId,
      getChatHistory(chat.id._serialized)
    );
    // Reply to the message that triggered this event
    message.reply(reply);
  }
});

// Start the server and initialize the WhatsApp client
startServer().then(() => {
  client.initialize();
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});