# Shapes CLI

A unified command-line interface that combines the core Shapes API capabilities from the basic JavaScript examples into a single REPL-style application. This CLI integrates basic chat completions, OAuth authentication, image processing, and function calling with tools into an interactive terminal experience.

## Goal

This application demonstrates how to build a comprehensive CLI tool that showcases all major Shapes API features in one place, providing developers with a reference implementation for building interactive applications with the Shapes platform.

## Features

**Core Chat Interface:**
- Interactive REPL-style chat sessions with Shapes API
- Real-time message streaming and response handling
- Code block syntax highlighting and rendering
- Persistent conversation history within sessions

**Authentication System:**
- OAuth-style authorization flow for user authentication
- Secure token storage and management
- Support for both API key and user authentication modes
- Automatic token refresh and validation

**Image Processing:**
- Upload and analyze images through the terminal
- Base64 encoding with automatic MIME type detection
- Vision capabilities for image understanding and analysis
- Multimodal conversations combining text and images

**Tool Integration:**
- Built-in tools for common operations (email, search, calculations)
- Function calling with automatic tool execution
- Multi-turn conversations with tool results
- Real-time tool output and feedback

**Plugin System:**
- Simple plugin architecture for extending functionality
- JSON-based plugin manifests for easy development
- Git-based plugin installation and management
- Hot-loading of new tools and capabilities

## Architecture

**React/Ink Terminal UI:**
- React components render directly to the terminal using Ink
- Provides rich interactive elements like input fields, message lists, and menus
- Enables real-time updates and responsive terminal interfaces
- Component-based architecture mirrors web development patterns

**OpenAI SDK Integration:**
- Uses OpenAI client library configured for Shapes API endpoints
- Handles chat completions, function calling, and streaming responses
- Custom headers (`X-App-ID`, `X-User-Auth`) for Shapes authentication
- Seamless integration with existing OpenAI-compatible tools

**Command-Based Architecture:**
- Modular command structure using Commander.js
- Each feature (auth, chat, image, tools) as separate command modules
- Easy to extend with new commands and functionality
- Follows CLI best practices for user experience

**Local Data Management:**
- User directory storage (`~/.shapes-cli/`) for configuration and plugins
- JSON-based configuration for tools and plugin manifests
- Secure token storage with file system permissions
- No external database dependencies

## Installation

1. Navigate to the project directory:
```bash
cd shapes-api/examples/apps/shapes-cli
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Set up environment variables:
```bash
export SHAPESINC_API_KEY="your-api-key"
export SHAPESINC_APP_ID="your-app-id"  
export SHAPESINC_SHAPE_USERNAME="your-username"
```

## Usage

### Interactive Mode (Default)
Launch the interactive REPL chat interface:
```bash
npm start
# or for development
npm run dev
```

**Features available in interactive mode:**
- **Real-time chat** with Shapes API using your configured model
- **Image upload** using the interface menu - select "Upload image" to add images to your message
- **Tool integration** - all configured tools are automatically available during conversations
- **Code block rendering** with syntax highlighting for readable output
- **Persistent conversation history** within the session
- **Multimodal conversations** combining text and images seamlessly

**Interface Controls:**
- Type your message and press Enter to send
- Use the menu to upload images, clear images, or send messages
- Use slash commands: `/login` for authentication, `/logout` to clear token, `/help` for command list
- Type Ctrl+C to exit

### Authentication Setup
Authenticate with the Shapes API (required before first use):

**Option 1: Within Interactive Mode**
```bash
npm start
# Then type: /login
```
- Opens browser for OAuth authorization flow from within the chat interface
- Integrated authentication without leaving the app

**Option 2: Separate Commands**
```bash
# Login
npm run login
# or for development  
npm run login:dev

# Logout
npm run logout
# or for development
npm run logout:dev
```
- Standalone authentication commands
- Login opens browser for OAuth authorization flow and prompts for authorization code
- Logout clears the stored authentication token
- Saves token securely in `~/.shapes-cli/` for future sessions
- Login only needs to be run once (until token expires or you logout)

## Plugin Development

To create a plugin:

1. Create a new directory with a `plugin.json` file:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "main": "index.js"
}
```

2. Implement your plugin functionality in `index.js`

3. Install the plugin:
```bash
npm start plugins
# Select "Install new plugin"
# Enter the path to your plugin directory
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT