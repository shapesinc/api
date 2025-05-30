// shapesApiClient.js
const OpenAI = require('openai');
const logger = require('./logger');

class ShapesApiClient {
    constructor(apiKey, baseUrl) {
        if (!apiKey || !baseUrl) {
            logger.error("Shapes API Key or Base URL not provided.");
            // Depending on your needs, you might want to throw an error here
            // or handle gracefully if the API is optional.
            this.client = null; // Prevent client initialization
            return;
        }
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseUrl,
        });
         logger.info(`Shapes API client initialized with base URL: ${baseUrl}`);
    }

    /**
     * Generate a reply to a text message using the Shapes API.
     *
     * @param {string} shapeUsername The username of the shape (used as the model name)
     * @param {string} userId The ID of the user
     * @param {string} message The original message text to respond to
     * @param {string | null} channelId The channel ID of the message (optional)
     * @returns {Promise<string>} The generated reply text
     * @throws {Error} If the API client is not initialized or the API call fails
     */
    async generateReply(shapeUsername, userId, message, channelId = null) {
        if (!this.client) {
            throw new Error("Shapes API client is not initialized.");
        }

        const userMessage = message; // No formatting needed based on the Python code

        const headers = {
            "X-User-Id": userId,
        };

        if (channelId) {
            headers["X-Channel-Id"] = channelId;
        }

        try {
            const response = await this.client.chat.completions.create({
                model: `shapesinc/${shapeUsername}`,
                messages: [
                    {
                        role: "user",
                        content: userMessage,
                    },
                ],
                extra_headers: headers,
            });

            // Ensure response and content exist
            if (!response || !response.choices || response.choices.length === 0 || !response.choices[0].message || response.choices[0].message.content === null) {
                 throw new Error("Shapes API returned an empty or invalid response.");
            }

            const reply = response.choices[0].message.content.trim();
            logger.info(`Generated reply from ${shapeUsername} for user ${userId} (channel: ${channelId || 'N/A'})`);
            return reply;

        } catch (error) {
            logger.error(`Error calling Shapes API (${shapeUsername}) for user ${userId}: ${error.message}`);
             // Log more details if available from axios/openai error
            if (error.response) {
                logger.error(`API Error Response Status: ${error.response.status}`);
                logger.error(`API Error Response Data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                logger.error('API Error: No response received');
            }
            throw new Error(`Failed to generate reply from Shapes API: ${error.message}`);
        }
    }
}

module.exports = ShapesApiClient;