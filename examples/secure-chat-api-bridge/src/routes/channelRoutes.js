/**
 * Channel Routes
 * 
 * This module defines routes for channel operations
 */

const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const authMiddleware = require('../middleware/auth');

// All channel routes require authentication
router.use(authMiddleware.authenticate);

// Channel operations
router.post('/', channelController.createChannel);
router.get('/', channelController.getUserChannels);
router.get('/:channelId', authMiddleware.isChannelMember, channelController.getChannel);
router.put('/:channelId', authMiddleware.hasRole(['admin', 'owner']), channelController.updateChannel);
router.delete('/:channelId', authMiddleware.hasRole(['owner']), channelController.deleteChannel);

// Channel member operations
router.get('/:channelId/members', authMiddleware.isChannelMember, channelController.getChannelMembers);
router.post('/:channelId/members', authMiddleware.hasRole(['admin', 'owner']), channelController.addMember);
router.delete('/:channelId/members/:userId', authMiddleware.hasRole(['admin', 'owner']), channelController.removeMember);
router.put('/:channelId/members/:userId/role', authMiddleware.hasRole(['owner']), channelController.updateMemberRole);

module.exports = router; 