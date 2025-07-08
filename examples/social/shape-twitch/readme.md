# Shapes Twitch Bot - Setup Guide

This guide will walk you through setting up your own AI-powered Twitch bot using the Shapes API. No coding experience required!

## What This Bot Does

- 🤖 Connects your Shape to Twitch chat
- 💬 Responds to messages based on your chosen mode
- 🎨 Generates images with `!imagine`
- 🧠 Maintains conversation memory
- ⚙️ Fully customizable behavior
  
![img](https://i.ibb.co/PXZZ4k3/Screenshot-2025-06-20-024732.png)

## Prerequisites

1. [Node.js](https://nodejs.org/) (v18 or newer)
2. Twitch account (for your bot)
3. Shapes account (free)

## Step-by-Step Setup

### 1. Get Your Tokens

#### Shapes API Key
1. Go to [shapes.inc/developer](https://shapes.inc/developer)
2. Create account or log in
3. Create a new Shape 
4. Go to "API Keys" and create a new key
5. Copy the API key

#### Twitch Bot Token
1. Go to [twitchtokengenerator.com](https://twitchtokengenerator.com/)
2. Select "Bot Chat Token"
3. Log in with your bot account
4. Copy the generated token (`ACCESS TOKEN` and add it after `oauth:`)

### 2. Install Dependencies

1. Open terminal in your project folder
2. Run: `npm install`

### 3. Start the Bot

Run this command in your terminal:
```bash
npm start
```

You should see:
```
Connecting to #your_channel_name
[BOT]: 🤖 ShapeBot activated! Mode: COMMAND_ONLY
```

## Configuration Options

Customize your bot by editing the `.env` file:

| Setting | Values | Description |
|---------|--------|-------------|
| `RESPONSE_MODE` | `COMMAND_ONLY` (default), `ALL_MESSAGES`, `SELECTIVE` | How the bot responds to messages |
| `SELECTIVE_CHANCE` | 0.1-1.0 | Probability of responding in SELECTIVE mode |
| `COOLDOWN_SECONDS` | 1-60 | Delay between bot responses |
| `MAX_RESPONSE_LENGTH` | 100-1000 | Max characters in responses |

## Available Commands

View all commands with `!help` in chat:

| Command | Example | Description |
|---------|---------|-------------|
| `!ask` | `!ask what's the weather?` | Ask a question |
| `!imagine` | `!imagine cyberpunk city` | Generate an image |
| `!reset` | `!reset` | Reset long-term memory |
| `!wack` | `!wack` | Clear short-term memory |
| `!info` | `!info` | Show Shape info |
| `!web` | `!web latest news` | Web search |
| `!help` | `!help` | Show all commands |

## Troubleshooting

**Bot won't start:**
- Verify all tokens in `.env` are correct
- Ensure Node.js v18+ is installed
- Check for typos in your `.env` file

**No responses in chat:**
- Make sure response mode matches your expectations
- Check bot has moderator permissions in Twitch
- Verify your Shape is active at shapes.inc

**Rate limit errors:**
- Increase `COOLDOWN_SECONDS` in `.env`
- Switch to `COMMAND_ONLY` mode
- Contact shapes.inc for rate limit increase

## Support

For additional help:
- [Shapes API Documentation](https://api.shapes.inc/docs)
- [Twitch Dev Forums](https://discuss.dev.twitch.tv/)
- [Create GitHub Issue]

> Pro Tip: Start with `COMMAND_ONLY` mode and gradually experiment with other modes once everything works!

