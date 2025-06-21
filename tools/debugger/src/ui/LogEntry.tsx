import { Box, Text } from 'ink';
import type { LogEntry as LogEntryType } from './types.js';

interface LogEntryProps {
  log: LogEntryType;
}

export const LogEntry = ({ log }: LogEntryProps) => {
  const data = log.data.toString();

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTypeColor = (type: LogEntryType['type']): string => {
    switch (type) {
      case 'request': return 'cyan';
      case 'response': return 'green';
      case 'chunk': return 'yellow';
      case 'error': return 'red';
      default: return 'white';
    }
  };

  const getTypeIcon = (type: LogEntryType['type']): string => {
    switch (type) {
      case 'request': return '→';
      case 'response': return '←';
      case 'chunk': return '⋯';
      case 'error': return '✗';
      default: return '•';
    }
  };

  // Check if this is a request/response header line to show timestamp on next line
  const isRequestResponseHeader = () => {
    return data.includes('=== Request') || data.includes('=== Response');
  };

  // Check if this is a system header (no timestamp needed)
  const isSystemHeader = () => {
    return data.includes('=== System');
  };

  if (isRequestResponseHeader()) {
    // For request/response headers, show the header then timestamp on next line
    return (
      <Box flexDirection="column">
        <Text>{data}</Text>
        <Box>
          <Text color={getTypeColor(log.type)}>{getTypeIcon(log.type)} </Text>
          <Text color="blueBright">{formatTimestamp(log.timestamp)}</Text>
        </Box>
      </Box>
    );
  }

  if (isSystemHeader()) {
    // For system headers, just show the header without timestamp
    return (
      <Box>
        <Text>{data}</Text>
      </Box>
    );
  }

  // For all other lines, just show the content without indentation
  return (
    <Box>
      <Text>{data}</Text>
    </Box>
  );
};