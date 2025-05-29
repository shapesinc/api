/**
 * Message Model
 * 
 * This module handles database operations related to messages
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../config/logger');
const encryption = require('../utils/encryption');

/**
 * Create a new message
 * 
 * @param {Object} messageData - Message data to create
 * @param {string} messageData.userId - User ID of sender
 * @param {string} messageData.channelId - Channel ID where message is sent
 * @param {string} messageData.content - Message content
 * @param {boolean} [messageData.encrypted=true] - Whether to encrypt the message
 * @returns {Promise<Object>} - Created message object
 */
async function createMessage(messageData) {
  try {
    // Generate a unique ID
    const messageId = uuidv4();
    
    // Encrypt content if needed
    let contentToStore = messageData.content;
    const shouldEncrypt = messageData.encrypted !== false; // Default to true
    
    if (shouldEncrypt) {
      contentToStore = encryption.encryptMessage(messageData.content);
      logger.debug(`Message encrypted for storage: ${messageId}`);
    }
    
    // Insert message into database
    await db.query(
      `INSERT INTO messages (id, channel_id, user_id, content, encrypted) VALUES (?, ?, ?, ?, ?)`,
      [messageId, messageData.channelId, messageData.userId, contentToStore, shouldEncrypt]
    );
    
    logger.info(`Message created: ${messageId}`);
    
    // Return created message data
    return {
      id: messageId,
      channelId: messageData.channelId,
      userId: messageData.userId,
      content: messageData.content, // Return original content, not encrypted
      encrypted: shouldEncrypt,
      sentAt: new Date()
    };
  } catch (error) {
    logger.error(`Error creating message: ${error.message}`);
    throw error;
  }
}

/**
 * Get messages for a channel (paginated)
 * 
 * @param {string} channelId - Channel ID to get messages for
 * @param {number} [page=1] - Page number
 * @param {number} [limit=50] - Results per page
 * @returns {Promise<Array<Object>>} - Array of message objects
 */
async function getMessagesByChannel(channelId, page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit;
    
    const messages = await db.query(
      `SELECT m.id, m.channel_id, m.user_id, m.content, m.encrypted, m.sent_at, 
              u.username as sender_username
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.channel_id = ?
       ORDER BY m.sent_at DESC
       LIMIT ? OFFSET ?`,
      [channelId, limit, offset]
    );
    
    // Decrypt messages if they are encrypted
    return messages.map(message => {
      if (message.encrypted) {
        try {
          message.content = encryption.decryptMessage(message.content);
          logger.debug(`Message decrypted: ${message.id}`);
        } catch (error) {
          logger.error(`Error decrypting message ${message.id}: ${error.message}`);
          message.content = '[Encrypted content - unable to decrypt]';
        }
      }
      return message;
    });
  } catch (error) {
    logger.error(`Error getting messages by channel: ${error.message}`);
    throw error;
  }
}

/**
 * Get a message by ID
 * 
 * @param {string} messageId - Message ID to find
 * @returns {Promise<Object|null>} - Message object or null if not found
 */
async function getMessageById(messageId) {
  try {
    const messages = await db.query(
      `SELECT m.id, m.channel_id, m.user_id, m.content, m.encrypted, m.sent_at,
              u.username as sender_username
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [messageId]
    );
    
    if (messages.length === 0) {
      return null;
    }
    
    const message = messages[0];
    
    // Decrypt message if it is encrypted
    if (message.encrypted) {
      try {
        message.content = encryption.decryptMessage(message.content);
      } catch (error) {
        logger.error(`Error decrypting message ${message.id}: ${error.message}`);
        message.content = '[Encrypted content - unable to decrypt]';
      }
    }
    
    return message;
  } catch (error) {
    logger.error(`Error getting message by ID: ${error.message}`);
    throw error;
  }
}

/**
 * Update a message's content
 * 
 * @param {string} messageId - Message ID to update
 * @param {string} newContent - New message content
 * @param {boolean} [encrypted=true] - Whether to encrypt the message
 * @returns {Promise<boolean>} - Success or failure
 */
async function updateMessage(messageId, newContent, encrypted = true) {
  try {
    // Get the current message to check if it exists
    const currentMessage = await getMessageById(messageId);
    
    if (!currentMessage) {
      logger.warn(`Attempt to update non-existent message: ${messageId}`);
      return false;
    }
    
    // Encrypt content if needed
    let contentToStore = newContent;
    if (encrypted) {
      contentToStore = encryption.encryptMessage(newContent);
    }
    
    // Update message in database
    await db.query(
      `UPDATE messages SET content = ?, encrypted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [contentToStore, encrypted, messageId]
    );
    
    logger.info(`Message updated: ${messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error updating message: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a message
 * 
 * @param {string} messageId - Message ID to delete
 * @returns {Promise<boolean>} - Success or failure
 */
async function deleteMessage(messageId) {
  try {
    const result = await db.query(
      `DELETE FROM messages WHERE id = ?`,
      [messageId]
    );
    
    if (result.affectedRows === 0) {
      logger.warn(`Attempt to delete non-existent message: ${messageId}`);
      return false;
    }
    
    logger.info(`Message deleted: ${messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting message: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createMessage,
  getMessagesByChannel,
  getMessageById,
  updateMessage,
  deleteMessage
}; 