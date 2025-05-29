/**
 * JWT Utilities
 * 
 * This module provides JWT token generation and verification utilities
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Get JWT secret from environment or use default for development
const JWT_SECRET = process.env.JWT_SECRET || 'default-development-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === undefined) {
  logger.error('JWT_SECRET not set in production environment!');
  throw new Error('JWT_SECRET must be set in production environment');
}

/**
 * Generate a JWT token for a user
 * 
 * @param {Object} user - User object to include in token payload
 * @param {string} user.id - User ID
 * @param {string} [user.username] - Optional username
 * @param {string} [user.email] - Optional email
 * @param {boolean} [user.mfa_enabled] - Whether MFA is enabled for the user
 * @param {Array} [user.roles] - Optional user roles
 * @returns {string} - JWT token
 */
function generateToken(user) {
  try {
    // Create payload with minimal necessary information
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      mfa_enabled: user.mfa_enabled || false,
      roles: user.roles || ['user']
    };

    // Generate and sign the token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    logger.debug(`JWT token generated for user ${user.id}`);
    return token;
  } catch (error) {
    logger.error(`Error generating JWT token: ${error.message}`);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify a JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    // Verify the token and return the decoded payload
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug(`JWT token verified for user ${decoded.sub}`);
    return decoded;
  } catch (error) {
    // Log different types of errors
    if (error.name === 'TokenExpiredError') {
      logger.warn('JWT token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn(`JWT verification failed: ${error.message}`);
    } else {
      logger.error(`Unexpected error verifying JWT token: ${error.message}`);
    }
    return null;
  }
}

/**
 * Extract a JWT token from an Authorization header
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - JWT token or null if not found
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract token from "Bearer <token>"
  return authHeader.substring(7);
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader
}; 