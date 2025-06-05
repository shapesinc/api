/**
 * Multi-Factor Authentication Utilities
 * 
 * This module provides TOTP-based MFA functionality
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../config/logger');

/**
 * Generate a new TOTP secret for a user
 * 
 * @param {string} username - Username to include in the TOTP label
 * @param {string} [issuer=SecureChat] - Issuer name for the TOTP code
 * @returns {Object} - Object containing secret and other information
 */
function generateSecret(username, issuer = 'SecureChat') {
  try {
    // Generate a new secret using speakeasy
    const secret = speakeasy.generateSecret({
      name: `${issuer}:${username}`,
      issuer: issuer,
      length: 20 // Adjust length as needed for security
    });
    
    logger.debug(`MFA secret generated for user ${username}`);
    
    return {
      otpauth_url: secret.otpauth_url,
      base32: secret.base32, // Store this in the database
      ascii: secret.ascii,
      hex: secret.hex
    };
  } catch (error) {
    logger.error(`Error generating MFA secret: ${error.message}`);
    throw new Error('Failed to generate MFA secret');
  }
}

/**
 * Generate a QR code for a TOTP secret
 * 
 * @param {string} otpauth_url - TOTP auth URL
 * @returns {Promise<string>} - Data URL of the QR code image
 */
async function generateQRCode(otpauth_url) {
  try {
    // Generate a QR code as a data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth_url);
    logger.debug('MFA QR code generated successfully');
    return qrCodeDataUrl;
  } catch (error) {
    logger.error(`Error generating QR code: ${error.message}`);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token against a secret
 * 
 * @param {string} token - TOTP token to verify
 * @param {string} secret - TOTP secret (base32 encoded)
 * @param {Object} [options] - Verification options
 * @param {number} [options.window=1] - Window of counter values to check
 * @returns {boolean} - Whether the token is valid
 */
function verifyToken(token, secret, options = { window: 1 }) {
  try {
    // Remove spaces and convert to uppercase if token is a string
    if (typeof token === 'string') {
      token = token.replace(/\s+/g, '').toUpperCase();
    }
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: options.window
    });
    
    if (verified) {
      logger.debug('MFA token verified successfully');
    } else {
      logger.warn('MFA token verification failed');
    }
    
    return verified;
  } catch (error) {
    logger.error(`Error verifying MFA token: ${error.message}`);
    return false;
  }
}

/**
 * Generate a current TOTP token for a secret (useful for testing)
 * 
 * @param {string} secret - TOTP secret (base32 encoded)
 * @returns {string} - Current TOTP token
 */
function generateToken(secret) {
  try {
    // Generate a token
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
    
    logger.debug('MFA token generated successfully');
    return token;
  } catch (error) {
    logger.error(`Error generating MFA token: ${error.message}`);
    throw new Error('Failed to generate MFA token');
  }
}

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateToken
}; 