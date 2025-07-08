import type http from 'node:http';
import chalk from 'chalk';
import { emitLog } from './events.js';
import { isStreamingResponse, shouldCollapseResponse } from './utils.js';
import { formatResponseHeaders, formatResponseBody } from './response-formatter.js';
import { formatSSEChunk } from './sse-formatter.js';
import { processHeaders } from './header-processor.js';
import { stateManager } from './state-manager.js';

export interface ResponseProcessingOptions {
  clientReq: http.IncomingMessage;
  clientRes: http.ServerResponse;
  requestId: string;
}

/**
 * Handle proxy response data streaming and logging.
 */
export function processProxyResponse(proxyRes: http.IncomingMessage, options: ResponseProcessingOptions): void {
  const { clientReq, clientRes, requestId } = options;
  const isStreaming = isStreamingResponse(proxyRes);
  const resChunks: Buffer[] = [];
  const eventCounter = { count: 0 };
  const shouldCollapse = shouldCollapseResponse(clientReq.url ?? '');

  // Store response headers immediately
  stateManager.addResponse(requestId, {
    status: proxyRes.statusCode || 200,
    headers: proxyRes.headers as Record<string, string | string[]>,
  });

  // Print headers immediately
  const requestNumber = stateManager.getRequestNumber(requestId);
  const responseHeaders = formatResponseHeaders(proxyRes, requestNumber);
  emitLog('response', responseHeaders.header);
  emitLog('response', responseHeaders.status);
  processHeaders(proxyRes.headers || {});

  if (shouldCollapse) {
    emitLog('response', `${chalk.bold('Body:')} ${chalk.yellow('[collapsed]')}`);
  } else if (isStreaming) {
    emitLog('response', `${chalk.bold('Body:')} ${chalk.yellow('[streaming]')}`);
  }

  proxyRes.on('data', chunk => {
    if (!shouldCollapse && isStreaming) {
      const formatted = formatSSEChunk(chunk, eventCounter);
      for (const line of formatted.lines) {
        emitLog('chunk', line);
        // Store streaming chunks
        stateManager.addStreamingChunk(requestId, line);
      }
    } else if (!shouldCollapse) {
      resChunks.push(chunk);
    }
    clientRes.write(chunk);
  });

  proxyRes.on('end', () => {
    const responseBody = Buffer.concat(resChunks);
    
    // Always store the response body in state for /view command, regardless of collapse status
    const request = stateManager.getAllRequests().find(r => r.id === requestId);
    if (request?.response && responseBody.length > 0) {
      request.response.body = responseBody.toString('utf8');
    }

    // Only display the body if not collapsed and not streaming
    if (!shouldCollapse && !isStreaming) {
      const formattedBody = formatResponseBody(proxyRes, responseBody);
      if (formattedBody) {
        for (const line of formattedBody) {
          emitLog('response', line);
        }
      }
    }

    if (!clientRes.headersSent) {
      clientRes.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
    }
    clientRes.end();
  });
}

/**
 * Handle proxy request errors.
 */
export function handleProxyError(err: Error, clientRes: http.ServerResponse): void {
  emitLog('error', `${chalk.bold('Upstream error:')} ${chalk.red(err.message)}`);
  clientRes.writeHead(502);
  clientRes.end(`Bad Gateway: ${err.message}`);
}