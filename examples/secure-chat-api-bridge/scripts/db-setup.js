#!/usr/bin/env node

/**
 * Database setup script
 * 
 * This script initializes the database and creates all necessary tables for the SecureChat API Bridge.
 * It should be run once before starting the application for the first time.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setup() {
  // Create connection without database selection first
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // Create database if it doesn't exist
    console.log(`Creating database ${process.env.DB_NAME} if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
    
    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME};`);
    
    // Create users table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Create channels table
    console.log('Creating channels table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type ENUM('direct', 'group', 'slack', 'discord') NOT NULL,
        external_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Create channel_users table (for channel membership)
    console.log('Creating channel_users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS channel_users (
        id VARCHAR(36) PRIMARY KEY,
        channel_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role ENUM('owner', 'admin', 'member') DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_channel_user (channel_id, user_id)
      );
    `);

    // Create messages table
    console.log('Creating messages table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        channel_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        encrypted BOOLEAN DEFAULT TRUE,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create attachments table
    console.log('Creating attachments table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id VARCHAR(36) PRIMARY KEY,
        message_id VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        encrypted BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      );
    `);

    // Create sessions table
    console.log('Creating sessions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create audit_logs table
    console.log('Creating audit_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(36),
        ip_address VARCHAR(45),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create platform_connections table
    console.log('Creating platform_connections table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS platform_connections (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        platform ENUM('slack', 'discord') NOT NULL,
        external_user_id VARCHAR(100) NOT NULL,
        access_token VARCHAR(255),
        refresh_token VARCHAR(255),
        token_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_platform_user (platform, external_user_id)
      );
    `);

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup(); 