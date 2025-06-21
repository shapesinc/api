import chalk from 'chalk';
import { config } from './config.js';
import { emitLog } from './events.js';

/**
 * Mask a token showing only the last 4 characters.
 */
function maskToken(token: string): string {
  const t = String(token || '');
  const last = t.slice(-4);
  return `****${last}`;
}

/**
 * Process and format HTTP headers with token masking and highlighting.
 */
export function processHeaders(headers: Record<string, string | string[] | undefined>): void {
  emitLog('request', chalk.bold('Headers:'));
  for (const [name, val] of Object.entries(headers)) {
    const value = Array.isArray(val) ? val.join(', ') : val;
    let display = value;
    const lower = name.toLowerCase();
    
    // Mask sensitive tokens
    if (config.get().headers.sensitiveHeaders.includes(lower)) {
      if (lower === 'authorization') {
        const parts = String(value).split(' ');
        if (parts.length > 1) {
          const scheme = parts.shift();
          const token = parts.join(' ');
          display = `${scheme} ${maskToken(token)}`;
        } else {
          display = maskToken(value ?? '');
        }
      } else {
        display = maskToken(value ?? '');
      }
    }
    
    // Highlight important headers
    const important = lower === 'authorization' || lower === 'content-type' ||
      config.get().headers.importantPrefixes.some(prefix => lower.startsWith(prefix));
    const colorFn = important ? chalk.magenta : chalk.gray;
    emitLog('request', colorFn(`  ${name}: ${display}`));
  }
}