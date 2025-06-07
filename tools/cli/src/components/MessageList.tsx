import { useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import { renderCodeBlock } from '../utils/rendering.js';
import open from 'open';
import type { Message } from './types.js';

interface MessageListProps {
    messages: Message[];
    shapeName?: string;
}

export const MessageList = ({ messages, shapeName }: MessageListProps) => {

    const getAssistantLabel = (messageDisplayName?: string) => {
        const displayName = messageDisplayName || shapeName;
        if (displayName?.startsWith('shapesinc/')) {
            const parts = displayName.split('/');
            return `${parts[1]}:`;
        }
        return displayName ? `${displayName}:` : 'Assistant:';
    };

    const getUserLabel = (messageDisplayName?: string) => {
        if (messageDisplayName) {
            return `You ${messageDisplayName}:`;
        }
        return 'You:';
    };

    const detectAndOpenImages = useCallback(async (content: string) => {
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
    }, []);

    // Auto-open images in new assistant messages
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.type === 'assistant') {
            detectAndOpenImages(lastMessage.content);
        }
    }, [messages, detectAndOpenImages]);

    const renderShapeInfo = (content: string) => {
        const lines = content.split('\n');
        return (
            <Box flexDirection="column">
                {lines.map((line, lineIndex) => {
                    const key = `${lineIndex}`;
                    // Header line
                    if (line.includes('=== SHAPE:')) {
                        const match = line.match(/🔷 === SHAPE: (.+) ===/);
                        if (match) {
                            return (
                                <Text key={key}>
                                    <Text color="white">🔷 === SHAPE: </Text>
                                    <Text color="cyan">{match[1]}</Text>
                                    <Text color="white"> ===</Text>
                                </Text>
                            );
                        }
                    }

                    // Section headers (with emojis)
                    if (line.match(/^(?:📝|💬|📊|🎭|🖼️|⚙️|🔧)/u)) {
                        return <Text key={key} color="white">{line}</Text>;
                    }

                    // Field lines with special handling
                    if (line.includes('  • ')) {
                        const match = line.match(/^(\s*• )([^:]+): ?(.*)$/);
                        if (match) {
                            const [, indent, fieldName, value] = match;

                            // Special handling for specific fields
                            if (line.includes('• Name:') || line.includes('• Username:')) {
                                return (
                                    <Text key={key}>
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
                                    <Text key={key}>
                                        <Text color="gray">{indent}{fieldName}: </Text>
                                        <Text>{isEnabled ? '✅ ' : '❌ '}</Text>
                                        <Text color={isEnabled ? 'green' : 'yellow'}>{statusText}</Text>
                                    </Text>
                                );
                            }

                            // Admin field with special coloring
                            if (line.includes('• Admin:')) {
                                const isAdmin = value.includes('Yes');
                                const adminText = value.replace('⚠️ ', '');
                                return (
                                    <Text key={key}>
                                        <Text color="gray">{indent}{fieldName}: </Text>
                                        {isAdmin && <Text>⚠️ </Text>}
                                        <Text color={isAdmin ? 'yellow' : 'gray'}>{adminText}</Text>
                                    </Text>
                                );
                            }

                            // Description field (value starts on new line, so only show field name)
                            if (line.includes('• Description:') && value.trim() === '') {
                                return (
                                    <Text key={key}>
                                        <Text color="gray">{indent}{fieldName}:</Text>
                                    </Text>
                                );
                            }

                            // Tags field (make field name gray instead of white)
                            if (line.includes('• Tags:') && value.trim() === '') {
                                return (
                                    <Text key={key}>
                                        <Text color="gray">{indent}{fieldName}:</Text>
                                    </Text>
                                );
                            }

                            // Regular field
                            return (
                                <Text key={key}>
                                    <Text color="gray">{indent}{fieldName}: </Text>
                                    <Text color="gray">{value}</Text>
                                </Text>
                            );
                        }
                    }

                    // Description value lines (indented text after Description field)
                    if (line.match(/^ {4}/) && !line.includes('• ') && lineIndex > 0) {
                        const prevLine = lines[lineIndex - 1];
                        if (prevLine?.includes('• Description:')) {
                            return <Text key={key} color="white">{line}</Text>;
                        }
                    }

                    // Single-line Description field with value
                    if (line.includes('• Description:') && !line.endsWith('Description:')) {
                        const match = line.match(/^(\s*• Description: )(.+)$/);
                        if (match) {
                            const [, fieldPart, descValue] = match;
                            return (
                                <Text key={key}>
                                    <Text color="gray">{fieldPart}</Text>
                                    <Text color="white">{descValue}</Text>
                                </Text>
                            );
                        }
                    }

                    // Tag/array items (indented with bullets)
                    if (line.match(/^ {4}• /)) {
                        return <Text key={key} color="gray">{line}</Text>;
                    }

                    // Empty lines
                    if (line.trim() === '') {
                        return <Text key={key}> </Text>;
                    }

                    // Default
                    return <Text key={key} color="white">{line}</Text>;
                })}
            </Box>
        );
    };

    const renderMemories = (content: string) => {
        const lines = content.split('\n');
        return (
            <Box flexDirection="column">
                {lines.map((line, lineIndex) => {
                    const key = `${lineIndex}`;

                    // Header line
                    if (line.includes('=== MEMORIES')) {
                        return <Text key={key} color="white">{line}</Text>;
                    }

                    // Memory header with date/time
                    if (line.match(/^📝 Memory \d+, /)) {
                        const match = line.match(/^(📝 Memory )(\d+)(, )(.+)$/);
                        if (match) {
                            const [, prefix, number, , datetime] = match;
                            return (
                                <Text key={key}>
                                    <Text color="yellow">{prefix}</Text>
                                    <Text color="yellow">{number}</Text>
                                    <Text color="gray"> {datetime}</Text>
                                </Text>
                            );
                        }
                        return <Text key={key} color="white">{line}</Text>;
                    }

                    // System info line (group, type, id)
                    if (line.match(/^\s+(individual|group), .+ \(.+\)$/)) {
                        const match = line.match(/^\s+((individual|group)), (.+) (\(.+\))$/);
                        if (match) {
                            const [, groupType, , typeText, id] = match;
                            return (
                                <Text key={key}>
                                    <Text color="gray">  </Text>
                                    <Text color="cyan">{groupType}</Text>
                                    <Text color="gray">, {typeText} </Text>
                                    <Text color="gray">{id}</Text>
                                </Text>
                            );
                        }
                        return <Text key={key} color="gray">{line}</Text>;
                    }

                    // Navigation line
                    if (line.includes('📄 Navigation:')) {
                        return <Text key={key} color="white">{line}</Text>;
                    }

                    // Empty lines
                    if (line.trim() === '') {
                        return <Text key={key}> </Text>;
                    }

                    // Summary content (should be white, not indented)
                    return <Text key={key} color="white">{line}</Text>;
                })}
            </Box>
        );
    };

    const renderMessage = (message: Message, index: number) => {
        // Special rendering for memories
        if (message.type === 'system' && message.content.includes('=== MEMORIES')) {
            return (
                <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
                    <Text color="magenta">System:</Text>
                    <Box marginLeft={2}>
                        {renderMemories(message.content)}
                    </Box>
                </Box>
            );
        }

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

        // Special rendering for app info
        if (message.type === 'system' && message.tool_call_id === 'app-info') {
            return (
                <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
                    <Text color="magenta">System:</Text>
                    <Box marginLeft={2}>
                        {renderShapeInfo(message.content)}
                    </Box>
                </Box>
            );
        }

        // Special rendering for shape change messages
        if (message.type === 'system' && message.content.includes('Shape changed to:')) {
            const match = message.content.match(/^(✅ Shape changed to: )shapesinc\/([^)]+)( \(.*\))$/);
            if (match) {
                const [, prefix, username, suffix] = match;
                return (
                    <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
                        <Text color="magenta">System:</Text>
                        <Box marginLeft={2}>
                            <Text color="green">{prefix}</Text>
                            <Text color="gray">shapesinc/</Text>
                            <Text color="cyan">{username}</Text>
                            <Text color="gray">{suffix}</Text>
                        </Box>
                    </Box>
                );
            }
        }

        // Special rendering for current shape prompt messages
        if (message.type === 'system' && message.content.includes('Current shape:') && message.content.includes('Enter new shape username')) {
            const lines = message.content.split('\n');
            const currentShapeLine = lines[0];
            const promptLine = lines[1];

            const match = currentShapeLine.match(/^(Current shape: )shapesinc\/(.+)$/);
            if (match) {
                const [, prefix, username] = match;
                return (
                    <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
                        <Text color="magenta">System:</Text>
                        <Box marginLeft={2} flexDirection="column">
                            <Box>
                                <Text color="gray">{prefix}</Text>
                                <Text color="gray">shapesinc/</Text>
                                <Text color="cyan">{username}</Text>
                            </Box>
                            <Text color="gray">{promptLine}</Text>
                        </Box>
                    </Box>
                );
            }
        }

        const formattedContent = message.content.replace(
            /```(\w+)?\n([\s\S]*?)```/g,
            (_match, language, code) => renderCodeBlock(code, language)
        );

        return (
            <Box key={`message-${index}`} flexDirection="column" marginBottom={1}>
                <Text color={message.type === 'user' ? 'green' : message.type === 'system' ? 'magenta' : message.type === 'tool' ? 'yellow' : message.type === 'error' ? 'red' : 'cyan'}>
                    {message.type === 'user' ? getUserLabel(message.display_name) :
                        message.type === 'system' ? 'System:' :
                            message.type === 'tool' ? `Tool (${message.display_name || 'unknown'}):` :
                                message.type === 'error' ? 'Error:' :
                                    getAssistantLabel(message.display_name)}
                    {message.streaming && <Text color="yellow"> ⚡</Text>}
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
                {message.tool_calls && message.tool_calls?.length > 0 && (
                    <Box marginLeft={2} marginTop={1}>
                        {message.tool_calls.map((toolCall, tcIndex) => (
                            <Box key={`${toolCall.function.name}-${tcIndex}`} flexDirection="column" marginBottom={1}>
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