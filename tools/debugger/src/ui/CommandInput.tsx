import { useState } from 'react';
import { Box, Text, useStdout, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { getEndpointInfo } from './utils.js';

interface CommandInputProps {
  onCommand: (command: string) => Promise<void>;
  requestCount: number;
  proxyPort: number;
  forwardingTo: string;
}

export const CommandInput = ({ onCommand, requestCount, proxyPort, forwardingTo }: CommandInputProps) => {
  const [input, setInput] = useState('');
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;

  useInput((input, key) => {
    // Handle Ctrl+C to exit
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }
  });

  const handleSubmit = async () => {
    if (input.trim()) {
      await onCommand(input.trim());
      setInput('');
    }
  };

  const endpointInfo = getEndpointInfo(forwardingTo);

  return (
    <Box flexDirection="column" width={terminalWidth}>
      {/* Input box with border */}
      <Box borderStyle="round" borderColor="blue" width={terminalWidth}>
        <Box width="100%" paddingX={1}>
          <Text color="green">❯ </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type /help for commands or Ctrl+C to exit..."
          />
        </Box>
      </Box>

      {/* Status line below input */}
      <Box width={terminalWidth} paddingX={2} justifyContent="space-between">
        <Box>
          <Text color="cyan">Proxy: </Text>
          <Text color="yellow">localhost:{proxyPort}</Text>
          <Text color="gray"> | </Text>
          <Text color="cyan">Requests: </Text>
          <Text color="green">{requestCount}</Text>
        </Box>
        <Box>
          <Text color="gray">Forwarding to </Text>
          <Text color={endpointInfo.color}>{endpointInfo.displayUrl}</Text>
        </Box>
      </Box>
    </Box>
  );
};