import { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import OpenAI, { type ClientOptions, type APIError } from 'openai';
import { getToken, getAuthUrl, clearToken, authenticate, saveToken } from '../utils/auth.js';
import { loadTools } from '../utils/tools.js';
import { loadPlugins } from '../utils/plugins.js';
import { uploadImage, listImageFiles } from '../utils/image.js';
import { ChatInput } from './ChatInput.js';
import { MessageList } from './MessageList.js';
import { Banner } from './Banner.js';
import { renderError } from '../utils/rendering.js';
import { config, initConfig } from '../config.js';
import type { Message, QueuedImage } from './types.js';
import open from 'open';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

interface Tool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    enabled: boolean;
}

const TOOLS_STATE_FILE = path.join(os.homedir(), '.shapes-cli', 'tools-state.json');
const USER_ID_FILE = path.join(os.homedir(), '.shapes-cli', 'user-id.txt');
const CHANNEL_ID_FILE = path.join(os.homedir(), '.shapes-cli', 'channel-id.txt');
const APP_ID_FILE = path.join(os.homedir(), '.shapes-cli', 'app-id.txt');
const API_KEY_FILE = path.join(os.homedir(), '.shapes-cli', 'api-key.txt');
const SHAPE_CACHE_FILE = path.join(os.homedir(), '.shapes-cli', 'shape-cache.json');
const SHAPE_USERNAME_FILE = path.join(os.homedir(), '.shapes-cli', 'shape-username.txt');

const saveToolsState = async (tools: Tool[]): Promise<void> => {
    try {
        const dir = path.dirname(TOOLS_STATE_FILE);
        await fs.mkdir(dir, { recursive: true });
        const toolsState = tools.reduce((acc, tool) => {
            acc[tool.name] = tool.enabled;
            return acc;
        }, {} as Record<string, boolean>);
        await fs.writeFile(TOOLS_STATE_FILE, JSON.stringify(toolsState), 'utf-8');
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save tools state:', _error);
    }
};

const loadToolsState = async (): Promise<Record<string, boolean>> => {
    try {
        const data = await fs.readFile(TOOLS_STATE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (_error) {
        // Return empty state if file doesn't exist or is invalid
        return {};
    }
};

const saveUserId = async (userId: string): Promise<void> => {
    try {
        const dir = path.dirname(USER_ID_FILE);
        await fs.mkdir(dir, { recursive: true });
        if (userId) {
            await fs.writeFile(USER_ID_FILE, userId, 'utf-8');
        } else {
            // Remove file if userId is empty
            try {
                await fs.unlink(USER_ID_FILE);
            } catch (_error) {
                // Ignore if file doesn't exist
            }
        }
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save user ID:', _error);
    }
};

const loadUserId = async (): Promise<string> => {
    try {
        const data = await fs.readFile(USER_ID_FILE, 'utf-8');
        return data.trim();
    } catch (_error) {
        // Return empty string if file doesn't exist or is invalid
        return '';
    }
};

const saveChannelId = async (channelId: string): Promise<void> => {
    try {
        const dir = path.dirname(CHANNEL_ID_FILE);
        await fs.mkdir(dir, { recursive: true });
        if (channelId) {
            await fs.writeFile(CHANNEL_ID_FILE, channelId, 'utf-8');
        } else {
            // Remove file if channelId is empty
            try {
                await fs.unlink(CHANNEL_ID_FILE);
            } catch (_error) {
                // Ignore if file doesn't exist
            }
        }
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save channel ID:', _error);
    }
};

const loadChannelId = async (): Promise<string> => {
    try {
        const data = await fs.readFile(CHANNEL_ID_FILE, 'utf-8');
        return data.trim();
    } catch (_error) {
        // Return empty string if file doesn't exist or is invalid
        return '';
    }
};

const saveAppId = async (appId: string): Promise<void> => {
    try {
        const dir = path.dirname(APP_ID_FILE);
        await fs.mkdir(dir, { recursive: true });
        // Always write to file, even if empty (to distinguish from "not set")
        await fs.writeFile(APP_ID_FILE, appId, 'utf-8');
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save app ID:', _error);
    }
};

const loadAppId = async (): Promise<string | null> => {
    try {
        const data = await fs.readFile(APP_ID_FILE, 'utf-8');
        return data.trim();
    } catch (_error) {
        // Return null if file doesn't exist (no user preference set)
        return null;
    }
};

const saveApiKey = async (apiKey: string): Promise<void> => {
    try {
        const dir = path.dirname(API_KEY_FILE);
        await fs.mkdir(dir, { recursive: true });
        if (apiKey) {
            await fs.writeFile(API_KEY_FILE, apiKey, 'utf-8');
        } else {
            // Remove file if apiKey is empty
            try {
                await fs.unlink(API_KEY_FILE);
            } catch (_error) {
                // Ignore if file doesn't exist
            }
        }
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save API key:', _error);
    }
};

const loadApiKey = async (): Promise<string> => {
    try {
        const data = await fs.readFile(API_KEY_FILE, 'utf-8');
        return data.trim();
    } catch (_error) {
        // Return empty string if file doesn't exist or is invalid
        return '';
    }
};

interface ShapeCache {
    username: string;
    shapeId: string;
    shapeName: string;
    timestamp: number;
}

const saveShapeCache = async (username: string, shapeId: string, shapeName: string): Promise<void> => {
    try {
        const dir = path.dirname(SHAPE_CACHE_FILE);
        await fs.mkdir(dir, { recursive: true });
        const cache: ShapeCache = {
            username,
            shapeId,
            shapeName,
            timestamp: Date.now()
        };
        await fs.writeFile(SHAPE_CACHE_FILE, JSON.stringify(cache), 'utf-8');
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save shape cache:', _error);
    }
};

const loadShapeCache = async (): Promise<ShapeCache | null> => {
    try {
        const data = await fs.readFile(SHAPE_CACHE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (_error) {
        // Return null if file doesn't exist or is invalid
        return null;
    }
};

const clearShapeCache = async (): Promise<void> => {
    try {
        await fs.unlink(SHAPE_CACHE_FILE);
    } catch (_error) {
        // Ignore if file doesn't exist
    }
};

const saveShapeUsername = async (username: string): Promise<void> => {
    try {
        const dir = path.dirname(SHAPE_USERNAME_FILE);
        await fs.mkdir(dir, { recursive: true });
        if (username) {
            await fs.writeFile(SHAPE_USERNAME_FILE, username, 'utf-8');
        } else {
            // Remove file if username is empty
            try {
                await fs.unlink(SHAPE_USERNAME_FILE);
            } catch (_error) {
                // Ignore if file doesn't exist
            }
        }
    } catch (_error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save shape username:', _error);
    }
};

const loadShapeUsername = async (): Promise<string> => {
    try {
        const data = await fs.readFile(SHAPE_USERNAME_FILE, 'utf-8');
        return data.trim();
    } catch (_error) {
        // Return empty string if file doesn't exist or is invalid
        return '';
    }
};

export const App = () => {
    const { stdout } = useStdout();
    const [messages, setMessages] = useState<Message[]>([]);
    const [client, setClient] = useState<OpenAI | null>(null);
    const [images, setImages] = useState<QueuedImage[]>([]);
    const [availableTools, setAvailableTools] = useState<Tool[]>([]);
    const [shapeName, setShapeName] = useState<string>('');
    const [authStatus, setAuthStatus] = useState<string>('');
    const [endpoint, setEndpoint] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<'normal' | 'awaiting_auth' | 'awaiting_key' | 'awaiting_shape'>('normal');
    const [userId, setUserId] = useState<string>('');
    const [channelId, setChannelId] = useState<string>('');
    const [appId, setAppId] = useState<string>('');
    const [appName, setAppName] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [cachedShapeId, setCachedShapeId] = useState<string>('');
    const [currentShapeUsername, setCurrentShapeUsername] = useState<string>('');

    const terminalHeight = stdout?.rows || 24;
    const terminalWidth = stdout?.columns || 80;

    useEffect(() => {
        const initialize = async () => {
            try {
                // Initialize config with auto-discovered endpoints
                const discoveredConfig = await initConfig();

                // Check for API key or user authentication
                const token = await getToken();

                // Load saved user ID, channel ID, app ID, API key, and shape username first
                const savedUserId = await loadUserId();
                const savedChannelId = await loadChannelId();
                const savedAppId = await loadAppId();
                const savedApiKey = await loadApiKey();
                const savedShapeUsername = await loadShapeUsername();
                setUserId(savedUserId);
                setChannelId(savedChannelId);
                setCurrentShapeUsername(savedShapeUsername);

                // Set API key from saved file or config
                if (savedApiKey && !apiKey) {
                    setApiKey(savedApiKey);
                } else if (!apiKey) {
                    setApiKey(discoveredConfig.apiKey);
                }

                // Calculate current API key for client creation
                const currentApiKey = apiKey || savedApiKey || discoveredConfig.apiKey;

                // Show system message if no API key and no auth token
                if (!currentApiKey && !token) {
                    const noAuthMessage: Message = {
                        type: 'system',
                        content: 'No API key configured and not authenticated. Please enter your API key using /key <your-api-key>.'
                    };
                    setMessages(prev => [...prev, noAuthMessage]);
                }

                // Handle app ID: null = use config default, "" = user cleared, "uuid" = user set
                const effectiveAppId = savedAppId !== null ? savedAppId : discoveredConfig.appId;
                setAppId(effectiveAppId);

                // Create client with API key or user authentication (currentApiKey already calculated above)

                // Only create client if we have an API key or token
                if (currentApiKey || token) {
                    const defaultHeaders: Record<string, string> = {};

                    // Add app ID header if set
                    if (effectiveAppId) {
                        defaultHeaders['X-App-ID'] = effectiveAppId;
                    }

                    // Add user auth header if available
                    if (token) {
                        defaultHeaders['X-User-Auth'] = token;
                    }

                    // Add user ID header if set
                    if (savedUserId) {
                        defaultHeaders['X-User-ID'] = savedUserId;
                    }

                    // Add channel ID header if set
                    if (savedChannelId) {
                        defaultHeaders['X-Channel-ID'] = savedChannelId;
                    }

                    const clientConfig: ClientOptions = {
                        apiKey: currentApiKey,
                        baseURL: discoveredConfig.apiUrl,
                        defaultHeaders,
                    };

                    const shapesClient = new OpenAI(clientConfig);
                    setClient(shapesClient);
                } else {
                    setClient(null);
                }

                // Set shape name, auth status, and endpoint
                const effectiveUsername = savedShapeUsername || discoveredConfig.username;
                const effectiveModel = `shapesinc/${effectiveUsername}`;
                setShapeName(effectiveModel);
                if (token) {
                    setAuthStatus(`Authenticated (${token.slice(-4)})`);
                } else if (currentApiKey) {
                    setAuthStatus(`API Key (${currentApiKey.slice(-4)})`);
                } else {
                    setAuthStatus('No Auth');
                }
                setEndpoint(discoveredConfig.apiUrl);

                // Don't add banner to messages - it will be rendered separately

                // Load cached shape data
                const shapeCache = await loadShapeCache();
                if (shapeCache && shapeCache.username === effectiveUsername) {
                    setCachedShapeId(shapeCache.shapeId);
                } else if (shapeCache && shapeCache.username !== effectiveUsername) {
                    // Clear cache if username has changed
                    await clearShapeCache();
                    setCachedShapeId('');
                }

                // Load tools and plugins
                const [_loadedTools] = await Promise.all([
                    loadTools(),
                    loadPlugins(),
                ]);
                // Note: setTools call removed as tools are not used in the component

                // Initialize test tools with saved state
                const savedToolsState = await loadToolsState();
                const testTools: Tool[] = [
                    {
                        name: 'ping',
                        description: 'Simple ping tool that returns pong',
                        parameters: {
                            type: 'object',
                            properties: {},
                            required: []
                        },
                        enabled: savedToolsState.ping ?? false
                    },
                    {
                        name: 'echo',
                        description: 'Echo tool that returns the input message',
                        parameters: {
                            type: 'object',
                            properties: {
                                message: { type: 'string', description: 'Message to echo' }
                            },
                            required: ['message']
                        },
                        enabled: savedToolsState.echo ?? false
                    }
                ];
                setAvailableTools(testTools);
            } catch (err) {
                setError((err as Error).message);
            }
        };

        initialize();
    }, [apiKey]);

    // Fetch app name when appId changes
    useEffect(() => {
        const fetchAppName = async () => {
            if (!appId) {
                setAppName('');
                return;
            }

            try {
                const token = await getToken();
                const headers: Record<string, string> = {
                    'X-App-ID': appId
                };

                if (config.apiKey) {
                    headers.Authorization = `Bearer ${config.apiKey}`;
                }

                if (token) {
                    headers['X-User-Auth'] = token;
                }

                const response = await fetch(`${endpoint.replace('/v1', '')}/auth/app_info`, {
                    method: 'GET',
                    headers
                });

                if (response.ok) {
                    const data = await response.json() as Record<string, unknown>;
                    setAppName(data.name as string);
                } else {
                    // If we can't fetch the name, show the app ID instead
                    setAppName(appId);
                }
            } catch (_error) {
                // If we can't fetch the name, show the app ID instead
                setAppName(appId);
            }
        };

        fetchAppName();
    }, [appId, endpoint]);

    const getUserDisplayName = async () => {
        const token = await getToken();
        const parts: string[] = [];

        if (apiKey || config.apiKey) {
            const key = apiKey || config.apiKey;
            parts.push(`key (${key.slice(-4)})`);
        }

        if (token) {
            parts.push(`auth (${token.slice(-4)})`);
        }

        if (userId) {
            parts.push(userId);
        }

        if (channelId) {
            parts.push(channelId);
        }

        return parts.length > 0 ? `[${parts.join(' | ')}]` : undefined;
    };

    const getShapeDisplayName = () => {
        return shapeName;
    };

    const handleSendMessage = async (content: string, messageImages?: string[]) => {
        // Handle awaiting auth token
        if (inputMode === 'awaiting_auth') {
            await handleAuthCode(content);
            return;
        }

        // Handle awaiting API key
        if (inputMode === 'awaiting_key') {
            await handleApiKey(content);
            return;
        }

        // Handle awaiting shape username
        if (inputMode === 'awaiting_shape') {
            await handleShapeInput(content);
            return;
        }

        // Handle slash commands
        if (content.startsWith('/')) {
            await handleSlashCommand(content.slice(1));
            return;
        }

        if (!client) {
            const systemMessage: Message = {
                type: 'system',
                content: 'No API key configured and not authenticated. Please use /key <your-api-key> or /login to authenticate.'
            };
            setMessages(prev => [...prev, systemMessage]);
            return;
        }

        // Use current images state if no specific images provided
        const currentImageUrls = images.map(img => img.dataUrl);
        const currentImages = messageImages || currentImageUrls;
        const userDisplayName = await getUserDisplayName();
        const userMessage: Message = {
            type: 'user',
            content,
            images: currentImages,
            display_name: userDisplayName
        };
        setMessages(prev => [...prev, userMessage]);

        // Clear images after sending
        setImages([]);

        try {
            // Prepare message content - text only or multimodal with images
            let messageContent: OpenAI.ChatCompletionContentPart[];
            if (currentImages.length > 0) {
                messageContent = [
                    { type: 'text' as const, text: content },
                    ...currentImages.map(img => ({
                        type: 'image_url' as const,
                        image_url: { url: img }
                    }))
                ];
            } else {
                messageContent = [{ type: 'text' as const, text: content }];
            }

            // Prepare the request with tools and plugins
            const request = {
                model: shapeName,
                messages: [
                    ...messages.filter(
                        msg => msg.type !== 'system' && msg.type !== 'tool' && msg.type !== 'error'
                    ).map(msg => {
                        if (msg.type === 'user' && msg.images && msg.images.length > 0) {
                            return {
                                role: 'user' as const,
                                content: [
                                    { type: 'text' as const, text: msg.content },
                                    ...msg.images.map(img => ({
                                        type: 'image_url' as const,
                                        image_url: { url: img }
                                    }))
                                ]
                            };
                        }

                        return {
                            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
                            content: msg.content,
                        };
                    }),
                    { role: 'user' as const, content: messageContent },
                ],
                tools: availableTools.filter(t => t.enabled).map(tool => ({
                    type: 'function' as const,
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters,
                    },
                })),
            };

            const response = await client.chat.completions.create(request);

            // Check for tool calls
            if (response.choices?.[0]?.message?.tool_calls) {
                const toolCalls = response.choices[0].message.tool_calls;

                // Add assistant message with tool calls
                const assistantMessage: Message = {
                    type: 'assistant',
                    content: response.choices[0]?.message?.content || '',
                    tool_calls: toolCalls,
                    display_name: getShapeDisplayName()
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Process each tool call
                const toolResults: Message[] = [];
                for (const toolCall of toolCalls) {
                    const result = await handleToolCall(toolCall);
                    toolResults.push({
                        type: 'tool',
                        content: result,
                        tool_call_id: toolCall.id,
                        display_name: getShapeDisplayName()
                    });
                }

                // Add tool result messages
                setMessages(prev => [...prev, ...toolResults]);

                // Make second API call with tool results
                const updatedMessages = [
                    ...messages.filter(msg => msg.type !== 'system' && msg.type !== 'tool' && msg.type !== 'error').map(msg => {
                        if (msg.type === 'user' && msg.images && msg.images.length > 0) {
                            return {
                                role: 'user' as const,
                                content: [
                                    { type: "text" as const, text: msg.content },
                                    ...msg.images.map(img => ({
                                        type: "image_url" as const,
                                        image_url: { url: img }
                                    }))
                                ]
                            };
                        }

                        return {
                            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
                            content: msg.content,
                        };
                    }),
                    { role: 'user' as const, content: messageContent },
                    {
                        role: 'assistant' as const,
                        content: response.choices[0]?.message?.content || '',
                        tool_calls: toolCalls.map(tc => ({
                            id: tc.id,
                            type: tc.type,
                            function: {
                                name: tc.function.name,
                                arguments: tc.function.arguments,
                            },
                        }))
                    },
                    ...toolResults.map(tr => ({
                        role: 'tool' as const,
                        content: tr.content,
                        tool_call_id: tr.tool_call_id ?? ''
                    }))
                ];

                const secondResponse = await client.chat.completions.create({
                    model: shapeName,
                    messages: updatedMessages,
                    tools: availableTools.filter(t => t.enabled).map(tool => ({
                        type: 'function' as const,
                        function: {
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters,
                        },
                    })),
                });

                // Check if second response also has tool calls
                if (secondResponse.choices?.[0]?.message?.tool_calls) {
                    const secondToolCalls = secondResponse.choices[0].message.tool_calls;

                    // Add assistant message with second tool calls
                    const secondAssistantMessage: Message = {
                        type: 'assistant',
                        content: secondResponse.choices[0]?.message?.content || '',
                        tool_calls: secondToolCalls,
                        display_name: getShapeDisplayName()
                    };
                    setMessages(prev => [...prev, secondAssistantMessage]);

                    // Process second set of tool calls
                    const secondToolResults: Message[] = [];
                    for (const toolCall of secondToolCalls) {
                        const result = await handleToolCall(toolCall);
                        secondToolResults.push({
                            type: 'tool',
                            content: result,
                            tool_call_id: toolCall.id,
                            display_name: getShapeDisplayName()
                        });
                    }

                    // Add second tool result messages
                    setMessages(prev => [...prev, ...secondToolResults]);

                    // Make third API call with second tool results
                    const finalMessages = [
                        ...updatedMessages,
                        {
                            role: 'assistant' as const,
                            content: secondResponse.choices[0]?.message?.content || '',
                            tool_calls: secondToolCalls.map(tc => ({
                                id: tc.id,
                                type: tc.type,
                                function: {
                                    name: tc.function.name,
                                    arguments: tc.function.arguments,
                                },
                            }))
                        },
                        ...secondToolResults.map(tr => ({
                            role: 'tool' as const,
                            content: tr.content,
                            tool_call_id: tr.tool_call_id ?? ''
                        }))
                    ];

                    const thirdResponse = await client.chat.completions.create({
                        model: shapeName,
                        messages: finalMessages,
                        tools: availableTools.filter(t => t.enabled).map(tool => ({
                            type: 'function' as const,
                            function: {
                                name: tool.name,
                                description: tool.description,
                                parameters: tool.parameters,
                            },
                        })),
                    });

                    const finalMessage: Message = {
                        type: 'assistant',
                        content: thirdResponse.choices[0]?.message?.content || '',
                        display_name: getShapeDisplayName()
                    };
                    setMessages(prev => [...prev, finalMessage]);

                } else {
                    // No more tool calls, add the final message
                    const finalMessage: Message = {
                        type: 'assistant',
                        content: secondResponse.choices[0]?.message?.content || '',
                        display_name: getShapeDisplayName()
                    };
                    setMessages(prev => [...prev, finalMessage]);
                }

            } else {
                // No tool calls, just add the assistant message
                const assistantMessage: Message = {
                    type: 'assistant',
                    content: response.choices[0]?.message?.content || '',
                    display_name: getShapeDisplayName()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (err) {
            const error = err as APIError;
            const status = error.status || error.code || 'Unknown';
            const message = error.message || 'An unexpected error occurred';

            const errorMessage: Message = {
                type: 'error',
                content: `API Error: ${status} ${message}`
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleToolCall = async (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<string> => {
        try {
            const args = JSON.parse(toolCall.function.arguments);

            switch (toolCall.function.name) {
                case 'ping':
                    return 'pong';

                case 'echo':
                    return args.message || 'No message provided';

                default:
                    return `Unknown tool: ${toolCall.function.name}`;
            }
        } catch (error) {
            return `Error executing tool ${toolCall.function.name}: ${(error as Error).message}`;
        }
    };

    const handleShapeInput = async (input: string) => {
        try {
            const newUsername = input.trim();

            // If empty input, keep current shape
            if (newUsername === '') {
                const keepMessage: Message = {
                    type: 'system',
                    content: 'Shape unchanged.'
                };
                setMessages(prev => [...prev, keepMessage]);
                setInputMode('normal');
                return;
            }

            // Validate the new shape by fetching its info (don't rely on cache)
            const headers: Record<string, string> = {};
            const token = await getToken();

            // Add API key if available
            if (config.apiKey || apiKey) {
                headers.Authorization = `Bearer ${apiKey || config.apiKey}`;
            }

            // Add auth token if available
            if (token) {
                headers['X-User-Auth'] = token;
            }

            // Add app ID if available
            const currentAppId = appId || config.appId;
            if (currentAppId) {
                headers['X-App-ID'] = currentAppId;
            }

            // Add user ID if set
            if (userId) {
                headers['X-User-ID'] = userId;
            }

            // Add channel ID if set
            if (channelId) {
                headers['X-Channel-ID'] = channelId;
            }

            const response = await fetch(`${endpoint.replace('/v1', '')}/shapes/public/${newUsername}`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                throw new Error(`Shape "${newUsername}" not found or not accessible: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as Record<string, unknown>;

            // Save the new shape username
            await saveShapeUsername(newUsername);
            setCurrentShapeUsername(newUsername);

            // Update the shape name display
            const newModel = `shapesinc/${newUsername}`;
            setShapeName(newModel);

            // Clear old shape cache since we're switching shapes
            await clearShapeCache();
            setCachedShapeId('');

            const successMessage: Message = {
                type: 'system',
                content: `✅ Shape changed to: shapesinc/${newUsername} (${data.name || newUsername})`
            };
            setMessages(prev => [...prev, successMessage]);

            // Return to normal input mode
            setInputMode('normal');

        } catch (error) {
            const errorMessage: Message = {
                type: 'system',
                content: `❌ Error changing shape: ${(error as Error).message}`
            };
            setMessages(prev => [...prev, errorMessage]);

            // Return to normal input mode on error
            setInputMode('normal');
        }
    };

    const handleSlashCommand = async (command: string) => {
        const [cmd, ...args] = command.split(' ');

        switch (cmd.toLowerCase()) {
            case 'login':
                await handleLogin();
                break;
            case 'logout':
                await handleLogout();
                break;
            case 'key': {
                const keyValue = args.join(' ').trim();
                if (keyValue === '') {
                    // Clear API key and prompt for new one
                    setApiKey('');
                    await saveApiKey('');
                    setInputMode('awaiting_key');
                    const keyMessage: Message = {
                        type: 'system',
                        content: 'API key cleared. Please enter your new API key:'
                    };
                    setMessages(prev => [...prev, keyMessage]);
                } else {
                    // Set API key directly
                    await handleApiKey(keyValue);
                }
                break;
            }
            case 'exit':
            case 'quit':
                process.exit(0);
                break;
            case 'image': {
                const [, filename] = command.split(' ', 2);
                try {
                    const result = await uploadImage(filename);
                    setImages(prev => [...prev, { dataUrl: result.dataUrl, filename: result.filename, size: result.size }]);

                    const sizeKB = Math.round(result.size / 1024);
                    const totalImages = images.length + 1;
                    const imageMessage: Message = {
                        type: 'system',
                        content: `Image uploaded: "${result.filename}" (${sizeKB}KB) - ${totalImages} image${totalImages > 1 ? 's' : ''} queued for next message.`
                    };
                    setMessages(prev => [...prev, imageMessage]);
                } catch (error) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `Failed to upload image: ${(error as Error).message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'images': {
                try {
                    const imageFiles = await listImageFiles();
                    let content = '';

                    // Show queued images first
                    if (images.length > 0) {
                        const queuedList = images.map((img, i) => `  ${i + 1}. ${img.filename} (${Math.round(img.size / 1024)}KB)`).join('\n');
                        content += `Queued for next message (${images.length}):\n${queuedList}\n\n`;
                    }

                    // Show available files in directory
                    if (imageFiles.length > 0) {
                        const availableList = imageFiles.map(file => `  • ${file}`).join('\n');
                        content += `Available in current directory:\n${availableList}`;
                    } else {
                        content += 'No image files found in current directory.';
                    }

                    if (images.length === 0 && imageFiles.length === 0) {
                        content = 'No images queued and no image files found in current directory.';
                    }

                    content += '\n\nUse "/image <filename>" to upload a file, or "/image" to upload the first available file.';

                    const listMessage: Message = {
                        type: 'system',
                        content
                    };
                    setMessages(prev => [...prev, listMessage]);
                } catch (error) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `Failed to list images: ${(error as Error).message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'images:clear': {
                const clearedCount = images.length;
                setImages([]);
                const clearMessage: Message = {
                    type: 'system',
                    content: clearedCount > 0 ? `Cleared ${clearedCount} queued image${clearedCount > 1 ? 's' : ''}.` : 'No images to clear.'
                };
                setMessages(prev => [...prev, clearMessage]);
                break;
            }
            case 'clear': {
                setMessages([]);
                const clearMessage: Message = {
                    type: 'system',
                    content: 'Chat history cleared.'
                };
                setMessages(prev => [...prev, clearMessage]);
                break;
            }
            case 'tools': {
                if (args.length === 0) {
                    // List all tools
                    const enabledCount = availableTools.filter(t => t.enabled).length;
                    let content = `Available tools (${enabledCount} enabled):\n`;

                    if (availableTools.length === 0) {
                        content += 'No tools available.';
                    } else {
                        for (const tool of availableTools) {
                            const status = tool.enabled ? '✓' : '○';
                            content += `  ${status} ${tool.name} - ${tool.description}\n`;
                        }
                    }

                    content += '\nUse "/tools:enable <name>" to enable a tool or "/tools:disable <name>" to disable it.';

                    const toolsMessage: Message = {
                        type: 'system',
                        content
                    };
                    setMessages(prev => [...prev, toolsMessage]);
                }
                break;
            }
            case 'tools:enable': {
                const toolName = args[0];
                if (!toolName) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: 'Please specify a tool name. Use "/tools" to see available tools.'
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }

                const toolIndex = availableTools.findIndex(t => t.name === toolName);
                if (toolIndex === -1) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `Tool "${toolName}" not found. Use "/tools" to see available tools.`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }

                const updatedTools = [...availableTools];
                updatedTools[toolIndex].enabled = true;
                setAvailableTools(updatedTools);

                // Save state to disk
                await saveToolsState(updatedTools);

                const successMessage: Message = {
                    type: 'system',
                    content: `Tool "${toolName}" enabled.`
                };
                setMessages(prev => [...prev, successMessage]);
                break;
            }
            case 'tools:disable': {
                const toolName = args[0];
                if (!toolName) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: 'Please specify a tool name. Use "/tools" to see available tools.'
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }

                const toolIndex = availableTools.findIndex(t => t.name === toolName);
                if (toolIndex === -1) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `Tool "${toolName}" not found. Use "/tools" to see available tools.`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }

                const updatedTools = [...availableTools];
                updatedTools[toolIndex].enabled = false;
                setAvailableTools(updatedTools);

                // Save state to disk
                await saveToolsState(updatedTools);

                const successMessage: Message = {
                    type: 'system',
                    content: `Tool "${toolName}" disabled.`
                };
                setMessages(prev => [...prev, successMessage]);
                break;
            }
            case 'user': {
                const userValue = args.join(' ').trim();
                if (userValue === '') {
                    // Clear user ID
                    setUserId('');
                    await saveUserId('');
                    const clearMessage: Message = {
                        type: 'system',
                        content: 'User ID cleared.'
                    };
                    setMessages(prev => [...prev, clearMessage]);
                } else {
                    // Set user ID
                    setUserId(userValue);
                    await saveUserId(userValue);
                    const setMessage: Message = {
                        type: 'system',
                        content: `User ID set to: ${userValue}`
                    };
                    setMessages(prev => [...prev, setMessage]);
                }
                break;
            }
            case 'channel': {
                const channelValue = args.join(' ').trim();
                if (channelValue === '') {
                    // Clear channel ID
                    setChannelId('');
                    await saveChannelId('');
                    const clearMessage: Message = {
                        type: 'system',
                        content: 'Channel ID cleared.'
                    };
                    setMessages(prev => [...prev, clearMessage]);
                } else {
                    // Set channel ID
                    setChannelId(channelValue);
                    await saveChannelId(channelValue);
                    const setMessage: Message = {
                        type: 'system',
                        content: `Channel ID set to: ${channelValue}`
                    };
                    setMessages(prev => [...prev, setMessage]);
                }
                break;
            }
            case 'info': {
                try {
                    const username = args[0] || currentShapeUsername || config.username;

                    // Prepare headers
                    const token = await getToken();
                    const headers: Record<string, string> = {};

                    // Add API key if available
                    if (config.apiKey || apiKey) {
                        headers.Authorization = `Bearer ${apiKey || config.apiKey}`;
                    }

                    // Add auth token if available
                    if (token) {
                        headers['X-User-Auth'] = token;
                    }

                    // Add app ID if available
                    const currentAppId = appId || config.appId;
                    if (currentAppId) {
                        headers['X-App-ID'] = currentAppId;
                    }

                    // Add user ID if set
                    if (userId) {
                        headers['X-User-ID'] = userId;
                    }

                    // Add channel ID if set
                    if (channelId) {
                        headers['X-Channel-ID'] = channelId;
                    }

                    const response = await fetch(`${endpoint.replace('/v1', '')}/shapes/public/${username}`, {
                        method: 'GET',
                        headers
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch shape info: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json() as Record<string, unknown>;

                    const {
                        id, name, username: shapeUsername, search_description, search_tags_v2,
                        created_ts, user_count, message_count, tagline, typical_phrases,
                        screenshots, category, character_universe, character_background,
                        avatar_url, avatar, banner, shape_settings, example_prompts,
                        enabled, allow_user_engine_override, error_message, wack_message
                    } = data;

                    const formatDate = (timestamp: number) => {
                        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    };

                    const formatArray = (arr: Record<string, unknown>[], label: string) => {
                        if (!arr || arr.length === 0) return '';
                        if (label === 'Screenshots') {
                            return arr.map(item => `• ${item.caption}: ${item.url}`).join('\n    ');
                        }
                        return arr.map(item => `• ${item}`).join('\n    ');
                    };

                    const infoContent = [
                        `🔷 === SHAPE PROFILE: ${name || shapeUsername} ===`,
                        '',
                        '📝 Basic Info:',
                        `  • ID: ${id || 'N/A'}`,
                        `  • Name: ${name || 'N/A'}`,
                        `  • Username: ${shapeUsername}`,
                        `  • Status: ${enabled ? '✅ Enabled' : '❌ Disabled'}`,
                        `  • Created: ${created_ts ? formatDate(created_ts as number) : 'N/A'}`,
                        '',
                        '💬 Description & Tags:',
                        `  • Description:\n    ${search_description || 'N/A'}`,
                        `  • Tagline: ${tagline || 'N/A'}`,
                        `  • Category: ${category || 'N/A'}`,
                        `  • Universe: ${character_universe || 'N/A'}`,
                        `  • Background: ${character_background || 'N/A'}`,
                        (search_tags_v2 as Record<string, string>[]).length > 0 ? `  • Tags:\n    ${formatArray(search_tags_v2 as Record<string, string>[], 'Tags')}` : '',
                        '',
                        '📊 Statistics:',
                        `  • Users: ${user_count?.toLocaleString() || 'N/A'}`,
                        `  • Messages: ${message_count?.toLocaleString() || 'N/A'}`,
                        '',
                        '🎭 Personality:',
                        (typical_phrases as Record<string, string>[]).length > 0 ? `  • Typical Phrases:\n    ${formatArray(typical_phrases as Record<string, string>[], 'Phrases')}` : '  • Typical Phrases: N/A',
                        (example_prompts as Record<string, string>[]).length > 0 ? `  • Example Prompts:\n    ${formatArray(example_prompts as Record<string, string>[], 'Prompts')}` : '  • Example Prompts: N/A',
                        '',
                        '🖼️ Media:',
                        `  • Avatar: ${avatar_url || avatar || 'N/A'}`,
                        `  • Banner: ${banner || 'N/A'}`,
                        (screenshots as Record<string, string>[]).length > 0 ? `  • Screenshots:\n    ${formatArray(screenshots as Record<string, string>[], 'Screenshots')}` : '  • Screenshots: None',
                        '',
                        '⚙️ Settings:',
                        (shape_settings as Record<string, string>) ? [
                            `  • Initial Message: ${(shape_settings as Record<string, string>).shape_initial_message || 'N/A'}`,
                            `  • Status Type: ${(shape_settings as Record<string, string>).status_type || 'N/A'}`,
                            `  • Status: ${(shape_settings as Record<string, string>).status || 'N/A'}`,
                            `  • Appearance: ${(shape_settings as Record<string, string>).appearance || 'N/A'}`
                        ].join('\n') : '  • Settings: N/A',
                        '',
                        '🔧 Advanced:',
                        `  • User Engine Override: ${allow_user_engine_override ? 'Allowed' : 'Not Allowed'}`,
                        error_message ? `  • Error Message: ${error_message}` : '',
                        wack_message ? `  • Wack Message: ${wack_message}` : ''
                    ].filter(line => line !== '').join('\n');

                    const infoMessage: Message = {
                        type: 'system',
                        content: infoContent,
                        // Add special marker for custom info formatting
                        tool_call_id: 'shape-info'
                    };
                    setMessages(prev => [...prev, infoMessage]);

                    // Cache the shape data
                    if (id && username) {
                        await saveShapeCache(username, id as string, name as string || username);
                        setCachedShapeId(id as string);
                    }

                } catch (error) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `❌ Error fetching shape info: ${(error as Error).message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'application': {
                try {
                    const appIdValue = args[0]?.trim();

                    if (appIdValue) {
                        // Validate UUID format
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                        if (!uuidRegex.test(appIdValue)) {
                            throw new Error('Invalid UUID format. Please provide a valid application ID.');
                        }

                        await saveAppId(appIdValue);
                        setAppId(appIdValue);

                        const setMessage: Message = {
                            type: 'system',
                            content: `Application ID set to: ${appIdValue}`
                        };
                        setMessages(prev => [...prev, setMessage]);
                    } else {
                        // Clear app ID
                        await saveAppId('');
                        setAppId('');

                        const clearMessage: Message = {
                            type: 'system',
                            content: 'Application ID cleared'
                        };
                        setMessages(prev => [...prev, clearMessage]);
                    }
                } catch (error) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `❌ Error setting application ID: ${(error as Error).message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'info:application': {
                try {
                    const currentAppId = appId || config.appId;
                    if (!currentAppId) {
                        throw new Error('No application ID configured');
                    }

                    const token = await getToken();
                    const headers: Record<string, string> = {
                        'X-App-ID': currentAppId
                    };

                    if (config.apiKey) {
                        headers.Authorization = `Bearer ${config.apiKey}`;
                    }

                    if (token) {
                        headers['X-User-Auth'] = token;
                    }

                    const response = await fetch(`${endpoint.replace('/v1', '')}/auth/app_info`, {
                        method: 'GET',
                        headers
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch application info: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json() as Record<string, unknown>;
                    const { id, name, description, disabled, admin } = data;

                    const appInfoContent = [
                        '🔷 === APPLICATION INFO ===',
                        '',
                        '📝 Basic Info:',
                        `  • ID: ${id}`,
                        `  • Name: ${name}`,
                        `  • Description: ${description || 'N/A'}`,
                        `  • Status: ${disabled ? '❌ Disabled' : '✅ Enabled'}`,
                        `  • Admin: ${admin ? '⚠️ Yes' : 'No'}`
                    ].join('\n');

                    const appInfoMessage: Message = {
                        type: 'system',
                        content: appInfoContent,
                        tool_call_id: 'app-info'
                    };
                    setMessages(prev => [...prev, appInfoMessage]);

                    // Update app name for status bar
                    setAppName(name as string);

                } catch (error) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `❌ Error fetching application info: ${(error as Error).message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'memories': {
                try {
                    // Parse page number from args (default to 1)
                    const pageArg = args[0];
                    const pageNumber = pageArg ? Number.parseInt(pageArg, 10) : 1;

                    if (pageArg && (Number.isNaN(pageNumber) || pageNumber < 1)) {
                        throw new Error('Page number must be a positive integer');
                    }

                    // Check if we have a cached shape_id
                    let shapeId = cachedShapeId;

                    if (!shapeId) {
                        // Try to fetch shape_id
                        const username = currentShapeUsername || config.username;
                        const response = await fetch(`${endpoint.replace('/v1', '')}/shapes/public/${username}`);

                        if (!response.ok) {
                            throw new Error(`Failed to fetch shape info: ${response.status} ${response.statusText}`);
                        }

                        const data = await response.json() as Record<string, unknown>;
                        shapeId = data.id as string;

                        if (shapeId && data.username) {
                            // Cache the shape data for future use
                            await saveShapeCache(data.username as string, shapeId, data.name as string || data.username as string);
                            setCachedShapeId(shapeId);
                        }
                    }

                    if (!shapeId) {
                        throw new Error('Could not determine shape ID');
                    }

                    // Prepare headers
                    const token = await getToken();
                    const headers: Record<string, string> = {};

                    // Add API key if available
                    if (config.apiKey || apiKey) {
                        headers.Authorization = `Bearer ${apiKey || config.apiKey}`;
                    }

                    // Add auth token if available
                    if (token) {
                        headers['X-User-Auth'] = token;
                    }

                    // Add app ID if available
                    const currentAppId = appId || config.appId;
                    if (currentAppId) {
                        headers['X-App-ID'] = currentAppId;
                    }

                    // Add user ID if set
                    if (userId) {
                        headers['X-User-ID'] = userId;
                    }

                    // Add channel ID if set
                    if (channelId) {
                        headers['X-Channel-ID'] = channelId;
                    }

                    // Fetch memories from /summaries/shapes/{shape_id} with pagination
                    const url = new URL(`${endpoint.replace('/v1', '')}/summaries/shapes/${shapeId}`);
                    url.searchParams.set('limit', '10');
                    url.searchParams.set('page', pageNumber.toString());

                    const memoriesResponse = await fetch(url.toString(), {
                        method: 'GET',
                        headers
                    });

                    if (!memoriesResponse.ok) {
                        throw new Error(`Failed to fetch memories: ${memoriesResponse.status} ${memoriesResponse.statusText}`);
                    }

                    const memoriesData = await memoriesResponse.json() as Record<string, unknown>;

                    // Format the memories data
                    const { items, total, page, total_pages, has_next, has_previous } = memoriesData;

                    if (!items || (items as Record<string, unknown>[]).length === 0) {
                        const noMemoriesMessage: Message = {
                            type: 'system',
                            content: 'No memories found for this shape.'
                        };
                        setMessages(prev => [...prev, noMemoriesMessage]);
                        return;
                    }

                    const formatDate = (timestamp: number) => {
                        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    };

                    let content = `🧠 === MEMORIES (${total} total, page ${page}/${total_pages}) ===\n\n`;

                    (items as Record<string, unknown>[]).forEach((item: Record<string, unknown>, index: number) => {
                        const { id, summary_type, deleted, result, group, created_at } = item;
                        const isGroup = group || false;
                        const createdAt = created_at ? formatDate(created_at as number) : 'Unknown';
                        const groupText = isGroup ? 'group' : 'individual';
                        const typeText = deleted ? `${summary_type} (DELETED)` : summary_type;

                        // Calculate global memory number: (page-1) * limit + index + 1
                        const globalMemoryNumber = (page as number - 1) * 10 + index + 1;

                        // Add empty line before each memory except the first one
                        if (index > 0) {
                            content += '\n';
                        }

                        content += `📝 Memory ${globalMemoryNumber}, ${createdAt}\n\n`;
                        content += `${result || 'No summary available'}\n\n`;
                        content += `  ${groupText}, ${typeText} (${id})\n\n`;
                    });

                    if (has_next || has_previous) {
                        content += `📄 Navigation: Page ${page} of ${total_pages}`;
                        if (has_previous) content += ' | ← Previous available';
                        if (has_next) content += ' | Next available →';
                        content += '\n';
                    }

                    const memoriesMessage: Message = {
                        type: 'system',
                        content
                    };
                    setMessages(prev => [...prev, memoriesMessage]);

                } catch (error) {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `❌ Error fetching memories: ${(error as Error).message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'shape': {
                const newUsername = args.join(' ').trim();

                if (newUsername === '') {
                    // No username provided, switch to input mode
                    const currentUsername = currentShapeUsername || config.username;
                    const currentModel = `shapesinc/${currentUsername}`;
                    const promptMessage: Message = {
                        type: 'system',
                        content: `Current shape: ${currentModel}\nEnter new shape username (or press Escape to cancel):`
                    };
                    setMessages(prev => [...prev, promptMessage]);
                    setInputMode('awaiting_shape');
                    return;
                }

                // Username provided directly, handle it
                await handleShapeInput(newUsername);
                break;
            }
            case 'help': {
                const helpMessage: Message = {
                    type: 'system',
                    content: 'Available commands:\n/login - Authenticate with Shapes API\n/logout - Clear authentication token\n/key [api-key] - Set API key (empty to clear and prompt for new one)\n/user [id] - Set user ID (empty to clear)\n/channel [id] - Set channel ID (empty to clear)\n/application [id] - Set application ID (empty to clear)\n/shape [username] - Change current shape (prompts for username if not provided)\n/info [username] - Show shape profile info (current shape if no username provided)\n/info:application - Show current application info\n/memories [page] - Show conversation summaries for current shape (page 1 if not specified)\n/images - List available image files\n/image [filename] - Upload an image (specify filename or auto-select first)\n/images:clear - Clear uploaded images\n/clear - Clear chat history\n/tools - List available tools\n/tools:enable <name> - Enable a tool\n/tools:disable <name> - Disable a tool\n/exit - Exit the application\n/help - Show this help message'
                };
                setMessages(prev => [...prev, helpMessage]);
                break;
            }
            default: {
                const unknownMessage: Message = {
                    type: 'system',
                    content: `Unknown command: /${cmd}. Type /help for available commands.`
                };
                setMessages(prev => [...prev, unknownMessage]);
                break;
            }
        }
    };

    const handleLogin = async () => {
        try {
            const authUrl = await getAuthUrl();

            const loginMessage: Message = {
                type: 'system',
                content: `Opening browser for authentication...\nAuth URL: ${authUrl}\n\nAfter authorizing, please enter the code you receive:`
            };
            setMessages(prev => [...prev, loginMessage]);

            await open(authUrl);

            // Switch to auth code input mode
            setInputMode('awaiting_auth');

        } catch (err) {
            const errorMessage: Message = {
                type: 'system',
                content: `Authentication failed: ${(err as Error).message}`
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleAuthCode = async (code: string) => {
        try {
            const token = await authenticate(code);
            await saveToken(token);

            // Update auth status
            setAuthStatus(`Authenticated (${token.slice(-4)})`);

            // Re-initialize client with new token
            const discoveredConfig = await initConfig();

            const defaultHeaders: Record<string, string> = {
                'X-App-ID': discoveredConfig.appId,
                'X-User-Auth': token,
            };

            // Add user ID header if set
            if (userId) {
                defaultHeaders['X-User-ID'] = userId;
            }

            // Add channel ID header if set
            if (channelId) {
                defaultHeaders['X-Channel-ID'] = channelId;
            }

            const clientConfig: ClientOptions = {
                apiKey: discoveredConfig.apiKey,
                baseURL: discoveredConfig.apiUrl,
                defaultHeaders,
            };

            const shapesClient = new OpenAI(clientConfig);
            setClient(shapesClient);

            const successMessage: Message = {
                type: 'system',
                content: 'Successfully authenticated!'
            };
            setMessages(prev => [...prev, successMessage]);

            // Return to normal input mode
            setInputMode('normal');

        } catch (err) {
            const errorMessage: Message = {
                type: 'system',
                content: `Authentication failed: ${(err as Error).message}`
            };
            setMessages(prev => [...prev, errorMessage]);

            // Return to normal input mode on error
            setInputMode('normal');
        }
    };

    const handleApiKey = async (key: string) => {
        try {
            // Validate API key format (basic check for non-empty string)
            if (!key || key.trim().length === 0) {
                const errorMessage: Message = {
                    type: 'system',
                    content: 'Invalid API key. Please provide a valid API key.'
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            // Set the API key and save it to file
            const trimmedKey = key.trim();
            setApiKey(trimmedKey);
            await saveApiKey(trimmedKey);

            const successMessage: Message = {
                type: 'system',
                content: `API key set successfully (${trimmedKey.slice(-4)})`
            };
            setMessages(prev => [...prev, successMessage]);

            // Return to normal input mode
            setInputMode('normal');

        } catch (err) {
            const errorMessage: Message = {
                type: 'system',
                content: `Failed to set API key: ${(err as Error).message}`
            };
            setMessages(prev => [...prev, errorMessage]);

            // Return to normal input mode on error
            setInputMode('normal');
        }
    };

    const handleLogout = async () => {
        try {
            const currentToken = await getToken();
            if (!currentToken) {
                const notAuthMessage: Message = {
                    type: 'system',
                    content: 'Not currently authenticated.'
                };
                setMessages(prev => [...prev, notAuthMessage]);
                return;
            }

            await clearToken();

            // Re-initialize with API key if available
            const discoveredConfig = await initConfig();

            if (discoveredConfig.apiKey) {
                const defaultHeaders: Record<string, string> = {
                    'X-App-ID': discoveredConfig.appId,
                };

                // Add user ID header if set
                if (userId) {
                    defaultHeaders['X-User-ID'] = userId;
                }

                // Add channel ID header if set
                if (channelId) {
                    defaultHeaders['X-Channel-ID'] = channelId;
                }

                const clientConfig: ClientOptions = {
                    apiKey: discoveredConfig.apiKey,
                    baseURL: discoveredConfig.apiUrl,
                    defaultHeaders,
                };

                const shapesClient = new OpenAI(clientConfig);
                setClient(shapesClient);
                setAuthStatus(`API Key (${discoveredConfig.apiKey.slice(-4)})`);
            } else {
                setClient(null);
                setAuthStatus('No Auth');
            }

            const logoutMessage: Message = {
                type: 'system',
                content: 'Successfully logged out! You can use /login to authenticate again.'
            };
            setMessages(prev => [...prev, logoutMessage]);

        } catch (err) {
            const errorMessage: Message = {
                type: 'system',
                content: `Logout failed: ${(err as Error).message}`
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    if (error) {
        return (
            <Box height={terminalHeight} flexDirection="column" justifyContent="center" alignItems="center">
                <Text>{renderError(error)}</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            {/* Banner - shown once at startup */}
            <Banner shapeName={shapeName} endpoint={endpoint} appId={appId || undefined} />

            {/* Message area - grows naturally */}
            <MessageList messages={messages} shapeName={shapeName} />

            {/* Input area at bottom */}
            <ChatInput
                onSend={handleSendMessage}
                images={images}
                enabledToolsCount={availableTools.filter(t => t.enabled).length}
                shapeName={shapeName}
                authStatus={authStatus}
                endpoint={endpoint}
                terminalWidth={terminalWidth}
                inputMode={inputMode}
                userId={userId}
                channelId={channelId}
                appName={appName}
                onRemoveImage={handleRemoveImage}
                onEscape={() => {
                    if (inputMode === 'awaiting_auth') {
                        setInputMode('normal');
                        const cancelMessage: Message = {
                            type: 'system',
                            content: 'Authentication cancelled.'
                        };
                        setMessages(prev => [...prev, cancelMessage]);
                    } else if (inputMode === 'awaiting_key') {
                        setInputMode('normal');
                        const cancelMessage: Message = {
                            type: 'system',
                            content: 'API key entry cancelled.'
                        };
                        setMessages(prev => [...prev, cancelMessage]);
                    } else if (inputMode === 'awaiting_shape') {
                        setInputMode('normal');
                        const cancelMessage: Message = {
                            type: 'system',
                            content: 'Shape change cancelled.'
                        };
                        setMessages(prev => [...prev, cancelMessage]);
                    }
                }}
            />
        </Box>
    );
};