import type http from 'node:http';
import type https from 'node:https';
import { URL } from 'node:url';
import { config } from './config.js';

export interface ProcessedRequest {
  url: URL;
  headers: Record<string, string | string[]>;
  options: http.RequestOptions | https.RequestOptions;
}

/**
 * Build upstream URL from client request.
 */
export function buildUpstreamUrl(clientReq: http.IncomingMessage, baseUrl: string): URL {
  return new URL(clientReq.url ?? '', baseUrl);
}

/**
 * Prepare headers for upstream request.
 */
export function prepareHeaders(clientReq: http.IncomingMessage, upstreamUrl: URL): Record<string, string | string[]> {
  return {
    ...clientReq.headers,
    host: upstreamUrl.host
  };
}

/**
 * Create upstream request options.
 */
export function createRequestOptions(clientReq: http.IncomingMessage, upstreamUrl: URL): http.RequestOptions | https.RequestOptions {
  const headers = prepareHeaders(clientReq, upstreamUrl);
  const port = upstreamUrl.port
    ? Number(upstreamUrl.port)
    : (upstreamUrl.protocol === 'https:' ? config.get().ports.defaultHttps : config.get().ports.defaultHttp);

  const baseOptions = {
    protocol: upstreamUrl.protocol,
    hostname: upstreamUrl.hostname,
    port,
    path: upstreamUrl.pathname + upstreamUrl.search,
    method: clientReq.method,
    headers,
  };

  // Add servername for HTTPS requests (required for proper TLS SNI)
  if (upstreamUrl.protocol === 'https:') {
    return {
      ...baseOptions,
      servername: upstreamUrl.hostname,
    } as https.RequestOptions;
  }

  return baseOptions;
}