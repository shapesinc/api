# Shapes X Bot (Unofficial)

An automated X (formerly Twitter) interaction bot that monitors and responds to DMs and mentions using the Shapes.inc AI API.

note: this is not base on official twitter dev docs

## Overview

This Node.js application uses Puppeteer to automate interactions on X/Twitter, allowing your Shapes AI assistant to:

1. **Automatically reply to Direct Messages**
2. **Scan and respond to mentions** of specified users
3. **Search for tweets** matching particular queries
4. **Use AI-generated responses** powered by Shapes.inc

The bot maintains a history of replied tweets to avoid duplicate responses and uses session cookies to minimize login requirements.

## Features

- 🤖 **Automated Login**: Uses saved cookies for persistent sessions, with fallback to standard login
- 📨 **DM Monitoring**: Checks for and responds to unread direct messages
- 🔍 **Tweet Search**: Finds tweets matching configured search queries
- 🎯 **Mention Tracking**: Scans for mentions of specific handles
- 🧠 **AI Responses**: Uses Shapes.inc API to generate contextually relevant replies
- 🔄 **History Management**: Tracks replied tweets to avoid duplicates
- 🛡️ **Stealth Mode**: Uses puppeteer-extra-plugin-stealth to avoid detection

## Prerequisites

- **Node.js**: Version 14 or higher
- **Shapes.inc Account**: With API key and configured shape
- **X/Twitter Account**: With username and password
- **X/Twitter API Access**: Not required (uses browser automation instead)

## Project Structure

```
shapes-x-bot/
├── main.js               # Main entry point script
├── checkdm.js            # DM checking and response functionality
├── replyclient.js        # Integration with Shapes.inc API
├── historyManager.js     # Manages replied tweet history
├── scrapetweets.js       # Scrapes tweets matching search queries
├── .env                  # Environment variables configuration
├── cookies.json          # Stored browser cookies (created automatically)
└── repliedTweets.json    # History of replied tweets (created automatically)
```

## Installation

1. Clone this repository:
   ```bash
   git clone [repository-url]
   cd shapes-x-bot
   ```

2. Install dependencies:
   ```bash
   npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth openai dotenv
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   # X/Twitter credentials
   USERNAME=your_twitter_username
   PASSWORD=your_twitter_password

   # Shapes.inc API credentials
   SHAPES_API_KEY=your_shapes_api_key
   SHAPES_USERNAME=your_shapes_shape_username

   # Search configuration
   SEARCH_QUERY=your search query here
   ```

## Usage

1. Start the bot:
   ```bash
   node main.js
   ```

2. The bot will:
   - Launch a browser session
   - Attempt to log in using saved cookies or credentials
   - Check for and respond to unread DMs
   - Search for tweets matching the configured query
   - Check for mentions of the specified handle
   - Reply to relevant tweets using the Shapes AI

## Configuration Options

### Custom Search Queries

Edit the `SEARCH_QUERY` in your `.env` file to adjust what tweets the bot searches for.

### Mention Tracking

Edit the `mentionsQuery` value in `main.js` to change whose mentions the bot monitors:

```javascript
// Default is '@elisabethxbt'
const mentionsQuery = '@yourusername'; 
or simply update on the .env query
```

### Browser Options

Adjust browser launch options in `main.js` for different environments:

```javascript
// Set to true for production, false for debugging
browser = await puppeteerExtra.launch({
    headless: true,  
    // Other browser options...
});
```

## How It Works

1. **Login Process**:
   - First tries to use saved cookies from previous sessions
   - Falls back to standard username/password login if needed
   - Handles potential verification steps with timeouts for manual intervention
   - Saves successful session cookies for future use

2. **DM Processing**:
   - Navigates to the DM section
   - Identifies unread conversations
   - Opens each conversation
   - Scrapes recent message history
   - Generates AI responses based on conversation context
   - Sends replies directly in the DM thread

3. **Tweet Searching & Replying**:
   - Searches for tweets matching configured queries
   - Filters out tweets already replied to
   - Generates contextually relevant responses
   - Replies to tweets directly
   - Saves IDs of replied tweets to avoid duplicates

4. **Error Handling**:
   - Takes screenshots on errors for debugging
   - Implements recovery mechanisms for navigation issues
   - Gracefully handles unexpected states

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Login Failures | Check your credentials in `.env` file; X may require manual verification |
| "Unread DM" Detection Issues | The selectors may need updating if X changes its UI |
| Browser Crashes | Adjust browser launch parameters or update dependencies |
| Rate Limiting | Add more delays between actions or reduce the frequency of script execution |
| Empty AI Responses | Check your Shapes API key and shape configuration |

## Extending the Bot

### Adding New Features

The modular design allows for easy extensions:

1. Create a new module file (e.g., `newfeature.js`)
2. Import necessary dependencies and helper functions
3. Implement your feature logic
4. Export the main function
5. Import and call from `main.js`

### Customizing AI Behavior

Modify `replyclient.js` to adjust how Shapes AI generates responses:
- Change `max_tokens` to control response length
- Adjust `temperature` to modify creativity/randomness
- Add system messages to guide response style

## Security Considerations

- The bot stores your X credentials and session cookies locally
- Consider running on a secure environment with appropriate permissions
- Never share your `.env` file or cookies.json
- If compromised, immediately change your X password

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- [Puppeteer](https://pptr.dev/) for browser automation
- [Shapes.inc](https://shapes.inc) for AI response generation
- [OpenAI Node.js Client](https://github.com/openai/openai-node) for Shapes API integration

## Disclaimer

This bot is an unofficial implementation and not affiliated with X Corp. or Shapes.inc. Use responsibly and in accordance with X's Terms of Service.