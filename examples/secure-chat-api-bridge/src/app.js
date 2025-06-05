/**
 * SecureChat API Bridge - Main Application
 *
 * This module sets up the Express server and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const config = require('./config');
const logger = require('./config/logger');
const db = require('./config/database');
const authMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const channelRoutes = require('./routes/channelRoutes');

// Initialize Express app
const app = express();

// Connect to database
db.init()
  .then(() => {
    logger.info('Database connection established');
  })
  .catch((error) => {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });

// Basic security headers
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compress responses
app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Log all requests (excluding sensitive routes)
app.use(authMiddleware.logRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API version
const API_VERSION = '/api/v1';

// Routes
app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/messages`, messageRoutes);
app.use(`${API_VERSION}/channels`, channelRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource '${req.originalUrl}' was not found on this server`
  });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log error
  if (statusCode >= 500) {
    logger.error(`Server error: ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`Client error: ${err.message}`);
  }
  
  res.status(statusCode).json({
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred'
  });
});

module.exports = app; 