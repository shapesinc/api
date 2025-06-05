/**
 * Server configuration
 * 
 * This module contains Express server settings and middleware configuration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./logger');

// Initialize Express
const app = express();

// Set security-related headers with Helmet
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || '*' // In production, limit to specific origin if set
    : '*', // In development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Log HTTP requests
app.use((req, res, next) => {
  // Don't log health check requests to avoid noise
  if (req.path === '/health') {
    return next();
  }
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      message: `${req.method} ${req.originalUrl}`,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Basic rate limiting (crude implementation, consider using express-rate-limit in production)
const requestCounts = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

app.use((req, res, next) => {
  const ip = req.ip;
  
  // Clean up old entries
  const now = Date.now();
  if (!requestCounts[ip]) {
    requestCounts[ip] = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW
    };
  } else if (requestCounts[ip].resetAt < now) {
    requestCounts[ip] = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW
    };
  }
  
  // Check rate limit
  if (requestCounts[ip].count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  
  // Increment counter
  requestCounts[ip].count++;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app; 