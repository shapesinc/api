// replyclient.js
require('dotenv').config();
const { OpenAI } = require('openai');

const SHAPES_API_KEY = process.env.SHAPES_API_KEY;
const SHAPES_USERNAME = process.env.SHAPES_USERNAME; // Used for the model name

if (!SHAPES_API_KEY || !SHAPES_USERNAME) {
    console.error("❌ SHAPES_API_KEY or SHAPES_USERNAME not set in .env");
    // Continue execution but log the error
}

// Initialize OpenAI with Shapes API configuration
const shapes = new OpenAI({
    apiKey: SHAPES_API_KEY,
    baseURL: 'https://api.shapes.inc/v1',
});

/**
 * Generates a reply using the Shapes AI based on the tweet data.
 * The raw tweet text is used as the prompt.
 * @param {object} tweetData - Object containing tweet details: { tweetId: string, username: string, text: string }.
 * @returns {Promise<string>} - The generated reply text.
 */
async function generateReply(tweetData) {
    if (!SHAPES_API_KEY || !SHAPES_USERNAME) {
        console.error("❌ Cannot generate reply: Shapes API keys are missing.");
        return "Sorry, my reply service is not configured correctly.";
    }

    if (!tweetData || !tweetData.text) {
         console.warn('⚠️ generateReply called with empty or invalid tweetData.');
         return "Could not process the tweet information.";
    }

    try {
        // Extract data from the input object
        const { tweetId, username, text } = tweetData;

        // Use the raw tweet text directly as the prompt content
        const prompt = text;

        console.log('Sending prompt to Shapes API:', prompt);

        // Prepare headers using provided tweet data
        const userIdHeader = tweetId || 'unknown_tweet_id';
        const channelIdHeader = username ? `@${username}` : 'unknown_channel'; // Use @username for channel ID
        const tweetTextHeader = text.substring(0, 100); // First 100 chars of tweet for context


        const response = await shapes.chat.completions.create(
            {
                model: `shapesinc/${SHAPES_USERNAME}`, // Use SHAPES_USERNAME as the model name
                messages: [{ role: "user", content: prompt }], // Pass the raw tweet text as the user message
                max_tokens: 150, // Limit the reply length to ensure it fits within Twitter's character limit
                temperature: 0.7, // Add some creativity while keeping responses on-topic
            },
            {
                headers: {
                    // Pass user context to the API for better analytics
                    "X-User-Id": userIdHeader,
                    "X-Channel-Id": channelIdHeader,
                    "X-Tweet-Text": tweetTextHeader,
                },
            }
        );

        const shapeResponseText = response.choices[0]?.message?.content?.trim();

        if (!shapeResponseText) {
            console.warn('⚠️ Shapes API returned empty response content.');
            return "I received an empty response from the AI.";
        }

        // Check if the response is within Twitter's character limit
        if (shapeResponseText.length > 280) {
            console.warn(`⚠️ Generated response exceeds Twitter's character limit (${shapeResponseText.length} chars). Truncating.`);
            // Truncate to fit Twitter's limit, add ellipses
            return shapeResponseText.substring(0, 277) + "...";
        }

        console.log('✅ Shapes Response:', shapeResponseText);
        return shapeResponseText;
    } catch (error) {
        console.error('❌ Error processing with Shapes API:', error.message);
        // Return a friendly message in case of API errors
        return `Sorry, I encountered an error while generating a reply.`;
    }
}

module.exports = { generateReply };