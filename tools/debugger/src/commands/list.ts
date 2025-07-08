import { stateManager } from '../state-manager.js';
import chalk from 'chalk';

/**
 * Format HTTP status code with appropriate color.
 */
function formatStatusCode(status: number): string {
  if (status >= 200 && status < 300) {
    return chalk.green(`${status} ${getStatusText(status)}`);
  } else if (status >= 300 && status < 400) {
    return chalk.yellow(`${status} ${getStatusText(status)}`);
  } else {
    return chalk.red(`${status} ${getStatusText(status)}`);
  }
}

/**
 * Get standard HTTP status text.
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return statusTexts[status] || '';
}

/**
 * Handle /list command to show recent requests.
 */
export function handleListCommand(args: string[]): string {
  // Parse count argument, default to 5
  const count = args.length > 0 ? parseInt(args[0], 10) : 5;
  
  if (isNaN(count) || count < 1) {
    return `❌ ${chalk.red('Invalid count. Please provide a positive number.')}`;
  }

  const allRequests = stateManager.getAllRequests();
  
  if (allRequests.length === 0) {
    return `📋 No requests recorded yet.`;
  }

  // Get the last N requests
  const recentRequests = allRequests.slice(-count);
  
  const lines: string[] = [`📋 Last ${recentRequests.length} request${recentRequests.length > 1 ? 's' : ''}:\n`];
  
  for (const req of recentRequests) {
    // First line: request number, method, and path
    const method = chalk.cyan(req.request.method);
    const url = chalk.white(req.request.url);
    lines.push(`${chalk.gray(`${req.requestNumber}.`)} ${method} ${url}`);
    
    // Second line: response status or error
    if (req.error) {
      lines.push(`   ${chalk.red('Error:')} ${req.error}`);
    } else if (req.response) {
      lines.push(`   ${formatStatusCode(req.response.status)}`);
    } else {
      lines.push(`   ${chalk.gray('(pending)')}`);
    }
    
    lines.push(''); // Empty line between entries
  }
  
  return lines.join('\n').trim();
}