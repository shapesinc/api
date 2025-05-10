// Corrected import: Include MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin
import { MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin } from "matrix-bot-sdk";
import OpenAI from "openai";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to .env file (assuming it's in the same directory as the script)
const envPath = join(__dirname, '.env');

// Path for the activated rooms JSON file
const ACTIVATED_ROOMS_FILE = join(__dirname, 'activated_rooms.json');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
    console.error(`[ERROR] .env file not found at ${envPath}`);
    process.exit(1);
}

// Load environment variables from .env file
const dotenvResult = config({ path: envPath });
if (dotenvResult.error) {
    console.error("[ERROR] Failed to load .env file:", dotenvResult.error);
    process.exit(1);
}

// Debug environment variables to confirm they are loaded
console.log("[DEBUG] Environment variables loaded:");
console.log(" HOMESERVER_URL:", process.env.HOMESERVER_URL);
console.log(" ACCESS_TOKEN:", process.env.TOKEN ? "[REDACTED]" : "undefined");
console.log(" SHAPESINC_API_KEY:", process.env.SHAPESINC_API_KEY ? "[REDACTED]" : "undefined");
console.log(" SHAPESINC_SHAPE_USERNAME:", process.env.SHAPESINC_SHAPE_USERNAME);

// Configuration
const homeserverUrl = process.env.HOMESERVER_URL || "https://matrix.org";
const accessToken = process.env.TOKEN;
if (!accessToken) {
    console.error("[ERROR] TOKEN not set in .env");
    process.exit(1);
}

const storage = new SimpleFsStorageProvider("bot.json");
const client = new MatrixClient(homeserverUrl, accessToken, storage);

// Auto-join rooms when invited
AutojoinRoomsMixin.setupOnClient(client);

// Shape API setup
const shape_api_key = process.env.SHAPESINC_API_KEY;
const shape_username = process.env.SHAPESINC_SHAPE_USERNAME;
if (!shape_api_key || !shape_username) {
    console.error("[ERROR] SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME not set in .env");
    process.exit(1);
}
const shapes_client = new OpenAI({
    apiKey: shape_api_key,
    baseURL: "https://api.shapes.inc/v1/",
});

// --- Persistence Logic ---
let activatedRooms = new Set(); // Use a Set for efficient checking

/**
 * Loads activated room IDs from the JSON file.
 * Returns a Set of room IDs.
 */
function loadActivatedRooms() {
    if (!fs.existsSync(ACTIVATED_ROOMS_FILE)) {
        console.log("[PERSISTENCE] Activated rooms file not found. Starting with empty state.");
        return new Set();
    }
    try {
        const data = fs.readFileSync(ACTIVATED_ROOMS_FILE, 'utf8');
        const roomArray = JSON.parse(data);
        if (!Array.isArray(roomArray)) {
            console.warn("[PERSISTENCE] Activated rooms file content is not an array. Starting with empty state.");
            return new Set();
        }
        console.log(`[PERSISTENCE] Loaded ${roomArray.length} activated rooms from file.`);
        return new Set(roomArray);
    } catch (err) {
        console.error("[PERSISTENCE ERROR] Failed to load activated rooms from file:", err);
        return new Set(); // Return empty set on error
    }
}

/**
 * Saves activated room IDs to the JSON file.
 */
function saveActivatedRooms() {
    try {
        const roomArray = Array.from(activatedRooms); // Convert Set to Array for JSON stringify
        const data = JSON.stringify(roomArray, null, 2); // Use 2 spaces for indentation
        fs.writeFileSync(ACTIVATED_ROOMS_FILE, data, 'utf8');
        console.log(`[PERSISTENCE] Saved ${activatedRooms.size} activated rooms to file.`);
    } catch (err) {
        console.error("[PERSISTENCE ERROR] Failed to save activated rooms to file:", err);
    }
}

// --- Message Handling ---
client.on("room.message", async (roomId, event) => {
    const botUserId = await client.getUserId();
    // Ignore messages from ourselves and messages without content
    if (!event.content || event.sender === botUserId) {
        return;
    }

    console.log(`[MESSAGE RECEIVED] In room ${roomId} from ${event.sender}.`);

    const content = event.content;
    const msgtype = content.msgtype;

    // --- Handle Text Messages ---
    if (msgtype === "m.text") {
        const body = content.body;
        if (typeof body !== "string") {
            console.log(`[HANDLER EXIT] Body is not a string for text event in room ${roomId}.`);
            return;
        }

        // Process commands starting with '!'
        if (body.startsWith("!")) {
            const [cmd, ...args] = body.slice(1).split(" ");
            const command = cmd.toLowerCase();
            let replyBody = "";

            switch (command) {
                case "ping":
                    replyBody = "pong";
                    break;

                case "say":
                    replyBody = args.join(" ") || "say what?";
                    break;

                case "activate":
                    if (activatedRooms.has(roomId)) {
                        replyBody = `I am already active for ${shape_username} in this room.`;
                    } else {
                        activatedRooms.add(roomId);
                        saveActivatedRooms();
                        replyBody = `Hello! I am now active for ${shape_username} in this room. All messages here will be forwarded.`;
                    }
                    break;

                case "deactivate":
                    if (!activatedRooms.has(roomId)) {
                        replyBody = `I am not active in this room. Use !activate first.`;
                    } else {
                        activatedRooms.delete(roomId);
                        saveActivatedRooms();
                        replyBody = `I am no longer active for ${shape_username} in this room.`;
                    }
                    break;

                case "reset":
                    if (!activatedRooms.has(roomId)) {
                        replyBody = `I am not active in this room. Use !activate first.`;
                    } else {
                        const resetMessage = `The context for ${shape_username} in this room has been reset for you. You can start a new conversation.`;
                        try {
                            // Send reset signal to Shapes API
                            await shapes_client.chat.completions.create({
                                model: `shapesinc/${shape_username}`,
                                messages: [{ role: "user", content: resetMessage }],
                                max_tokens: 1000,
                                timeout: 50000, // 50 seconds timeout
                                headers: {
                                    "X-User-Id": event.sender,
                                    "X-Room-Id": roomId,
                                },
                            });
                            replyBody = resetMessage;
                        } catch (err) {
                            console.error("[RESET ERROR]", err);
                            replyBody = "Sorry, there was an error trying to reset the context with the Shape.";
                        }
                    }
                    break;

                case "llm":
                    const userInput = args.join(" ");
                    if (!userInput) {
                        replyBody = "Please provide a message for the LLM.";
                    } else {
                        try {
                            // Prepend sender's username to the message
                            const senderUsername = event.sender.split(":")[0].replace("@", "");
                            const contentForShape = `${senderUsername}: ${userInput}`;
                            const resp = await shapes_client.chat.completions.create({
                                model: `shapesinc/${shape_username}`,
                                messages: [{ role: "user", content: contentForShape }],
                                max_tokens: 1000,
                                timeout: 50000, // 50 seconds timeout
                                headers: {
                                    "X-User-Id": event.sender,
                                    "X-Room-Id": roomId,
                                },
                            });
                            if (resp.choices && resp.choices.length > 0 && resp.choices[0].message && resp.choices[0].message.content) {
                                replyBody = resp.choices[0].message.content;
                            } else {
                                replyBody = "Sorry, I couldn't get a clear response from the Shape.";
                            }
                        } catch (err) {
                            console.error("[LLM ERROR]", err);
                            if (err.code === 'ECONNABORTED') {
                                replyBody = "Sorry, the request to the Shape timed out.";
                            } else if (err.response && err.response.status === 429) {
                                replyBody = "Too many requests to the Shapes API. Please try again later.";
                            } else {
                                replyBody = "Sorry, there was an error connecting to the Shape.";
                            }
                        }
                    }
                    break;

                case "help":
                    replyBody = `Available Commands for ${shape_username}:
- !ping: Check if I'm awake (responds with "pong").
- !say <message>: Make me repeat your message.
- !activate: Enable me to respond to all text messages in this room.
- !deactivate: Stop me from responding to non-command messages.
- !reset: Reset my conversation context in this room (requires activation).
- !llm <prompt>: Send a direct query to the Shapes API.
- !help: Show this command list.`;
                    break;

                default:
                    // Ignore unknown commands
                    break;
            }

            // Only send a reply if replyBody was set by a command
            if (replyBody) {
                try {
                    await client.sendMessage(roomId, { msgtype: "m.text", body: replyBody });
                    console.log(`[COMMAND] Processed '${command}' in ${roomId}. Sent: "${replyBody.substring(0, 50)}..."`);
                } catch (err) {
                    console.error(`[COMMAND ERROR] Failed to send reply for command '${command}' in ${roomId}:`, err);
                }
            }

        } else {
            // Process non-command text messages if the room is activated
            if (activatedRooms.has(roomId)) {
                console.log(`[ACTIVATED ROOM] Processing text message in room ${roomId}: "${body.substring(0, 50)}..."`);
                let replyBody = "";
                try {
                    // Prepend sender's username to the message
                    const senderUsername = event.sender.split(":")[0].replace("@", "");
                    const contentForShape = `${senderUsername}: ${body}`;
                    const resp = await shapes_client.chat.completions.create({
                        model: `shapesinc/${shape_username}`,
                        messages: [{ role: "user", content: contentForShape }],
                        max_tokens: 1000,
                        timeout: 50000, // 50 seconds timeout
                        headers: {
                            "X-User-Id": event.sender,
                            "X-Room-Id": roomId,
                        },
                    });
                    if (resp.choices && resp.choices.length > 0 && resp.choices[0].message && resp.choices[0].message.content) {
                        replyBody = resp.choices[0].message.content;
                    } else {
                        replyBody = "Sorry, I couldn't get a clear response from the Shape.";
                    }
                } catch (err) {
                    console.error("[ACTIVATED TEXT LLM ERROR]", err);
                    if (err.code === 'ECONNABORTED') {
                        replyBody = "Sorry, the request to the Shape timed out.";
                    } else if (err.response && err.response.status === 429) {
                        replyBody = "Too many requests to the Shapes API. Please try again later.";
                    } else {
                        replyBody = "Sorry, there was an error connecting to the Shape.";
                    }
                }

                if (replyBody) {
                    try {
                        await client.sendMessage(roomId, { msgtype: "m.text", body: replyBody });
                        console.log(`[ACTIVATED ROOM] Responded in ${roomId}. Sent: "${replyBody.substring(0, 50)}..."`);
                    } catch (err) {
                        console.error(`[ACTIVATED ROOM ERROR] Failed to send response in ${roomId}:`, err);
                    }
                }
            } else {
                // Message is non-command text and room is not activated, ignore.
                console.log(`[MESSAGE IGNORED] Ignored non-command text in non-activated room ${roomId}.`);
            }
        }
    } else {
        // Ignore messages that are not text
        console.log(`[MESSAGE IGNORED] Ignored message with type ${msgtype} in room ${roomId}.`);
    }
});

// Handle room invites
client.on("room.invite", async (roomId, inviteEvent) => {
    console.log(`[INVITE] Invited to room ${roomId} by ${inviteEvent.sender}`);
    try {
        await client.joinRoom(roomId);
        console.log(`[INVITE] Successfully joined room ${roomId} after invite.`);
        try {
            await client.sendMessage(roomId, {
                msgtype: "m.text",
                body: `Hello! Thanks for the invite. Use !activate if you'd like me to respond to all messages in this room, !llm <prompt> for a direct query, !reset to start a new conversation, or !help for a list of commands.`,
            });
        } catch (e) {
            console.error("Failed to send welcome message after joining:", e);
        }
    } catch (err) {
        console.error(`[INVITE ERROR] Error joining room ${roomId} after invite:`, err);
    }
});

// Log sync state
client.on("sync", (state, prevState, data) => {
    if (state === "ERROR") {
        console.error("[SYNC ERROR] Sync encountered an error:", data);
    }
});

// Start the bot
async function startBot() {
    console.log("[STARTUP] Loading activated rooms state...");
    activatedRooms = loadActivatedRooms(); // Load state before starting client

    console.log("[STARTUP] Starting bot...");
    try {
        await client.start();
        console.log("[STARTUP] Bot started! Client is now syncing.");
        console.log(`[STARTUP] Bot user ID: ${await client.getUserId()}`);
    } catch (err) {
        console.error("[STARTUP ERROR] Error starting bot:", err);
        process.exit(1);
    }
}

startBot().catch(err => {
    console.error("[UNHANDLED STARTUP ERROR] Unhandled error during bot startup:", err);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log("\n[SHUTDOWN] SIGINT received. Stopping bot...");
    if (client) {
        await client.stop();
    }
    console.log("[SHUTDOWN] Bot stopped.");
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log("\n[SHUTDOWN] SIGTERM received. Stopping bot...");
    if (client) {
        await client.stop();
    }
    console.log("[SHUTDOWN] Bot stopped.");
    process.exit(0);
});
