import pkg from '@atproto/api';
const { BskyAgent, RichText } = pkg;
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const BLUESKY_IDENTIFIER = process.env.BLUESKY_IDENTIFIER;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;
const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '60000', 10); 

// Initialize the Bluesky API client
const agent = new BskyAgent({
  service: 'https://bsky.social',
});

// Initialize the Shapes API client
const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1',
});

// Store the bot's DID for mention detection
let botDid = '';
let botHandle = '';

// Store the last notification timestamp to avoid processing the same notifications
let lastNotificationTime = new Date().toISOString();

// Function to process a message with the Shapes API
async function processWithShapes(content, userId, threadId) {
  try {
    console.log('Sending to Shapes API:', content);
    
    // Create headers object - only include X-Channel-Id if threadId exists
    const headers = {
      "X-User-Id": userId
    };
    
    // Only add X-Channel-Id if threadId is provided
    if (threadId) {
      headers["X-Channel-Id"] = threadId;
    }
    
    // Call the Shapes API using the OpenAI SDK
    const response = await shapes.chat.completions.create({
      model: `shapesinc/${SHAPES_USERNAME}`,
      messages: [
        { role: "user", content: content }
      ],
      extra_headers: headers
    });
    
    // Extract response
    const aiResponse = response.choices[0].message.content;
    console.log('AI Response:', aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error('Error processing with Shapes API:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return `Sorry, I encountered an error while processing your request.`;
  }
}

// Function to check for new mentions and notifications
async function checkNotifications() {
  try {
    const response = await agent.listNotifications({ limit: 20 });
    const notifications = response.data.notifications;
    
    // Filter for new notifications after the last check
    const newNotifications = notifications.filter(notification => 
      notification.indexedAt > lastNotificationTime
    );
    
    // Update the timestamp for the next check
    if (notifications.length > 0) {
      lastNotificationTime = notifications[0].indexedAt;
    }
    
    console.log(`Found ${newNotifications.length} new notifications.`);
    
    // Process each notification
    for (const notification of newNotifications) {
      // Only process mentions or replies
      if (['mention', 'reply'].includes(notification.reason)) {
        console.log(`Processing ${notification.reason}:`, notification.uri);
        
        try {
          // Get the post content directly from the notification record
          let content = "";
          
          if (notification.record && notification.record.text) {
            content = notification.record.text;
          } else {
            console.log("Getting post from URI:", notification.uri);
            
            // For AT Protocol format: at://did:plc:xxx/app.bsky.feed.post/rkey
            const uriParts = notification.uri.split('/');
            const did = uriParts[2];
            const rkey = uriParts[uriParts.length - 1];
            
            console.log(`Extracted DID: ${did}, RKEY: ${rkey}`);
            
            try {
              // Properly format the request for the AT Protocol
              const postResponse = await agent.app.bsky.feed.getPost({ 
                repo: did,
                rkey: rkey 
              });
              
              if (postResponse && postResponse.data && postResponse.data.record) {
                content = postResponse.data.record.text;
                console.log("Retrieved post content:", content);
              } else {
                console.log("Post data structure:", JSON.stringify(postResponse.data));
                continue; // Skip this notification if we can't get the content
              }
            } catch (postError) {
              console.error("Error getting post details:", postError.message);
              continue; // Skip this notification
            }
          }
          
          // Skip empty content
          if (!content) {
            console.log("Skipping notification with empty content");
            continue;
          }
          
          // Look for mentions of our bot in the content
          const isMentioningBot = content.includes(`@${botHandle}`);
          
          if (isMentioningBot || notification.reason === 'reply') {
            // Remove the bot handle from the content before processing
            content = content.replace(`@${botHandle}`, '').trim();
            
            // Process the content with Shapes API
            const userId = `bluesky-user-${notification.author.did}`;
            const threadId = `bluesky-thread-${notification.uri}`;
            
            const aiResponse = await processWithShapes(content, userId, threadId);
            
            // Reply to the post
            try {
              // Format the response text with RichText
              const rt = new RichText({ text: aiResponse });
              await rt.detectFacets(agent);
              
              // Use the notification to reply
              const reply = {
                text: rt.text,
                facets: rt.facets,
                reply: {
                  root: {
                    uri: notification.uri,
                    cid: notification.cid
                  },
                  parent: {
                    uri: notification.uri,
                    cid: notification.cid
                  }
                }
              };
              
              const replyResponse = await agent.post(reply);
              console.log("Reply posted successfully:", replyResponse.uri);
            } catch (replyError) {
              console.error("Error posting reply:", replyError.message);
            }
          }
        } catch (error) {
          console.error(`Error processing notification: ${error.message}`);
          console.error(error.stack);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking notifications:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Main function to start the bot
async function startBot() {
  try {
    console.log('Logging in to Bluesky...');
    await agent.login({
      identifier: BLUESKY_IDENTIFIER,
      password: BLUESKY_PASSWORD,
    });
    
    // Get our bot's information
    const { data } = await agent.getProfile({ actor: agent.session.did });
    botDid = agent.session.did;
    botHandle = data.handle;
    
    console.log(`Logged in as ${botHandle} (${botDid})`);
    console.log(`Shape bot is running and monitoring for mentions...`);
    
    // Check for notifications immediately
    await checkNotifications();
    
    // Set up interval to check for new notifications
    setInterval(checkNotifications, POLLING_INTERVAL);
    
  } catch (error) {
    console.error('Error starting bot:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    console.log('Retrying in 10 seconds...');
    setTimeout(startBot, 10000);
  }
}

// Start the bot
console.log('Starting Shape Bluesky bot...');
startBot(); 