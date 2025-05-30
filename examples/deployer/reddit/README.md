# Reddit Bot Deployer

A Reddit bot that integrates with the Shapes.inc API, packaged with a Next.js frontend for easy deployment to a local Minikube Kubernetes cluster.

> **⚠️  WARNING:** The included Next.js deployment frontend is designed **ONLY FOR LOCAL DEVELOPMENT** 

Production Ready requires deep integration -> Note this as temporary WIP (Although works well for individual deployment / testing purpose)

## Overview

This project consists of two main components:

1. **Reddit Shape Bot**: A Node.js bot that:
   - Connects to Reddit using OAuth credentials
   - Monitors a specified subreddit for comments containing specific commands
   - Forwards relevant comment content to the Shapes.inc API
   - Posts responses from the Shapes.inc API back to Reddit as comment replies

2. **Minikube Deployer**: A Next.js application that:
   - Provides a web interface for configuring your Reddit credentials
   - Creates Kubernetes secrets with your provided configuration
   - Deploys and manages the bot on your Minikube cluster
   - Offers basic deployment status and control

## Prerequisites

- **Node.js** (v18+) and **npm** or **Yarn**
- **Docker** for building the container image
- **Minikube** for running a local Kubernetes cluster
- **kubectl** configured to work with your Minikube cluster
- **Reddit Developer App** credentials (Client ID and Secret)

## Project Structure

```
/
├── reddit/                # Bot implementation
│   ├── index.js           # Core bot logic
│   ├── package.json       # Bot dependencies
│   ├── package-lock.json  # Dependency lock file
│   ├── Dockerfile         # Container definition
│   └── README.md          # Bot-specific documentation
│
└── reddit-deployer/       # Next.js deployment UI
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

## Setting Up Reddit API Access

Before deploying the bot, you need to create a Reddit application to get API credentials:

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..." at the bottom
3. Fill in the following details:
   - Name: ShapesRedditBot (or your preferred name)
   - Select "script" application type
   - Description: Bot connecting Reddit with Shapes.inc API
   - About URL: Your URL or leave blank for development
   - Redirect URI: http://localhost:8080 (for development)
4. Click "create app"
5. Note the Client ID (the string under your app name) and Client Secret

## Setup Instructions

### 1. Installation

```bash
# Install bot dependencies
cd reddit
npm install

# Install deployer dependencies
cd ../reddit-deployer
npm install
```

### 2. Building the Bot Container

```bash
# Start Minikube if not running
minikube start

# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Build the bot image
cd ../reddit
docker build -t reddit-shape-bot:latest .
```

### 3. Running the Deployment UI

Open a new terminal window (to avoid using Minikube's Docker environment):

```bash
cd reddit-deployer
npm run dev
```

### 4. Using the Deployment UI

1. Visit `http://localhost:3000` in your browser
2. Fill in the required information:
   - Reddit Client ID
   - Reddit Client Secret
   - Reddit Username
   - Reddit Password
   - Subreddit to monitor (without the r/ prefix)
   - Shapes.inc API Key
   - Shapes.inc Shape Username
   - Optional: Polling Interval (in milliseconds)
3. Click "Deploy Bot" to start the bot
4. Click "Stop Bot" when you want to terminate it

## Bot Commands

The Reddit bot monitors comments in the specified subreddit and responds to two commands:

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
- Ensure your Reddit credentials are correct
- Verify your Shapes.inc API key is valid
- Check if credentials were properly stored in the Kubernetes Secret:
  ```bash
  kubectl get secret bot-secrets -o yaml
  # Decode with: echo "<BASE64_VALUE>" | base64 --decode

  # Or simply check environment variables in the pod:
  kubectl exec {botname}-xxxxx-yyyyy -- env
  ```

### Reddit Rate Limiting

If you see rate limit errors:
- Increase the polling interval to reduce API calls
- Ensure your Reddit account has sufficient karma and age
- Consider using a different Reddit account with higher limits

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
  kubectl delete deployment {botname}
  ```
  or scale it to zero:
  ```bash
  kubectl scale deployment {botname} --replicas=0
  ```

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/shapesinc/api/blob/main/license) file for details.

## Contribution

Feel free to submit issues or pull requests for further improvements.