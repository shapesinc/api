import type http from 'node:http';
import { config } from './config.js';

/**
 * Check if a URL path matches any collapsed response patterns.
 */
export function shouldCollapseResponse(urlPath: string): boolean {
  return config.responses.collapsedPatterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return urlPath.startsWith(prefix);
    }
    return urlPath === pattern;
  });
}

/**
 * Check if response is streaming based on headers.
 */
export function isStreamingResponse(res: http.IncomingMessage): boolean {
  const contentType = res.headers['content-type'] || '';
  return config.content.streamingContentTypes.some(type =>
    contentType.includes(type) && res.headers['transfer-encoding'] === 'chunked'
  );
}
