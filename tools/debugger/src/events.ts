import { EventEmitter } from 'node:events';

export interface LogEvent {
  type: 'request' | 'response' | 'chunk' | 'error';
  data: unknown;
}

export const logEmitter = new EventEmitter();

// Simple console logger that listens to events
logEmitter.on('log', (event: LogEvent) => {
  if (event.type === 'chunk') {
    // Direct output for streaming chunks
    console.log(event.data);
  } else {
    // For other events, just pass through the formatted data
    console.log(event.data);
  }
});

// Helper to emit log events
export function emitLog(type: LogEvent['type'], data: unknown): void {
  logEmitter.emit('log', { type, data });
}