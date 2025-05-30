// app.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./logger'); // Basic logger
const state = require('./state'); // State management
const messaging = require('./messaging'); // Messaging functions
const utils = require('./utils'); // Utility functions
const ShapesApiClient = require('./shapesApiClient'); // Shapes API Client

// --- Configuration from Environment Variables ---
const OPERATOR_SHAPE = process.env.OPERATOR_SHAPE_USERNAME || "operator";
const DEFAULT_SHAPE_USER = process.env.DEFAULT_SHAPE_USER || null; // Use null if not set

const SHAPES_API_KEY = process.env.SHAPES_API_KEY;
const SHAPES_API_URL = process.env.SHAPES_API_URL;

// --- Initialize App and Modules ---
const app = express();
messaging.initializeMessaging(); // Initialize Twilio/Sendblue clients

// Initialize Shapes API Client
const shapesApiClient = new ShapesApiClient(SHAPES_API_KEY, SHAPES_API_URL);


// --- Middleware ---
// Parse application/x-www-form-urlencoded for Twilio webhooks
app.use('/sms', bodyParser.urlencoded({ extended: false }));
// Parse application/json for Sendblue webhooks
app.use('/imsg', bodyParser.json());


// --- Flask Routes ---

app.post("/imsg", async (req, res) => {
    try {
        const data = req.body;

        const incomingMsg = data.content;
        const userNum = data.from_number;
        const toNumber = data.to_number; // The number the message was sent TO (your number)
        const groupId = data.group_id || null; // Use null instead of empty string if not present

        if (!incomingMsg) {
            logger.info("Empty iMessage received, ignoring.");
            return res.json({ status: "success" });
        }

        logger.info(`Received iMessage from ${userNum} (Group: ${groupId || 'N/A'}): ${incomingMsg.substring(0, 50)}...`);

        // Skip processing if this is an outbound message (sent by us)
        if (data.is_outbound) {
            logger.info("Skipping outbound iMessage.");
            return res.json({ status: "success" });
        }

        // Determine chat ID
        const chat_id = groupId || userNum;

        // Check if user/group has already selected a shape
        let shape_username = await state.getShapeUsername(chat_id);

        // Extract shape username from message if it contains a shapes.inc URL
        const extracted_username = utils.extractShapeUsername(incomingMsg);

        if (extracted_username) {
            shape_username = extracted_username;
            await state.setShapeUsername(chat_id, shape_username);

            // Only reset operator_msg_sent if using the interactive flow initially (no default)
            if (!DEFAULT_SHAPE_USER) {
                 await state.setOperatorMsgSent(chat_id, false);
            }

            logger.info(`Set shape for ${chat_id} to ${shape_username} via URL.`);

            const response_msg = `Connecting you with ${shape_username} now... You're all set! ${shape_username} is now on the line and ready to chat with you.`;

            // Send the response via Sendblue
            // Note: Sendblue's send-group-message uses group_id, send-message uses 'number'
            // The sendImessageSendblue function handles this logic.
            await messaging.sendImessageSendblue(userNum, response_msg, groupId); // Use userNum for the confirmation message if not a group? Or chat_id? Let's stick to userNum for now, confirmation should go to the sender.

            // Return acknowledgment to webhook
            return res.json({ status: "success" });
        }

        // --- Handle cases where no shape is currently selected ---
        if (!shape_username) {
            // Check if a default shape is configured
            if (DEFAULT_SHAPE_USER) {
                logger.info(`No shape selected for ${chat_id}, auto-connecting to default: ${DEFAULT_SHAPE_USER}`);
                shape_username = DEFAULT_SHAPE_USER;
                await state.setShapeUsername(chat_id, shape_username); // Set the default shape

                // Send a connection notice first
                const connection_msg = `Connecting you to ${shape_username}...`;
                await messaging.sendImessageSendblue(userNum, connection_msg, groupId); // Send notice to the user

                // Then proceed to generate and send the FIRST reply from the default shape
                // For direct messages, send typing indicator while generating the first reply
                if (!groupId) {
                    messaging.sendTypingIndicatorSendblue(userNum).catch(err => logger.warning(`Failed to send typing indicator: ${err.message}`)); // Log but don't block
                }

                const reply = await shapesApiClient.generateReply(
                    shape_username,
                    userNum, // User ID for the API
                    incomingMsg,
                    groupId // Channel ID for the API
                );

                await messaging.sendImessageSendblue(userNum, reply, groupId);
                logger.info(`Sent auto-connected reply from ${shape_username} to ${userNum}.`);

                return res.json({ status: "success" });

            } else {
                // If no default shape, use the existing interactive flow with the operator
                logger.info(`No shape selected for ${chat_id} and no default configured. Using interactive flow.`);

                const operatorMsgWasSent = await state.getOperatorMsgSent(chat_id);

                if (operatorMsgWasSent) {
                    // Auto-connect to operator if operator message was already sent
                    shape_username = OPERATOR_SHAPE;
                    await state.setShapeUsername(chat_id, shape_username); // Set operator as the shape

                    // Let user know they're now connected to the operator
                    const connection_msg = `You are now connected to ${shape_username}.`;
                    await messaging.sendImessageSendblue(userNum, connection_msg, groupId);

                    // Create Brain with operator and generate reply
                     // For direct messages, send typing indicator
                    if (!groupId) {
                         messaging.sendTypingIndicatorSendblue(userNum).catch(err => logger.warning(`Failed to send typing indicator: ${err.message}`)); // Log but don't block
                    }

                    const reply = await shapesApiClient.generateReply(
                        shape_username,
                        userNum, // User ID for the API
                        incomingMsg,
                        groupId // Channel ID for the API
                    );

                    await messaging.sendImessageSendblue(userNum, reply, groupId);
                    logger.info(`Auto-connected ${chat_id} to ${shape_username} and sent response.`);
                    return res.json({ status: "success" });

                } else {
                    // Send the initial operator message asking for shape selection
                    shape_username = OPERATOR_SHAPE; // Use operator for the prompt itself

                    const operator_msg = "Hello, Shapes Switchboard here! I'll connect you with a Shape now. Who would you like to speak with today? Just visit https://shapes.inc to browse our directory, then send me their profile link (like https://shapes.inc/tenshi) and I'll connect you right away.";

                    // Send the operator message via Sendblue
                    await messaging.sendImessageSendblue(userNum, operator_msg, groupId);

                    // Mark that operator message was sent for this chat
                    await state.setOperatorMsgSent(chat_id, true);

                    logger.info(`Sent initial operator prompt to ${userNum}.`);
                    // We sent the prompt, do not generate a response to the *incoming* message yet
                    return res.json({ status: "success" });
                }
            }
        }

        // --- Handle cases where a shape is already selected ---
        // If we reach here, shape_username is not null
        logger.info(`Shape already selected for ${chat_id}: ${shape_username}. Generating reply.`);

        // For direct messages (not groups), send typing indicator
        if (!groupId) {
            messaging.sendTypingIndicatorSendblue(userNum).catch(err => logger.warning(`Failed to send typing indicator: ${err.message}`)); // Log but don't block
        }

        // Generate reply using Shapes API with the selected shape
        const reply = await shapesApiClient.generateReply(
            shape_username,
            userNum, // User ID for the API
            incomingMsg,
            groupId // Channel ID for the API
        );

        // Send the response via Sendblue
        await messaging.sendImessageSendblue(userNum, reply, groupId);

        logger.info(`Sent response from ${shape_username} to ${userNum}.`);

        // Return acknowledgment to webhook
        return res.json({ status: "success" });

    } catch (e) {
        logger.error(`Error processing iMessage: ${e.message}`);
        // Return an error response (consider sending an error message back to user?)
        // For webhooks, often just returning a 500 is sufficient, platforms handle retries.
        return res.status(500).json({ status: "error", message: e.message });
    }
});


app.post("/sms", async (req, res) => {
    // Twilio webhooks expect TwiML response
    const twiml = new messaging.MessagingResponse();

    try {
        const incomingMsg = req.body.Body;
        const userNum = req.body.From;
        const groupSid = req.body.GroupSid || null; // Twilio Group SID

        logger.info(`Received SMS from ${userNum} (Group: ${groupSid || 'N/A'}): ${incomingMsg.substring(0, 50)}...`);

        if (!incomingMsg) {
             logger.info("Empty SMS received, ignoring.");
             return res.type('text/xml').send(twiml.toString());
        }

        // Determine chat ID
        const chat_id = groupSid || userNum;

        // Check if user/group has already selected a shape
        let shape_username = await state.getShapeUsername(chat_id);

        // Extract shape username from message if it contains a shapes.inc URL
        const extracted_username = utils.extractShapeUsername(incomingMsg);

        if (extracted_username) {
            shape_username = extracted_username;
            await state.setShapeUsername(chat_id, shape_username);

            // Only reset operator_msg_sent if using the interactive flow initially (no default)
            if (!DEFAULT_SHAPE_USER) {
                 await state.setOperatorMsgSent(chat_id, false);
            }

            logger.info(`Set shape for ${chat_id} to ${shape_username} via URL.`);

            const response_msg = `Connecting you with ${shape_username} now... You're all set! ${shape_username} is now on the line and ready to chat with you.`;

            twiml.message(response_msg);
            return res.type('text/xml').send(twiml.toString());
        }

        // --- Handle cases where no shape is currently selected ---
        if (!shape_username) {
            // Check if a default shape is configured
            if (DEFAULT_SHAPE_USER) {
                logger.info(`No shape selected for ${chat_id}, auto-connecting to default: ${DEFAULT_SHAPE_USER}`);
                shape_username = DEFAULT_SHAPE_USER;
                await state.setShapeUsername(chat_id, shape_username); // Set the default shape

                // Generate the FIRST reply from the default shape
                const reply = await shapesApiClient.generateReply(
                    shape_username,
                    userNum, // User ID for the API
                    incomingMsg,
                    groupSid // Channel ID for the API
                );

                // Combine connection notice and the first reply in one message for SMS
                const fullReply = `Connecting you to ${shape_username}...\n\n${reply}`;
                twiml.message(fullReply);

                logger.info(`Sent auto-connected reply from ${shape_username} to ${userNum} via SMS.`);
                return res.type('text/xml').send(twiml.toString());

            } else {
                 // If no default shape, use the existing interactive flow with the operator
                logger.info(`No shape selected for ${chat_id} and no default configured. Using interactive flow.`);

                const operatorMsgWasSent = await state.getOperatorMsgSent(chat_id);

                if (operatorMsgWasSent) {
                    // Auto-connect to operator if operator message was already sent
                    shape_username = OPERATOR_SHAPE;
                    await state.setShapeUsername(chat_id, shape_username); // Set operator as the shape

                    // Create Brain with operator and generate reply
                    const reply = await shapesApiClient.generateReply(
                        shape_username,
                        userNum, // User ID for the API
                        incomingMsg,
                        groupSid // Channel ID for the API
                    );

                    // Combine connection notice and reply
                    const fullReply = `You are now connected to ${shape_username}.\n\n${reply}`;
                    twiml.message(fullReply);

                    logger.info(`Auto-connected ${chat_id} to ${shape_username} and sent response via SMS.`);
                     return res.type('text/xml').send(twiml.toString());

                } else {
                    // Send the initial operator message asking for shape selection
                    shape_username = OPERATOR_SHAPE; // Use operator for the prompt itself

                    const operator_msg = "Hello, Shapes Switchboard here! I'll connect you with a Shape now. Who would you like to speak with today? Just visit shapes.inc to browse our directory, then send me their profile link (like shapes.inc/shoutingguy) and I'll connect you right away.";

                    twiml.message(operator_msg);

                    // Mark that operator message was sent for this chat
                    await state.setOperatorMsgSent(chat_id, true);

                    logger.info(`Sent initial operator prompt to ${userNum} via SMS.`);
                    // We sent the prompt, do not generate a response to the *incoming* message yet
                    return res.type('text/xml').send(twiml.toString());
                }
            }
        }


        // --- Handle cases where a shape is already selected ---
        // If we reach here, shape_username is not null
        logger.info(`Shape already selected for ${chat_id}: ${shape_username}. Generating reply.`);

        // Generate reply using Shapes API with selected shape
        const reply = await shapesApiClient.generateReply(
            shape_username,
            userNum, // User ID for the API
            incomingMsg,
            groupSid // Channel ID for the API
        );

        // Send the response via Twilio
        twiml.message(reply);

        logger.info(`Sent response from ${shape_username} to ${userNum} via SMS.`);
        return res.type('text/xml').send(twiml.toString());


    } catch (e) {
        logger.error(`Error processing SMS: ${e.message}`);
        // Return a generic error message via TwiML
        twiml.message("Sorry, I'm having trouble processing your message right now.");
        res.type('text/xml').send(twiml.toString());
    }
});


// --- Group Management Endpoints (Optional, if you need to initiate groups) ---
// These are *not* from the original Python code snippet, but are related to Sendblue group management.
// You would call these from external tools or admin interfaces.

// Example: Endpoint to create a new iMessage group
app.post('/create-group', async (req, res) => {
    const { numbers, initialMessage, mediaUrl } = req.body; // Expect numbers as an array

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({ status: 'error', message: 'An array of recipient numbers is required.' });
    }

    try {
        const groupId = await messaging.createGroupSendblue(numbers, initialMessage, mediaUrl);
        res.json({ status: 'success', group_id: groupId });
    } catch (error) {
        logger.error(`Error in /create-group endpoint: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Example: Endpoint to add a recipient to an existing group
app.post('/add-to-group', async (req, res) => {
    const { groupId, number } = req.body;

    if (!groupId || !number) {
        return res.status(400).json({ status: 'error', message: 'groupId and number are required.' });
    }

    try {
        const response = await messaging.addToGroupSendblue(groupId, number);
        res.json({ status: 'success', data: response });
    } catch (error) {
        logger.error(`Error in /add-to-group endpoint: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// --- Main Execution Block ---

const port = parseInt(process.env.PORT, 10) || 8080;
const debug = process.env.FLASK_DEBUG === 'true'; // Use this flag for logging control

logger.info(`Default shape for new chats is set to: ${DEFAULT_SHAPE_USER || 'interactive (operator)'}`);
logger.info(`Starting server on port ${port}`);

app.listen(port, '0.0.0.0', () => {
    logger.info(`Server listening on port ${port}`);
});

// Handle graceful shutdown if needed (e.g., for Redis client cleanup)
// process.on('SIGTERM', () => {
//     logger.info('SIGTERM received, shutting down gracefully');
//     if (state.redisClient && state.redisClient.status === 'ready') {
//         state.redisClient.quit(() => {
//             logger.info('Redis client disconnected');
//             process.exit(0);
//         });
//     } else {
//         process.exit(0);
//     }
// });