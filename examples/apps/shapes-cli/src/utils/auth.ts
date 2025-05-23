import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { initConfig } from '../config.js';

const TOKEN_FILE = path.join(os.homedir(), '.shapes-cli', 'token.json');

export async function saveToken(token: string): Promise<void> {
  const dir = path.dirname(TOKEN_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(TOKEN_FILE, JSON.stringify({ token }), 'utf-8');
}

export async function getToken(): Promise<string | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, 'utf-8');
    const { token } = JSON.parse(data);
    return token;
  } catch (_error) {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch (_error) {
    // Ignore error if file doesn't exist
  }
}

export async function authenticate(code: string): Promise<string> {
  try {
    const discoveredConfig = await initConfig();
    const response = await axios.post(`${discoveredConfig.authUrl}/nonce`, {
      app_id: discoveredConfig.appId,
      code,
    });
    return response.data.auth_token;
  } catch (error) {
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
}

export async function getAuthUrl(): Promise<string> {
  const discoveredConfig = await initConfig();
  return `${discoveredConfig.siteUrl}/authorize?app_id=${discoveredConfig.appId}`;
}