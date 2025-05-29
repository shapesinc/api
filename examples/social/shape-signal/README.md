# Signal Shapes Bot

This is a bot that connects your shape to Signal, a secure messaging platform. The shape will respond to messages in Signal groups using your shape's personality.

## Features

- Monitors Signal for messages in groups where the bot is present
- Processes messages using the Shapes API
- Maintains separate conversations per user
- Supports special commands like !reset, !web, !help, and !imagine
- Works with any shape from the Shapes catalog

## Prerequisites

Before running the bot, you need:

- A Signal account
- A Shapes.inc account with a shape
- Python 3.8 or higher
- Docker (for Signal CLI REST API)

## Setup

Clone this repository:
```bash
git clone https://github.com/your-username/signal-shapes-bot.git
cd signal-shapes-bot
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file:

**Linux/macOS:**
```bash
cp .env.example .env
```

**Windows:**
```cmd
copy .env.example .env
```

Fill in the `.env` file:
- `SIGNAL_SERVICE`: Signal service address (e.g., 127.0.0.1:8090)
- `PHONE_NUMBER`: Your Signal phone number
- `SHAPESINC_API_KEY`: Your Shapes API key
- `SHAPESINC_SHAPE_USERNAME`: Your shape's username

Set up Signal CLI REST API:

**Linux:**
```bash
sudo docker run -d --name signal-api --restart=always -p 8090:8080 \
    -v $HOME/.local/share/signal-api:/home/.local/share/signal-cli \
    -e 'MODE=native' bbernhard/signal-cli-rest-api
```

**macOS:**
```bash
docker run -d --name signal-api --restart=always -p 8090:8080 \
    -v $HOME/.local/share/signal-api:/home/.local/share/signal-cli \
    -e 'MODE=native' bbernhard/signal-cli-rest-api
```

**Windows:**
```cmd
docker run -d --name signal-api --restart=always -p 8090:8080 ^
    -v "%USERPROFILE%\.local\share\signal-api:/home/.local/share/signal-cli" ^
    -e "MODE=native" bbernhard/signal-cli-rest-api
```

Link your Signal account:
1. Open http://127.0.0.1:8090/v1/qrcodelink?device_name=signal-shapes-bot
2. In Signal app: Settings → Linked devices → Link new device
3. Scan the QR code

Switch to JSON-RPC mode:

```bash
# Stop and restart container (same on all platforms)
docker stop signal-api
docker rm signal-api
```

**Linux:**
```bash
sudo docker run -d --name signal-api --restart=always -p 8090:8080 \
    -v $HOME/.local/share/signal-api:/home/.local/share/signal-cli \
    -e 'MODE=json-rpc' bbernhard/signal-cli-rest-api
```

**macOS:**
```bash
docker run -d --name signal-api --restart=always -p 8090:8080 \
    -v $HOME/.local/share/signal-api:/home/.local/share/signal-cli \
    -e 'MODE=json-rpc' bbernhard/signal-cli-rest-api
```

**Windows:**
```cmd
docker run -d --name signal-api --restart=always -p 8090:8080 ^
    -v "%USERPROFILE%\.local\share\signal-api:/home/.local/share/signal-cli" ^
    -e "MODE=json-rpc" bbernhard/signal-cli-rest-api
```

## Running the Bot

```bash
python main.py
```

The bot will:
- Connect to your Signal account
- Monitor for messages in groups where the bot is present
- Respond to messages using your shape's personality

## How It Works

1. The bot monitors Signal groups for new messages
2. When someone sends a message in a group with the bot, it extracts the message content
3. The content is sent to the Shapes API, which processes it through your shape
4. The response is sent back to the Signal group as a reply

## Usage

Since you cannot message yourself directly on Signal:

1. Create a Signal group
2. Add yourself to the group
3. Send messages in the group (e.g., "Hello!")
4. The bot will respond using your shape's personality

### Special Commands

- `!reset` - Reset the shape's memory
- `!help` - Get help with commands
- `!web [query]` - Search the web
- `!imagine [prompt]` - Generate images
- `!info` - Get information about the shape

## Tips

- To ensure your bot maintains a consistent personality, make sure your shape is well-configured
- Each user gets their own conversation context with the shape
- The bot works in both individual and group conversations
- Signal has built-in message encryption and privacy features

## Troubleshooting

If you encounter issues:

- Check that your Signal API container is running: `docker ps`
- Verify your Shapes API key and shape username are correct
- Ensure the Signal service is in JSON-RPC mode: `docker logs signal-api`
- Check the console logs for detailed error messages
- Test the Signal API directly: `curl http://127.0.0.1:8090/v1/about`

**Platform-specific issues:**

- **Windows**: If you get permission errors, make sure Docker Desktop is running as Administrator
- **macOS**: Make sure Docker Desktop is installed and running
- **Linux**: Add your user to the docker group: `sudo usermod -aG docker $USER`, then log out and back in

## License

This project is licensed under the MIT License.

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements!