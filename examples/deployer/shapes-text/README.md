# Shapes Text Bot Deployer

A web interface for deploying a Shapes Text bot to a local Minikube Kubernetes cluster. This tool streamlines the deployment process by handling Kubernetes secrets and configurations through an intuitive UI.

## Overview

This project provides a Next.js web interface to deploy a Node.js bot application that integrates with:
- Shapes API for AI capabilities.
- Twilio for SMS messaging.

The deployer automatically:
- Creates Kubernetes Secrets with your credentials
- Deploys the bot application to Minikube
- Manages the complete lifecycle of the deployment

## Prerequisites

Before starting, ensure you have the following installed:

- [Node.js and npm](https://nodejs.org/) (v16 or newer recommended)
- [Docker](https://www.docker.com/get-started)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [Ngrok](https://ngrok.com/) (for webhook exposing)

You'll also need:
- **Shapes API Key**: Obtain from [Shapes.inc](https://shapes.inc)
- **Twilio Account**: For SMS functionality (Account SID, Auth Token, Phone Number)
- **Sendblue Account**: For iMessage and group management (optional - only required for iMessage integration)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shapesinc/shapes-api/examples
   cd shapes-text
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with any deployer-specific configurations.

## Setup Instructions

### Step 1: Prepare Kubernetes Environment

1. **Start Minikube**
   ```bash
   minikube start
   ```

2. **Configure Docker to use Minikube's daemon**
   ```bash
   eval $(minikube docker-env)
   ```
   ⚠️ **Important**: Run this command in every new terminal session used for building or deploying.

### Step 2: Build the Bot Image

1. **Build the Docker image**
   ```bash
   # From the project root containing the Dockerfile
   docker build -t shapestext:latest .
   ```

   For a clean build:
   ```bash
   docker build --no-cache -t shapestext:latest .
   ```

### Step 3: Launch the Deployer Interface

1. **Start the Next.js development server**
   ```bash
   # Navigate to shapes-text-deployer directory first
   cd shapes-text-deployer
   npm run dev
   ```

2. **Access the web interface**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Using the Deployer

### Deployment Process

1. **Complete the credential form** with:
   - Shapes API Key
   - Twilio credentials (Account SID, Auth Token, Phone Number)
   - Sendblue credentials (if using iMessage integration)
   - Default Shape User settings (customizable bot parameters)

2. **Click "Deploy"**
   
   The system will:
   - Create and apply a Kubernetes Secret containing your credentials
   - Deploy the bot using the deployment.yaml manifest
   - Provide a public URL for accessing your bot

### Managing Your Deployment

1. **Stopping the Bot**
   Click "Stop Deployment" to:
   - Remove the Kubernetes deployment and service
   - Delete the secret containing your credentials

2. **Redeploying**
   You can redeploy with new settings at any time by updating the form and clicking "Deploy" again.

## Configuring Webhook Integration

After deployment, you'll need to expose your bot and configure webhooks:

1. **Get service information**
   ```bash
   kubectl get service shapestext-service
   ```

2. **Obtain Minikube IP**
   ```bash
   minikube ip
   ```

3. **Start Ngrok to expose your service**
   ```bash
   # Replace <nodeport> with the port from step 1
   ngrok http <minikube-ip>:<nodeport>
   ```

4. **Update webhook URLs**
   - In your Twilio dashboard, set your SMS webhook to the Ngrok URL
   - For Sendblue, configure the webhook in your account settings

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| `Error: spawn /bin/sh ENOENT` | Ensure kubectl and minikube are in PATH and bash is available |
| `Kubernetes deployment manifest not found` | Verify deployment.yaml exists in the app/api/deploy directory |
| `Dependency check failed` | Run `minikube status` and `which kubectl` to diagnose |
| `Failed to apply Kubernetes Secret/Deployment` | Check console logs for detailed kubectl error messages |
| `Received HTML error from kubectl` | Check network connectivity to Minikube API server |
| Bot not accessible via URL | Verify pod status with `kubectl get pods` and check logs with `kubectl logs <pod-name>` |
| Webhook not receiving events | Verify Ngrok is running and Twilio/Sendblue webhooks are correctly configured |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── deploy/
│   │   │   ├── route.ts        # API route for deployment
│   │   │   └── deployment.yaml # Kubernetes manifest
│   │   └── stop/
│   │       └── route.ts        # API route for stopping
│   └── page.tsx                # Frontend deployment form
├── bot/                        # Node.js bot application
│   ├── app.js                  # Main application entry point
│   ├── state.js                # User state management
│   ├── messaging.js            # Message handling logic
│   ├── shapesApiClient.js      # Shapes API integration
│   ├── utils.js                # Helper functions
│   ├── logger.js               # Logging functionality
│   ├── package.json            # Bot dependencies
│   └── Dockerfile              # Container definition
├── .env                        # Environment variables
└── package.json                # Next.js deployer dependencies
```

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/shapesinc/api/blob/main/license) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For questions or support, please [open an issue](https://github.com/shapesinc/shapes-api/issues) or contact us at hi@shapes.inc.