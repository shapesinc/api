/**
 * SecureChat API Bridge - Server
 *
 * This module starts the server
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');

// Set the port
const PORT = config.port || 3000;

// Create server (HTTP or HTTPS)
let server;

if (config.useHttps) {
  try {
    // Load SSL certificates
    const privateKey = fs.readFileSync(path.join(__dirname, '../ssl/private.key'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, '../ssl/certificate.crt'), 'utf8');
    
    const credentials = {
      key: privateKey,
      cert: certificate
    };
    
    // Add CA certificate if available
    const caPath = path.join(__dirname, '../ssl/ca.crt');
    if (fs.existsSync(caPath)) {
      credentials.ca = fs.readFileSync(caPath, 'utf8');
    }
    
    // Create HTTPS server
    server = https.createServer(credentials, app);
    logger.info('HTTPS server created');
  } catch (error) {
    logger.error(`Failed to load SSL certificates: ${error.message}`);
    logger.warn('Falling back to HTTP server');
    server = http.createServer(app);
  }
} else {
  // Create HTTP server
  server = http.createServer(app);
  logger.info('HTTP server created');
}

// Start the server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Protocol: ${config.useHttps ? 'HTTPS' : 'HTTP'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error(`Server error: ${error.message}`);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}\n${error.stack}`);
  process.exit(1);
});

// Gracefully shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Gracefully shutdown on SIGINT
process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}); 