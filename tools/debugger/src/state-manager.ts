import crypto from 'node:crypto';
import { config } from './config.js';

export interface RequestState {
  id: string;
  requestNumber: number;
  timestamp: Date;
  request: {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    body?: string;
  };
  response?: {
    status: number;
    headers: Record<string, string | string[]>;
    body?: string;
    streamingChunks?: string[];
  };
  duration?: number;
  error?: string;
}

class StateManager {
  private requests: RequestState[] = [];
  private maxSize: number;
  private requestCounter: number = 0;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  /**
   * Create a new request entry.
   */
  createRequest(data: {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    body?: string;
  }): string {
    const id = crypto.randomUUID();
    this.requestCounter++;
    
    const request: RequestState = {
      id,
      requestNumber: this.requestCounter,
      timestamp: new Date(),
      request: data,
    };

    this.requests.push(request);
    
    // Trim old entries if queue is too large
    if (this.requests.length > this.maxSize) {
      this.requests.shift();
    }

    return id;
  }

  /**
   * Add response data to an existing request.
   */
  addResponse(id: string, response: {
    status: number;
    headers: Record<string, string | string[]>;
    body?: string;
  }): void {
    const request = this.requests.find(r => r.id === id);
    if (request) {
      request.response = response;
      request.duration = Date.now() - request.timestamp.getTime();
    }
  }

  /**
   * Add a streaming chunk to a response.
   */
  addStreamingChunk(id: string, chunk: string): void {
    const request = this.requests.find(r => r.id === id);
    if (request?.response) {
      if (!request.response.streamingChunks) {
        request.response.streamingChunks = [];
      }
      request.response.streamingChunks.push(chunk);
    }
  }

  /**
   * Mark request as failed with error.
   */
  markError(id: string, error: string): void {
    const request = this.requests.find(r => r.id === id);
    if (request) {
      request.error = error;
      request.duration = Date.now() - request.timestamp.getTime();
    }
  }

  /**
   * Get the most recent request/response pair.
   */
  getLastRequest(): RequestState | undefined {
    return this.requests[this.requests.length - 1];
  }

  /**
   * Get all requests (for UI display).
   */
  getAllRequests(): RequestState[] {
    return [...this.requests];
  }

  /**
   * Get request number by ID.
   */
  getRequestNumber(id: string): number | undefined {
    return this.requests.find(r => r.id === id)?.requestNumber;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.requests = [];
    this.requestCounter = 0;
  }
}

// Export singleton instance
export const stateManager = new StateManager(config.get().state.maxHistorySize);