import { EventEmitter } from 'node:events';

export interface LogEvent {
  type: 'request' | 'response' | 'chunk' | 'error';
  data: unknown;
}

export const logEmitter = new EventEmitter();

// Events are now handled by the React/Ink UI
// No console fallback needed

// Helper to emit log events
export function emitLog(type: LogEvent['type'], data: unknown): void {
  logEmitter.emit('log', { type, data });
}