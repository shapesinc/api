/**
 * Authentication Middleware
 * 
 * This module provides middleware functions for authentication and authorization
 */

const jwt = require('../utils/jwt');
const logger = require('../config/logger');
const userModel = require('../models/user');

/**
 * Middleware to verify JWT token and attach user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  // Get auth header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  
  // Extract token
  const token = jwt.extractTokenFromHeader(authHeader);
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization format, must be Bearer token' });
  }
  
  // Verify token
  const decoded = jwt.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Attach user ID to request
  req.user = {
    id: decoded.sub,
    username: decoded.username,
    email: decoded.email,
    mfa_enabled: decoded.mfa_enabled,
    roles: decoded.roles || ['user']
  };
  
  // Log authenticated access (excluding sensitive routes from logs)
  const isSensitiveRoute = req.path.includes('/auth/') || req.path.includes('/password/');
  if (!isSensitiveRoute) {
    logger.info(`Authenticated access: ${req.user.username} (${req.method} ${req.path})`);
  }
  
  next();
}

/**
 * Middleware to check if MFA is verified
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireMFA(req, res, next) {
  // Check if user exists in request
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has MFA enabled
  if (!req.user.mfa_enabled) {
    return next(); // MFA not required for this user
  }
  
  // Check if MFA is verified
  if (!req.session || !req.session.mfa_verified) {
    return res.status(403).json({ 
      error: 'MFA verification required',
      mfa_required: true
    });
  }
  
  next();
}

/**
 * Middleware to check if user has specific role
 * 
 * @param {string|Array<string>} roles - Required role(s)
 * @returns {Function} - Express middleware function
 */
function hasRole(roles) {
  // Convert single role to array
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Check if user exists in request
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user roles
    const userRoles = req.user.roles || ['user'];
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn(`Access denied: ${req.user.username} lacks role(s) ${requiredRoles.join(', ')}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Middleware to check if user is a channel member
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function isChannelMember(req, res, next) {
  try {
    // Check if user exists in request
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get channel ID from request parameters
    const channelId = req.params.channelId || req.body.channelId;
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    // This will be implemented later with the channel model
    // For now, just pass through
    // Example implementation:
    /*
    const userChannels = await channelModel.getChannelsForUser(req.user.id);
    const isChannelMember = userChannels.some(channel => channel.id === channelId);
    
    if (!isChannelMember) {
      return res.status(403).json({ error: 'Not a member of this channel' });
    }
    */
    
    next();
  } catch (error) {
    logger.error(`Error in isChannelMember middleware: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if a request is from an allowed IP
 * 
 * @param {Array<string>} allowedIPs - Array of allowed IP addresses
 * @returns {Function} - Express middleware function
 */
function restrictByIP(allowedIPs) {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`IP restricted access attempt from ${clientIP}`);
      return res.status(403).json({ error: 'Access denied from this IP' });
    }
    
    next();
  };
}

/**
 * Middleware to log requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function logRequest(req, res, next) {
  const start = Date.now();
  
  // Log request
  logger.debug({
    message: `${req.method} ${req.url}`,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug({
      message: `${req.method} ${req.url} - ${res.statusCode}`,
      duration: `${duration}ms`,
      status: res.statusCode
    });
  });
  
  next();
}

module.exports = {
  authenticate,
  requireMFA,
  hasRole,
  isChannelMember,
  restrictByIP,
  logRequest
}; 