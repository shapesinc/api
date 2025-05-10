## Matrix Shapes Bot

This is a Matrix bot that integrates with the Shapes API to provide conversational AI capabilities in Matrix rooms. The bot can respond to commands, process text messages in activated rooms, and interact with the Shapes API to generate responses. It is designed to be easy to set up and use in Matrix rooms, particularly on the Element.io client.

## Features
- Responds to commands like `!ping`, `!say`, `!activate`, `!deactivate`, `!reset`, `!llm`, and `!help`.
- Automatically joins rooms when invited.
- Processes all text messages in activated rooms by sending them to the Shapes API, with the sender's username prepended.
- Persists activated room state in a JSON file for continuity across restarts.
- Includes user-friendly error messages for API issues (e.g., timeouts, rate limits).

## Prerequisites
- **Node.js**: Version 18 or higher (for native `fetch` support).
- **Matrix Account**: A Matrix account on a homeserver (e.g., Element.io).
- **Shapes API Credentials**: An API key and shape username from Shapes.inc.
- **Environment File**: A `.env` file with required configuration.

## Setup

### 1. Register for a Matrix Account on Element.io
To use the bot, you need a Matrix account. Element.io is a popular Matrix client and homeserver. Follow these steps to register:

1. Visit [Element.io](https://app.element.io/).
2. Click **Create Account**.
3. Choose **Register** on the default homeserver (`matrix.org`) or select a custom homeserver if desired.
4. Provide a **username**, **password**, and optional **email** for account recovery.
5. Verify your email (if required) and complete the CAPTCHA.
6. Once registered, log in to Element.io to access your account.

### 2. Obtain a Matrix Access Token
The bot requires an access token to authenticate with the Matrix homeserver. Matrix access tokens **do not typically expire** unless revoked or the account's password is changed. However, for security, treat them as sensitive and regenerate if compromised.

To get your access token:

1. Log in to Element.io at [app.element.io](https://app.element.io/).
2. Click your **profile icon** (top-left) and select **Settings**.
3. Navigate to the **Help & About** tab.
4. Scroll to the bottom and find **Access Token**.
5. Click **<click to reveal>** to display your token, then copy it.
   - **Note**: Treat this token like a password. Do not share it publicly.
6. Store the token securely for use in the `.env` file.

**Security Note**: If you suspect your token is compromised or need to revoke it, change your account password or log out all sessions from the **Security & Privacy** settings in Element.io. This will invalidate the token, and you'll need to generate a new one.

### 3. Obtain Shapes API Credentials
1. Sign up for an account at [Shapes.inc](https://shapes.inc) 
2. Obtain your **API Key** and **Shape Username** from your account dashboard.
3. Note these credentials for the `.env` file.

### 4. Clone and Install the Bot
```bash
git clone https://github.com/shapesinc/api-examples.git
cd api-examples/shape-matrix
```
This installs the required dependencies:
```bash
matrix-bot-sdk
openai
dotenv
``` 
 
5. Configure the Environment
Create a `.env` file in the project root with the following content:
```env
TOKEN=<your-matrix-access-token>
SHAPESINC_API_KEY=<your-shapes-api-key>
SHAPESINC_SHAPE_USERNAME=<your-shape-username>
```
`TOKEN`: Your Matrix access token from Element.io.
`SHAPESINC_API_KEY`: Your Shapes API key.
`SHAPESINC_SHAPE_USERNAME`: Your Shapes username (without the shapesinc/ prefix).

Example:
```env
TOKEN=your_matrix_token_here
SHAPESINC_API_KEY=your_shapes_api_key_here
SHAPESINC_SHAPE_USERNAME=your_shape_username
```
6. Run the Bot
```bash
node index.js
```
The bot will start, load any previously activated rooms from activated_rooms.json, and begin syncing with the Matrix homeserver.
#### Example:
!ping
> pong

!llm What is the capital of France?
> The capital of France is Paris.
 
#### Usage

Invite the Bot: Add the bot to a Matrix room by inviting its user ID (e.g., @your-bot:matrix.org). The bot will auto-join and send a welcome message.

Activate the Bot: Use !activate in a room to enable responses to all text messages. The bot will prepend the sender's username and send messages to the Shapes API.

Interact: Send commands or, in activated rooms, any text message to get a response from the Shapes API.

Reset Context: Use !reset to start a new conversation context in an activated room.

Get Help: Use !help to see all commands and their descriptions.

#### Notes
- Access Token Duration: Matrix access tokens do not expire by default but can be invalidated by changing your password or logging out all sessions. If the bot stops working, check your token and get the new one if needed.
- Error Handling: The bot provides user-friendly error messages for issues like API timeouts or rate limits (e.g., "Too many requests to the Shapes API. Please try again later.").
- Persistence: Activated rooms are stored in activated_rooms.json to maintain state across restarts.
- Non-Text Messages: The bot only processes text messages. Other message types (e.g., files, stickers) are ignored.
- Security: Keep your .env file secure and do not commit it to version control. Use a .gitignore file to exclude it.

#### Troubleshooting
- Bot Not Responding: Check the console logs for errors. Ensure the SHAPESINC_API_KEY and TOKEN are correct, and the Shapes API credentials are valid.
- Token Issues: If the token is invalid, get the new one via Element.io's Help & About settings.
- API Errors: If the Shapes API returns errors (e.g., 429 rate limit), wait and retry or check your API key.
- Room State Lost: If activated_rooms.json is corrupted, delete it; the bot will start with an empty state.

Contributing
Feel free to submit issues or pull requests to improve the bot. Ensure any changes are tested and maintain compatibility with the Matrix protocol and Shapes API.
