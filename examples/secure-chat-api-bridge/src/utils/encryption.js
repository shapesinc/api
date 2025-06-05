/**
 * Encryption Utilities
 * 
 * This module provides encryption and decryption utilities for secure messaging
 */

const CryptoJS = require('crypto-js');
const logger = require('../config/logger');

// Get encryption key from environment or use a default for development (NOT FOR PRODUCTION)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-development-key-do-not-use-in-production';

if (process.env.NODE_ENV === 'production' && process.env.ENCRYPTION_KEY === undefined) {
  logger.error('ENCRYPTION_KEY not set in production environment!');
  throw new Error('ENCRYPTION_KEY must be set in production environment');
}

/**
 * Encrypt a message using AES-256
 * 
 * @param {string} message - Message to encrypt
 * @param {string} [key=ENCRYPTION_KEY] - Key to use for encryption (defaults to app key)
 * @returns {string} - Encrypted message as a Base64-encoded string
 */
function encryptMessage(message, key = ENCRYPTION_KEY) {
  try {
    // For objects, convert to JSON string first
    const messageStr = typeof message === 'object' ? JSON.stringify(message) : message;
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(messageStr, key).toString();
    
    logger.debug('Message encrypted successfully');
    return encrypted;
  } catch (error) {
    logger.error(`Error encrypting message: ${error.message}`);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message using AES-256
 * 
 * @param {string} encryptedMessage - Encrypted message as a Base64-encoded string
 * @param {string} [key=ENCRYPTION_KEY] - Key to use for decryption (defaults to app key)
 * @returns {string} - Decrypted message
 */
function decryptMessage(encryptedMessage, key = ENCRYPTION_KEY) {
  try {
    // Decrypt using AES
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key).toString(CryptoJS.enc.Utf8);
    
    // Try to parse as JSON if it looks like JSON
    if (decrypted.startsWith('{') || decrypted.startsWith('[')) {
      try {
        return JSON.parse(decrypted);
      } catch (e) {
        // If parsing fails, return as string
        return decrypted;
      }
    }
    
    logger.debug('Message decrypted successfully');
    return decrypted;
  } catch (error) {
    logger.error(`Error decrypting message: ${error.message}`);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Generate a random encryption key
 * 
 * @param {number} [length=32] - Length of the key in bytes
 * @returns {string} - Hex-encoded random key
 */
function generateEncryptionKey(length = 32) {
  // Generate random bytes
  const randomBytes = CryptoJS.lib.WordArray.random(length);
  
  // Convert to hex string
  return randomBytes.toString(CryptoJS.enc.Hex);
}

/**
 * Create a hash of a string (e.g., for password storage)
 * 
 * @param {string} data - Data to hash
 * @param {string} [salt] - Optional salt
 * @returns {string} - Hex-encoded hash
 */
function createHash(data, salt) {
  const dataWithSalt = salt ? data + salt : data;
  return CryptoJS.SHA256(dataWithSalt).toString(CryptoJS.enc.Hex);
}

module.exports = {
  encryptMessage,
  decryptMessage,
  generateEncryptionKey,
  createHash
}; 