/**
 * Message Routes
 * 
 * This module defines routes for message operations
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// All message routes require authentication
router.use(authMiddleware.authenticate);

// Regular message routes
router.post('/', messageController.sendMessage);
router.get('/channel/:channelId', authMiddleware.isChannelMember, messageController.getChannelMessages);
router.get('/:messageId', messageController.getMessage);
router.put('/:messageId', messageController.updateMessage);
router.delete('/:messageId', messageController.deleteMessage);

// Shapes API integration routes
router.post('/shapes', messageController.sendToShapes);
router.post('/shapes/image', messageController.sendImageToShapes);
router.post('/shapes/tool', messageController.useShapeTool);

module.exports = router; 