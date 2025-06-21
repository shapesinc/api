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

  // Only show timestamp and arrow on Method and Status lines
  const shouldShowTimestamp = () => {
    return data.includes('Method: ') || data.includes('Status: ');
  };

  if (shouldShowTimestamp()) {
    return (
      <Box>
        <Text color="gray">{formatTimestamp(log.timestamp)} </Text>
        <Text color={getTypeColor(log.type)}>{getTypeIcon(log.type)} </Text>
        <Text>{log.data}</Text>
      </Box>
    );
  }

  // For other lines (Headers, Body, etc.), indent more to show hierarchy
  // Timestamp (8) + space + arrow + space = 11 characters of base indentation
  const indentation = '           '; // 11 spaces

  return (
    <Box>
      <Text>{indentation}{data}</Text>
    </Box>
  );
};