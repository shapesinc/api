/**
 * User Model
 * 
 * This module handles database operations related to users
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const logger = require('../config/logger');

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

/**
 * Create a new user
 * 
 * @param {Object} userData - User data to create
 * @param {string} userData.username - User's username
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password (will be hashed)
 * @returns {Promise<Object>} - Created user object (without password)
 */
async function createUser(userData) {
  try {
    // Generate a unique ID
    const userId = uuidv4();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    
    // Insert user into database and return the created user
    const result = await db.query(
      `INSERT INTO users (id, username, email, password) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, mfa_enabled, created_at`,
      [userId, userData.username, userData.email, hashedPassword]
    );
    
    logger.info(`User created: ${userId}`);
    
    // Return user data without password
    return result[0];
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    
    // Check for duplicate key errors (PostgreSQL error code)
    if (error.code === '23505') {
      if (error.detail && error.detail.includes('username')) {
        throw new Error('Username already exists');
      } else if (error.detail && error.detail.includes('email')) {
        throw new Error('Email already exists');
      }
    }
    
    throw error;
  }
}

/**
 * Find a user by their ID
 * 
 * @param {string} id - User ID to find
 * @param {boolean} [includePassword=false] - Whether to include password in result
 * @returns {Promise<Object|null>} - User object or null if not found
 */
async function findById(id, includePassword = false) {
  try {
    // Select fields based on includePassword flag
    const fields = includePassword 
      ? 'id, username, email, password, mfa_enabled, mfa_secret, created_at, updated_at' 
      : 'id, username, email, mfa_enabled, created_at, updated_at';
    
    const users = await db.query(
      `SELECT ${fields} FROM users WHERE id = $1`,
      [id]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0];
  } catch (error) {
    logger.error(`Error finding user by ID: ${error.message}`);
    throw error;
  }
}

/**
 * Find a user by their username
 * 
 * @param {string} username - Username to find
 * @param {boolean} [includePassword=false] - Whether to include password in result
 * @returns {Promise<Object|null>} - User object or null if not found
 */
async function findByUsername(username, includePassword = false) {
  try {
    // Select fields based on includePassword flag
    const fields = includePassword 
      ? 'id, username, email, password, mfa_enabled, mfa_secret, created_at, updated_at' 
      : 'id, username, email, mfa_enabled, created_at, updated_at';
    
    const users = await db.query(
      `SELECT ${fields} FROM users WHERE username = $1`,
      [username]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0];
  } catch (error) {
    logger.error(`Error finding user by username: ${error.message}`);
    throw error;
  }
}

/**
 * Find a user by their email
 * 
 * @param {string} email - Email to find
 * @param {boolean} [includePassword=false] - Whether to include password in result
 * @returns {Promise<Object|null>} - User object or null if not found
 */
async function findByEmail(email, includePassword = false) {
  try {
    // Select fields based on includePassword flag
    const fields = includePassword 
      ? 'id, username, email, password, mfa_enabled, mfa_secret, created_at, updated_at' 
      : 'id, username, email, mfa_enabled, created_at, updated_at';
    
    const users = await db.query(
      `SELECT ${fields} FROM users WHERE email = $1`,
      [email]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0];
  } catch (error) {
    logger.error(`Error finding user by email: ${error.message}`);
    throw error;
  }
}

/**
 * Update a user's MFA settings
 * 
 * @param {string} userId - User ID to update
 * @param {boolean} enabled - Whether MFA is enabled
 * @param {string|null} secret - MFA secret (or null if disabling)
 * @returns {Promise<boolean>} - Success or failure
 */
async function updateMFA(userId, enabled, secret = null) {
  try {
    await db.query(
      `UPDATE users SET mfa_enabled = $1, mfa_secret = $2 WHERE id = $3`,
      [enabled, secret, userId]
    );
    
    logger.info(`Updated MFA settings for user ${userId}: enabled=${enabled}`);
    return true;
  } catch (error) {
    logger.error(`Error updating MFA settings: ${error.message}`);
    throw error;
  }
}

/**
 * Verify a user's password
 * 
 * @param {string} plainPassword - Plain text password to verify
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - Whether password is correct
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error(`Error verifying password: ${error.message}`);
    return false;
  }
}

/**
 * Get all users (paginated)
 * 
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Results per page
 * @returns {Promise<Array<Object>>} - Array of user objects
 */
async function getAll(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;
    
    const users = await db.query(
      `SELECT id, username, email, mfa_enabled, created_at, updated_at 
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return users;
  } catch (error) {
    logger.error(`Error getting all users: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a user by ID
 * 
 * @param {string} userId - User ID to delete
 * @returns {Promise<boolean>} - Success or failure
 */
async function deleteUser(userId) {
  try {
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [userId]
    );
    
    if (result.length === 0) {
      logger.warn(`Attempt to delete non-existent user: ${userId}`);
      return false;
    }
    
    logger.info(`User deleted: ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createUser,
  findById,
  findByUsername,
  findByEmail,
  updateMFA,
  verifyPassword,
  getAll,
  deleteUser
}; 