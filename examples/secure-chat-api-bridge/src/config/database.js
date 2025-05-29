/**
 * Database configuration
 * 
 * This module sets up the PostgreSQL connection pool for the application
 */

const { Pool } = require('pg');
const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Create a knex instance for PostgreSQL
const knexInstance = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'securechat',
    user: process.env.DB_USER || 'dbuser',
    password: process.env.DB_PASSWORD || 'dbpassword',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  migrations: {
    directory: path.join(__dirname, '../../migrations')
  },
  seeds: {
    directory: path.join(__dirname, '../../seeds')
  }
});

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'securechat',
  user: process.env.DB_USER || 'dbuser',
  password: process.env.DB_PASSWORD || 'dbpassword',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Maximum connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10) // Idle connection timeout
});

/**
 * Initialize the database connection
 * 
 * @returns {Promise<boolean>} - Whether the initialization was successful
 */
async function init() {
  try {
    // Test the connection
    const client = await pool.connect();
    console.log('PostgreSQL connection established successfully.');
    client.release();
    
    // Run migrations if in development environment
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('Running database migrations...');
        await knexInstance.migrate.latest();
        console.log('Database migrations completed successfully.');
      } catch (migrationError) {
        console.error('Error running migrations:', migrationError);
        // Don't fail if migrations error, just log
      }
    }
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Export the pool and utility functions
module.exports = {
  pool,
  init,
  knex: knexInstance,
  // Helper method for parameterized queries
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error; // Re-throw to let the caller handle it
    }
  }
}; 