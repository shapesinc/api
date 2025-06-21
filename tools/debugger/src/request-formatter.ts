import type http from 'node:http';
import chalk from 'chalk';
import { formatJson } from './json-formatter.js';

export interface FormattedRequest {
  header: string;
  method: string;
  url: string;
  body?: string[];
}

/**
 * Format HTTP request data.
 */
export function formatRequest(req: http.IncomingMessage, bodyBuf: Buffer): FormattedRequest {
  const formatted: FormattedRequest = {
    header: chalk.cyan.bold.underline('\n=== Request ==='),
    method: chalk.bold('Method: ') + req.method,
    url: chalk.bold('URL: ') + req.url,
  };

  // Body
  if (bodyBuf?.length) {
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      formatted.body = [chalk.bold('Body:'), ...formatJson(obj, { isResponse: false })];
    } catch {
      formatted.body = [chalk.bold('Body:'), str];
    }
  }

  return formatted;
}