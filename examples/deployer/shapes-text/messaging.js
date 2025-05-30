// messaging.js
const twilio = require('twilio');
const axios = require('axios');
const MessagingResponse = twilio.twiml.MessagingResponse;
const logger = require('./logger');
const { detectShapesFileUrl } = require('./utils');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const SENDBLUE_API_KEY_ID = process.env.SENDBLUE_API_KEY_ID;
const SENDBLUE_API_SECRET_KEY = process.env.SENDBLUE_API_SECRET_KEY;
const SENDBLUE_PHONE_NUMBER = process.env.SENDBLUE_PHONE_NUMBER;

let twilioClient = null;

// --- Initialization ---
function initializeMessaging() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        logger.info("Twilio client initialized.");
    } else {
        logger.warning("Twilio credentials not found. SMS sending disabled.");
    }

    if (!SENDBLUE_API_KEY_ID || !SENDBLUE_API_SECRET_KEY || !SENDBLUE_PHONE_NUMBER) {
        logger.warning("Sendblue credentials not found. iMessage sending/group management disabled.");
    } else {
         logger.info("Sendblue credentials loaded.");
    }
}


// --- Twilio (SMS) Functions ---

/**
 * Send an outgoing SMS message using Twilio.
 *
 * @param {string} to The recipient's phone number
 * @param {string} body The message content
 * @returns {Promise<string>} The Twilio message SID
 * @throws {Error} If Twilio client not initialized or sending fails
 */
async function sendMessageTwilio(to, body) {
    if (!twilioClient) {
        throw new Error("Twilio client not initialized. Cannot send SMS.");
    }
    try {
        const message = await twilioClient.messages.create({
            body: body,
            from: TWILIO_PHONE_NUMBER,
            to: to,
        });
        logger.info(`Sent SMS message to ${to} (SID: ${message.sid})`);
        return message.sid;
    } catch (e) {
        logger.error(`Error sending SMS message to ${to}: ${e.message}`);
        throw new Error(`Failed to send SMS: ${e.message}`);
    }
}


// --- Sendblue (iMessage) Functions ---

function getSendblueHeaders() {
     if (!SENDBLUE_API_KEY_ID || !SENDBLUE_API_SECRET_KEY) {
         throw new Error("Sendblue credentials not configured.");
     }
     return {
        "Content-Type": "application/json",
        "sb-api-key-id": SENDBLUE_API_KEY_ID,
        "sb-api-secret-key": SENDBLUE_API_SECRET_KEY,
    };
}


/**
 * Send an outgoing iMessage using Sendblue.
 *
 * @param {string | string[]} to The recipient's phone number (or list for new groups - though group creation function is separate)
 * @param {string} body The message content
 * @param {string | null} group_id The group ID for existing group messages (optional)
 * @returns {Promise<object>} The Sendblue API response
 * @throws {Error} If Sendblue credentials missing or sending fails
 */
async function sendImessageSendblue(to, body, group_id = null) {
    try {
        const headers = getSendblueHeaders();

        // Check if the body contains a files.shapes.inc URL
        const shapesFileUrl = detectShapesFileUrl(body);

        const payload = { from_number: SENDBLUE_PHONE_NUMBER };
        let endpoint;

        if (group_id) {
            payload.group_id = group_id;
            endpoint = "https://api.sendblue.co/api/send-group-message";
            logger.info(`Preparing to send iMessage to group ${group_id}`);
        } else {
            payload.number = to; // 'to' should be a single string number here
            endpoint = "https://api.sendblue.co/api/send-message";
            logger.info(`Preparing to send iMessage to ${to}`);
        }

        if (shapesFileUrl) {
            logger.info(`Detected Shapes file URL: ${shapesFileUrl}`);
            const textWithoutUrl = body.replace(shapesFileUrl, "").trim();
            payload.media_url = shapesFileUrl;
            if (textWithoutUrl) {
                payload.content = textWithoutUrl;
            }
             logger.info(`Sending iMessage with media from URL: ${shapesFileUrl}`);
        } else {
            payload.content = body;
            logger.info("Sending iMessage with text content.");
        }

        const response = await axios.post(endpoint, payload, { headers });
        logger.info(`Sendblue response status: ${response.status}`);
        return response.data;

    } catch (e) {
        logger.error(`Error sending iMessage to ${group_id || to}: ${e.message}`);
         if (e.response) {
            logger.error(`Sendblue API Error Status: ${e.response.status}`);
            logger.error(`Sendblue API Error Data: ${JSON.stringify(e.response.data)}`);
         }
        throw new Error(`Failed to send iMessage: ${e.message}`);
    }
}

/**
 * Send a typing indicator to a recipient using Sendblue.
 * Note: Only works for direct messages (not group chats).
 *
 * @param {string} to The recipient's phone number
 * @returns {Promise<object>} The Sendblue API response
 */
async function sendTypingIndicatorSendblue(to) {
     try {
        const headers = getSendblueHeaders();
        const payload = { number: to };
        const response = await axios.post("https://api.sendblue.co/api/send-typing-indicator", payload, { headers });
        logger.info(`Sent typing indicator to ${to}. Status: ${response.status}`);
        return response.data;
    } catch (e) {
        // Log error but don't re-throw, typing indicator is not critical
        logger.error(`Error sending Sendblue typing indicator to ${to}: ${e.message}`);
         if (e.response) {
            logger.error(`Sendblue Typing Indicator API Error Status: ${e.response.status}`);
            logger.error(`Sendblue Typing Indicator API Error Data: ${JSON.stringify(e.response.data)}`);
         }
        return { status: "ERROR", message: e.message };
    }
}

/**
 * Create a new iMessage group chat using Sendblue.
 *
 * @param {string[]} numbers List of phone numbers to include in the group
 * @param {string | null} body Initial message to send to the group (optional)
 * @param {string | null} mediaUrl URL of media to send with the initial message (optional)
 * @returns {Promise<string>} The group_id of the newly created group
 * @throws {Error} If Sendblue credentials missing, no body/mediaUrl, or creation fails
 */
async function createGroupSendblue(numbers, body = null, mediaUrl = null) {
    try {
        const headers = getSendblueHeaders();

        if (!body && !mediaUrl) {
            throw new Error("Either body or mediaUrl must be provided to create a group");
        }

        const payload = {
            numbers: numbers,
            from_number: SENDBLUE_PHONE_NUMBER,
        };

        if (body) payload.content = body;
        if (mediaUrl) payload.media_url = mediaUrl;

        logger.info(`Attempting to create Sendblue group with members: ${numbers.join(', ')}`);
        const response = await axios.post("https://api.sendblue.co/api/send-group-message", payload, { headers });
        logger.info(`Sendblue group creation response status: ${response.status}`);

        const result = response.data;
        const groupId = result.group_id;

        if (!groupId) {
            throw new Error("Failed to extract group_id from Sendblue response during creation.");
        }

        logger.info(`Successfully created Sendblue group: ${groupId}`);
        return groupId;

    } catch (e) {
        logger.error(`Error creating Sendblue group: ${e.message}`);
         if (e.response) {
            logger.error(`Sendblue API Error Status: ${e.response.status}`);
            logger.error(`Sendblue API Error Data: ${JSON.stringify(e.response.data)}`);
         }
        throw new Error(`Failed to create Sendblue group: ${e.message}`);
    }
}


/**
 * Add a person to an existing iMessage group chat using Sendblue.
 *
 * @param {string} group_id ID of the group to add the person to
 * @param {string} number Phone number to add to the group
 * @returns {Promise<object>} The Sendblue API response
 * @throws {Error} If Sendblue credentials missing or adding fails
 */
async function addToGroupSendblue(group_id, number) {
    try {
        const headers = getSendblueHeaders();
        const payload = {
            group_id: group_id,
            modify_type: "add_recipient",
            number: number
        };

        logger.info(`Attempting to add ${number} to Sendblue group ${group_id}`);
        const response = await axios.post("https://api.sendblue.co/api/modify-group", payload, { headers });
         logger.info(`Sendblue add recipient response status: ${response.status}`);

        return response.data;

    } catch (e) {
        logger.error(`Error adding ${number} to group ${group_id}: ${e.message}`);
         if (e.response) {
            logger.error(`Sendblue API Error Status: ${e.response.status}`);
            logger.error(`Sendblue API Error Data: ${JSON.stringify(e.response.data)}`);
         }
        throw new Error(`Failed to add recipient to group: ${e.message}`);
    }
}


module.exports = {
    initializeMessaging,
    sendMessageTwilio,
    sendImessageSendblue,
    sendTypingIndicatorSendblue,
    createGroupSendblue,
    addToGroupSendblue,
    MessagingResponse // Export Twilio TwiML builder
};