/**
 * Utility functions for consistent API header management across OpenAI SDK and fetch requests
 */

interface HeaderConfig {
    effectiveAppId?: string | null;
    token?: string | null;
    userId?: string;
    channelId?: string;
    apiKey?: string;
}

/**
 * Get the current API key using consistent precedence logic
 * Priority: current state → saved file → config default
 */
export function getCurrentApiKey(
    apiKeyState: string,
    savedApiKey: string,
    configApiKey: string
): string {
    return apiKeyState || savedApiKey || configApiKey;
}

/**
 * Build consistent headers for fetch requests (includes Authorization header)
 * Used by all fetch() calls in the application
 */
export function buildApiHeaders(config: HeaderConfig): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    // Add app ID header if set (respects user clearing the value)
    if (config.effectiveAppId) {
        headers['X-App-ID'] = config.effectiveAppId;
    }

    // Add auth token header if available
    if (config.token) {
        headers['X-User-Auth'] = config.token;
    }

    // Add user ID header if set
    if (config.userId) {
        headers['X-User-ID'] = config.userId;
    }

    // Add channel ID header if set
    if (config.channelId) {
        headers['X-Channel-ID'] = config.channelId;
    }

    // Add Authorization header for fetch requests
    if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    return headers;
}

/**
 * Build headers for OpenAI SDK per-request usage (excludes Authorization header)
 * Authorization is handled by the OpenAI client instance API key
 */
export function buildOpenAIHeaders(config: Omit<HeaderConfig, 'apiKey'>): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add app ID header if set (respects user clearing the value)
    if (config.effectiveAppId) {
        headers['X-App-ID'] = config.effectiveAppId;
    }

    // Add auth token header if available
    if (config.token) {
        headers['X-User-Auth'] = config.token;
    }

    // Add user ID header if set
    if (config.userId) {
        headers['X-User-ID'] = config.userId;
    }

    // Add channel ID header if set
    if (config.channelId) {
        headers['X-Channel-ID'] = config.channelId;
    }

    return headers;
}