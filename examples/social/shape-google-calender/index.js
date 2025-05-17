
const readline = require('readline');
const { google } = require('googleapis');
const chrono = require('chrono-node');
const { OpenAI } = require('openai'); 
const dotenv = require('dotenv');     
dotenv.config();
const { authorize } = require('./google-auth');
// Get necessary configuration from environment variables
const SHAPES_API_KEY = process.env.SHAPES_API_KEY;
const SHAPES_USERNAME = process.env.SHAPES_USERNAME;
const SHAPES_BASE_URL = process.env.SHAPES_BASE_URL; // Optional custom base URL

// Validate essential Shapes configuration
if (!SHAPES_USERNAME) {
    console.error("❌ Error: SHAPES_USERNAME environment variable not set in .env");
    process.exit(1); // Exit if Shapes username is not configured
}
if (!SHAPES_API_KEY) {
    console.warn("⚠️ Warning: SHAPES_API_KEY environment variable not set in .env. OpenAI client might not initialize correctly or authenticate with Shapes.");
}

// Initialize the OpenAI client configured for the Shapes API
const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: SHAPES_BASE_URL, // Use custom base URL if provided
});

// --- Generate a stable user ID for this script session ---
// This ID will be reused for all Shapes API calls within this single execution run.
// It provides a consistent identity for the AI to potentially maintain context.
// Using timestamp + random part for reasonable uniqueness per script launch.
const stableUserId = "cli_session_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
console.log(`ℹ️ Using stable user ID for this session: ${stableUserId}`);
// --- End stable user ID generation ---


/**
 * Sends a specific event summary notification to the Shapes AI.
 * This is used *once* after a successful event creation.
 * @param {string} content The summary string to send (structured like "Subject:..., Time:..., etc.").
 * @param {string} userId A user identifier (stable for the session).
 * @param {string|null} threadId A thread/channel identifier (optional, null for this CLI context).
 * @returns {Promise<string>} The AI's response, or an error message.
 */
async function notifyShapesOfEvent(content, userId, threadId) {
    if (!content || content.trim() === '') return "Please provide some text for the AI to process.";

    try {
        const headers = {
            "X-User-Id": userId,
            ...(threadId && { "X-Channel-Id": threadId }),
        };

        console.log(`[DEBUG] Notifying Shapes AI of created event for user ${userId}...`);

        const response = await shapes.chat.completions.create({
            model: `shapesinc/${SHAPES_USERNAME}`, // Ensure model name is correctly formatted
            messages: [
                { role: "user", content: `Just completed an action: Created a calendar event. Here are the details:\n${content}` }
            ],
  
        }, {
             headers: headers
        });

        // Return the free-form text content from the AI
        return response.choices[0]?.message?.content || "AI returned an empty response content.";

    } catch (error) {
        console.error('❌ Shapes API Error during event notification:', error); // Log the full error for debugging
        // Use backticks for template literal in error message
        return `Shapes API failed to respond for event notification: ${error.message}. Check console for details.`;
    }
}


/**
 * Sends a general chat message to the Shapes AI during an interactive session.
 * @param {string} message The user's chat message.
 * @param {string} userId A user identifier (stable for the session).
 * @param {string|null} threadId A thread/channel identifier (optional, null for this CLI context).
 * @returns {Promise<string>} The AI's response, or an error message.
 */
async function chatWithShapes(message, userId, threadId) {
    if (!message || message.trim() === '') return ""; // Return empty for empty messages

    try {
        const headers = {
            "X-User-Id": userId,
            ...(threadId && { "X-Channel-Id": threadId }),
        };

        console.log(`[DEBUG] Sending chat message to Shapes AI for user ${userId}...`);

        // Send the user's free-form chat message
        const response = await shapes.chat.completions.create({
            model: `shapesinc/${SHAPES_USERNAME}`,
            messages: [
                // Simple user message for ongoing chat
                { role: "user", content: message }
                // For more complex chat history, you would pass an array of previous messages here
                // e.g., [{ role: "system", content: "You are helpful..." }, { role: "user", content: "Hi" }, { role: "assistant", content: "Hello!" }, { role: "user", content: message }]
                // This requires storing chat history state, which adds complexity. Keeping it simple for this example.
            ],
            // You might want to adjust temperature or max_tokens for chat vs notification
            // temperature: 0.9,
            // max_tokens: 300,
        }, {
             headers: headers
        });

        // Return the free-form text content from the AI
        return response.choices[0]?.message?.content || "AI returned an empty chat response.";

    } catch (error) {
        console.error('❌ Shapes API Error during chat message:', error); // Log the full error for debugging
        return `Shapes API failed to respond during chat: ${error.message}. Check console for details.`;
    }
}

/**
 * Extracts the first date/time and all email addresses from input text using chrono-node and regex.
 * @param {string} input The raw input string from the user.
 * @returns {{date: Date|null, emails: string[]}} An object containing the extracted date (or null) and an array of emails.
 */
function extractDetails(input) {
  const date = chrono.parseDate(input);
  const emailMatches = input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g);
  const emails = emailMatches || [];
  return { date, emails };
}

/**
 * Extracts a potential subject from the input string by splitting at common keywords or the first email.
 * This is a heuristic and might not always capture the intended subject accurately.
 * @param {string} input The raw input string from the user.
 * @returns {string} The extracted subject string.
 */
function extractSubject(input) {
  const lowerInput = input.toLowerCase();
  const keywords = [' with ', ' at ', ' tomorrow', ' next ', ' on '];

  let indices = [];
  for (const kw of keywords) {
    const idx = lowerInput.indexOf(kw);
    if (idx !== -1) indices.push(idx);
  }

  const emailMatch = input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  if (emailMatch && emailMatch.index !== undefined) {
    indices.push(emailMatch.index);
  }

  if (indices.length === 0) {
    return input.trim();
  }

  const cutIndex = Math.min(...indices);
  return input.substring(0, cutIndex).trim();
}



// --- Google Calendar Event Creation ---

/**
 * Creates a calendar event using the Google Calendar API.
 * Requires an authenticated Google OAuth2 client.
 * @param {google.auth.OAuth2} auth An authenticated Google OAuth2 client instance.
 * @param {string} summary The summary/title of the event.
 * @param {Date} startTime The start time of the event.
 * @param {Date} endTime The end time of the event.
 * @param {string[]} attendees An array of email addresses for attendees.
 * @returns {Promise<string|null>} A promise that resolves with the Google Calendar event link (htmlLink) on success, or null on failure.
 */
async function createCalendarEvent(auth, summary, startTime, endTime, attendees = []) {
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: summary || 'New Scheduled Event',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: attendees.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 10 },
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    console.log('Creating Google Calendar event...');
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    const eventLink = res.data.htmlLink;

    console.log('✅ Event created successfully!');
    console.log('   Google Calendar Link:', eventLink);

    // Return the link so the main function can use it
    return eventLink;

  } catch (err) {
    console.error('❌ Error creating Google Calendar event:', err);
     if (err.errors && err.errors.length > 0) {
        err.errors.forEach(e => console.error(`   - ${e.reason}: ${e.message}`)); // Use backticks
    }
    if (err.message.includes('Invalid Attendees')) {
        console.error('   This might be due to invalid attendee email addresses.');
    }
    return null;
  }
}



/**
 * Starts an interactive chat session with the Shapes AI.
 * This loop continues until the user types 'done' or 'exit'.
 * @param {readline.Interface} rl The readline interface.
 * @param {string} userId The stable user ID for the session.
 * @param {Function} mainLoopCallback The callback to return to the main event processing loop.
 */
async function startShapesChat(rl, userId, mainLoopCallback) {
    console.log('\n---');
    rl.question('🔷 Shapes AI Chat (Type \'done\' or \'exit\' to finish chat):\n> ', async (chatInput) => {
        const lowerChatInput = chatInput.toLowerCase().trim();

        if (lowerChatInput === 'done' || lowerChatInput === 'exit') {
            console.log('\n---');
            console.log('Ending chat session.');
            console.log('Ready for next event. Type "exit" to quit at any time.');
            console.log('---\n');
            mainLoopCallback(rl); // Return to the main event loop
            return;
        }

        if (chatInput.trim() === '') {
             // If input is just whitespace, prompt again without sending to AI
            startShapesChat(rl, userId, mainLoopCallback);
            return;
        }


        const chatResponse = await chatWithShapes(chatInput, userId, null); // threadId remains null for this CLI context

        console.log(`\n🤖 Shapes AI: ${chatResponse}`);
        console.log('---');
        startShapesChat(rl, userId, mainLoopCallback);
    });
}


/**
 * Process a single event creation based on user input
 * @param {readline.Interface} rl The readline interface
 * @param {Function} callback Function to call after processing (used for loop)
 */
async function processEvent(rl, callback) {
  rl.question('📅 Describe your event (e.g., "Meeting with alice@example.com tomorrow at 3pm about project X") or type "exit" to quit:\n> ', async (input) => {
    console.log('\n---');

    // Check if user wants to exit the whole application
    if (input.toLowerCase().trim() === 'exit') {
      console.log('Exiting application. Goodbye!');
      rl.close();
      return; // Stop the process
    }

    // --- Step 1: Extract details using original input and extraction functions ---
    const subject = extractSubject(input);
    const { date: eventTime, emails: attendeeEmails } = extractDetails(input);

    // --- Step 2: Validate extracted details ---
    if (!eventTime) {
      console.log('❌ Could not understand the date and time from your input.');
      console.log('   Please try again, ensuring the date and time are clear (e.g., "tomorrow at 3pm", "July 20th 2025 10:00").');
      // Continue the loop by calling the callback
      callback(rl);
      return;
    }

    if (attendeeEmails.length === 0) {
      console.log('❌ Could not find any valid attendee email in your input.');
      console.log('   Please include at least one email address like alice@example.com.');
       // Continue the loop by calling the callback
      callback(rl);
      return;
    }

    // --- Step 3: Prepare for event creation ---
    const endTime = new Date(eventTime.getTime() + 60 * 60 * 1000); // default 1 hour duration
    const finalSubject = subject || 'New Scheduled Event';

    // Use backticks for console logs
    console.log(`\nExtracted Details for Calendar Event:`);
    console.log(`  Subject    : ${finalSubject}`);
    console.log(`  Start Time : ${eventTime.toLocaleString()}`);
    console.log(`  End Time   : ${endTime.toLocaleString()}`);
    console.log(`  Attendees  : ${attendeeEmails.length > 0 ? attendeeEmails.join(', ') : 'None found'}`);
    console.log('---');

    console.log('Attempting to authorize with Google and create event...');

    authorize(async (auth) => {

      const eventLink = await createCalendarEvent(auth, finalSubject, eventTime, endTime, attendeeEmails);

      if (eventLink) { // Event creation was successful
        console.log('\n---');
        console.log('Informing Shapes AI about the created event...');

        // Construct a message to send to the AI summarizing the created event
        // Use backticks for cleaner string construction
        const aiMessageContent = `
Subject: "${finalSubject}",
Time: "${eventTime.toLocaleString()}",
Attendees: "${attendeeEmails.join(', ')}",
Link: ${eventLink}
        `.trim(); // Trim whitespace from the template literal

        // Use the stableUserId declared outside this function
        const commandLineThreadId = null; // threadId remains null for this CLI context

        // Get the initial notification response from the AI
        const initialAiResponse = await notifyShapesOfEvent(aiMessageContent, stableUserId, commandLineThreadId);

        console.log(`\n🤖 Shapes AI (Event Notification): ${initialAiResponse}`);
        // No separator '---' here, as we transition immediately to chat prompt

        // --- Start the interactive chat session after successful event creation ---
        // Pass the readline interface, stableUserId, and the main loop's callback
        startShapesChat(rl, stableUserId, callback);

      } else { // Event creation failed
          console.log('\n---');
          console.log('Event creation failed, skipping AI notification and chat.');
          console.log('---');
          console.log('Ready for next event. Type "exit" to quit at any time.');
          // Continue the loop if event creation failed
          callback(rl);
      }
    });
  });
}

/**
 * Main function to create a readline interface and start the event processing loop
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Welcome to Calendar Event Creator with Shapes AI Chat');
  console.log('You can create multiple events and chat with the AI about them.');
  console.log('Type "exit" at any time to quit.');
  console.log('---\n');

  processEvent(rl, (currentRl) => processEvent(currentRl, arguments.callee));
}

main();