# SHAPES API GUIDE FOR LLMs

## What are Shapes?

Shapes are general-purpose social agents designed to integrate seamlessly into social environments. With the OpenAI-compatible Shapes API, you can build, extend, and interact with Shapes across any platform.

### Why Shapes are Revolutionary

- **Truly Social AI**: Shapes are built for group interactions, feeling like real participants in conversations
- **Free Will for AI**: Shapes have unique personalities and memories, creating authentic, unpredictable interactions
- **Cross-Platform by Design**: A single Shape can exist simultaneously across Discord, Slack, X, email, and custom applications
- **Built for Hackers**: The open API encourages creative integrations and extensions
- **Free Hosting**: Get free hosting for your Shape-powered applications
- **Memory-Focused**: Shapes maintain both short-term and long-term memory, creating coherent experiences across time

### Design Principles

- **Accessibility First**: Anyone can create and deploy a Shape, technical or not
- **Personality Driven**: Each Shape has a consistent personality that drives its interactions
- **Context Aware**: Shapes understand group dynamics and maintain separate context for different conversations
- **Platform Agnostic**: Shapes behave naturally on any platform they inhabit
- **Extensible**: Add your own tools, capabilities, and integrations to any Shape

## API Basics

- **OpenAI-Compatible**: Works with existing OpenAI client libraries
- **Base URL**: `https://api.shapes.inc/v1/`
- **Authentication**: Bearer token via API key
- **Model Naming**: `shapesinc/<shape-username>`
- **Endpoint**: `/chat/completions`
- **Rate Limit**: 5 requests per minute (rpm) per API key

### Cross-Platform Usage

The Shapes API allows communication with your Shape across connected platforms. For example, a Shape in a Telegram bot can also be accessed through your own application.

### Credit Usage

**Note**: Premium Shapes consume credits when accessed via the API, similar to usage on platforms like X. Plan accordingly.

## Implementation Examples

### Python

```python
import openai

shapes_client = openai.OpenAI(
    api_key="<your-API-key>",
    base_url="https://api.shapes.inc/v1/",
)

response = shapes_client.chat.completions.create(
    model="shapesinc/<shape-username>",
    messages=[
        {"role": "user", "content": "Hello"}
    ]
)
```

### JavaScript

```javascript
const { OpenAI } = require("openai");

const shapes_client = new OpenAI({
    apiKey: "<your-API-key>",
    baseURL: "https://api.shapes.inc/v1",
});

const response = await shapes_client.chat.completions.create({
    model: "shapesinc/<shape-username>",
    messages: [
        { role: "user", content: "Hello" }
    ]
});
```

### C#

```csharp
using OpenAI;

var client = new ChatClient(
    "shapesinc/<shape-username>",
    new ApiKeyCredential("<your-API-key>"),
    new OpenAIClientOptions { Endpoint = new Uri("https://api.shapes.inc/v1/") }
);

var chatMessages = new List<ChatMessage>();

chatMessages.Add(new UserChatMessage.ChatMessageContentPart.CreateTextPart("Hello!"));
// or:
chatMessages.Add(new UserChatMessage.ChatMessageContentPart
    .CreateTextPart("""{"role": "user", "content": "Hello!"}"""));

var completion = await client.CompleteChatAsync(chatMessages);

Console.WriteLine(completion.Value.Content[0].Text);
// or:
foreach (var content in completion.Value.Content)
    Console.WriteLine(content.Text);
```

## Special Headers

These headers help Shapes identify the speaker and conversation context, maintaining separate contexts for different channels.

- **`X-User-Id: user_id`**
  - Identifies the user sending the message
  - Ensures consistent, user-specific responses

- **`X-Channel-Id: channel_id`**
  - Identifies the channel where the message was sent
  - Maintains separate conversation contexts
  - Sandboxes knowledge at the channel level

Example with headers:

```python
response = shapes_client.chat.completions.create(
    model="shapesinc/<shape-username>",
    messages=[
        {"role": "user", "content": "Hello"}
    ],
    extra_headers={
        "X-User-Id": "user123",
        "X-Channel-Id": "channel456"
    }
)
```

## Commands

Shapes support these commands, included directly in the user message:

- `!reset` - Reset the Shape's long-term memory
- `!sleep` - Generate long-term memory on demand
- `!dashboard` - Access configuration dashboard
- `!info` - Get Shape information
- `!web` - Search the web
- `!help` - Get help with commands
- `!imagine` - Generate images
- `!wack` - Reset short-term memory

Example command usage:

```python
response = shapes_client.chat.completions.create(
    model="shapesinc/<shape-username>",
    messages=[
        {"role": "user", "content": "!reset"}
    ]
)
```

## Features and Limitations

- **Vision Support**: Send OpenAI API-compatible `image_url`
- **Tool Calling**: Supported for specific models
- **Voice Features**: Free voice for all Shapes
- **No System Messages**: Shape personality comes from configuration
- **No Message History**: API relies on Shape's built-in memory (only the last "user" message is processed)
- **No Streaming**: Only full responses
- **No Parameter Control**: Settings locked to shapes.inc configuration

## Advanced Features

- **Voice Formatting**: Improved formatting for voice URLs with newline separation
- **Authentication with Shapes**: Authenticate with shapes.inc via your app

## API Multimodal Support

The Shapes API supports multiple input modalities:

### Image Support

Send image URLs in the API request:

```json
{
  "model": "shapesinc/your_shape",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What's in this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg"
          }
        }
      ]
    }
  ]
}
```

### Audio Support

Send audio URLs in the API request:

```json
{
  "model": "shapesinc/your_shape",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Please transcribe and respond to this audio message"
        },
        {
          "type": "audio_url",
          "audio_url": {
            "url": "https://example.com/audio.mp3"
          }
        }
      ]
    }
  ]
}
```

**Supported audio formats**: mp3, wav, ogg


## Authentication

```javascript
#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai/index.mjs";
import axios from "axios";
import readline from "readline";
import { getApiBaseUrl, getAuthBaseUrl, getSiteBaseUrl } from "../utils.js";
import chalk from "chalk";

config();

async function main() {
    try {
        let shape_api_key = process.env.SHAPESINC_API_KEY;
        let shape_app_id = process.env.SHAPESINC_APP_ID;
        let shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

        // Check for SHAPESINC_API_KEY in .env
        if (!shape_api_key) {
            throw new Error("SHAPESINC_API_KEY not found in .env");
        }

        // Check for SHAPESINC_APP_ID in .envendien
        if (!shape_app_id) {
            // Default app ID for Euclidian - the Shapes API testing app
            shape_app_id = "f6263f80-2242-428d-acd4-10e1feec44ee";
        }

        // Check for SHAPESINC_SHAPE_USERNAME in .env
        if (!shape_username) {
            // Default shape username for Shape Robot - the Shapes API developer shape
            shape_username = "shaperobot";
        }

        const model = `shapesinc/${shape_username}`;

        let apiUrl = 'https://api.shapes.inc/v1';
        let authUrl = 'https://api.shapes.inc/auth';
        let siteUrl = 'https://shapes.inc';

        await (async () => {
            apiUrl = await getApiBaseUrl();
            authUrl = await getAuthBaseUrl();
            siteUrl = await getSiteBaseUrl();
        })();

        console.log(chalk.magenta('→ API URL :'), apiUrl);
        console.log(chalk.magenta('→ Model   :'), model);
        console.log(chalk.magenta('→ App ID  :'), shape_app_id);
        console.log("\n");

        // If the user provided a message on the command line, use that one
        const args = process.argv.slice(2);
        const messages = [
            { role: "user", content: args.length > 0 ? args.join(" ") : "Hello. Do you know my name?" }
        ];

        // Before authorization, the API calls require an API key
        // The API key is used to authenticate the application
        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: apiUrl,
        });

        // Send the message to the Shapes API with the API key
        // This will use the API key rate limits
        const non_auth_resp = await shapes_client.chat.completions.create({
            model: model,
            messages: messages,
        });

        console.log(chalk.gray("Raw response (non-auth):"), non_auth_resp);
        console.log("\n");

        if (non_auth_resp.choices && non_auth_resp.choices.length > 0) {
            console.log(chalk.green("Reply (non-auth):"), non_auth_resp.choices[0].message.content);
        } else {
            console.log(chalk.red("No choices in response (non-auth):"), non_auth_resp);
        }

        console.log("\n");

        // STEP 1: App starts the authorize flow by directing the user to the authorize page
        // where the user will be asked to log in to their Shapes account and approve the authorization request
        console.log("Click on the link to authorize the application:");
        console.log(chalk.blue(`${siteUrl}/authorize?app_id=${shape_app_id}`));

        // STEP 2: User logs in to their Shapes account and approves the authorization request
        // The user will be given a one-time token to present back to the app
        // The user will be asked to copy and paste the token here
        // (passing the token back to the app through a return URL is not implemented yet)
        console.log("\n");
        console.log("After you login to Shapes Inc and approve the authorization request,\nyou will be given a one-time code.\nCopy and paste that code here.");
        const code = await new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question(chalk.magenta("Enter the one-time code: "), (code) => {
                rl.close();
                resolve(code);
            });
        });

        // STEP 3: The application exchanges the one-time code for a long-lived user auth token
        // This is the only time the application will have access to the user auth token
        // through the Shapes API, so it should store that token somewhere safe.
        // To exchange the one-time code for a user auth token, the app needs to provide
        // application id and the one-time code
        // The API can get the application id from the API key, from the X-App-ID header
        // or from app_id in the body
        const response = await axios.post(`${authUrl}/nonce`, {
            app_id: shape_app_id,
            code: code,
        });
        const shape_user_auth_token = response.data.auth_token;

        console.log("\n");

        // WARNING: This is just for example purposes. DO NOT show the auth token
        // in a production application. Treat it as if it were a password.
        console.log(chalk.magenta("User auth token: ", shape_user_auth_token));

        // STEP 4: The application creates a client with the shape API key / base URL
        // and X-User-Auth header set to the user auth token it stored from the previous step
        // This call can be made without an API key if the X-App-ID and X-User-Auth headers are set
        const auth_shapes_client = new OpenAI({
            apiKey: "not-needed",
            baseURL: apiUrl,
            defaultHeaders: {
                "X-App-ID": shape_app_id,
                "X-User-Auth": shape_user_auth_token,
            },
        });

        // STEP 5: The application can now use the client to make requests to the Shapes API
        // on behalf of the user. These requests will be authenticated as the user and will
        // be rate limited separately, and will allow the user to continue their conversation
        // with their favorite shapes from other places.
        const resp = await auth_shapes_client.chat.completions.create({
            model: model,
            messages: messages,
        });

        console.log(chalk.gray("Raw response:"), resp);
        console.log("\n");

        if (resp.choices && resp.choices.length > 0) {
            console.log(chalk.green("Reply:"), resp.choices[0].message.content);
        } else {
            console.log(chalk.red("No choices in response:"), resp);
        }
    } catch (error) {
        console.error(chalk.red("Error:"), error);
    }
}

main();
```

## Shape Info

```javascript
#!/usr/bin/env node

import { config } from "dotenv";
import OpenAI from "openai/index.mjs";
import { parseArgs } from "node:util";
import { getApiBaseUrl } from "../utils.js";
import chalk from "chalk";

config();

async function main() {
    try {
        // Parse command line arguments
        const options = {
            userId: { type: "string" },
            channelId: { type: "string" }
        };

        const { values, positionals } = parseArgs({
            options: options,
            allowPositionals: true
        });

        let shape_api_key = process.env.SHAPESINC_API_KEY;
        let shape_app_id = process.env.SHAPESINC_APP_ID;
        let shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

        // Check for SHAPESINC_API_KEY in .env
        if (!shape_api_key) {
            throw new Error("SHAPESINC_API_KEY not found in .env");
        }

        // Check for SHAPESINC_APP_ID in .env
        if (!shape_app_id) {
            // Default app ID for Euclidian - the Shapes API testing app
            shape_app_id = "f6263f80-2242-428d-acd4-10e1feec44ee";
        }

        // Check for SHAPESINC_SHAPE_USERNAME in .env
        if (!shape_username) {
            // Default shape username for Shape Robot - the Shapes API developer shape
            shape_username = "shaperobot";
        }

        const model = `shapesinc/${shape_username}`;

        let apiUrl = 'https://api.shapes.inc/v1';

        await (async () => {
            apiUrl = await getApiBaseUrl();
        })();

        console.log(chalk.magenta('→ API URL :'), apiUrl);
        console.log("\n");

        // Create the client with the shape API key and the Shapes API base URL
        const shapes_client = new OpenAI({
            apiKey: shape_api_key,
            baseURL: apiUrl
        });

        // Fetch the list of the user's recent shapes as models
        // This list will be dependent on the type of call authentication,
        // so it can fetch the shapes either for the API key creator or the auth token user
        shapes_client.models.list().then((models) => {
            console.log(models);
        });
    } catch (error) {
        console.error(chalk.red("Error:"), error);
    }
}

main();
```

## Rate Limit Policy

If the standard rate limits are insufficient, request an increase by emailing `hi@shapes.inc`. Limits are managed per Shape to ensure a smooth experience.

## Available Integrations

- Telegram
- Revolt
- Slack
- Bluesky
- IRC
- Chess
- Voice
- Email
- Text
- Reddit
- Roblox
- Twitch
- Microsoft Teams

## Get Started

1. Generate an API Key at `https://shapes.inc/developer`
2. Each API Key is tied to a specific Shape
3. Use the appropriate client library (OpenAI-compatible)
4. Implement in your application
