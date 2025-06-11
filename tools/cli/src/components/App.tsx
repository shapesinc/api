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
import { getCurrentApiKey, buildApiHeaders, buildOpenAIHeaders } from '../utils/headers.js';
import chalk from 'chalk';
import { config, initConfig, resetDiscoveryCache } from '../config.js';
import net from 'node:net';
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
const OPTIONS_FILE = path.join(os.homedir(), '.shapes-cli', 'options.json');

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

interface AppOptions {
    streaming: boolean;
}

const DEFAULT_OPTIONS: AppOptions = {
    streaming: false
};

const saveOptions = async (options: AppOptions): Promise<void> => {
    try {
        const dir = path.dirname(OPTIONS_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(OPTIONS_FILE, JSON.stringify(options, null, 2), 'utf-8');
    } catch (_error) {
        console.warn('Failed to save options:', _error);
    }
};

const loadOptions = async (): Promise<AppOptions> => {
    try {
        const data = await fs.readFile(OPTIONS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_OPTIONS, ...parsed };
    } catch (_error) {
        return DEFAULT_OPTIONS;
    }
};

const checkServerAvailability = (host: string, port: number, timeoutMs = 200): Promise<boolean> => {
    return new Promise((resolve) => {
        const sock = new net.Socket();
        let settled = false;
        const onDone = (up: boolean) => {
            if (!settled) {
                settled = true;
                sock.destroy();
                resolve(up);
            }
        };
        sock.setTimeout(timeoutMs);
        sock.once("connect", () => onDone(true));
        sock.once("timeout", () => onDone(false));
        sock.once("error", () => onDone(false));
        sock.connect(port, host);
    });
};

const detectServerType = (apiUrl: string): 'prod' | 'local' | 'debugger' | 'custom' => {
    if (apiUrl.includes('api.shapes.inc')) return 'prod';
    if (apiUrl.includes('localhost:8080')) return 'local';
    if (apiUrl.includes('localhost:8090')) return 'debugger';
    return 'custom';
};

const getServerDisplayName = (type: 'prod' | 'local' | 'debugger' | 'custom', customUrl?: string): string => {
    switch (type) {
        case 'prod': return 'api.shapes.inc';
        case 'local': return 'localhost:8080';
        case 'debugger': return 'localhost:8090';
        case 'custom': return customUrl || 'custom';
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
    const [currentClientApiKey, setCurrentClientApiKey] = useState<string>('');
    const [currentClientBaseURL, setCurrentClientBaseURL] = useState<string>('');
    const [cachedShapeId, setCachedShapeId] = useState<string>('');
    const [currentShapeUsername, setCurrentShapeUsername] = useState<string>('');
    const [options, setOptions] = useState<AppOptions>(DEFAULT_OPTIONS);
    const [serverType, setServerType] = useState<'prod' | 'local' | 'debugger' | 'custom'>('prod');
    const [customServerUrl, setCustomServerUrl] = useState<string>('');

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
                const savedOptions = await loadOptions();
                setUserId(savedUserId);
                setChannelId(savedChannelId);
                setCurrentShapeUsername(savedShapeUsername);
                setOptions(savedOptions);

                // Set API key from saved file or config
                if (savedApiKey && !apiKey) {
                    setApiKey(savedApiKey);
                } else if (!apiKey) {
                    setApiKey(discoveredConfig.apiKey);
                }

                // Calculate current API key for client creation using consistent logic
                const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, discoveredConfig.apiKey);

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

                // Only create/recreate client if API key or baseURL has changed or client doesn't exist
                if ((currentApiKey || token) && (currentApiKey !== currentClientApiKey || discoveredConfig.apiUrl !== currentClientBaseURL || !client)) {
                    const clientConfig: ClientOptions = {
                        apiKey: currentApiKey,
                        baseURL: discoveredConfig.apiUrl,
                        // Remove defaultHeaders - we'll use per-request headers instead
                    };

                    const shapesClient = new OpenAI(clientConfig);
                    setClient(shapesClient);
                    setCurrentClientApiKey(currentApiKey);
                    setCurrentClientBaseURL(discoveredConfig.apiUrl);
                } else if (!currentApiKey && !token) {
                    setClient(null);
                    setCurrentClientApiKey('');
                    setCurrentClientBaseURL('');
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
                const detectedType = detectServerType(discoveredConfig.apiUrl);
                setServerType(detectedType);
                if (detectedType === 'custom') {
                    setCustomServerUrl(discoveredConfig.apiUrl);
                }

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
    }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch app name when appId changes
    useEffect(() => {
        const fetchAppName = async () => {
            if (!appId) {
                return;
            }

            try {
                const token = await getToken();
                const savedApiKey = await loadApiKey();
                const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
                
                const headers = buildApiHeaders({
                    effectiveAppId: appId ?? undefined,
                    token,
                    userId,
                    channelId,
                    apiKey: currentApiKey
                });

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
    }, [appId, endpoint, apiKey, userId, channelId]);

    // Recreate OpenAI client when endpoint changes (from /server command)
    useEffect(() => {
        const recreateClient = async () => {
            if (!endpoint) return;
            
            try {
                const token = await getToken();
                const savedApiKey = await loadApiKey();
                const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
                
                // Only recreate client if we have auth and the endpoint is different
                if ((currentApiKey || token) && endpoint !== currentClientBaseURL) {
                    const clientConfig: ClientOptions = {
                        apiKey: currentApiKey,
                        baseURL: endpoint,
                    };

                    const shapesClient = new OpenAI(clientConfig);
                    setClient(shapesClient);
                    setCurrentClientApiKey(currentApiKey);
                    setCurrentClientBaseURL(endpoint);
                } else if (!currentApiKey && !token) {
                    setClient(null);
                    setCurrentClientApiKey('');
                    setCurrentClientBaseURL('');
                }
            } catch (err) {
                console.warn('Failed to recreate client on endpoint change:', err);
            }
        };

        recreateClient();
    }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

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

    /**
     * Debug helper - adds debug info as system messages in chat
     * Currently unused but kept for potential debugging needs
     */
    // @ts-expect-error - Keeping for potential debugging
    const _debugInfo = (message: string) => {
        const debugMessage: Message = {
            type: 'system',
            content: `🐛 DEBUG: ${message}`
        };
        setMessages(prev => [...prev, debugMessage]);
    };

    /**
     * Helper function to build OpenAI message history from our Message array
     * Filters out system messages and converts to OpenAI format
     */
    const buildMessageHistory = (
        historyMessages: Message[],
        newContent: OpenAI.ChatCompletionContentPart[]
    ): OpenAI.ChatCompletionMessageParam[] => {
        // Convert existing messages to OpenAI format
        const convertedMessages = historyMessages.filter(
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
        });

        // Add the new user message
        return [
            ...convertedMessages,
            { role: 'user' as const, content: newContent }
        ];
    };

    /**
     * Processes tool calls and handles follow-up API requests (up to 3 rounds)
     * Returns the final assistant message after all tool processing is complete
     */
    const processToolCalls = async (
        initialResponse: {
            content: string;
            tool_calls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
        },
        messageHistory: OpenAI.ChatCompletionMessageParam[],
        skipInitialMessage = false // Skip adding the first assistant message (for streaming)
    ): Promise<Message> => {
        if (!client) {
            throw new Error('OpenAI client not initialized');
        }

        let currentResponse = initialResponse;
        let currentHistory = [...messageHistory];
        let roundCount = 0;
        const maxRounds = 3;

        while (currentResponse.tool_calls && currentResponse.tool_calls.length > 0 && roundCount < maxRounds) {
            roundCount++;

            // Add the assistant message with tool calls to the UI (unless skipping first message)
            if (!skipInitialMessage || roundCount > 1) {
                const assistantMessage: Message = {
                    type: 'assistant',
                    content: currentResponse.content,
                    tool_calls: currentResponse.tool_calls,
                    display_name: getShapeDisplayName()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }

            // Execute all tool calls in parallel
            const toolResults = await Promise.all(
                currentResponse.tool_calls.map(async (toolCall) => ({
                    tool_call_id: toolCall.id,
                    content: await handleToolCall(toolCall)
                }))
            );

            // Add tool result messages to the UI
            const toolResultMessages: Message[] = toolResults.map(result => ({
                type: 'tool',
                content: result.content,
                tool_call_id: result.tool_call_id,
                display_name: getShapeDisplayName()
            }));
            setMessages(prev => [...prev, ...toolResultMessages]);

            // Prepare the message history for the next API call
            currentHistory = [
                ...currentHistory,
                {
                    role: 'assistant' as const,
                    content: currentResponse.content,
                    tool_calls: currentResponse.tool_calls.map(tc => ({
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
                    tool_call_id: tr.tool_call_id
                }))
            ];

            // Make the next API call (always non-streaming for tool follow-ups)
            const savedAppId = await loadAppId();
            const token = await getToken();
            const effectiveAppId = savedAppId !== null ? savedAppId : (await initConfig()).appId;
            
            const rawNextResponse = await client.chat.completions.create({
                model: shapeName,
                stream: false, // Always non-streaming for tool follow-ups
                messages: currentHistory,
                tools: availableTools.filter(t => t.enabled).map(tool => ({
                    type: 'function' as const,
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters,
                    },
                })),
            }, {
                headers: buildOpenAIHeaders({
                    effectiveAppId: effectiveAppId ?? undefined,
                    token,
                    userId,
                    channelId
                })
            });

            // Parse response if it's a string (same fix as main handler)
            let nextResponse: OpenAI.ChatCompletion;
            if (typeof rawNextResponse === 'string') {
                nextResponse = JSON.parse(rawNextResponse) as OpenAI.ChatCompletion;
            } else {
                nextResponse = rawNextResponse;
            }


            // Update current response for next iteration
            currentResponse = {
                content: nextResponse.choices?.[0]?.message?.content || '',
                tool_calls: nextResponse.choices?.[0]?.message?.tool_calls || []
            };
        }

        // Return the final assistant message
        return {
            type: 'assistant',
            content: currentResponse.content,
            display_name: getShapeDisplayName(),
            tool_calls: currentResponse.tool_calls.length > 0 ? currentResponse.tool_calls : undefined
        };
    };

    /**
     * Handles streaming API responses with real-time content display
     * Accumulates chunks, displays content in real-time, then processes tool calls after completion
     */
    const handleStreamingResponse = async (
        request: OpenAI.ChatCompletionCreateParams,
        messageHistory: OpenAI.ChatCompletionMessageParam[]
    ): Promise<void> => {
        if (!client) {
            throw new Error('OpenAI client not initialized');
        }
        // Create the streaming request with consistent headers
        const savedAppId = await loadAppId();
        const token = await getToken();
        const effectiveAppId = savedAppId !== null ? savedAppId : (await initConfig()).appId;
        
        const stream = await client.chat.completions.create({
            ...request,
            stream: true
        }, {
            headers: buildOpenAIHeaders({
                effectiveAppId: effectiveAppId ?? undefined,
                token,
                userId,
                channelId
            })
        }) as AsyncIterable<OpenAI.ChatCompletionChunk>;

        // Add a streaming message placeholder to the UI
        const streamingMessage: Message = {
            type: 'assistant',
            content: '',
            display_name: getShapeDisplayName(),
            streaming: true
        };
        setMessages(prev => [...prev, streamingMessage]);

        // Accumulate the streaming response
        let accumulatedContent = '';
        const accumulatedToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];

        // Process each chunk as it arrives
        for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta;

            // Handle content chunks - display in real-time
            if (delta?.content) {
                accumulatedContent += delta.content;

                // Update the streaming message in real-time
                setMessages(prev =>
                    prev.map((msg, index) =>
                        index === prev.length - 1 && msg.streaming
                            ? { ...msg, content: accumulatedContent }
                            : msg
                    )
                );
            }

            // Handle tool call chunks - accumulate for later processing
            if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index;

                    // Initialize tool call if it doesn't exist
                    if (!accumulatedToolCalls[index]) {
                        accumulatedToolCalls[index] = {
                            id: toolCall.id || '',
                            type: 'function',
                            function: { name: '', arguments: '' }
                        };
                    }

                    // Accumulate tool call data
                    if (toolCall.function?.name) {
                        accumulatedToolCalls[index].function.name += toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        accumulatedToolCalls[index].function.arguments += toolCall.function.arguments;
                    }
                }
            }
        }

        // Finalize the streaming message (remove streaming indicator)
        const finalMessage: Message = {
            type: 'assistant',
            content: accumulatedContent,
            display_name: getShapeDisplayName(),
            tool_calls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined
        };

        setMessages(prev =>
            prev.map((msg, index) =>
                index === prev.length - 1 && msg.streaming
                    ? finalMessage
                    : msg
            )
        );

        // Process tool calls if any were accumulated
        if (accumulatedToolCalls.length > 0) {
            const finalMessage = await processToolCalls(
                {
                    content: accumulatedContent,
                    tool_calls: accumulatedToolCalls
                },
                messageHistory,
                true // Skip initial message since we already finalized it above
            );

            setMessages(prev => [...prev, finalMessage]);
        }
    };

    /**
     * Handles non-streaming API responses
     * Processes the response directly and handles tool calls if present
     */
    const handleNonStreamingResponse = async (
        request: OpenAI.ChatCompletionCreateParams,
        messageHistory: OpenAI.ChatCompletionMessageParam[]
    ): Promise<void> => {
        if (!client) {
            throw new Error('OpenAI client not initialized');
        }
        // Create the non-streaming request with consistent headers
        const savedAppId = await loadAppId();
        const token = await getToken();
        const effectiveAppId = savedAppId !== null ? savedAppId : (await initConfig()).appId;
        
        const rawResponse = await client.chat.completions.create({
            ...request,
            stream: false
        }, {
            headers: buildOpenAIHeaders({
                effectiveAppId: effectiveAppId ?? undefined,
                token,
                userId,
                channelId
            })
        });

        // Parse response if it's a string
        let response: OpenAI.ChatCompletion;
        if (typeof rawResponse === 'string') {
            response = JSON.parse(rawResponse);
        } else {
            response = rawResponse;
        }

        // Extract response data
        const content = response.choices?.[0]?.message?.content || '';
        const toolCalls = response.choices?.[0]?.message?.tool_calls;

        // Check if there are tool calls to process
        if (toolCalls && toolCalls.length > 0) {
            // Process tool calls using the shared function
            const finalMessage = await processToolCalls(
                {
                    content,
                    tool_calls: toolCalls
                },
                messageHistory
            );

            // Add the final message from tool processing
            setMessages(prev => [...prev, finalMessage]);
        } else {
            // No tool calls, just add the assistant message directly
            const assistantMessage: Message = {
                type: 'assistant',
                content,
                display_name: getShapeDisplayName()
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
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

            /*
             * NEW REFACTORED API LOGIC
             * ======================
             *
             * This section has been refactored to use separate functions for streaming
             * and non-streaming responses. Both approaches now:
             *
             * 1. Handle real-time content display (streaming only)
             * 2. Accumulate tool calls properly
             * 3. Process tool calls in a unified way after completion
             * 4. Support up to 3 rounds of tool calling
             *
             * Benefits:
             * - Cleaner, more maintainable code
             * - Consistent tool calling behavior between modes
             * - Better error handling and edge case coverage
             * - Easier to test and debug
             */

            // Build the message history using our helper function
            const messageHistory = buildMessageHistory(messages, messageContent);

            // Prepare the request with tools and plugins
            const request = {
                model: shapeName,
                stream: options.streaming,
                messages: messageHistory,
                tools: availableTools.filter(t => t.enabled).map(tool => ({
                    type: 'function' as const,
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters,
                    },
                })),
            };

            // Route to appropriate handler based on streaming preference
            if (options.streaming) {
                await handleStreamingResponse(request, messageHistory);
            } else {
                await handleNonStreamingResponse(request, messageHistory);
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
            const token = await getToken();
            const savedAppId = await loadAppId();
            const savedApiKey = await loadApiKey();
            const effectiveAppId = savedAppId !== null ? savedAppId : config.appId;
            const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
            
            const headers = buildApiHeaders({
                effectiveAppId: effectiveAppId ?? undefined,
                token,
                userId,
                channelId,
                apiKey: currentApiKey
            });

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
                const subCommand = args[0]?.toLowerCase();

                if (subCommand === 'clear') {
                    // Handle clear subcommand
                    const clearedCount = images.length;
                    setImages([]);
                    const clearMessage: Message = {
                        type: 'system',
                        content: clearedCount > 0 ? `Cleared ${clearedCount} queued image${clearedCount > 1 ? 's' : ''}.` : 'No images to clear.'
                    };
                    setMessages(prev => [...prev, clearMessage]);
                    break;
                }

                // Default behavior: list images
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
                const toolName = args[0]?.toLowerCase();
                const toolState = args[1]?.toLowerCase();

                if (!toolName) {
                    // List all tools
                    const enabledCount = availableTools.filter(t => t.enabled).length;
                    let content = `Available tools (${enabledCount} enabled):\n`;

                    if (availableTools.length === 0) {
                        content += 'No tools available.';
                    } else {
                        for (const tool of availableTools) {
                            const status = tool.enabled ? 'on' : 'off';
                            content += `  ${tool.name}: ${status} - ${tool.description}\n`;
                        }
                    }

                    const toolsMessage: Message = {
                        type: 'system',
                        content
                    };
                    setMessages(prev => [...prev, toolsMessage]);
                } else {
                    // Find the tool
                    const toolIndex = availableTools.findIndex(t => t.name.toLowerCase() === toolName);
                    if (toolIndex === -1) {
                        const errorMessage: Message = {
                            type: 'system',
                            content: `Tool "${toolName}" not found. Use "/tools" to see available tools.`
                        };
                        setMessages(prev => [...prev, errorMessage]);
                        break;
                    }

                    const tool = availableTools[toolIndex];

                    if (toolState === undefined) {
                        // Show current state
                        const stateMessage: Message = {
                            type: 'system',
                            content: `${tool.name}: ${tool.enabled ? 'on' : 'off'}`
                        };
                        setMessages(prev => [...prev, stateMessage]);
                    } else if (toolState === 'on' || toolState === 'off') {
                        // Set new state
                        const newEnabled = toolState === 'on';
                        const updatedTools = [...availableTools];
                        updatedTools[toolIndex].enabled = newEnabled;
                        setAvailableTools(updatedTools);

                        // Save state to disk
                        await saveToolsState(updatedTools);

                        const updateMessage: Message = {
                            type: 'system',
                            content: `${tool.name} set to: ${toolState}`
                        };
                        setMessages(prev => [...prev, updateMessage]);
                    } else {
                        // Invalid state value
                        const errorMessage: Message = {
                            type: 'system',
                            content: `Invalid tool state: ${toolState}. Use "on" or "off".`
                        };
                        setMessages(prev => [...prev, errorMessage]);
                    }
                }
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
                const infoType = args[0]?.toLowerCase();

                if (infoType === 'application') {
                    // Show application info
                    try {
                        const savedAppId = await loadAppId();
                        const effectiveAppId = savedAppId !== null ? savedAppId : config.appId;
                        if (!effectiveAppId) {
                            throw new Error('No application ID configured');
                        }

                        const token = await getToken();
                        const savedApiKey = await loadApiKey();
                        const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
                        
                        const headers = buildApiHeaders({
                            effectiveAppId,
                            token,
                            userId,
                            channelId,
                            apiKey: currentApiKey
                        });

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

                // Default to shape info (infoType is 'shape' or undefined or a username)
                try {
                    const username = (infoType && infoType !== 'shape') ? infoType : (args[1] || currentShapeUsername || config.username);

                    // Prepare headers
                    const token = await getToken();
                    const savedAppId = await loadAppId();
                    const savedApiKey = await loadApiKey();
                    const effectiveAppId = savedAppId !== null ? savedAppId : config.appId;
                    const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
                    
                    const headers = buildApiHeaders({
                        effectiveAppId,
                        token,
                        userId,
                        channelId,
                        apiKey: currentApiKey
                    });

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

                        // Prepare headers
                        const token = await getToken();
                        const savedAppId = await loadAppId();
                        const savedApiKey = await loadApiKey();
                        const effectiveAppId = savedAppId !== null ? savedAppId : config.appId;
                        const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
                        
                        const headers = buildApiHeaders({
                            effectiveAppId,
                            token,
                            userId,
                            channelId,
                            apiKey: currentApiKey
                        });

                        const response = await fetch(`${endpoint.replace('/v1', '')}/shapes/public/${username}`, {
                            method: 'GET',
                            headers
                        });

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

                    // Prepare headers for memories fetch
                    const token = await getToken();
                    const savedAppId = await loadAppId();
                    const savedApiKey = await loadApiKey();
                    const effectiveAppId = savedAppId !== null ? savedAppId : config.appId;
                    const currentApiKey = getCurrentApiKey(apiKey, savedApiKey, config.apiKey);
                    
                    const headers = buildApiHeaders({
                        effectiveAppId,
                        token,
                        userId,
                        channelId,
                        apiKey: currentApiKey
                    });

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
            case 'options': {
                const optionName = args[0]?.toLowerCase();
                const optionValue = args[1];

                if (!optionName) {
                    // List all options
                    const optionsContent = `Current options:

↳ ${chalk.cyan('streaming')}: ${chalk.blue(options.streaming.toString())} ${chalk.gray('(boolean - enables streaming responses)')}`;

                    const optionsMessage: Message = {
                        type: 'system',
                        content: optionsContent
                    };
                    setMessages(prev => [...prev, optionsMessage]);
                } else if (optionName === 'streaming') {
                    if (optionValue === undefined) {
                        // Show current value
                        const valueMessage: Message = {
                            type: 'system',
                            content: `${chalk.cyan('streaming')}: ${chalk.blue(options.streaming.toString())}`
                        };
                        setMessages(prev => [...prev, valueMessage]);
                    } else {
                        // Set new value
                        const newValue = optionValue.toLowerCase() === 'true';
                        const newOptions = { ...options, streaming: newValue };
                        setOptions(newOptions);
                        await saveOptions(newOptions);

                        const updateMessage: Message = {
                            type: 'system',
                            content: `${chalk.cyan('streaming')} set to: ${chalk.blue(newValue.toString())}`
                        };
                        setMessages(prev => [...prev, updateMessage]);
                    }
                } else {
                    // Unknown option
                    const errorMessage: Message = {
                        type: 'system',
                        content: `Unknown option: ${optionName}. Available options: streaming`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'server': {
                const serverArg = args[0]?.toLowerCase();

                if (!serverArg) {
                    // Show server status and options
                    const [debuggerAvailable, localAvailable] = await Promise.all([
                        checkServerAvailability('localhost', 8090),
                        checkServerAvailability('localhost', 8080)
                    ]);

                    const getServerStatus = (type: 'prod' | 'local' | 'debugger' | 'custom', available: boolean) => {
                        const name = getServerDisplayName(type, type === 'custom' ? customServerUrl : undefined);
                        const isSelected = serverType === type;

                        if (isSelected) return chalk.green(`${name} (current)`);
                        if (type === 'prod') return chalk.white(name);
                        if (available) return chalk.white(name);
                        return chalk.gray(name);
                    };

                    let serverContent = `Available servers:

↳ ${chalk.cyan('prod')} (${getServerStatus('prod', true)})
↳ ${chalk.cyan('debugger')} (${getServerStatus('debugger', debuggerAvailable)})
↳ ${chalk.cyan('local')} (${getServerStatus('local', localAvailable)})`;

                    if (serverType === 'custom') {
                        serverContent += `\n↳ ${chalk.cyan('custom')} (${getServerStatus('custom', true)})`;
                    }

                    const serverMessage: Message = {
                        type: 'system',
                        content: serverContent
                    };
                    setMessages(prev => [...prev, serverMessage]);
                } else if (serverArg === 'auto') {
                    // Re-run auto detection
                    resetDiscoveryCache();
                    const discoveredConfig = await initConfig();
                    setEndpoint(discoveredConfig.apiUrl);
                    const detectedType = detectServerType(discoveredConfig.apiUrl);
                    setServerType(detectedType);
                    if (detectedType === 'custom') {
                        setCustomServerUrl(discoveredConfig.apiUrl);
                    }

                    const successMessage: Message = {
                        type: 'system',
                        content: `Auto-detected and switched to: ${chalk.green(getServerDisplayName(detectedType, detectedType === 'custom' ? discoveredConfig.apiUrl : undefined))}`
                    };
                    setMessages(prev => [...prev, successMessage]);
                } else if (serverArg === 'prod') {
                    setEndpoint('https://api.shapes.inc/v1');
                    setServerType('prod');
                    const successMessage: Message = {
                        type: 'system',
                        content: `Switched to: ${chalk.green('prod (api.shapes.inc)')}`
                    };
                    setMessages(prev => [...prev, successMessage]);
                } else if (serverArg === 'debugger') {
                    const debuggerAvailable = await checkServerAvailability('localhost', 8090);
                    if (!debuggerAvailable) {
                        const warningMessage: Message = {
                            type: 'system',
                            content: `${chalk.yellow('Warning:')} Debugger proxy not detected at localhost:8090. Staying on current server.`
                        };
                        setMessages(prev => [...prev, warningMessage]);
                    } else {
                        setEndpoint('http://localhost:8090/v1');
                        setServerType('debugger');
                        const successMessage: Message = {
                            type: 'system',
                            content: `Switched to: ${chalk.green('debugger (localhost:8090)')}`
                        };
                        setMessages(prev => [...prev, successMessage]);
                    }
                } else if (serverArg === 'local') {
                    const localAvailable = await checkServerAvailability('localhost', 8080);
                    if (!localAvailable) {
                        const warningMessage: Message = {
                            type: 'system',
                            content: `${chalk.yellow('Warning:')} Local server not detected at localhost:8080. Staying on current server.`
                        };
                        setMessages(prev => [...prev, warningMessage]);
                    } else {
                        setEndpoint('http://localhost:8080/v1');
                        setServerType('local');
                        const successMessage: Message = {
                            type: 'system',
                            content: `Switched to: ${chalk.green('local (localhost:8080)')}`
                        };
                        setMessages(prev => [...prev, successMessage]);
                    }
                } else if (serverArg.startsWith('http')) {
                    // Custom server URL
                    setEndpoint(serverArg);
                    setServerType('custom');
                    setCustomServerUrl(serverArg);
                    const successMessage: Message = {
                        type: 'system',
                        content: `Switched to: ${chalk.green(`custom (${serverArg})`)}`
                    };
                    setMessages(prev => [...prev, successMessage]);
                } else {
                    const errorMessage: Message = {
                        type: 'system',
                        content: `Unknown server: ${serverArg}. Use prod, local, debugger, auto, or a full URL.`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'help': {
                const helpContent = `Available commands:

↳ ${chalk.green('/login')} - Authenticate with Shapes API
↳ ${chalk.green('/logout')} - Clear authentication token
↳ ${chalk.green('/key')} ${chalk.green('[api-key]')} - Set API key (empty to clear and prompt for new one)
↳ ${chalk.green('/user')} ${chalk.green('[id]')} - Set user ID (empty to clear)
↳ ${chalk.green('/channel')} ${chalk.green('[id]')} - Set channel ID (empty to clear)
↳ ${chalk.green('/application')} ${chalk.green('[id]')} - Set application ID (empty to clear)
↳ ${chalk.green('/shape')} ${chalk.green('[username]')} - Change current shape (prompts for username if not provided)
↳ ${chalk.green('/info')} ${chalk.green('[shape|application]')} - Show shape or application info (defaults to current shape)
↳ ${chalk.green('/memories')} ${chalk.green('[page]')} - Show conversation summaries for current shape (page 1 if not specified)
↳ ${chalk.green('/images')} - List available image files
↳ ${chalk.green('/image')} ${chalk.green('[filename]')} - Upload an image (specify filename or auto-select first)
↳ ${chalk.green('/images')} ${chalk.green('clear')} - Clear uploaded images
↳ ${chalk.green('/clear')} - Clear chat history
↳ ${chalk.green('/tools')} - List available tools
↳ ${chalk.green('/tools')} ${chalk.green('<name>')} ${chalk.green('[on|off]')} - Show or set tool state
↳ ${chalk.green('/options')} - List all options
↳ ${chalk.green('/options')} ${chalk.green('<name>')} ${chalk.green('[value]')} - Show or set option value
↳ ${chalk.green('/server')} - List available servers and current selection
↳ ${chalk.green('/server')} ${chalk.green('[prod|local|debugger|auto|url]')} - Switch server or auto-detect
↳ ${chalk.green('/exit')} - Exit the application
↳ ${chalk.green('/help')} - Show this help message

Configuration files are stored in: ${chalk.cyan('~/.shapes-cli/')}`;

                const helpMessage: Message = {
                    type: 'system',
                    content: helpContent
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

            // Re-initialize client with new token (only if API key changed)
            const discoveredConfig = await initConfig();
            const currentApiKey = getCurrentApiKey(apiKey, await loadApiKey(), discoveredConfig.apiKey);
            
            // Only recreate client if API key or baseURL has changed
            if (currentApiKey !== currentClientApiKey || discoveredConfig.apiUrl !== currentClientBaseURL || !client) {
                const clientConfig: ClientOptions = {
                    apiKey: currentApiKey,
                    baseURL: discoveredConfig.apiUrl,
                    // Remove defaultHeaders - we'll use per-request headers instead
                };

                const shapesClient = new OpenAI(clientConfig);
                setClient(shapesClient);
                setCurrentClientApiKey(currentApiKey);
                setCurrentClientBaseURL(discoveredConfig.apiUrl);
            }

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

            // Re-initialize with API key if available (only if API key changed)
            const discoveredConfig = await initConfig();
            const currentApiKey = getCurrentApiKey(apiKey, await loadApiKey(), discoveredConfig.apiKey);

            if (currentApiKey) {
                // Only recreate client if API key or baseURL has changed
                if (currentApiKey !== currentClientApiKey || discoveredConfig.apiUrl !== currentClientBaseURL || !client) {
                    const clientConfig: ClientOptions = {
                        apiKey: currentApiKey,
                        baseURL: discoveredConfig.apiUrl,
                        // Remove defaultHeaders - we'll use per-request headers instead
                    };

                    const shapesClient = new OpenAI(clientConfig);
                    setClient(shapesClient);
                    setCurrentClientApiKey(currentApiKey);
                    setCurrentClientBaseURL(discoveredConfig.apiUrl);
                }
                setAuthStatus(`API Key (${currentApiKey.slice(-4)})`);
            } else {
                setClient(null);
                setCurrentClientApiKey('');
                setCurrentClientBaseURL('');
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
                appId={appId}
                serverType={serverType}
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