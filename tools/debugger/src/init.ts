import { config } from './config.js';

/**
 * Initialize configuration by loading persistent settings.
 * This must be called before any other modules that use config are imported.
 */
export async function initializeConfig(): Promise<void> {
  await config.loadCollapsePatterns();
}