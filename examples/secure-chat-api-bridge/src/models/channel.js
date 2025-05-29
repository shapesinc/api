/**
 * Channel Model
 * 
 * This module handles database operations related to channels
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Create a new channel
 * 
 * @param {Object} channelData - Channel data to create
 * @param {string} channelData.name - Channel name
 * @param {string} [channelData.description] - Channel description
 * @param {string} channelData.type - Channel type (direct, group, slack, discord)
 * @param {string} [channelData.externalId] - External ID for platform integrations
 * @param {string} creatorUserId - User ID of the channel creator
 * @returns {Promise<Object>} - Created channel object
 */
async function createChannel(channelData, creatorUserId) {
  try {
    // Start a transaction to create channel and add creator as owner
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Generate a unique ID
      const channelId = uuidv4();
      
      // Insert channel into database
      await connection.execute(
        `INSERT INTO channels (id, name, description, type, external_id) VALUES (?, ?, ?, ?, ?)`,
        [channelId, channelData.name, channelData.description || null, channelData.type, channelData.externalId || null]
      );
      
      // Add creator as owner of the channel
      const membershipId = uuidv4();
      await connection.execute(
        `INSERT INTO channel_users (id, channel_id, user_id, role) VALUES (?, ?, ?, 'owner')`,
        [membershipId, channelId, creatorUserId]
      );
      
      // Commit the transaction
      await connection.commit();
      
      logger.info(`Channel created: ${channelId} by user ${creatorUserId}`);
      
      // Return created channel data
      return {
        id: channelId,
        name: channelData.name,
        description: channelData.description || null,
        type: channelData.type,
        externalId: channelData.externalId || null,
        createdAt: new Date()
      };
    } catch (error) {
      // Roll back the transaction if there's an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (error) {
    logger.error(`Error creating channel: ${error.message}`);
    throw error;
  }
}

/**
 * Get a channel by ID
 * 
 * @param {string} channelId - Channel ID to find
 * @returns {Promise<Object|null>} - Channel object or null if not found
 */
async function getChannelById(channelId) {
  try {
    const channels = await db.query(
      `SELECT id, name, description, type, external_id, created_at, updated_at 
       FROM channels 
       WHERE id = ?`,
      [channelId]
    );
    
    if (channels.length === 0) {
      return null;
    }
    
    return channels[0];
  } catch (error) {
    logger.error(`Error getting channel by ID: ${error.message}`);
    throw error;
  }
}

/**
 * Get channels for a user
 * 
 * @param {string} userId - User ID to get channels for
 * @returns {Promise<Array<Object>>} - Array of channel objects
 */
async function getChannelsForUser(userId) {
  try {
    const channels = await db.query(
      `SELECT c.id, c.name, c.description, c.type, c.external_id, c.created_at, c.updated_at, cu.role
       FROM channels c
       JOIN channel_users cu ON c.id = cu.channel_id
       WHERE cu.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    
    return channels;
  } catch (error) {
    logger.error(`Error getting channels for user: ${error.message}`);
    throw error;
  }
}

/**
 * Add a user to a channel
 * 
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID to add
 * @param {string} [role='member'] - Role for the user (owner, admin, member)
 * @returns {Promise<boolean>} - Success or failure
 */
async function addUserToChannel(channelId, userId, role = 'member') {
  try {
    // Check if channel exists
    const channel = await getChannelById(channelId);
    if (!channel) {
      logger.warn(`Attempt to add user to non-existent channel: ${channelId}`);
      return false;
    }
    
    // Check if user is already in the channel
    const existingMembership = await db.query(
      `SELECT id FROM channel_users WHERE channel_id = ? AND user_id = ?`,
      [channelId, userId]
    );
    
    if (existingMembership.length > 0) {
      // Update role if user is already in the channel
      await db.query(
        `UPDATE channel_users SET role = ? WHERE channel_id = ? AND user_id = ?`,
        [role, channelId, userId]
      );
      
      logger.info(`Updated user ${userId} role to ${role} in channel ${channelId}`);
      return true;
    }
    
    // Add user to channel
    const membershipId = uuidv4();
    await db.query(
      `INSERT INTO channel_users (id, channel_id, user_id, role) VALUES (?, ?, ?, ?)`,
      [membershipId, channelId, userId, role]
    );
    
    logger.info(`Added user ${userId} to channel ${channelId} with role ${role}`);
    return true;
  } catch (error) {
    logger.error(`Error adding user to channel: ${error.message}`);
    throw error;
  }
}

/**
 * Remove a user from a channel
 * 
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<boolean>} - Success or failure
 */
async function removeUserFromChannel(channelId, userId) {
  try {
    const result = await db.query(
      `DELETE FROM channel_users WHERE channel_id = ? AND user_id = ?`,
      [channelId, userId]
    );
    
    if (result.affectedRows === 0) {
      logger.warn(`Attempt to remove user ${userId} from channel ${channelId} they're not in`);
      return false;
    }
    
    logger.info(`Removed user ${userId} from channel ${channelId}`);
    return true;
  } catch (error) {
    logger.error(`Error removing user from channel: ${error.message}`);
    throw error;
  }
}

/**
 * Get users in a channel
 * 
 * @param {string} channelId - Channel ID
 * @returns {Promise<Array<Object>>} - Array of user objects with roles
 */
async function getUsersInChannel(channelId) {
  try {
    const users = await db.query(
      `SELECT u.id, u.username, u.email, cu.role, cu.created_at as joined_at
       FROM users u
       JOIN channel_users cu ON u.id = cu.user_id
       WHERE cu.channel_id = ?
       ORDER BY cu.role, u.username`,
      [channelId]
    );
    
    return users;
  } catch (error) {
    logger.error(`Error getting users in channel: ${error.message}`);
    throw error;
  }
}

/**
 * Update a channel
 * 
 * @param {string} channelId - Channel ID to update
 * @param {Object} channelData - Channel data to update
 * @param {string} [channelData.name] - New channel name
 * @param {string} [channelData.description] - New channel description
 * @param {string} [channelData.externalId] - New external ID
 * @returns {Promise<boolean>} - Success or failure
 */
async function updateChannel(channelId, channelData) {
  try {
    // Check if channel exists
    const channel = await getChannelById(channelId);
    if (!channel) {
      logger.warn(`Attempt to update non-existent channel: ${channelId}`);
      return false;
    }
    
    // Build update fields
    const updateFields = [];
    const params = [];
    
    if (channelData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(channelData.name);
    }
    
    if (channelData.description !== undefined) {
      updateFields.push('description = ?');
      params.push(channelData.description);
    }
    
    if (channelData.externalId !== undefined) {
      updateFields.push('external_id = ?');
      params.push(channelData.externalId);
    }
    
    if (updateFields.length === 0) {
      // Nothing to update
      return true;
    }
    
    // Add channel ID to params
    params.push(channelId);
    
    // Update channel
    await db.query(
      `UPDATE channels SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    logger.info(`Updated channel: ${channelId}`);
    return true;
  } catch (error) {
    logger.error(`Error updating channel: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a channel
 * 
 * @param {string} channelId - Channel ID to delete
 * @returns {Promise<boolean>} - Success or failure
 */
async function deleteChannel(channelId) {
  try {
    const result = await db.query(
      `DELETE FROM channels WHERE id = ?`,
      [channelId]
    );
    
    if (result.affectedRows === 0) {
      logger.warn(`Attempt to delete non-existent channel: ${channelId}`);
      return false;
    }
    
    logger.info(`Channel deleted: ${channelId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting channel: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createChannel,
  getChannelById,
  getChannelsForUser,
  addUserToChannel,
  removeUserFromChannel,
  getUsersInChannel,
  updateChannel,
  deleteChannel
}; 