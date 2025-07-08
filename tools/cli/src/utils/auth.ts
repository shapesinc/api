import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import axios from "axios";
import { initConfig } from "../config.js";

const TOKEN_FILE = path.join(os.homedir(), ".shapes-cli", "token.json");

export async function saveToken(token: string): Promise<void> {
    const dir = path.dirname(TOKEN_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(TOKEN_FILE, JSON.stringify({ token }), "utf-8");
}

export async function getToken(): Promise<string | null> {
    try {
        const data = await fs.readFile(TOKEN_FILE, "utf-8");
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

export async function authenticate(code: string, effectiveAppId?: string): Promise<string> {
    try {
        const discoveredConfig = await initConfig();
        const requestBody: { code: string; app_id?: string } = { code };
        
        // Only include app_id if user hasn't cleared it (same logic as X-App-ID header)
        if (effectiveAppId) {
            requestBody.app_id = effectiveAppId;
        }
        
        const response = await axios.post(`${discoveredConfig.authUrl}/nonce`, requestBody);
        return response.data.auth_token;
    } catch (error) {
        throw new Error(`Authentication failed: ${(error as Error).message}`);
    }
}

export async function getAuthUrl(effectiveAppId?: string): Promise<string> {
    const discoveredConfig = await initConfig();
    
    // Only include app_id query param if user hasn't cleared it
    if (effectiveAppId) {
        return `${discoveredConfig.siteUrl}/authorize?app_id=${effectiveAppId}`;
    } else {
        return `${discoveredConfig.siteUrl}/authorize`;
    }
}
