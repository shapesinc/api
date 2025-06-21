import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.shapes-debugger');
const COLLAPSE_PATTERNS_FILE = path.join(CONFIG_DIR, 'collapse-patterns.json');

interface CollapseConfig {
  patterns: string[];
}

/**
 * Save collapse patterns to persistent storage.
 */
export async function saveCollapsePatterns(patterns: string[]): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const config: CollapseConfig = { patterns };
    await fs.writeFile(COLLAPSE_PATTERNS_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to save collapse patterns:', error);
  }
}

/**
 * Load collapse patterns from persistent storage.
 */
export async function loadCollapsePatterns(): Promise<string[]> {
  try {
    const data = await fs.readFile(COLLAPSE_PATTERNS_FILE, 'utf-8');
    const config: CollapseConfig = JSON.parse(data);
    return Array.isArray(config.patterns) ? config.patterns : [];
  } catch (error) {
    // Return empty array if file doesn't exist or is invalid
    return [];
  }
}