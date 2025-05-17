// shapesService.js
import OpenAI from 'openai';
import { shapesApiKey, shapesBaseUrl } from '../config/config.js';
import https from 'https';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Validates the API configuration
 * @throws {Error} If the configuration is invalid
 */
function validateConfig() {
  if (!shapesApiKey) {
    throw new Error('SHAPES_API_KEY is not set in environment variables');
  }
  if (!shapesBaseUrl) {
    throw new Error('SHAPES_BASE_URL is not set in environment variables');
  }
  if (shapesApiKey === 'your_api_key_here') {
    throw new Error('Please replace the default API key with your actual Shapes API key');
  }
}

/**
 * Creates and returns a configured OpenAI client for Shapes API
 * @returns {OpenAI} Configured OpenAI client
 */
function createShapesClient() {
  validateConfig();
  
  // Create a custom HTTPS agent with specific configuration
  const agent = new https.Agent({
    keepAlive: true,
    timeout: 30000,
    rejectUnauthorized: true,
    family: 4 // Force IPv4
  });
  
  return new OpenAI({
    apiKey: shapesApiKey,
    baseURL: shapesBaseUrl,
    maxRetries: 3,
    timeout: 30000,
    httpAgent: agent
  });
}

/**
 * Sends the diff content to the Shapes API and gets a review response.
 * @param {string} diffContent - The diff content of the pull request.
 * @returns {Promise<string>} - The review content from Shapes API.
 */
export async function getReviewFromShapes(diffContent) {
  const client = createShapesClient();
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} to connect to Shapes API`);
      console.log('API URL:', `${shapesBaseUrl}/chat/completions`);
      console.log('API Key present:', !!shapesApiKey);
      console.log('API Key length:', shapesApiKey?.length);

      const response = await client.chat.completions.create({
        model: 'shapesinc/codegingerai',
        messages: [
          {
            role: 'user',
            content: `codegingerai, please review the following diff:\n\n\`\`\`diff\n${diffContent}\n\`\`\``
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      console.log('Response received:', JSON.stringify(response, null, 2));
      
      const reply = response.choices?.[0]?.message?.content;
      if (!reply) {
        throw new Error("No content in Shapes API response");
      }

      return reply;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      // If it's a connection error, wait longer between retries
      if (error.message.includes('Connection error')) {
        const retryDelay = RETRY_DELAY * attempt; // Exponential backoff
        console.log(`Connection error, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.response?.data?.error?.message || lastError?.message || 'Unknown error';
  throw new Error(`Failed to get review from Shapes API after ${MAX_RETRIES} attempts. Last error: ${errorMessage}`);
} 