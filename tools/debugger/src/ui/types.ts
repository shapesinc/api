export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'request' | 'response' | 'chunk' | 'error';
  data: string;
  requestId?: string;
}

export interface UIState {
  logs: LogEntry[];
  requestCount: number;
  proxyPort: number;
  forwardingTo: string;
}