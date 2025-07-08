import http from 'node:http';
import https from 'node:https';
import { buildUpstreamUrl, createRequestOptions } from './request-processor.js';
import { processProxyResponse, handleProxyError } from './response-processor.js';
import { formatRequest } from './request-formatter.js';
import { processHeaders } from './header-processor.js';
import { emitLog } from './events.js';
import { stateManager } from './state-manager.js';

/**
 * Create and configure upstream proxy request.
 */
export function createUpstreamRequest(
  clientReq: http.IncomingMessage,
  clientRes: http.ServerResponse,
  baseUrl: string,
  requestBody: Buffer,
  requestId: string
): http.ClientRequest {
  const upstreamUrl = buildUpstreamUrl(clientReq, baseUrl);
  const options = createRequestOptions(clientReq, upstreamUrl);

  const proxyReq = (upstreamUrl.protocol === 'https:' ? https : http)
    .request(options, proxyRes => {
      processProxyResponse(proxyRes, { clientReq, clientRes, requestId });
    });

  proxyReq.on('error', err => {
    stateManager.markError(requestId, err.message);
    handleProxyError(err, clientRes);
  });

  // Send buffered request body
  if (requestBody.length) {
    proxyReq.write(requestBody);
  }
  proxyReq.end();

  return proxyReq;
}

/**
 * Handle complete proxy request flow.
 */
export function handleProxyRequest(
  clientReq: http.IncomingMessage,
  clientRes: http.ServerResponse,
  baseUrl: string,
  requestBody: Buffer
): void {
  // Create state entry
  const requestId = stateManager.createRequest({
    method: clientReq.method || 'GET',
    url: clientReq.url || '',
    headers: clientReq.headers as Record<string, string | string[]>,
    body: requestBody.length ? requestBody.toString('utf8') : undefined,
  });

  // Log the request
  const requestNumber = stateManager.getRequestNumber(requestId);
  const formatted = formatRequest(clientReq, requestBody, requestNumber);
  emitLog('request', formatted.header);
  emitLog('request', formatted.method);
  emitLog('request', formatted.url);
  processHeaders(clientReq.headers);
  if (formatted.body) {
    for (const line of formatted.body) {
      emitLog('request', line);
    }
  }

  // Create and send upstream request
  createUpstreamRequest(clientReq, clientRes, baseUrl, requestBody, requestId);
}