import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface QueuedImage {
  dataUrl: string;
  filename: string;
  size: number;
}

interface ChatInputProps {
  onSend: (content: string, images?: string[]) => void;
  images: QueuedImage[];
  enabledToolsCount: number;
  shapeName: string;
  authStatus: string;
  endpoint: string;
  terminalWidth: number;
  inputMode?: 'normal' | 'awaiting_auth';
  onEscape?: () => void;
  userId?: string;
  channelId?: string;
  appName?: string;
  onRemoveImage?: (index: number) => void;
}

export const ChatInput = ({ onSend, images, enabledToolsCount, shapeName, authStatus, endpoint, terminalWidth, inputMode = 'normal', onEscape, userId, channelId, appName, onRemoveImage }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useInput((input, key) => {
    if (key.escape && inputMode === 'awaiting_auth' && onEscape) {
      onEscape();
    }
  });

  const handleSubmit = () => {
    if (input.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const imageUrls = images.map(img => img.dataUrl);
      onSend(input, images.length > 0 ? imageUrls : undefined);
      setInput('');
      // Reset submitting state after a brief delay
      globalThis.setTimeout(() => setIsSubmitting(false), 100);
    }
  };

  const renderShapeName = () => {
    if (shapeName.startsWith('shapesinc/')) {
      const parts = shapeName.split('/');
      return (
        <Box>
          <Text color="gray">shapesinc/</Text>
          <Text color="cyan">{parts[1]}</Text>
        </Box>
      );
    }
    return <Text color="cyan">{shapeName}</Text>;
  };

  const getAuthColor = () => {
    return authStatus.startsWith('Authenticated') ? 'green' : 'yellow';
  };

  const getEndpointInfo = () => {
    const isProduction = endpoint.includes('api.shapes.inc');
    const displayUrl = isProduction ? 'prod' : endpoint.replace(/^https?:\/\//, '');
    const color = isProduction ? 'green' : 'yellow';
    return { displayUrl, color };
  };

  return (
    <Box flexDirection="column" width={terminalWidth}>
      {/* Images display with remove buttons */}
      {images.length > 0 && (
        <Box marginTop={1} paddingX={2}>
          <Text color="yellow">Images ({images.length}): </Text>
          {images.map((image, index) => (
            <Box key={index} marginRight={1}>
              <Text color="cyan">{image.filename}</Text>
              <Text color="gray"> ({Math.round(image.size / 1024)}KB) </Text>
              {onRemoveImage && (
                <Box 
                  onPress={() => onRemoveImage(index)}
                  cursor="pointer"
                >
                  <Text color="red">×</Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
      
      {/* Input box with border */}
      <Box borderStyle="round" borderColor="blue" width={terminalWidth}>
        <Box width="100%" paddingX={1}>
          <Text color="green">❯ </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder={inputMode === 'awaiting_auth' ? 'Enter authorization code (ESC to cancel)...' : 'Type your message or use /help for commands...'}
          />
        </Box>
      </Box>
      
      {/* Status line below input - aligned as if inside the border */}
      <Box width={terminalWidth} paddingX={2} justifyContent="space-between">
        <Box>
          <Text color="cyan">Shape: </Text>
          {renderShapeName()}
          {images.length > 0 && (
            <Text color="yellow"> | Images: {images.length}</Text>
          )}
          {enabledToolsCount > 0 && (
            <Text color="green"> | Tools: {enabledToolsCount}</Text>
          )}
        </Box>
        <Box>
          {userId && (
            <Text color="magenta">User: {userId}</Text>
          )}
          {channelId && (
            <Text color="blue">{userId ? ' | ' : ''}Channel: {channelId}</Text>
          )}
        </Box>
        <Box>
          <Text color={getAuthColor()}>{authStatus}</Text>
          <Text color="gray"> | </Text>
          <Text color={getEndpointInfo().color}>{getEndpointInfo().displayUrl}</Text>
          {appName && (
            <>
              <Text color="gray"> | </Text>
              <Text color="cyan">{appName}</Text>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};