#!/usr/bin/env node

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import zlib from 'node:zlib';
import { getApiServerBaseUrl } from './src/utils.js';
import chalk from 'chalk';

/**
 * Mask a token showing only the last 4 characters.
 * @param {string} token
 * @returns {string}
 */
function maskToken(token) {
  const t = String(token || '');
  const last = t.slice(-4);
  return '****' + last;
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

/**
 * Pretty-print JSON with OpenAI chat syntax highlighting.
 * @param {object} obj - parsed JSON object
 * @param {object} opts
 * @param {boolean} opts.isResponse - if true, also highlight finish_reason
 */
function prettyPrintJson(obj, { isResponse = false } = {}) {
  const str = JSON.stringify(obj, null, 2);
  for (const line of str.split('\n')) {
    const m = line.match(/^(\s*)(.*)$/);
    const indent = m ? m[1] : '';
    const trimmed = m ? m[2] : line;
    // braces or brackets
    if (/^[\{\}\[\]],?$/.test(trimmed)) {
      console.log(indent + chalk.gray(trimmed));
    } else if (trimmed.startsWith('"role"')) {
      const parts = trimmed.match(/^"role":\s*"([^"]+)"(,?)$/);
      if (parts) {
        const [, role, comma] = parts;
        const colorFn = roleColorMap[role] || chalk.white;
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
      // highlight only content value
      const partsContent = trimmed.match(/^("content":\s*)(".*")(,?)$/);
      if (partsContent) {
        const [, keyPart, valuePart, comma] = partsContent;
        console.log(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
      } else {
        console.log(indent + chalk.gray(trimmed));
      }
    } else if (isResponse && trimmed.startsWith('"finish_reason"')) {
      const parts = trimmed.match(/^"finish_reason":\s*"([^"]+)"(,?)$/);
      if (parts) {
        const [, reason, comma] = parts;
        const colorFn = finishReasonColors[reason] || chalk.red;
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
const PORT    = process.env.PORT || 8090;
// Determine upstream API base URL (local server or production)
const baseUrl = await getApiServerBaseUrl();

/**
 * Pretty-print an HTTP request header and body (minimal skeleton)
 */
function prettyPrintRequest(req, bodyBuf) {
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
        display = maskToken(value);
      }
    } else if (lower === 'x-user-auth') {
      display = maskToken(value);
    }
    // highlight important headers
    const important = lower === 'authorization' || lower === 'content-type' ||
      lower.startsWith('x-user-') || lower.startsWith('x-channel-') ||
      lower.startsWith('x-app-') || lower.startsWith('x-api-');
    const colorFn = important ? chalk.magenta : chalk.gray;
    console.log(colorFn(`  ${name}: ${display}`));
  }

  // Body
  if (bodyBuf && bodyBuf.length) {
    console.log(chalk.bold('Body:'));
    const str = bodyBuf.toString('utf8');
    try {
      const obj = JSON.parse(str);
      prettyPrintJson(obj, { isResponse: false });
    } catch (e) {
      console.log(str);
    }
  }
}

/**
 * Pretty-print an HTTP response status and body (minimal skeleton)
 */
function prettyPrintResponse(res, bodyBuf) {
  // colored section title based on status code
  {
    const code = res.statusCode;
    const titleColor = code >= 200 && code < 300 ? chalk.green
                      : code >= 300 && code < 400 ? chalk.yellow
                      : chalk.red;
    console.log(titleColor.bold.underline(`\n=== Response ===`));
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
        display = maskToken(value);
      }
    } else if (lower === 'x-user-auth') {
      display = maskToken(value);
    }
    // highlight important headers
    const important = lower === 'authorization' || lower === 'content-type' ||
      lower.startsWith('x-user-') || lower.startsWith('x-channel-') ||
      lower.startsWith('x-app-') || lower.startsWith('x-api-');
    const colorFn = important ? chalk.magenta : chalk.gray;
    console.log(colorFn(`  ${name}: ${display}`));
  }

  // Body
  if (bodyBuf && bodyBuf.length) {
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
        console.log(chalk.red('Failed to decompress gzipped response:'), err.message);
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
}


// Basic HTTP proxy server
const server = http.createServer((clientReq, clientRes) => {
  // Buffer incoming request body
  const reqChunks = [];
  clientReq.on('data', chunk => reqChunks.push(chunk));
  clientReq.on('end', () => {
    const requestBody = Buffer.concat(reqChunks);
    // Log the request (expand later)
    prettyPrintRequest(clientReq, requestBody);

    // Build upstream URL
    const upstreamUrl = new URL(clientReq.url, baseUrl);
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
        const resChunks = [];
        proxyRes.on('data', chunk => resChunks.push(chunk));
        proxyRes.on('end', () => {
          const responseBody = Buffer.concat(resChunks);
          // Log the response (expand later)
          prettyPrintResponse(proxyRes, responseBody);

          // Relay status, headers, and body back to client
          clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
          clientRes.end(responseBody);
        });
    });

    proxyReq.on('error', err => {
      console.error(chalk.red('Upstream error:'), err.message);
      // Respond with 502 Bad Gateway on error
      clientRes.writeHead(502);
      clientRes.end('Bad Gateway: ' + err.message);
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
  console.log(chalk.magenta(`Debugger proxy v1.0.0`));
  console.log(chalk.magenta('→ Listening on  :'), `http://localhost:${PORT}`);
  console.log(chalk.magenta('→ Forwarding to :'), baseUrl);
  // TODO: initialize CLI UI (Ink/React) here
});