/**
 * Shapes API Service
 * 
 * This module provides functions to interact with the Shapes API
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

// Shapes API client
const shapesClient = axios.create({
  baseURL: config.shapesApi.url,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.shapesApi.key}`
  },
  timeout: 30000 // 30 seconds timeout
});

/**
 * Send a message to Shapes API
 *
 * @param {string} message - The message content
 * @param {string} userId - The user ID
 * @param {string} channelId - The channel ID
 * @returns {Promise<string>} - The response message
 */
async function sendMessage(message, userId, channelId) {
  try {
    const response = await shapesClient.post('/v1/chat', {
      message,
      userId,
      channelId,
      options: {
        model: config.shapesApi.model || 'claude-3-haiku-20240307'
      }
    });
    
    logger.info(`Message sent to Shapes API: ${message.substring(0, 50)}...`);
    
    // Return the response message
    return response.data.response;
  } catch (error) {
    logger.error(`Shapes API error: ${error.message}`);
    
    // Check for specific error responses
    if (error.response) {
      logger.error(`Shapes API status: ${error.response.status}`);
      logger.error(`Shapes API data: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(`Failed to send message to Shapes API: ${error.message}`);
  }
}

/**
 * Send an image with text to Shapes API
 *
 * @param {string} text - The text content
 * @param {string} imageUrl - The image URL
 * @param {string} userId - The user ID
 * @param {string} channelId - The channel ID
 * @returns {Promise<string>} - The response message
 */
async function sendImageWithText(text, imageUrl, userId, channelId) {
  try {
    const response = await shapesClient.post('/v1/chat', {
      message: text,
      userId,
      channelId,
      media: [
        {
          type: 'image',
          url: imageUrl
        }
      ],
      options: {
        model: config.shapesApi.model || 'claude-3-haiku-20240307'
      }
    });
    
    logger.info(`Image sent to Shapes API with text: ${text.substring(0, 50)}...`);
    
    // Return the response message
    return response.data.response;
  } catch (error) {
    logger.error(`Shapes API error: ${error.message}`);
    
    // Check for specific error responses
    if (error.response) {
      logger.error(`Shapes API status: ${error.response.status}`);
      logger.error(`Shapes API data: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(`Failed to send image to Shapes API: ${error.message}`);
  }
}

/**
 * Execute a message with tools through Shapes API
 *
 * @param {string} message - The message content
 * @param {Array} tools - The tools to use
 * @param {string} userId - The user ID
 * @param {string} channelId - The channel ID
 * @returns {Promise<Object>} - The response object with message and tool calls
 */
async function executeWithTools(message, tools, userId, channelId) {
  try {
    const response = await shapesClient.post('/v1/chat', {
      message,
      userId,
      channelId,
      tools,
      options: {
        model: config.shapesApi.model || 'claude-3-haiku-20240307'
      }
    });
    
    logger.info(`Tool execution request sent to Shapes API: ${message.substring(0, 50)}...`);
    
    // Return the response object containing message and any tool calls
    return {
      message: response.data.response,
      toolCalls: response.data.toolCalls || null
    };
  } catch (error) {
    logger.error(`Shapes API error: ${error.message}`);
    
    // Check for specific error responses
    if (error.response) {
      logger.error(`Shapes API status: ${error.response.status}`);
      logger.error(`Shapes API data: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(`Failed to execute tools with Shapes API: ${error.message}`);
  }
}

/**
 * Send tool execution results back to Shapes API
 *
 * @param {string} toolCallId - The tool call ID
 * @param {string} result - The tool execution result
 * @param {string} userId - The user ID
 * @param {string} channelId - The channel ID
 * @returns {Promise<string>} - The response message
 */
async function sendToolResults(toolCallId, result, userId, channelId) {
  try {
    const response = await shapesClient.post('/v1/chat/tools/results', {
      toolCallId,
      result,
      userId,
      channelId
    });
    
    logger.info(`Tool results sent to Shapes API for tool call: ${toolCallId}`);
    
    // Return the response message
    return response.data.response;
  } catch (error) {
    logger.error(`Shapes API error: ${error.message}`);
    
    // Check for specific error responses
    if (error.response) {
      logger.error(`Shapes API status: ${error.response.status}`);
      logger.error(`Shapes API data: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(`Failed to send tool results to Shapes API: ${error.message}`);
  }
}

module.exports = {
  sendMessage,
  sendImageWithText,
  executeWithTools,
  sendToolResults
}; 