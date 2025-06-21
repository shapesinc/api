import chalk from 'chalk';
import { formatJson } from './json-formatter.js';

export interface FormattedSSEChunk {
  lines: string[];
  isComplete: boolean;
}

/**
 * Parse and format SSE chunk for display.
 */
export function formatSSEChunk(chunk: Buffer, eventCounter: { count: number }): FormattedSSEChunk {
  const lines: string[] = [];
  let isComplete = false;
  
  const chunkStr = chunk.toString('utf8');
  const chunkLines = chunkStr.split('\n');

  for (const line of chunkLines) {
    if (line.startsWith('data: ')) {
      if (line === 'data: [DONE]') {
        lines.push(chalk.blue.bold('\n=== Stream Complete ==='));
        isComplete = true;
      } else {
        try {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          const obj = JSON.parse(jsonStr);
          eventCounter.count++;
          lines.push(chalk.cyan.bold(`\n--- Event ${eventCounter.count} ---`));
          lines.push(...formatJson(obj, { isResponse: true }));
        } catch {
          lines.push(chalk.gray(line));
        }
      }
    } else if (line.trim()) {
      lines.push(chalk.gray(line));
    }
  }

  return { lines, isComplete };
}