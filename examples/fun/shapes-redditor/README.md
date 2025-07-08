# shapes-redditor

A salty reddit bot powered by the shapesinc api. Talks trash, never backs down, and probably needs therapy.

## Overview
Shapes-redditor is a fun project that simulates Reddit interactions using the capabilities of a particular Shape. It's built to demonstrate the capabilities of the Shapesinc API while providing an entertaining experience. The bot is responds to posts and comments with witty, sometimes passive-aggressive responses, making for an interesting interaction.

## Features
- AI-powered Reddit responses using Shapesinc API
- Classic Reddit-style post and comment system
- Web interface that looks suspiciously like Reddit
- Upvote/downvote functionality (because internet points matter)

## Live Demo
Check out the live demo at: https://shapes-redditor.vercel.app/

## Prerequisites
Before you begin, ensure you have:
- Node.js (v14 or higher)
- npm (v6 or higher)
- A Shapesinc API key (get one at https://shapes.inc/developer)

## Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/shapes-redditor.git
cd shapes-redditor
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Go to https://shapes.inc/developer and get your API credentials
   - Create a `.env` file in the root directory with the following variables:
```bash
# Get these from https://shapes.inc/developer
SHAPESINC_SHAPE_USERNAME=your_shape_username_here
SHAPESINC_API_KEY=your_api_key_here

# Optional: Change this if you want to run the server on a different port
PORT=3001
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001` (or your specified PORT)

## Usage Guide
1. **Creating Posts**
   - Click the "Create Post" button
   - Enter a title and content
   - Submit and watch the bot respond

2. **Interacting with Comments**
   - Reply to existing posts or comments
   - The bot will respond with AI-generated content
   - Use upvote/downvote to influence the conversation

3. **Best Practices**
   - The bot tends to get more creative with specific topics
   - Multiple interactions in a thread can lead to more entertaining exchanges

## Tech Stack
- **Frontend**
  - React + Vite (for fast development and optimal performance)
  - TypeScript (for type safety and better development experience)
  - CSS Modules (for scoped styling)
  - React Router (for navigation)

- **Backend**
  - Express.js (for the API server)
  - Shapesinc API (for AI-powered responses)
  - Node.js (runtime environment)

## Troubleshooting
- **API Key Issues**
  - Ensure your API key is correctly set in the `.env` file
  - Check if your API key has the necessary permissions
  - Verify your Shapesinc account is active
  - Shape username is the username of the particular shape you want to use, not the username of your Shapes account.

- **Server Issues**
  - Check if the port is already in use
  - Ensure all environment variables are set
  - Check the console for error messages



Feel free to submit a PR if you want to make this bot even more unhinged!

## License
This project is open source and available under the MIT License. Do whatever you want with it, just don't blame me if the bot starts questioning your life choices.


