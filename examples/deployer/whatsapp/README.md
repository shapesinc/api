# WhatsApp Bot Deployer

A WhatsApp bot that integrates with the Shapes.inc API, packaged with a Next.js frontend for easy deployment to a local Minikube Kubernetes cluster.

> **⚠️  WARNING:** The included Next.js deployment frontend is designed **ONLY FOR LOCAL DEVELOPMENT** 

Production Ready requires deep integration -> Note this as temporary WIP (Although works well for individual deployment / testing purpose)

## Overview

This project consists of two main components:

1. **WhatsApp Shape Bot**: A Node.js bot that:
   - Connects to your WhatsApp by scanning a QR code and logging in
   - Monitors for messages in WhatsApp
   - Forwards relevant content to the Shapes.inc API
   - Posts responses from the Shapes.inc API back to users on WhatsApp DMs

2. **Minikube Deployer**: A Next.js application that:
   - Provides a web interface for configuring your WhatsApp credentials
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
├── whatsapp/               # Bot implementation
│   ├── index.js            # Core bot logic
│   ├── package.json        # Bot dependencies
│   ├── package-lock.json   # Dependency lock file
│   ├── start.sh            # Startup script
│   ├── README.md           # Bot-specific documentation
│   └── Dockerfile          # Container definition
│
└── whatsapp-deployer/      # Next.js deployment UI
    ├── app/
    │   ├── api/            # API endpoints
    │   │   ├── deploy/
    │   │   │   └── route.ts  # Deployment handler
    │   │   └── stop/
    │   │       └── route.ts  # Stop handler
    │   ├── whatsapp-deployment.yaml  # K8s deployment config
    │   ├── whatsapp-pvc.yaml         # K8s persistent volume claim
    │   ├── page.tsx        # Main UI component
    │   ├── layout.tsx      # Layout wrapper
    │   ├── globals.css     # Global styles
    │   └── favicon.ico     # Site favicon
    ├── public/             # Static assets
    ├── next.config.ts      # Next.js configuration
    ├── next-env.d.ts       # TypeScript declarations
    ├── tsconfig.json       # TypeScript configuration
    ├── postcss.config.mjs  # PostCSS configuration
    ├── package.json        # Deployer dependencies
    ├── package-lock.json   # Dependency lock file
    └── README.md           # Deployer documentation
```

## Setup Instructions

### 1. Installation

```bash
# Install bot dependencies
cd whatsapp
npm install

# Install deployer dependencies
cd ../whatsapp-deployer
npm install
```

### 2. Building the Bot Container

```bash
# To install the latest minikube stable release, follow this:
# https://minikube.sigs.k8s.io/docs/start/
# Choose the OS, Arch, Release & Installer Type

# Start Minikube if not running
minikube start

# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Build the bot image
cd ../whatsapp
docker build -t whatsapp-shape-bot:latest .
```

### 3. Running the Deployment UI

Open a new terminal window (to avoid using Minikube's Docker environment):

```bash
cd whatsapp-deployer
npm run dev
```

### 4. Using the Deployment UI

1. Visit `http://localhost:3000` in your browser
2. Fill in the required information:
   - WhatsApp Session Credentials
   - Shapes.inc API Key
   - Shapes.inc Shape Username
   - Optional: Polling Interval (in milliseconds)
3. Click "Deploy Bot" to start the bot
4. Click "Stop Bot" when you want to terminate it

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
- Ensure your WhatsApp credentials are correct
- Verify your Shapes.inc API key is valid
- Check if credentials were properly stored in the Kubernetes Secret:
  ```bash
  kubectl get secret bot-secrets -o yaml
  # Decode with: echo "<BASE64_VALUE>" | base64 --decode

  # Or simply check environment variables in the pod:
  kubectl exec {botname}-xxxxx-yyyyy -- env
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

Feel free to submit issues or pull requests for further improvements.