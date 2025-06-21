import chalk from 'chalk';

export interface DebuggerConfig {
  ports: {
    proxy: number;
    defaultHttp: number;
    defaultHttps: number;
  };
  ui: {
    roleColors: Record<string, typeof chalk>;
    finishReasonColors: Record<string, typeof chalk>;
    statusCodeColors: {
      success: typeof chalk;
      redirect: typeof chalk;
      error: typeof chalk;
    };
  };
  headers: {
    importantPrefixes: string[];
    sensitiveHeaders: string[];
  };
  content: {
    streamingContentTypes: string[];
    compressionTypes: string[];
  };
  responses: {
    collapsedPatterns: string[];
  };
  state: {
    maxHistorySize: number;
  };
}

/**
 * Default configuration for the debugger proxy
 */
export const defaultConfig: DebuggerConfig = {
  ports: {
    proxy: 8090,
    defaultHttp: 80,
    defaultHttps: 443,
  },
  ui: {
    roleColors: {
      system: chalk.gray,
      user: chalk.cyan,
      assistant: chalk.green,
      function: chalk.yellow,
    },
    finishReasonColors: {
      stop: chalk.green,
      function_call: chalk.cyan,
    },
    statusCodeColors: {
      success: chalk.green,
      redirect: chalk.yellow,
      error: chalk.red,
    },
  },
  headers: {
    importantPrefixes: ['x-user-', 'x-channel-', 'x-app-', 'x-api-'],
    sensitiveHeaders: ['authorization', 'x-user-auth'],
  },
  content: {
    streamingContentTypes: ['text/event-stream', 'application/x-ndjson'],
    compressionTypes: ['gzip', 'zstd'],
  },
  responses: {
    collapsedPatterns: ['/users/*'],
  },
  state: {
    maxHistorySize: 200,
  },
};

/**
 * Get the current configuration with environment variable overrides
 */
export function getConfig(): DebuggerConfig {
  return {
    ...defaultConfig,
    ports: {
      ...defaultConfig.ports,
      proxy: Number(process.env.PORT) || defaultConfig.ports.proxy,
    },
  };
}

/**
 * Current active configuration
 */
export const config = getConfig();