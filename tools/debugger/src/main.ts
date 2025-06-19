#!/usr/bin/env node

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import zlib from 'node:zlib';
import { getApiServerBaseUrl } from './utils.js';
import chalk from 'chalk';

/**
 * Mask a token showing only the last 4 characters.
 */
function maskToken(token: string): string {
  const t = String(token || '');
  const last = t.slice(-4);
  return `****${last}`;
}

// Role-based coloring for JSON bodies
const roleColorMap = {
  system: chalk.gray,
  user: chalk.cyan,
  assistant: chalk.green,
  function: chalk.yellow
};

// Finish-reason coloring for response bodies
const finishReasonColors = {
  stop: chalk.green,
  function_call: chalk.cyan
};

// URL patterns for collapsed responses (show headers only)
const collapsedResponsePatterns = [
  '/users/*'
];

/**
 * Check if a URL path matches any collapsed response patterns.
 */
function shouldCollapseResponse(urlPath: string): boolean {
  return collapsedResponsePatterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return urlPath.startsWith(prefix);
    }
    return urlPath === pattern;
  });
}

/**
 * Pretty-print JSON with OpenAI chat syntax highlighting.
 */
function prettyPrintJson(obj: Record<string, unknown>, { isResponse = false }: { isResponse?: boolean } = {}): void {
  const str = JSON.stringify(obj, null, 2);
  for (const line of str.split('\n')) {
    const m = line.match(/^(\s*)(.*)$/);
    const indent = m ? m[1] : '';
    const trimmed = m ? m[2] : line;
    // braces or brackets
    if (/^[{}[\]],?$/.test(trimmed)) {
      console.log(indent + chalk.gray(trimmed));
    } else if (trimmed.startsWith('"role"')) {
      const parts = trimmed.match(/^"role":\s*"([^"]+)"(,?)$/);
      if (parts) {
        const [, role, comma] = parts;
        const colorFn = roleColorMap[role as keyof typeof roleColorMap] || chalk.white;
        console.log(
          indent + chalk.gray('"role": ') + colorFn(`"${role}"`) + (comma || '')
        );
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"model"')) {
      // highlight only model value
      const partsModel = trimmed.match(/^("model":\s*)(".*")(,?)$/);
      if (partsModel) {
        const [, keyPart, valuePart, comma] = partsModel;
        console.log(indent + chalk.gray(keyPart) + chalk.blue(valuePart) + (comma || ''));
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"content"')) {
      // highlight content value (string or array/object)
      const partsContent = trimmed.match(/^("content":\s*)(".*")(,?)$/);
      if (partsContent) {
        // Simple string content
        const [, keyPart, valuePart, comma] = partsContent;
        console.log(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
      } else {
        // Array or object content - highlight the key part
        const keyMatch = trimmed.match(/^("content":\s*)(.*)(,?)$/);
        if (keyMatch) {
          const [, keyPart, valuePart, comma] = keyMatch;
          console.log(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
        } else {
          console.log(indent + chalk.gray(trimmed));
        }
      }
    } else if (trimmed.startsWith('"name"')) {
      // highlight tool/function names
      const partsName = trimmed.match(/^("name":\s*)(".*")(,?)$/);
      if (partsName) {
        const [, keyPart, valuePart, comma] = partsName;
        console.log(indent + chalk.gray(keyPart) + chalk.yellow(valuePart) + (comma || ''));
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"text"')) {
      // highlight text content in content objects
      const partsText = trimmed.match(/^("text":\s*)(".*")(,?)$/);
      if (partsText) {
        const [, keyPart, valuePart, comma] = partsText;
        console.log(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"image_url"')) {
      // highlight image_url content in content objects
      const partsImageUrl = trimmed.match(/^("image_url":\s*)(.*)(,?)$/);
      if (partsImageUrl) {
        const [, keyPart, valuePart, comma] = partsImageUrl;
        console.log(indent + chalk.gray(keyPart) + chalk.cyan(valuePart) + (comma || ''));
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"stream"')) {
      // highlight stream parameter value
      const partsStream = trimmed.match(/^("stream":\s*)(true|false)(,?)$/);
      if (partsStream) {
        const [, keyPart, valuePart, comma] = partsStream;
        console.log(indent + chalk.gray(keyPart) + chalk.yellow(valuePart) + (comma || ''));
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (isResponse && trimmed.startsWith('"finish_reason"')) {
      const parts = trimmed.match(/^"finish_reason":\s*"([^"]+)"(,?)$/);
      if (parts) {
        const [, reason, comma] = parts;
        const colorFn = finishReasonColors[reason as keyof typeof finishReasonColors] || chalk.red;
        console.log(
          indent + chalk.gray('"finish_reason": ') + colorFn(`"${reason}"`) + (comma || '')
        );
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else {
      console.log(indent + chalk.gray(trimmed));
    }
  }
}

// Configuration
// If you change the port, you must also change it in
// the application you want to debug
const PORT: number = Number(process.env.PORT) || 8090;
// Determine upstream API base URL (local server or production)
const baseUrl: string = await getApiServerBaseUrl();

/**
 * Pretty-print an HTTP request header and body (minimal skeleton)
 */
function prettyPrintRequest(req: http.IncomingMessage, bodyBuf: Buffer): void {
  console.log(chalk.cyan.bold.underline('\n=== Request ==='));
  console.log(chalk.bold('Method:'), req.method);
  console.log(chalk.bold('URL:'), req.url);

  // Headers
  console.log(chalk.bold('Headers:'));
  for (const [name, val] of Object.entries(req.headers)) {
    const value = Array.isArray(val) ? val.join(', ') : val;
    let display = value;
    const lower = name.toLowerCase();
    if (lower === 'authorization') {
      const parts = String(value).split(' ');
      if (parts.length > 1) {
        const scheme = parts.shift();
        const token = parts.join(' ');
        display = `${scheme} ${maskToken(token)}`;
      } else {
        display = maskToken(value ?? '');
      }
    } else if (lower === 'x-user-auth') {
      display = maskToken(value ?? '');
    }
    // highlight important headers
    const important = lower === 'authorization' || lower === 'content-type' ||
      lower.startsWith('x-user-') || lower.startsWith('x-channel-') ||
      lower.startsWith('x-app-') || lower.startsWith('x-api-');
    const colorFn = important ? chalk.magenta : chalk.gray;
    console.log(colorFn(`  ${name}: ${display}`));
  }

  // Body
  if (bodyBuf?.length) {
    console.log(chalk.bold('Body:'));
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      prettyPrintJson(obj, { isResponse: false });
    } catch {
      console.log(str);
    }
  }
}

/**
 * Check if response is streaming based on headers
 */
function isStreamingResponse(res: http.IncomingMessage): boolean {
  const contentType = res.headers['content-type'] || '';
  return contentType.includes('text/event-stream') ||
         contentType.includes('application/x-ndjson') ||
         res.headers['transfer-encoding'] === 'chunked';
}

/**
 * Pretty-print response headers
 */
function prettyPrintResponseHeaders(res: http.IncomingMessage): void {
  // colored section title based on status code
  {
    const code = res.statusCode ?? 200;
    const titleColor = code >= 200 && code < 300 ? chalk.green
                      : code >= 300 && code < 400 ? chalk.yellow
                      : chalk.red;
    console.log(titleColor.bold.underline('\n=== Response ==='));
  }
  console.log(chalk.bold('Status:'), res.statusCode);

  // Headers
  console.log(chalk.bold('Headers:'));
  for (const [name, val] of Object.entries(res.headers || {})) {
    const value = Array.isArray(val) ? val.join(', ') : val;
    let display = value;
    const lower = name.toLowerCase();
    // mask sensitive tokens
    if (lower === 'authorization') {
      const parts = String(value).split(' ');
      if (parts.length > 1) {
        const scheme = parts.shift();
        const token = parts.join(' ');
        display = `${scheme} ${maskToken(token)}`;
      } else {
        display = maskToken(value ?? '');
      }
    } else if (lower === 'x-user-auth') {
      display = maskToken(value ?? '');
    }
    // highlight important headers
    const important = lower === 'authorization' || lower === 'content-type' ||
      lower.startsWith('x-user-') || lower.startsWith('x-channel-') ||
      lower.startsWith('x-app-') || lower.startsWith('x-api-');
    const colorFn = important ? chalk.magenta : chalk.gray;
    console.log(colorFn(`  ${name}: ${display}`));
  }
}

/**
 * Parse and print SSE chunk in real-time
 */
function parseAndPrintSSEChunk(chunk: Buffer, eventCounter: { count: number }): void {
  const chunkStr = chunk.toString('utf8');
  const lines = chunkStr.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      if (line === 'data: [DONE]') {
        console.log(chalk.blue.bold('\n=== Stream Complete ==='));
      } else {
        try {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          const obj = JSON.parse(jsonStr);
          eventCounter.count++;
          console.log(chalk.cyan.bold(`\n--- Event ${eventCounter.count} ---`));
          prettyPrintJson(obj, { isResponse: true });
        } catch {
          // Print raw line if not valid JSON
          console.log(chalk.gray(line));
        }
      }
    } else if (line.trim()) {
      // Print other non-empty lines (like event: or id:)
      console.log(chalk.gray(line));
    }
  }
}

/**
 * Pretty-print response body with decompression support
 */
function prettyPrintResponseBody(res: http.IncomingMessage, bodyBuf: Buffer): void {
  if (!bodyBuf?.length) return;

  console.log(chalk.bold('Body:'));

  // Check if response is gzipped
  const contentEncoding = res.headers['content-encoding'];
  if (contentEncoding === 'gzip') {
    try {
      const decompressed = zlib.gunzipSync(bodyBuf);
      const str = decompressed.toString('utf8');
      try {
        const obj = JSON.parse(str);
        prettyPrintJson(obj, { isResponse: true });
      } catch {
        console.log(str);
      }
    } catch (err) {
      console.log(chalk.red('Failed to decompress gzipped response:'), (err as Error).message);
      console.log(chalk.gray('Raw gzipped data length:'), bodyBuf.length);
    }
  } else {
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      prettyPrintJson(obj, { isResponse: true });
    } catch {
      console.log(str);
    }
  }
}


// Basic HTTP proxy server
const server = http.createServer((clientReq, clientRes) => {
  // Buffer incoming request body
  const reqChunks: Buffer[] = [];
  clientReq.on('data', chunk => reqChunks.push(chunk));
  clientReq.on('end', () => {
    const requestBody = Buffer.concat(reqChunks);
    // Log the request (expand later)
    prettyPrintRequest(clientReq, requestBody);

    // Build upstream URL
    const upstreamUrl = new URL(clientReq.url ?? '', baseUrl);
    // Prepare headers for upstream (override Host header)
    const headers = {
      ...clientReq.headers,
      host: upstreamUrl.host
    };
    // Determine port (default to 443 for https, 80 for http)
    const port = upstreamUrl.port
      ? Number(upstreamUrl.port)
      : (upstreamUrl.protocol === 'https:' ? 443 : 80);
    const options = {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port,
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: clientReq.method,
      headers,
      // Ensure TLS SNI and cert validation use the correct hostname
      servername: upstreamUrl.hostname,
    };

    // Forward to upstream
    const proxyReq = (upstreamUrl.protocol === 'https:' ? https : http)
      .request(options, proxyRes => {
        const isStreaming = isStreamingResponse(proxyRes);
        const resChunks: Buffer[] = [];
        const eventCounter = { count: 0 }; // Track event numbers for streaming
        const shouldCollapse = shouldCollapseResponse(clientReq.url ?? '');

        // Print headers immediately
        prettyPrintResponseHeaders(proxyRes);
        
        if (shouldCollapse) {
          console.log(chalk.dim('Body: [collapsed]'));
        } else if (isStreaming) {
          console.log(chalk.bold('Body:'));
        }

        proxyRes.on('data', chunk => {
          if (!shouldCollapse && isStreaming) {
            // Parse and print SSE chunk immediately with event numbering
            parseAndPrintSSEChunk(chunk, eventCounter);
          } else if (!shouldCollapse) {
            // For non-streaming responses, accumulate chunks
            resChunks.push(chunk);
          }

          // Forward chunk to client immediately
          clientRes.write(chunk);
        });

        proxyRes.on('end', () => {
          if (!shouldCollapse && !isStreaming) {
            // Only show body for non-streaming, non-collapsed responses
            const responseBody = Buffer.concat(resChunks);
            prettyPrintResponseBody(proxyRes, responseBody);
          }

          // Relay status and headers to client (if not already sent)
          if (!clientRes.headersSent) {
            clientRes.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          }
          clientRes.end();
        });
    });

    proxyReq.on('error', err => {
      console.error(chalk.red('Upstream error:'), err.message);
      // Respond with 502 Bad Gateway on error
      clientRes.writeHead(502);
      clientRes.end(`Bad Gateway: ${err.message}`);
    });

    // Send buffered request body
    if (requestBody.length) {
      proxyReq.write(requestBody);
    }
    proxyReq.end();
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(chalk.magenta('Debugger proxy v1.0.0'));
  console.log(chalk.magenta('→ Listening on  :'), `http://localhost:${PORT}`);
  console.log(chalk.magenta('→ Forwarding to :'), baseUrl);
  // TODO: initialize CLI UI (Ink/React) here
});