/**
 * Configuration Module
 * 
 * This module loads and validates configuration from environment variables
 */

require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Parse CORS origins
const parseCorsOrigins = (origins) => {
  if (!origins) return ['http://localhost:3000']; // Default
  return origins.split(',').map(origin => origin.trim());
};

// Configuration object
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  useHttps: process.env.USE_HTTPS === 'true',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'securechat',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Maximum connections
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10) // Idle connection timeout
  },
  
  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRY || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  // CORS
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  
  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    file: process.env.LOG_FILE,
    maxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760', 10), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
    console: process.env.LOG_CONSOLE !== 'false'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 requests per windowMs
  },
  
  // Shapes API
  shapesApi: {
    key: process.env.SHAPES_API_KEY,
    url: process.env.SHAPES_API_URL || 'https://api.shapes.studio',
    model: process.env.SHAPES_API_MODEL || 'claude-3-haiku-20240307',
    userId: process.env.SHAPES_USER_ID || 'shape-user'
  }
};

// Validate configuration
if (config.useHttps && process.env.NODE_ENV === 'production') {
  console.log('Warning: HTTPS is enabled but SSL certificates must be provided at runtime');
}

module.exports = config; 