import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Plugin {
  name: string;
  version: string;
  description: string;
  main: string;
}

const PLUGINS_DIR = path.join(os.homedir(), '.shapes-cli', 'plugins');

export async function loadPlugins(): Promise<Plugin[]> {
  try {
    await fs.mkdir(PLUGINS_DIR, { recursive: true });
    const files = await fs.readdir(PLUGINS_DIR);

    const plugins: Plugin[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(PLUGINS_DIR, file), 'utf-8');
        plugins.push(JSON.parse(content));
      }
    }

    return plugins;
  } catch (error) {
    console.error('Error loading plugins:', error);
    return [];
  }
}

export async function installPlugin(pluginUrl: string): Promise<void> {
  try {
    const pluginDir = path.join(PLUGINS_DIR, path.basename(pluginUrl, '.git'));
    await fs.mkdir(pluginDir, { recursive: true });

    // Clone the plugin repository
    await execAsync(`git clone ${pluginUrl} ${pluginDir}`);

    // Install dependencies
    await execAsync('npm install', { cwd: pluginDir });

    // Read plugin manifest
    const manifestPath = path.join(pluginDir, 'plugin.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Save plugin info
    await fs.writeFile(
      path.join(PLUGINS_DIR, `${manifest.name}.json`),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(`Failed to install plugin: ${(error as Error).message}`);
  }
}

export async function removePlugin(pluginName: string): Promise<void> {
  try {
    const pluginDir = path.join(PLUGINS_DIR, pluginName);
    const manifestPath = path.join(PLUGINS_DIR, `${pluginName}.json`);

    // Remove plugin directory
    await fs.rm(pluginDir, { recursive: true, force: true });

    // Remove plugin manifest
    await fs.unlink(manifestPath).catch(() => {
      // Ignore error if file doesn't exist
    });
  } catch (error) {
    throw new Error(`Failed to remove plugin: ${(error as Error).message}`);
  }
}