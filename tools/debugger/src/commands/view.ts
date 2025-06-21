import { stateManager } from '../state-manager.js';
import { formatRequest } from '../request-formatter.js';
import { formatResponseHeaders, formatResponseBody } from '../response-formatter.js';
import chalk from 'chalk';

/**
 * Handle /view command to re-display a specific request/response.
 */
export function handleViewCommand(args: string[]): string[] {
  const allRequests = stateManager.getAllRequests();
  
  if (allRequests.length === 0) {
    return [`❌ ${chalk.red('No requests recorded yet.')}`];
  }

  // Parse request number argument, default to latest
  let requestNumber: number;
  if (args.length > 0) {
    const parsed = parseInt(args[0], 10);
    if (isNaN(parsed) || parsed < 1) {
      return [`❌ ${chalk.red('Invalid request number. Please provide a positive number.')}`];
    }
    requestNumber = parsed;
  } else {
    requestNumber = allRequests[allRequests.length - 1].requestNumber;
  }

  // Find the request by number
  const request = allRequests.find(r => r.requestNumber === requestNumber);
  if (!request) {
    return [`❌ ${chalk.red(`Request ${requestNumber} not found.`)}`];
  }

  const lines: string[] = [];

  // Format and display the request (strip any leading newlines since we're not in live log)
  const requestData = {
    method: request.request.method,
    url: request.request.url,
    headers: request.request.headers,
  } as any;

  const requestBody = request.request.body ? Buffer.from(request.request.body, 'utf8') : Buffer.alloc(0);
  const formattedRequest = formatRequest(requestData, requestBody, request.requestNumber);

  lines.push(formattedRequest.header.replace(/^\n/, '')); // Remove leading newline
  lines.push(formattedRequest.method);
  lines.push(formattedRequest.url);
  
  // Add headers
  lines.push(chalk.bold('Headers:'));
  for (const [name, val] of Object.entries(request.request.headers)) {
    const value = Array.isArray(val) ? val.join(', ') : val;
    let display = value;
    const lower = name.toLowerCase();
    
    // Mask sensitive tokens (simplified version)
    if (lower === 'authorization' && value) {
      const parts = String(value).split(' ');
      if (parts.length > 1) {
        const scheme = parts.shift();
        const token = parts.join(' ');
        const last = token.slice(-4);
        display = `${scheme} ****${last}`;
      }
    }
    
    const important = lower === 'authorization' || lower === 'content-type';
    const colorFn = important ? chalk.magenta : chalk.gray;
    lines.push(colorFn(`  ${name}: ${display}`));
  }

  // Add request body if present
  if (formattedRequest.body) {
    lines.push(...formattedRequest.body);
  }

  // Add response if available
  if (request.response) {
    const responseData = {
      statusCode: request.response.status,
      headers: request.response.headers,
    } as any;

    const formattedResponseHeaders = formatResponseHeaders(responseData, request.requestNumber);
    lines.push(formattedResponseHeaders.header.replace(/^\n/, '')); // Remove leading newline
    lines.push(formattedResponseHeaders.status);

    // Add response headers
    lines.push(chalk.bold('Headers:'));
    for (const [name, val] of Object.entries(request.response.headers)) {
      const value = Array.isArray(val) ? val.join(', ') : val;
      const lower = name.toLowerCase();
      const important = lower === 'content-type' || lower === 'content-length';
      const colorFn = important ? chalk.magenta : chalk.gray;
      lines.push(colorFn(`  ${name}: ${value}`));
    }

    // Add response body - ALWAYS EXPANDED for /view command
    if (request.response.body) {
      const bodyBuffer = Buffer.from(request.response.body, 'utf8');
      const formattedBody = formatResponseBody(responseData, bodyBuffer);
      if (formattedBody) {
        lines.push(...formattedBody);
      }
    } else if (request.response.streamingChunks) {
      lines.push(chalk.bold('Body:') + chalk.yellow(' [streaming]'));
      for (const chunk of request.response.streamingChunks) {
        lines.push(chunk);
      }
    }
  } else if (request.error) {
    lines.push(`\n${chalk.red.bold.underline('=== Error ===')}`);
    lines.push(`${chalk.bold('Error:')} ${chalk.red(request.error)}`);
  } else {
    lines.push(`\n${chalk.gray.bold.underline('=== Response ===')}`);
    lines.push(chalk.gray('(pending)'));
  }

  return lines;
}