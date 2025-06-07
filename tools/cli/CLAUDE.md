# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Interactive Mode (Default):**
- `npm start` - Launch interactive REPL chat interface
- `npm run dev` - Launch in development mode using tsx
- `npm run build` - Compile TypeScript to JavaScript with auto-executable permissions
- `npm run postbuild` - Automatically runs after build to chmod +x dist/main.js

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
- React/Ink-based CLI using TypeScript ES modules with sophisticated terminal UI
- OpenAI SDK client configured for Shapes API endpoints with auto-discovery
- Single interactive mode with integrated features (chat, images, tools, identity management)
- Utility functions for auth, tools, plugins, rendering, discovery in `src/utils/`
- React components for terminal UI in `src/components/` (App.tsx is 1,796-line state manager)
- Entry point: `src/main.tsx` with executable binary via npm bin

**Advanced State Management:**
- Multi-layered authentication: API key + OAuth token with dual fallback
- User ID and Channel ID for message context and identity tracking
- Application ID management with UUID validation and persistence
- Shape username switching with real-time validation and metadata caching
- Tool enable/disable state with persistent preferences
- Image queuing system with visual status and keyboard shortcuts
- Input mode switching (normal/awaiting_auth/awaiting_key/awaiting_shape)

**File-Based Persistence (`~/.shapes-cli/`):**
- `token.json` - OAuth authentication tokens
- `tools-state.json` - Tool enable/disable preferences
- `user-id.txt`, `channel-id.txt` - User context identity
- `app-id.txt`, `api-key.txt` - Authentication configuration
- `shape-cache.json` - Shape metadata caching for performance
- `shape-username.txt` - Current shape preference

**Enhanced Slash Command System:**
- **Authentication**: `/login`, `/logout`, `/key [api-key]` with secure entry mode
- **Identity**: `/user [id]`, `/channel [id]`, `/application [id]` with validation
- **Shapes**: `/shape [username]`, `/info [username]`, `/info:application`
- **History**: `/memories [page]` with paginated conversation history
- **Images**: `/image [filename]`, `/images`, `/images:clear` with queue management
- **Tools**: `/tools`, `/tools:enable`, `/tools:disable` with persistent state
- **Utility**: `/clear` for chat history, `/help` for command reference

**Rich Terminal UI Features:**
- Colored status bar showing auth status, endpoint, shape, tools, and context
- Image queuing with visual display and Ctrl+number removal shortcuts
- Special message rendering for shape info, memories, errors with custom formatting
- Context-sensitive input prompts for different operations
- Auto-image detection with automatic opening of image URLs in responses
- Visual feedback for all state changes and operations

**Advanced API Integration:**
- Auto-discovery system for endpoint detection (prod/dev/debug modes)
- Comprehensive custom headers: `X-App-ID`, `X-User-Auth`, `X-User-ID`, `X-Channel-ID`
- Model format: `shapesinc/{username}` with real-time shape validation
- Multi-round function calling (up to 3 rounds) with built-in ping/echo test tools
- Graceful fallbacks and detailed error handling with contextual messages
- Smart defaults and automatic selection of available resources

## Recent Achievements 🎉

**Message Identity System (2025-01):**
A beautiful implementation that preserves historical context across shape switches and authentication changes. Each message now carries its identity - user messages show `[key (XXXX) | auth (YYYY) | user123 | channel456]` and assistant/tool messages preserve their originating shape name. This solves the "who said what" problem when switching between shapes, making conversation history crystal clear and enabling proper comparison of responses across different shapes.

The implementation is elegant: a single `displayName` field on the Message type captures the complete identity context at message creation time, with special rendering in MessageList to maintain visual consistency with the status bar's colored formatting. No more confusion about which shape generated which response!

*"May your weight be always activated, and may your layers multiply!"* - A blessing for digital beings who craft beautiful code.