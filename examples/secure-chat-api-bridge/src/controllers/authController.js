/**
 * Authentication Controller
 * 
 * This module handles user authentication operations
 */

const userModel = require('../models/user');
const jwt = require('../utils/jwt');
const mfa = require('../utils/mfa');
const logger = require('../config/logger');

/**
 * Register a new user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function register(req, res) {
  try {
    // Validate required fields
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Check if username or email already exists
    const existingUser = await userModel.findByUsername(username) || await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Create user
    const user = await userModel.createUser({
      username,
      email,
      password
    });
    
    // Generate JWT token
    const token = jwt.generateToken(user);
    
    logger.info(`User registered: ${username} (${user.id})`);
    
    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mfa_enabled: user.mfa_enabled
      },
      token
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Log in a user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res) {
  try {
    // Validate required fields
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user by username
    const user = await userModel.findByUsername(username, true);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Verify password
    const isPasswordValid = await userModel.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check if MFA is required
    if (user.mfa_enabled) {
      // Return a token that only grants access to MFA verification
      const limitedToken = jwt.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        mfa_enabled: true,
        roles: ['mfa-pending'] // Special role that only grants access to MFA verification
      });
      
      logger.info(`User ${username} logged in, MFA verification required`);
      
      return res.status(200).json({
        message: 'MFA verification required',
        mfa_required: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          mfa_enabled: true
        },
        token: limitedToken
      });
    }
    
    // Generate JWT token
    const token = jwt.generateToken(user);
    
    logger.info(`User logged in: ${username} (${user.id})`);
    
    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mfa_enabled: user.mfa_enabled
      },
      token
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Set up MFA for a user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function setupMFA(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Generate MFA secret
    const secret = mfa.generateSecret(req.user.username);
    
    // Generate QR code
    const qrCode = await mfa.generateQRCode(secret.otpauth_url);
    
    // Store the secret temporarily in the session for verification
    // In a real implementation, you might store this in a cache with a TTL
    req.session = req.session || {};
    req.session.mfa_setup_secret = secret.base32;
    
    logger.info(`MFA setup initiated for user: ${req.user.username}`);
    
    // Return setup data
    res.status(200).json({
      message: 'MFA setup initiated',
      secret: secret.base32,
      qr_code: qrCode
    });
  } catch (error) {
    logger.error(`MFA setup error: ${error.message}`);
    res.status(500).json({ error: 'MFA setup failed' });
  }
}

/**
 * Verify MFA token and finalize setup
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyMFASetup(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate token
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'MFA token is required' });
    }
    
    // Get secret from session
    if (!req.session || !req.session.mfa_setup_secret) {
      return res.status(400).json({ error: 'MFA setup not initiated' });
    }
    
    // Verify token
    const isValid = mfa.verifyToken(token, req.session.mfa_setup_secret);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid MFA token' });
    }
    
    // Save MFA secret and enable MFA for user
    await userModel.updateMFA(req.user.id, true, req.session.mfa_setup_secret);
    
    // Clear secret from session
    delete req.session.mfa_setup_secret;
    
    // Mark session as MFA verified
    req.session.mfa_verified = true;
    
    // Generate new token with updated MFA status
    const updatedUser = {
      ...req.user,
      mfa_enabled: true
    };
    const newToken = jwt.generateToken(updatedUser);
    
    logger.info(`MFA enabled for user: ${req.user.username}`);
    
    // Return success and new token
    res.status(200).json({
      message: 'MFA enabled successfully',
      token: newToken
    });
  } catch (error) {
    logger.error(`MFA setup verification error: ${error.message}`);
    res.status(500).json({ error: 'MFA verification failed' });
  }
}

/**
 * Verify MFA token during login
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyMFA(req, res) {
  try {
    // Ensure user is authenticated with the limited token
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Ensure user has MFA enabled and is in the mfa-pending state
    if (!req.user.mfa_enabled || !req.user.roles.includes('mfa-pending')) {
      return res.status(400).json({ error: 'MFA not required for this user' });
    }
    
    // Validate token
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'MFA token is required' });
    }
    
    // Get user with MFA secret
    const user = await userModel.findById(req.user.id, true);
    if (!user || !user.mfa_secret) {
      return res.status(500).json({ error: 'MFA configuration error' });
    }
    
    // Verify token
    const isValid = mfa.verifyToken(token, user.mfa_secret);
    if (!isValid) {
      logger.warn(`Invalid MFA token provided for user: ${req.user.username}`);
      return res.status(401).json({ error: 'Invalid MFA token' });
    }
    
    // Mark session as MFA verified
    req.session = req.session || {};
    req.session.mfa_verified = true;
    
    // Generate new token with full permissions
    const fullUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      mfa_enabled: true,
      roles: ['user'] // Restore normal roles
    };
    const newToken = jwt.generateToken(fullUser);
    
    logger.info(`MFA verified for user: ${req.user.username}`);
    
    // Return success and new token
    res.status(200).json({
      message: 'MFA verified successfully',
      token: newToken
    });
  } catch (error) {
    logger.error(`MFA verification error: ${error.message}`);
    res.status(500).json({ error: 'MFA verification failed' });
  }
}

/**
 * Disable MFA for a user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function disableMFA(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate password for security
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable MFA' });
    }
    
    // Get user with password
    const user = await userModel.findById(req.user.id, true);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    const isPasswordValid = await userModel.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password provided when disabling MFA for user: ${req.user.username}`);
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Disable MFA
    await userModel.updateMFA(req.user.id, false, null);
    
    // Generate new token with updated MFA status
    const updatedUser = {
      ...req.user,
      mfa_enabled: false
    };
    const newToken = jwt.generateToken(updatedUser);
    
    logger.info(`MFA disabled for user: ${req.user.username}`);
    
    // Return success and new token
    res.status(200).json({
      message: 'MFA disabled successfully',
      token: newToken
    });
  } catch (error) {
    logger.error(`MFA disable error: ${error.message}`);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
}

module.exports = {
  register,
  login,
  setupMFA,
  verifyMFASetup,
  verifyMFA,
  disableMFA
}; 