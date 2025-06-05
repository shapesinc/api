/**
 * Message Controller
 * 
 * This module handles message operations
 */

const messageModel = require('../models/message');
const shapesApi = require('../services/shapesApi');
const logger = require('../config/logger');

/**
 * Send a message
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function sendMessage(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    const { channelId, content } = req.body;
    
    if (!channelId || !content) {
      return res.status(400).json({ error: 'Channel ID and content are required' });
    }
    
    // Optional encryption setting
    const shouldEncrypt = req.body.encrypted !== false; // Default to true
    
    // Create message in database
    const message = await messageModel.createMessage({
      userId: req.user.id,
      channelId,
      content,
      encrypted: shouldEncrypt
    });
    
    logger.info(`Message sent by ${req.user.username} in channel ${channelId}`);
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Send a message to Shapes API
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function sendToShapes(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    const { channelId, content } = req.body;
    
    if (!channelId || !content) {
      return res.status(400).json({ error: 'Channel ID and content are required' });
    }
    
    // Send message to Shapes API
    const shapeResponse = await shapesApi.sendMessage(
      content,
      req.user.id,
      channelId
    );
    
    // Store user message in database
    const userMessage = await messageModel.createMessage({
      userId: req.user.id,
      channelId,
      content,
      encrypted: true
    });
    
    // Store Shape's response in database
    const shapeUserId = process.env.SHAPES_USER_ID || 'shape-user'; // A dedicated user ID for the Shape
    const shapeMessage = await messageModel.createMessage({
      userId: shapeUserId,
      channelId,
      content: shapeResponse,
      encrypted: true
    });
    
    logger.info(`Message sent to Shapes API by ${req.user.username} in channel ${channelId}`);
    
    res.status(200).json({
      message: 'Message sent to Shapes API successfully',
      request: userMessage,
      response: {
        id: shapeMessage.id,
        content: shapeResponse,
        timestamp: shapeMessage.sentAt
      }
    });
  } catch (error) {
    logger.error(`Error sending message to Shapes API: ${error.message}`);
    res.status(500).json({ error: 'Failed to send message to Shapes API' });
  }
}

/**
 * Send an image to Shapes API
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function sendImageToShapes(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    const { channelId, text, imageUrl } = req.body;
    
    if (!channelId || !imageUrl) {
      return res.status(400).json({ error: 'Channel ID and image URL are required' });
    }
    
    // Send image to Shapes API
    const shapeResponse = await shapesApi.sendImageWithText(
      text || 'What do you think about this image?',
      imageUrl,
      req.user.id,
      channelId
    );
    
    // Store user message in database (with image reference)
    const content = {
      type: 'image',
      text: text || 'Shared an image',
      imageUrl
    };
    
    const userMessage = await messageModel.createMessage({
      userId: req.user.id,
      channelId,
      content: JSON.stringify(content),
      encrypted: true
    });
    
    // Store Shape's response in database
    const shapeUserId = process.env.SHAPES_USER_ID || 'shape-user';
    const shapeMessage = await messageModel.createMessage({
      userId: shapeUserId,
      channelId,
      content: shapeResponse,
      encrypted: true
    });
    
    logger.info(`Image sent to Shapes API by ${req.user.username} in channel ${channelId}`);
    
    res.status(200).json({
      message: 'Image sent to Shapes API successfully',
      request: userMessage,
      response: {
        id: shapeMessage.id,
        content: shapeResponse,
        timestamp: shapeMessage.sentAt
      }
    });
  } catch (error) {
    logger.error(`Error sending image to Shapes API: ${error.message}`);
    res.status(500).json({ error: 'Failed to send image to Shapes API' });
  }
}

/**
 * Use a Shape tool
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function useShapeTool(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate required fields
    const { channelId, content, tools } = req.body;
    
    if (!channelId || !content || !tools) {
      return res.status(400).json({ error: 'Channel ID, content, and tools are required' });
    }
    
    // Execute tool call through Shapes API
    const toolResponse = await shapesApi.executeWithTools(
      content,
      tools,
      req.user.id,
      channelId
    );
    
    // Store user message in database
    const userMessage = await messageModel.createMessage({
      userId: req.user.id,
      channelId,
      content,
      encrypted: true
    });
    
    if (toolResponse.toolCalls) {
      // Handle tool calls - this is a simplified version
      // In a real implementation, you would execute the tools and send results back
      
      logger.info(`Shape API tool calls received: ${JSON.stringify(toolResponse.toolCalls)}`);
      
      res.status(200).json({
        message: 'Tool calls received from Shapes API',
        request: userMessage,
        toolCalls: toolResponse.toolCalls
      });
    } else {
      // No tool calls, just a regular message
      const shapeUserId = process.env.SHAPES_USER_ID || 'shape-user';
      const shapeMessage = await messageModel.createMessage({
        userId: shapeUserId,
        channelId,
        content: toolResponse.message,
        encrypted: true
      });
      
      res.status(200).json({
        message: 'Message processed successfully',
        request: userMessage,
        response: {
          id: shapeMessage.id,
          content: toolResponse.message,
          timestamp: shapeMessage.sentAt
        }
      });
    }
  } catch (error) {
    logger.error(`Error using Shape tool: ${error.message}`);
    res.status(500).json({ error: 'Failed to use Shape tool' });
  }
}

/**
 * Get messages for a channel
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getChannelMessages(req, res) {
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
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Get messages
    const messages = await messageModel.getMessagesByChannel(channelId, page, limit);
    
    res.status(200).json({
      message: 'Messages retrieved successfully',
      data: messages,
      pagination: {
        page,
        limit,
        count: messages.length
      }
    });
  } catch (error) {
    logger.error(`Error getting channel messages: ${error.message}`);
    res.status(500).json({ error: 'Failed to get messages' });
  }
}

/**
 * Get a single message
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getMessage(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get message ID from path
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }
    
    // Get message
    const message = await messageModel.getMessageById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.status(200).json({
      message: 'Message retrieved successfully',
      data: message
    });
  } catch (error) {
    logger.error(`Error getting message: ${error.message}`);
    res.status(500).json({ error: 'Failed to get message' });
  }
}

/**
 * Update a message
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateMessage(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get message ID from path
    const { messageId } = req.params;
    
    // Validate required fields
    const { content } = req.body;
    
    if (!messageId || !content) {
      return res.status(400).json({ error: 'Message ID and content are required' });
    }
    
    // Get the current message
    const message = await messageModel.getMessageById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if user owns the message
    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own messages' });
    }
    
    // Optional encryption setting
    const shouldEncrypt = req.body.encrypted !== false; // Default to true
    
    // Update message
    const success = await messageModel.updateMessage(messageId, content, shouldEncrypt);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update message' });
    }
    
    // Get updated message
    const updatedMessage = await messageModel.getMessageById(messageId);
    
    logger.info(`Message ${messageId} updated by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Message updated successfully',
      data: updatedMessage
    });
  } catch (error) {
    logger.error(`Error updating message: ${error.message}`);
    res.status(500).json({ error: 'Failed to update message' });
  }
}

/**
 * Delete a message
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteMessage(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get message ID from path
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }
    
    // Get the current message
    const message = await messageModel.getMessageById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if user owns the message
    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }
    
    // Delete message
    const success = await messageModel.deleteMessage(messageId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete message' });
    }
    
    logger.info(`Message ${messageId} deleted by ${req.user.username}`);
    
    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting message: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete message' });
  }
}

module.exports = {
  sendMessage,
  sendToShapes,
  sendImageToShapes,
  useShapeTool,
  getChannelMessages,
  getMessage,
  updateMessage,
  deleteMessage
}; 