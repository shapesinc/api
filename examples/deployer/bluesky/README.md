# Bluesky Shape Bot Deployer

A Bluesky bot that integrates with the Shapes.inc API, packaged with a Next.js frontend for easy deployment to a local Minikube Kubernetes cluster.

> **⚠️  WARNING:** The included Next.js deployment frontend is designed **ONLY FOR LOCAL DEVELOPMENT** 

Production Ready requires deep integration -> Note this as temporary WIP(Although works well for individual deployment / testing purpose)

## Overview

This project consists of two main components:

1. **Bluesky Shape Bot**: A Node.js bot that:
   - Connects to Bluesky using provided credentials
   - Monitors for mentions and replies
   - Forwards relevant post content to the Shapes.inc API
   - Posts responses from the Shapes.inc API back to Bluesky

2. **Minikube Deployer**: A Next.js application that:
   - Provides a web interface for configuring your bot credentials
   - Creates Kubernetes secrets with your provided configuration
   - Deploys and manages the bot on your Minikube cluster
   - Offers basic deployment status and control

## Prerequisites

- **Node.js** (v18+) and **npm** or **Yarn**
- **Docker** for building the container image
- **Minikube** for running a local Kubernetes cluster
- **kubectl** configured to work with your Minikube cluster

## Project Structure

```
/
├── bluesky/               # Bot implementation
│   ├── bot.js            # Core bot logic
│   ├── package.json      # Bot dependencies
│   ├── package-lock.json
│   └── Dockerfile        # Container definition
│
└── bluesky-bot-deployer/ # Next.js deployment UI
    ├── app/
    │   ├── api/          # API endpoints
    │   │   ├── deploy/
    │   │   │   └── route.ts  # Deployment handler
    │   │   └── stop/
    │   │       └── route.ts  # Stop handler
    │   ├── page.tsx      # Main UI component
    │   └── layout.tsx    # Layout wrapper
    ├── public/
    ├── bot-deployment.yaml # K8s/Minikube deployment manifest
    ├── next.config.js
    └── package.json      # Deployer dependencies
```

## Setup Instructions

### 1. Installation

```bash
# Install bot dependencies
cd bluesky
npm install

# Install deployer dependencies
cd ../bluesky-bot-deployer
npm install
```

### 2. Building the Bot Container
``` bash
To install the latest minikube stable release for download follow this:
https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Fx86-64%2Fstable%2Fbinary+download
Choose the OS, Arch, Release & Installer Type
```
```bash
# Start Minikube if not running
minikube start

# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Build the bot image
cd ../bluesky

eval $(minikube docker-env)
docker build -t bluesky-shape-bot:latest .
```

### 3. Running the Deployment UI

Open a new terminal window (to avoid using Minikube's Docker environment):

```bash
cd bluesky-bot-deployer
npm run dev
```

### 4. Using the Deployment UI

1. Visit `http://localhost:3000` in your browser
2. Fill in the required information:
   - Bluesky Identifier (handle or email)
   - Bluesky App Password
   - Shapes.inc API Key
   - Shapes.inc Shape Username
   - Optional: Polling Interval (in milliseconds)
3. Click "Deploy Bot" to start the bot
4. Click "Stop Bot" when you want to terminate it

## Verifying Deployment

After deployment, verify your bot is running properly:

```bash
# Check pod status
kubectl get pods --> Gives you botName
# View bot logs (replace with your actual pod name)
kubectl logs {botname}-xxxxx-yyyyy

# Follow logs in real-time
kubectl logs -f {botname}-xxxxx-yyyyy
```

## Troubleshooting

### Authentication Issues

If you see "Invalid identifier or password" in the logs:
- Ensure your Bluesky credentials are correct
- Verify you're using an App Password, not your main account password
- Check if credentials were properly stored in the Kubernetes Secret:
  ```bash
  kubectl get secret bot-secrets -o yaml
  # Decode with: echo "<BASE64_VALUE>" | base64 --decode

  or simply
  kubectl exec {botname}  -- env
  ```

### Pod Status Issues

- **Pending/ContainerCreating**: Check events with `kubectl describe pod <pod-name>`
- **ImagePullBackOff**: Ensure you built the image within Minikube's Docker environment
- **Error/CrashLoopBackOff**: Check logs with `kubectl logs <pod-name>`

### Command Issues

- If `kubectl` commands fail, ensure it's installed and properly configured
- Always use `kubectl config use-context minikube` to target your Minikube cluster

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

Feel free to submit issues or pull requests to futher improvements.