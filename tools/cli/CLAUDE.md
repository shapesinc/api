# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Interactive Mode (Default):**
- `npm start` - Launch interactive REPL chat interface
- `npm run dev` - Launch in development mode using ts-node
- `npm run build` - Compile TypeScript to JavaScript

**Code Quality:**
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint to check code quality and style
- `npm run lint:fix` - Auto-fix ESLint issues where possible

**Authentication Setup:**
- `npm run login` - Run OAuth authentication flow (required once)
- `npm run login:dev` - Run login in development mode
- `npm run logout` - Clear authentication token
- `npm run logout:dev` - Run logout in development mode

**Environment Variables:**
- `SHAPESINC_API_KEY` - API key for Shapes API
- `SHAPESINC_APP_ID` - Application ID (defaults to f6263f80-2242-428d-acd4-10e1feec44ee)
- `SHAPESINC_SHAPE_USERNAME` - Username (defaults to shaperobot)

## Architecture Overview

**Core Structure:**
- React/Ink-based CLI using TypeScript ES modules
- OpenAI SDK client configured for Shapes API endpoints
- Single interactive mode with integrated features (chat, images, tools)
- Utility functions for auth, tools, plugins, rendering in `src/utils/`
- React components for terminal UI in `src/components/`
- Only separate command: `auth` for OAuth setup

**Key Patterns:**
- Default launch: interactive REPL chat interface with all features
- Authentication tokens stored in `~/.shapes-cli/token.json`
- Tools and plugins auto-loaded and available in all conversations
- Image upload integrated into chat input interface
- Central config in `src/config.ts` with environment variable defaults
- OpenAI client instantiated with custom base URL and headers for Shapes API

**Integrated Features:**
- **Chat**: Real-time conversations with message history and slash commands
- **Images**: Upload via interface menu, automatic base64 encoding
- **Tools**: Auto-loaded from `~/.shapes-cli/tools/`, sent with every request
- **Plugins**: Stored in `~/.shapes-cli/plugins/`, extend tool functionality
- **Slash Commands**: `/login` for auth, `/logout` to clear token, `/help` for command list

**API Integration:**
- Uses OpenAI SDK pointed at Shapes API (`https://api.shapes.inc/v1`)
- Custom headers: `X-App-ID` and `X-User-Auth`
- Model format: `shapesinc/{username}`
- Function calling support for tools integration
- All tools automatically included in chat completion requests