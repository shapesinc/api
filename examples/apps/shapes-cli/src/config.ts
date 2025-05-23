import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import { getApiBaseUrl, getAuthBaseUrl, getSiteBaseUrl } from './utils/discovery.js';

dotenv.config();

// Base configuration that doesn't require async discovery
const baseConfig = {
  apiKey: process.env.SHAPESINC_API_KEY || '',
  appId: process.env.SHAPESINC_APP_ID || 'f6263f80-2242-428d-acd4-10e1feec44ee',
  username: process.env.SHAPESINC_SHAPE_USERNAME || 'shaperobot',
  dataDir: path.join(os.homedir(), '.shapes-cli'),
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3,
  plugins: {
    enabled: true,
    autoUpdate: true,
  },
  tools: {
    enabled: true,
    autoUpdate: true,
  },
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  get model() {
    return `shapesinc/${this.username}`;
  },
};

// Configuration with auto-discovered URLs
let discoveredConfig: typeof baseConfig & {
  apiUrl: string;
  authUrl: string;
  siteUrl: string;
} | null = null;

/**
 * Initialize configuration with auto-discovered endpoints
 */
export async function initConfig() {
  if (discoveredConfig) return discoveredConfig;

  const [apiUrl, authUrl, siteUrl] = await Promise.all([
    process.env.SHAPES_API_URL || await getApiBaseUrl(),
    process.env.SHAPES_AUTH_URL || await getAuthBaseUrl(),
    process.env.SHAPES_SITE_URL || await getSiteBaseUrl(),
  ]);

  discoveredConfig = {
    ...baseConfig,
    apiUrl,
    authUrl,
    siteUrl,
  };

  return discoveredConfig;
}

/**
 * Get config - falls back to default URLs if not initialized
 */
export const config = {
  ...baseConfig,
  apiUrl: process.env.SHAPES_API_URL || 'https://api.shapes.inc/v1',
  authUrl: process.env.SHAPES_AUTH_URL || 'https://api.shapes.inc/auth',
  siteUrl: process.env.SHAPES_SITE_URL || 'https://shapes.inc',
};