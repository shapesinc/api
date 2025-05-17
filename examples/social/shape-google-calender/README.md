# Google Calendar Event Adder with Shapes AI

A powerful command-line tool that combines natural language processing with Google Calendar and Shapes.inc AI to streamline your event management workflow.

## Overview

This Node.js application allows you to:

1. **Create Google Calendar events** using natural language input
2. **Chat with a Shapes.inc AI** about the created events
3. **Maintain conversation context** throughout your session

The tool parses your natural language descriptions to extract event details (subject, date/time, attendees), creates the event in Google Calendar, and then enables an interactive chat session with your configured Shapes AI assistant about the event.

## Features

- 🗣️ **Natural Language Processing**: Describe events in plain English
- 📅 **Google Calendar Integration**: Seamlessly create events in your calendar
- 🤖 **Shapes AI Integration**: Notify and chat with your AI assistant about events
- 💬 **Contextual Conversations**: Maintain consistent session identity for coherent interactions
- 🔄 **Multiple Event Creation**: Add several events in sequence without restarting

## Prerequisites

Before getting started, you'll need:

- **Node.js**: Version 16 or higher
- **Google Account**: With Google Calendar enabled
- **Shapes.inc Account**: With a configured shape (AI assistant)
- **Google API Credentials**: From Google Cloud Console with Calendar API enabled
- **.env File**: Containing your Shapes.inc API key and shape username

## Installation

1. Clone this repository:
   ```bash
   git clone [repository-url]
   cd google-calendar-shapes-ai
   ```

2. Install dependencies:
   ```bash
   npm install googleapis openai chrono-node dotenv readline
   ```

3. Set up Google OAuth:
   - Place your `credentials.json` file in the project directory
   - The first run will prompt browser authentication

4. Create `.env` file with your Shapes.inc credentials:
   ```
   SHAPES_API_KEY=your_shapes_api_key_here
   SHAPES_USERNAME=your_shapes_shape_username_here
   SHAPES_BASE_URL=https://api.shapes.inc/v1
   ```

## Usage

1. Start the application:
   ```bash
   node index.js
   ```

2. Follow the interactive prompts:
   - Describe your event (e.g., "Meeting with alice@example.com tomorrow at 3pm about project X")
   - The app will create the event and notify your Shapes AI
   - Chat with your AI assistant about the event (or anything else)
   - Type 'done' or 'exit' to create another event
   - Type 'exit' at the event creation prompt to quit

## How It Works

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Natural Language │     │  Google Calendar  │     │    Shapes.inc     │
│     Processing    │────►│       API         │────►│        AI         │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
                                                            │
                                                            │
                                                            ▼
                                                   ┌───────────────────┐
                                                   │                   │
                                                   │   Interactive     │
                                                   │   Chat Session    │
                                                   │                   │
                                                   └───────────────────┘
```

1. **Input Processing**: Your event description is parsed to extract details
2. **Calendar Creation**: The Google Calendar API creates the event
3. **AI Notification**: Your Shapes AI is informed about the event
4. **Interactive Chat**: You can discuss the event or anything else with your AI

## Tips for Effective Use

- **Event Descriptions**: Be reasonably clear about date, time, and email addresses
- **Shapes AI Configuration**: Configure your shape to understand event notifications
- **Troubleshooting**: Check console logs for detailed information during issues
- **Date Formats**: If the app doesn't understand your date/time, try common formats like "tomorrow at 4 PM" or "July 25th 10am"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Google Authorization Fails | Verify `credentials.json` location and check Google Cloud Console for API restrictions |
| Invalid Attendees | Double-check email address formats in your input |
| Shapes API Errors | Verify API key and username in `.env` file and ensure your shape is active |
| Date/Time Extraction Issues | Try rephrasing with more standard date formats |

## Project Structure

- `index.js` - Main script and entry point
- `google-auth.js` - Handles Google OAuth authentication flow
- `.env` - Contains your Shapes.inc credentials
- `credentials.json` - Google API credentials file
- `token.json` - Generated after first Google authentication

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests with suggestions or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Google Calendar API](https://developers.google.com/calendar)
- [Shapes.inc](https://shapes.inc)
- [Chrono-node](https://github.com/wanasit/chrono) for natural language date parsing