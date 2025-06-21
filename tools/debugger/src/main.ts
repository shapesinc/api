#!/usr/bin/env node

import http from 'node:http';
import { getApiServerBaseUrl } from './service-discovery.js';
import { config } from './config.js';
import chalk from 'chalk';
import { emitLog } from './events.js';
import { handleProxyRequest } from './proxy-handler.js';
import { startUI } from './ui/index.js';




// Load persistent configuration
await config.loadCollapsePatterns();

// Determine upstream API base URL (local server or production)
const baseUrl: string = await getApiServerBaseUrl();



// HTTP proxy server
const server = http.createServer((clientReq, clientRes) => {
  // Buffer incoming request body
  const reqChunks: Buffer[] = [];
  clientReq.on('data', chunk => reqChunks.push(chunk));
  clientReq.on('end', () => {
    const requestBody = Buffer.concat(reqChunks);
    handleProxyRequest(clientReq, clientRes, baseUrl, requestBody);
  });
});

// Start listening
server.listen(config.get().ports.proxy, () => {
  // Log initial startup messages
  emitLog('request', chalk.magenta('Debugger proxy v1.0.0'));
  emitLog('request', `${chalk.magenta('→ Listening on  :')} ${chalk.yellow(`http://localhost:${config.get().ports.proxy}`)}`);
  emitLog('request', `${chalk.magenta('→ Forwarding to :')} ${chalk.yellow(baseUrl)}`);
  emitLog('request', chalk.cyan('UI initialized. Type /help for commands.'));
  
  // Start React/Ink UI
  startUI(baseUrl);
});