// utils.js
const url = require('url');
const path = require('path');

/**
 * Extracts shape username from a shapes.inc URL.
 * Supports formats:
 * - shapes.inc/shoutingguy
 * - shapes.inc/shoutingguy/chat
 *
 * @param {string} message The message containing the URL
 * @returns {string | null} The extracted shape username or null if not found
 */
function extractShapeUsername(message) {
    try {
        // Find potential URLs in the message
        const urlMatches = message.match(/\bhttps?:\/\/\S+/gi);

        if (!urlMatches) {
            return null;
        }

        for (const urlString of urlMatches) {
            // Use URL parsing to robustly handle different URL formats
            const parsedUrl = new URL(urlString);

            // Check if the hostname is shapes.inc (case-insensitive)
            if (parsedUrl.hostname.toLowerCase() === 'shapes.inc') {
                // Get the first path segment
                const pathnameSegments = parsedUrl.pathname.split('/').filter(segment => segment !== '');

                if (pathnameSegments.length > 0) {
                    // The first segment is the username
                    return pathnameSegments[0];
                }
            }
        }
    } catch (error) {
        // Ignore errors from invalid URLs, just return null
        console.error("Error parsing URL in message:", error);
    }

    // Fallback regex for simpler cases or if URL parsing fails
    // Match shapes.inc/{username} or shapes.inc/{username}/anything
    const regexMatch = message.match(/shapes\.inc\/([a-zA-Z0-9_-]+)(?:[\/\s]|$)/i);
    if (regexMatch && regexMatch[1]) {
         return regexMatch[1];
    }


    return null;
}

/**
 * Detect if the text contains a file URL from Shapes API.
 *
 * @param {string} text The text to check
 * @returns {string | null} The file URL if found, null otherwise
 */
function detectShapesFileUrl(text) {
    // Pattern for Shapes file URLs (starting with https://files.shapes.inc/)
    const pattern = /(https:\/\/files\.shapes\.inc\/[^\s]+)/i; // Added case-insensitive flag
    const match = text.match(pattern);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

module.exports = {
    extractShapeUsername,
    detectShapesFileUrl
};