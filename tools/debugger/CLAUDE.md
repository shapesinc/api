# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@shapesinc/debugger` - a CLI tool that proxies Shapes API traffic and provides a React/Ink-driven UI for live request/response logging and interactive slash commands. The tool acts as a development proxy, forwarding requests to upstream Shapes API servers while providing detailed logging and debugging capabilities.

## Common Development Commands

```bash
# Development
npm run dev              # Run in development mode with hot reload
npm run start:dev        # Alternative development start command

# Building
npm run build           # Build TypeScript to dist/ with type declarations
npm run postbuild       # Automatically runs after build to make dist/main.js executable

# Code Quality
npm run lint            # Run ESLint with error reporting
npm run lint:fix        # Auto-fix ESLint issues
npm run typecheck       # Type check without emitting files

# Production
npm run start           # Run built version from dist/main.js
```

## Architecture

### Core Components

- **Proxy Server** (`src/main.ts`): HTTP proxy that forwards `/v1/*` requests to upstream Shapes API
- **Auto-discovery** (`src/utils.ts`): Automatically detects available API servers (debug proxy, local dev, production)
- **Request/Response Logging**: Color-coded pretty printing with syntax highlighting for OpenAI chat completions

### Key Features

- **Environment-based routing**: Automatically discovers and routes to available servers
  - Debug proxy: `http://localhost:8090/v1` 
  - Dev server: `http://localhost:8080/v1`
  - Production: `https://api.shapes.inc/v1`
- **Token masking**: Automatically masks authorization tokens in logs (shows only last 4 chars)
- **Compression handling**: Automatically decompresses gzipped responses
- **Syntax highlighting**: Special formatting for OpenAI chat completion requests/responses with role-based coloring

### Configuration

- `PORT`: Proxy listening port (default: 8090)
- `TARGET_BASE_URL`: Override upstream URL (defaults to auto-discovery)

### Build System

- TypeScript with ESNext target and NodeNext modules
- Outputs to `dist/` with source maps and declarations
- Uses `tsc-alias` for path resolution
- Executable binary at `dist/main.js` (via `shapes-debug` command)

## Code Standards

- Strict TypeScript configuration with comprehensive type checking
- ESLint with React, TypeScript, and import plugins
- Consistent type imports preferred (`import type`)
- No unused variables/parameters allowed
- React JSX transform (no need for React imports in JSX files)