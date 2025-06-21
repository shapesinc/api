import { useState, useEffect } from 'react';
import { Box } from 'ink';
import { Banner } from './Banner.js';
import { CommandInput } from './CommandInput.js';
import { LogEntry } from './LogEntry.js';
import { logEmitter } from '../events.js';
import { stateManager } from '../state-manager.js';
import { config } from '../config.js';
import { handleCollapseCommand } from '../commands/collapse.js';
import type { LogEntry as LogEntryType, UIState } from './types.js';
import chalk from 'chalk';

interface AppProps {
  baseUrl: string;
}

export const App = ({ baseUrl }: AppProps) => {
  const [state, setState] = useState<UIState>({
    logs: [],
    requestCount: 0,
    proxyPort: config.get().ports.proxy,
    forwardingTo: baseUrl,
  });

  useEffect(() => {
    // Listen to log events and convert them to UI log entries
    const handleLog = ({ type, data }: { type: 'request' | 'response' | 'chunk' | 'error'; data: unknown }) => {
      const logEntry: LogEntryType = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type,
        data: typeof data === 'string' ? data : String(data),
      };

      setState(prevState => ({
        ...prevState,
        logs: [...prevState.logs, logEntry],
        // Increment request count only for new requests
        requestCount: type === 'request' && typeof data === 'string' && data.includes('=== Request ===') 
          ? prevState.requestCount + 1 
          : prevState.requestCount,
      }));
    };

    logEmitter.on('log', handleLog);

    return () => {
      logEmitter.off('log', handleLog);
    };
  }, []);

  const handleCommand = async (command: string) => {
    // Add command to logs
    const commandEntry: LogEntryType = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'request',
      data: chalk.yellow(`> ${command}`),
    };

    setState(prevState => ({
      ...prevState,
      logs: [...prevState.logs, commandEntry],
    }));

    // Handle commands
    if (command.startsWith('/')) {
      const parts = command.slice(1).split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      switch (cmd) {
        case 'help': {
          const helpEntry: LogEntryType = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            type: 'response',
            data: `Available commands:

↳ ${chalk.green('/help')} - Show this help message
↳ ${chalk.green('/clear')} - Clear log history
↳ ${chalk.green('/stats')} - Show proxy statistics
↳ ${chalk.green('/collapse')} - Show current collapsed response patterns
↳ ${chalk.green('/collapse add <pattern>')} - Add URL pattern to collapse responses
↳ ${chalk.green('/collapse remove <pattern>')} - Remove URL pattern from collapsed responses
↳ ${chalk.green('/collapse clear')} - Clear all collapsed response patterns
↳ ${chalk.green('/exit')} - Exit the debugger

The debugger automatically logs all HTTP requests and responses.
Use Ctrl+C to exit at any time.`,
          };

          setState(prevState => ({
            ...prevState,
            logs: [...prevState.logs, helpEntry],
          }));
          break;
        }

        case 'clear': {
          setState(prevState => ({
            ...prevState,
            logs: [],
          }));
          break;
        }

        case 'stats': {
          const allRequests = stateManager.getAllRequests();
          const completedRequests = allRequests.filter(r => r.response);
          const errorRequests = allRequests.filter(r => r.error);
          
          const statsEntry: LogEntryType = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            type: 'response',
            data: `📊 Proxy Statistics:

↳ Total requests: ${allRequests.length}
↳ Completed: ${completedRequests.length}
↳ Errors: ${errorRequests.length}
↳ Success rate: ${allRequests.length > 0 ? Math.round((completedRequests.length / allRequests.length) * 100) : 0}%

↳ Proxy port: ${config.get().ports.proxy}
↳ Forwarding to: ${baseUrl}
↳ History size: ${allRequests.length}/${config.get().state.maxHistorySize}`,
          };

          setState(prevState => ({
            ...prevState,
            logs: [...prevState.logs, statsEntry],
          }));
          break;
        }

        case 'collapse': {
          try {
            const result = await handleCollapseCommand(args);
            const collapseEntry: LogEntryType = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
              type: 'response',
              data: result,
            };

            setState(prevState => ({
              ...prevState,
              logs: [...prevState.logs, collapseEntry],
            }));
          } catch (error) {
            const errorEntry: LogEntryType = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
              type: 'error',
              data: `Error handling collapse command: ${error instanceof Error ? error.message : String(error)}`,
            };

            setState(prevState => ({
              ...prevState,
              logs: [...prevState.logs, errorEntry],
            }));
          }
          break;
        }

        case 'exit': {
          process.exit(0);
          break;
        }

        default: {
          const errorEntry: LogEntryType = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            type: 'error',
            data: `Unknown command: /${cmd}. Type /help for available commands.`,
          };

          setState(prevState => ({
            ...prevState,
            logs: [...prevState.logs, errorEntry],
          }));
          break;
        }
      }
    } else {
      // Non-slash commands are silently ignored as per requirements
      const ignoredEntry: LogEntryType = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: 'response',
        data: chalk.gray('(Non-command input ignored)'),
      };

      setState(prevState => ({
        ...prevState,
        logs: [...prevState.logs, ignoredEntry],
      }));
    }
  };

  return (
    <Box flexDirection="column">
      <Banner 
        proxyPort={state.proxyPort}
        forwardingTo={state.forwardingTo}
        requestCount={state.requestCount}
      />
      
      {/* Show all logs without height constraints - let terminal handle scrolling */}
      {state.logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
      
      <CommandInput 
        onCommand={handleCommand}
        requestCount={state.requestCount}
        proxyPort={state.proxyPort}
        forwardingTo={state.forwardingTo}
      />
    </Box>
  );
};