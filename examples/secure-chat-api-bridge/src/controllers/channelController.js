/**
 * Channel Controller
 * 
 * This module handles channel operations
 */

const channelModel = require('../models/channel');
const logger = require('../config/logger');

/**
 * Create a new channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createChannel(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Channel name is required' });
    }
    
    // Create channel and add creator as owner
    const channel = await channelModel.createChannel({
      name,
      description: description || '',
      createdBy: req.user.id
    });
    
    logger.info(`Channel created: ${name} by ${req.user.username}`);
    
    res.status(201).json({
      message: 'Channel created successfully',
      data: channel
    });
  } catch (error) {
    logger.error(`Error creating channel: ${error.message}`);
    res.status(500).json({ error: 'Failed to create channel' });
  }
}

/**
 * Get all channels for the current user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserChannels(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channels for user
    const channels = await channelModel.getChannelsForUser(req.user.id);
    
    res.status(200).json({
      message: 'Channels retrieved successfully',
      data: channels
    });
  } catch (error) {
    logger.error(`Error getting user channels: ${error.message}`);
    res.status(500).json({ error: 'Failed to get channels' });
  }
}

/**
 * Get a specific channel by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getChannel(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID from path
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // Get channel
    const channel = await channelModel.getChannelById(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.status(200).json({
      message: 'Channel retrieved successfully',
      data: channel
    });
  } catch (error) {
    logger.error(`Error getting channel: ${error.message}`);
    res.status(500).json({ error: 'Failed to get channel' });
  }
}

/**
 * Update a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateChannel(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID from path
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // Validate fields to update
    const { name, description } = req.body;
    
    if (!name && description === undefined) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }
    
    // Get current channel
    const existingChannel = await channelModel.getChannelById(channelId);
    
    if (!existingChannel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Update channel
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    const success = await channelModel.updateChannel(channelId, updateData);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update channel' });
    }
    
    // Get updated channel
    const updatedChannel = await channelModel.getChannelById(channelId);
    
    logger.info(`Channel ${channelId} updated by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Channel updated successfully',
      data: updatedChannel
    });
  } catch (error) {
    logger.error(`Error updating channel: ${error.message}`);
    res.status(500).json({ error: 'Failed to update channel' });
  }
}

/**
 * Delete a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteChannel(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID from path
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // Get current channel
    const existingChannel = await channelModel.getChannelById(channelId);
    
    if (!existingChannel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Delete channel
    const success = await channelModel.deleteChannel(channelId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete channel' });
    }
    
    logger.info(`Channel ${channelId} deleted by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting channel: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
}

/**
 * Get all members of a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getChannelMembers(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID from path
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // Get channel members
    const members = await channelModel.getUsersInChannel(channelId);
    
    res.status(200).json({
      message: 'Channel members retrieved successfully',
      data: members
    });
  } catch (error) {
    logger.error(`Error getting channel members: ${error.message}`);
    res.status(500).json({ error: 'Failed to get channel members' });
  }
}

/**
 * Add a member to a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addMember(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID from path
    const { channelId } = req.params;
    
    // Validate required fields
    const { userId, role } = req.body;
    
    if (!channelId || !userId) {
      return res.status(400).json({ error: 'Channel ID and user ID are required' });
    }
    
    // Default role to 'member' if not specified
    const memberRole = role || 'member';
    
    // Ensure role is valid
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(memberRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: member, admin' });
    }
    
    // Add user to channel
    const success = await channelModel.addUserToChannel(channelId, userId, memberRole);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to add member to channel' });
    }
    
    logger.info(`User ${userId} added to channel ${channelId} by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Member added to channel successfully'
    });
  } catch (error) {
    logger.error(`Error adding member to channel: ${error.message}`);
    res.status(500).json({ error: 'Failed to add member to channel' });
  }
}

/**
 * Remove a member from a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function removeMember(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID and user ID from path
    const { channelId, userId } = req.params;
    
    if (!channelId || !userId) {
      return res.status(400).json({ error: 'Channel ID and user ID are required' });
    }
    
    // Get channel members to check roles
    const members = await channelModel.getUsersInChannel(channelId);
    
    // Find the member to remove
    const memberToRemove = members.find(member => member.id === userId);
    
    // Check if target is an owner (owners can't be removed except by themselves)
    if (memberToRemove && memberToRemove.role === 'owner' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Channel owners can only remove themselves' });
    }
    
    // Remove user from channel
    const success = await channelModel.removeUserFromChannel(channelId, userId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to remove member from channel' });
    }
    
    logger.info(`User ${userId} removed from channel ${channelId} by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Member removed from channel successfully'
    });
  } catch (error) {
    logger.error(`Error removing member from channel: ${error.message}`);
    res.status(500).json({ error: 'Failed to remove member from channel' });
  }
}

/**
 * Update a member's role in a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateMemberRole(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID and user ID from path
    const { channelId, userId } = req.params;
    
    // Validate required fields
    const { role } = req.body;
    
    if (!channelId || !userId || !role) {
      return res.status(400).json({ error: 'Channel ID, user ID, and role are required' });
    }
    
    // Ensure role is valid
    const validRoles = ['member', 'admin', 'owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: member, admin, owner' });
    }
    
    // Get channel members to check current roles
    const members = await channelModel.getUsersInChannel(channelId);
    
    // Find the member to update
    const memberToUpdate = members.find(member => member.id === userId);
    
    if (!memberToUpdate) {
      return res.status(404).json({ error: 'User is not a member of this channel' });
    }
    
    // If changing to owner, make sure current owner agrees to step down
    if (role === 'owner') {
      // Find current owner
      const currentOwner = members.find(member => member.role === 'owner');
      
      if (currentOwner && currentOwner.id !== req.user.id) {
        return res.status(403).json({ error: 'Only the current owner can assign a new owner' });
      }
      
      // If updating someone else to owner, current owner becomes admin
      if (currentOwner && currentOwner.id !== userId) {
        await channelModel.addUserToChannel(channelId, currentOwner.id, 'admin');
      }
    }
    
    // Update member role
    const success = await channelModel.addUserToChannel(channelId, userId, role);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update member role' });
    }
    
    logger.info(`User ${userId} role updated to ${role} in channel ${channelId} by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Member role updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating member role: ${error.message}`);
    res.status(500).json({ error: 'Failed to update member role' });
  }
}

module.exports = {
  createChannel,
  getUserChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  getChannelMembers,
  addMember,
  removeMember,
  updateMemberRole
}; 