// state.js
const Redis = require('ioredis');
const logger = require('./logger'); // We'll create a simple logger module next

// --- State Management (In-memory Fallback) ---
// In-memory store for user shape selections
// Key: user_id or channel_id, Value: shape_username
const userShapeMapping = {};

// Track if operator message was already sent to a user/group (used in interactive flow)
// Key: user_id or channel_id, Value: boolean
const operatorMsgSent = {}; // Only relevant if DEFAULT_SHAPE_USER is NOT set

// --- Redis Initialization ---
let redisClient = null;
const REDIS_AVAILABLE = process.env.REDIS_AVAILABLE === 'true';

if (REDIS_AVAILABLE) {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisUsername = process.env.REDIS_USERNAME;
    const redisPassword = process.env.REDIS_PASSWORD;

    try {
        if (redisUrl) {
            redisClient = new Redis(redisUrl);
            logger.info("Attempting to connect to Redis using URL...");
        } else if (redisHost) {
            redisClient = new Redis({
                host: redisHost,
                port: parseInt(redisPort, 10),
                username: redisUsername,
                password: redisPassword,
                connectTimeout: 3000, // 3 seconds
            });
            logger.info(`Attempting to connect to Redis at ${redisHost}:${redisPort}...`);
        } else {
             logger.warning("REDIS_AVAILABLE is true but no REDIS_URL or REDIS_HOST provided.");
             REDIS_AVAILABLE = false; // Disable Redis if config is missing
        }

        if (redisClient) {
             redisClient.on('connect', () => {
                logger.info('Connected to Redis');
            });

            redisClient.on('error', (err) => {
                logger.error(`Redis connection error: ${err.message}`);
                // In a real application, you might want to implement more robust
                // reconnection logic or graceful fallback here.
            });

            // Give Redis a moment to connect, but don't block startup.
            // Connection errors will be handled by the 'error' event.
        }

    } catch (e) {
        logger.warning(`Failed to initialize Redis client: ${e.message}`);
        redisClient = null;
        REDIS_AVAILABLE = false; // Explicitly disable if initialization fails
    }
} else {
    logger.info("Redis is not configured (REDIS_AVAILABLE not true or missing). Using in-memory state.");
}


/**
 * Get the shape username for a chat ID, from Redis if available or fallback to memory.
 *
 * @param {string} chat_id The chat ID (user_id or channel_id)
 * @returns {Promise<string | null>} The shape username or null if not found
 */
async function getShapeUsername(chat_id) {
    if (redisClient && redisClient.status === 'ready') {
        try {
            const redisKey = `shape-text:${chat_id}`;
            const shape = await redisClient.get(redisKey);
            if (shape) {
                return shape;
            }
        } catch (e) {
            logger.warning(`Redis error getting shape for ${chat_id}: ${e.message}`);
        }
    }

    // Fallback to in-memory dictionary
    return userShapeMapping[chat_id] || null;
}

/**
 * Set the shape username for a chat ID, in Redis if available and in memory.
 *
 * @param {string} chat_id The chat ID (user_id or channel_id)
 * @param {string} shape_username The shape username to set
 * @returns {Promise<void>}
 */
async function setShapeUsername(chat_id, shape_username) {
    // Always update the in-memory dictionary for fallback
    userShapeMapping[chat_id] = shape_username;

    // Update Redis if available and connected
    if (redisClient && redisClient.status === 'ready') {
        try {
            const redisKey = `shape-text:${chat_id}`;
            await redisClient.set(redisKey, shape_username);
        } catch (e) {
            logger.warning(`Redis error setting shape for ${chat_id}: ${e.message}`);
        }
    }
}

/**
 * Check if operator message was sent for a chat ID, from Redis if available
 * or fallback to memory.
 *
 * @param {string} chat_id The chat ID (user_id or channel_id)
 * @returns {Promise<boolean>} True if operator message was sent, False otherwise
 */
async function getOperatorMsgSent(chat_id) {
    if (redisClient && redisClient.status === 'ready') {
        try {
            const redisKey = `operator_msg:${chat_id}`;
            const value = await redisClient.get(redisKey);
            if (value !== null) {
                return value === "1";
            }
        } catch (e) {
            logger.warning(`Redis error getting operator_msg for ${chat_id}: ${e.message}`);
        }
    }

    // Fallback to in-memory dictionary
    return operatorMsgSent[chat_id] || false;
}

/**
 * Set if operator message was sent for a chat ID, in Redis if available and in memory.
 *
 * @param {string} chat_id The chat ID (user_id or channel_id)
 * @param {boolean} sent Whether the operator message was sent
 * @returns {Promise<void>}
 */
async function setOperatorMsgSent(chat_id, sent = true) {
    // Always update the in-memory dictionary for fallback
    operatorMsgSent[chat_id] = sent;

    // Update Redis if available and connected
    if (redisClient && redisClient.status === 'ready') {
        try {
            const redisKey = `operator_msg:${chat_id}`;
            await redisClient.set(redisKey, sent ? "1" : "0");
        } catch (e) {
            logger.warning(`Redis error setting operator_msg for ${chat_id}: ${e.message}`);
        }
    }
}

module.exports = {
    getShapeUsername,
    setShapeUsername,
    getOperatorMsgSent,
    setOperatorMsgSent,
};