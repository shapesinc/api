import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { renderCodeBlock } from '../utils/rendering.js';
import open from 'open';

interface Message {
  type: 'user' | 'assistant' | 'system' | 'tool' | 'error';
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

  const detectAndOpenImages = async (content: string) => {
    // Match image URLs (common image extensions)
    const imageUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp))/gi;
    const matches = content.match(imageUrlRegex);
    
    if (matches) {
      for (const imageUrl of matches) {
        try {
          await open(imageUrl);
        } catch (error) {
          console.warn('Failed to open image URL:', imageUrl, error);
        }
      }
    }
  };

  // Auto-open images in new assistant messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.type === 'assistant') {
      detectAndOpenImages(lastMessage.content);
    }
  }, [messages]);

  const renderShapeInfo = (content: string) => {
    const lines = content.split('\n');
    return (
      <Box flexDirection="column">
        {lines.map((line, lineIndex) => {
          // Header line
          if (line.includes('=== SHAPE PROFILE:')) {
            const match = line.match(/🔷 === SHAPE PROFILE: (.+) ===/);
            if (match) {
              return (
                <Text key={lineIndex}>
                  <Text color="white">🔷 === SHAPE PROFILE: </Text>
                  <Text color="cyan">{match[1]}</Text>
                  <Text color="white"> ===</Text>
                </Text>
              );
            }
          }
          
          // Section headers (with emojis)
          if (line.match(/^[📝💬📊🎭🖼️⚙️🔧]/)) {
            return <Text key={lineIndex} color="white">{line}</Text>;
          }
          
          // Field lines with special handling
          if (line.includes('  • ')) {
            const match = line.match(/^(\s*• )([^:]+): ?(.*)$/);
            if (match) {
              const [, indent, fieldName, value] = match;
              
              // Special handling for specific fields
              if (line.includes('• Name:') || line.includes('• Username:')) {
                return (
                  <Text key={lineIndex}>
                    <Text color="gray">{indent}{fieldName}: </Text>
                    <Text color="cyan">{value}</Text>
                  </Text>
                );
              }
              
              // Status field with colored status
              if (line.includes('• Status:')) {
                const isEnabled = value.includes('Enabled');
                const statusText = value.replace('✅ ', '').replace('❌ ', '');
                return (
                  <Text key={lineIndex}>
                    <Text color="gray">{indent}{fieldName}: </Text>
                    <Text>{isEnabled ? '✅ ' : '❌ '}</Text>
                    <Text color={isEnabled ? 'green' : 'yellow'}>{statusText}</Text>
                  </Text>
                );
              }
              
              // Description field (value starts on new line, so only show field name)
              if (line.includes('• Description:') && value.trim() === '') {
                return (
                  <Text key={lineIndex}>
                    <Text color="gray">{indent}{fieldName}:</Text>
                  </Text>
                );
              }
              
              // Tags field (make field name gray instead of white)
              if (line.includes('• Tags:') && value.trim() === '') {
                return (
                  <Text key={lineIndex}>
                    <Text color="gray">{indent}{fieldName}:</Text>
                  </Text>
                );
              }
              
              // Regular field
              return (
                <Text key={lineIndex}>
                  <Text color="gray">{indent}{fieldName}: </Text>
                  <Text color="gray">{value}</Text>
                </Text>
              );
            }
          }
          
          // Description value lines (indented text after Description field)
          if (line.match(/^    /) && !line.includes('• ') && lineIndex > 0) {
            const prevLine = lines[lineIndex - 1];
            if (prevLine && prevLine.includes('• Description:')) {
              return <Text key={lineIndex} color="white">{line}</Text>;
            }
          }
          
          // Tag/array items (indented with bullets)
          if (line.match(/^    • /)) {
            return <Text key={lineIndex} color="gray">{line}</Text>;
          }
          
          // Empty lines
          if (line.trim() === '') {
            return <Text key={lineIndex}> </Text>;
          }
          
          // Default
          return <Text key={lineIndex} color="white">{line}</Text>;
        })}
      </Box>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    // Special rendering for shape info
    if (message.type === 'system' && message.tool_call_id === 'shape-info') {
      return (
        <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
          <Text color="magenta">System:</Text>
          <Box marginLeft={2}>
            {renderShapeInfo(message.content)}
          </Box>
        </Box>
      );
    }

    const formattedContent = message.content.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, language, code) => renderCodeBlock(code, language)
    );

    return (
      <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
        <Text color={message.type === 'user' ? 'green' : message.type === 'system' ? 'magenta' : message.type === 'tool' ? 'yellow' : message.type === 'error' ? 'red' : 'cyan'}>
          {message.type === 'user' ? 'You:' : message.type === 'system' ? 'System:' : message.type === 'tool' ? 'Tool:' : message.type === 'error' ? 'Error:' : getAssistantLabel()}
        </Text>
        <Box marginLeft={2}>
          {message.type === 'error' ? (
            <Text>
              <Text color="gray">API Error: </Text>
              <Text color="red">{message.content.replace('API Error: ', '')}</Text>
            </Text>
          ) : (
            <Text>{formattedContent}</Text>
          )}
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