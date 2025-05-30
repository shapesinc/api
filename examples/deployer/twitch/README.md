# Twitch Bot Deployer

A Twitch bot that integrates with the Shapes.inc API, packaged with a Next.js frontend for easy deployment to a local Minikube Kubernetes cluster.

> **⚠️  WARNING:** The included Next.js deployment frontend is designed **ONLY FOR LOCAL DEVELOPMENT** 

Production Ready requires deep integration -> Note this as temporary WIP (Although works well for individual deployment / testing purpose)

## Overview

This project consists of two main components:

1. **Twitch Shape Bot**: A Node.js bot that:
   - Connects to Twitch chat via WebSocket (IRC)
   - Monitors the specified channel for commands (!ask and !shape)
   - Forwards user questions/prompts to the Shapes.inc API
   - Posts responses from the Shapes.inc API back to the Twitch chat

2. **Minikube Deployer**: A Next.js application that:
   - Provides a web interface for configuring your Twitch credentials
   - Creates Kubernetes secrets with your provided configuration
   - Deploys and manages the bot on your Minikube cluster
   - Offers basic deployment status and control

## Prerequisites

- **Node.js** (v18+) and **npm** or **Yarn**
- **Docker** for building the container image
- **Minikube** for running a local Kubernetes cluster
- **kubectl** configured to work with your Minikube cluster
- **Twitch Developer App** credentials (OAuth token)

## Project Structure

```
/
├── twitch/                # Bot implementation
│   ├── index.js           # Core bot logic
│   ├── package.json       # Bot dependencies
│   ├── package-lock.json  # Dependency lock file
│   └── Dockerfile         # Container definition
│
└── twitch-deployer/       # Next.js deployment UI
    ├── app/
    │   ├── api/           # API endpoints
    │   │   ├── deploy-twitch/
    │   │   │   └── route.ts  # Deployment handler
    │   │   └── stop-twitch/
    │   │       └── route.ts  # Stop handler
    │   ├── deployment-twitch-bot.yaml  # K8s deployment config
    │   ├── page.tsx       # Main UI component
    │   ├── layout.tsx     # Layout wrapper
    │   ├── globals.css    # Global styles
    │   └── favicon.ico    # Site favicon
    ├── public/            # Static assets
    ├── next.config.ts     # Next.js configuration
    ├── next-env.d.ts      # TypeScript declarations
    ├── tsconfig.json      # TypeScript configuration
    ├── postcss.config.mjs # PostCSS configuration
    ├── package.json       # Deployer dependencies
    ├── package-lock.json  # Dependency lock file
    └── README.md          # Deployer documentation
```

## Setting Up Twitch API Access

Before deploying the bot, you need to set up Twitch API access:

Obtain Twitch OAuth Token

To get your Twitch OAuth token:

1. Visit https://antiscuff.com/oauth/
2. Sign in with your Twitch account
3. Authorize the application
4. Copy the OAuth token (it should start with "oauth:")
   - Note: Remove the prefix OAuth: 


## Setup Instructions

### 1. Installation

```bash
# Install bot dependencies
cd twitch
npm install

# Install deployer dependencies
cd ../twitch-deployer
npm install
```

### 2. Building the Bot Container

```bash
# Start Minikube if not running
minikube start

# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Build the bot image
cd ../twitch
docker build -t twitch-shape-bot:latest .
```

### 3. Running the Deployment UI

Open a new terminal window (to avoid using Minikube's Docker environment):

```bash
cd twitch-deployer
npm run dev
```

### 4. Using the Deployment UI

1. Visit `http://localhost:3000` in your browser
2. Fill in the required information:
   - Twitch OAuth Token (from step 2 in "Setting Up Twitch API Access")
   - Twitch Channel Name (without the # prefix)
   - Shapes.inc API Key
   - Shapes.inc Shape Username
3. Click "Deploy Bot" to start the bot
4. Click "Stop Bot" when you want to terminate it

## Bot Commands

The Twitch bot monitors chat in the specified channel and responds to two commands:

1. **!ask [question]** - Process the question with the Shapes API and reply
2. **!shape [prompt]** - Process the prompt with the Shapes API and reply

Example:
```
!ask What's the weather like on Mars?
```

## Verifying Deployment

After deployment, verify your bot is running properly:

```bash
# Check pod status
kubectl get pods 
# This will show you the botName with format: {botname}-xxxxx-yyyyy

# View bot logs (replace with your actual pod name)
kubectl logs {botname}-xxxxx-yyyyy

# Follow logs in real-time
kubectl logs -f {botname}-xxxxx-yyyyy
```

## Troubleshooting

### Authentication Issues

If you see authentication errors in the logs:
- Ensure your Twitch OAuth token is correct and not expired
- Make sure the Twitch token has the proper scopes (chat:read, chat:edit)
- Verify your Shapes.inc API key is valid
- Check if credentials were properly stored in the Kubernetes Secret:
  ```bash
  kubectl get secret bot-secrets -o yaml
  # Decode with: echo "<BASE64_VALUE>" | base64 --decode

  # Or simply check environment variables in the pod:
  kubectl exec {botname}-xxxxx-yyyyy -- env
  ```

### Connection Issues

If the bot connects but doesn't respond:
- Check if the bot is receiving messages (logs should show incoming chat)
- Ensure the bot has joined the correct channel
- Verify the channel name matches exactly (case-sensitive)

### Pod Status Issues

- **Pending/ContainerCreating**: Check events with `kubectl describe pod <pod-name>`
- **ImagePullBackOff**: Ensure you built the image within Minikube's Docker environment
- **Error/CrashLoopBackOff**: Check logs with `kubectl logs <pod-name>`

## Important Notes

- This solution is designed for **local development only**
- For production deployment, you would need:
  - Multi-node Kubernetes clusters
  - Proper security configurations
  - Centralized logging and monitoring
  - Automated CI/CD pipelines
- To permanently stop the bot without using the UI:
  ```bash
  kubectl delete deployment twitch-shape-bot
  ```
  or scale it to zero:
  ```bash
  kubectl scale deployment twitch-shape-bot --replicas=0
  ```

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/shapesinc/api/blob/main/license) file for details.

## Contribution

Feel free to submit issues or pull requests for further improvements.
