import type http from 'node:http';
import { config } from './config.js';

/**
 * Check if a URL path matches any collapsed response patterns.
 */
export function shouldCollapseResponse(urlPath: string): boolean {
  return config.get().responses.collapsedPatterns.some(pattern => {
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
  const contentType = String(res.headers['content-type'] || '');
  const transferEncoding = String(res.headers['transfer-encoding'] || '');
  
  return config.get().content.streamingContentTypes.some(type =>
    contentType.includes(type) && transferEncoding.includes('chunked')
  );
}
