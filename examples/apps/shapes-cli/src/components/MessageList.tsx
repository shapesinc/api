import React from 'react';
import { Box, Text } from 'ink';
import { renderCodeBlock } from '../utils/rendering.js';

interface Message {
  type: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  images?: string[];
  tool_calls?: any[];
  tool_call_id?: string;
}

interface MessageListProps {
  messages: Message[];
  shapeName?: string;
}

export const MessageList = ({ messages, shapeName }: MessageListProps) => {
  const getAssistantLabel = () => {
    if (shapeName && shapeName.startsWith('shapesinc/')) {
      const parts = shapeName.split('/');
      return `${parts[1]}:`;
    }
    return shapeName ? `${shapeName}:` : 'Assistant:';
  };

  const renderMessage = (message: Message, index: number) => {
    const formattedContent = message.content.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, language, code) => renderCodeBlock(code, language)
    );

    return (
      <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
        <Text color={message.type === 'user' ? 'green' : message.type === 'system' ? 'magenta' : message.type === 'tool' ? 'yellow' : 'cyan'}>
          {message.type === 'user' ? 'You:' : message.type === 'system' ? 'System:' : message.type === 'tool' ? 'Tool:' : getAssistantLabel()}
        </Text>
        <Box marginLeft={2}>
          <Text>{formattedContent}</Text>
        </Box>
        {message.tool_calls && message.tool_calls.length > 0 && (
          <Box marginLeft={2} marginTop={1}>
            {message.tool_calls.map((toolCall, tcIndex) => (
              <Box key={tcIndex} flexDirection="column" marginBottom={1}>
                <Text color="yellow">🔧 {toolCall.function.name}({toolCall.function.arguments})</Text>
              </Box>
            ))}
          </Box>
        )}
        {message.images && message.images.length > 0 && (
          <Box marginLeft={2} marginTop={1}>
            <Text color="gray">Images: {message.images.length}</Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      {messages.map((message, index) => renderMessage(message, index))}
    </Box>
  );
};