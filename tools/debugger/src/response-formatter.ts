import type http from 'node:http';
import zlib from 'node:zlib';
import chalk from 'chalk';
import { config } from './config.js';
import { formatJson } from './json-formatter.js';

export interface FormattedResponse {
  header: string;
  status: string;
  body?: string[];
}

/**
 * Format response headers with status code coloring.
 */
export function formatResponseHeaders(res: http.IncomingMessage, requestNumber?: number): FormattedResponse {
  const code = res.statusCode ?? 200;
  const titleColor = code >= 200 && code < 300 ? config.get().ui.statusCodeColors.success
                    : code >= 300 && code < 400 ? config.get().ui.statusCodeColors.redirect
                    : config.get().ui.statusCodeColors.error;

  const headerText = requestNumber
    ? `=== Response ${requestNumber} ===`
    : '=== Response ===';

  return {
    header: `\n           ${titleColor.bold.underline(headerText)}`,
    status: chalk.bold('Status: ') + res.statusCode,
  };
}

/**
 * Format response body with decompression support.
 */
export function formatResponseBody(res: http.IncomingMessage, bodyBuf: Buffer): string[] | null {
  if (!bodyBuf?.length) return null;

  const lines: string[] = [chalk.bold('Body:')];
  const contentEncoding = res.headers['content-encoding'];

  if (contentEncoding === 'gzip') {
    try {
      const decompressed = zlib.gunzipSync(bodyBuf);
      const str = decompressed.toString('utf8');
      try {
        const obj = JSON.parse(str);
        lines.push(...formatJson(obj, { isResponse: true }));
      } catch {
        lines.push(str);
      }
    } catch (err) {
      lines.push(
        chalk.red('Failed to decompress gzipped response: ') + (err as Error).message,
        chalk.gray('Raw gzipped data length: ') + bodyBuf.length
      );
    }
  } else if (contentEncoding === 'zstd') {
    try {
      const decompressed = zlib.zstdDecompressSync(bodyBuf);
      const str = decompressed.toString('utf-8');
      try {
        const obj = JSON.parse(str);
        lines.push(...formatJson(obj, { isResponse: true }));
      } catch {
        lines.push(str);
      }
    } catch (err) {
      lines.push(
        chalk.red('Failed to decompress zstd response: ') + (err as Error).message,
        chalk.gray('Raw zstd data length: ') + bodyBuf.length
      );
    }
  } else {
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      lines.push(...formatJson(obj, { isResponse: true }));
    } catch {
      lines.push(str);
    }
  }

  return lines;
}