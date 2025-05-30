import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Define the path to your Kubernetes deployment manifest
const deploymentManifestPath = path.join(process.cwd(), 'app', 'bot-deployment.yaml');
const botCodePath = path.join(process.cwd(), '..', 'bot.js'); // Adjust if your bot code is elsewhere

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();

    const {
      blueskyIdentifier,
      blueskyPassword,
      shapesApiKey,
      shapesUsername,
    } = credentials;

    if (!blueskyIdentifier || !blueskyPassword || !shapesApiKey || !shapesUsername) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    // --- Step 1: Build the Docker Image ---
    // Need to ensure we are using the minikube docker daemon
    // The easiest way is to run `eval $(minikube docker-env)` in the terminal
    // where you start the Next.js app.
    // Building the image programmatically here adds complexity (need minikube binary, etc.)
    // For this guide, we assume the image `bluesky-shape-bot:latest` is already built
    // *within* the minikube docker environment using `eval $(minikube docker-env) && docker build -t bluesky-shape-bot:latest .`
    // from the bot's directory *before* running the Next.js app.

    // Check if the bot code file exists
     if (!fs.existsSync(botCodePath)) {
         console.error(`Bot code not found at: ${botCodePath}`);
         return NextResponse.json({ error: `Bot code file not found at ${botCodePath}. Make sure it exists.` }, { status: 500 });
     }

     // Check if the deployment manifest exists
      if (!fs.existsSync(deploymentManifestPath)) {
          console.error(`Deployment manifest not found at: ${deploymentManifestPath}`);
          return NextResponse.json({ error: `Kubernetes deployment manifest not found at ${deploymentManifestPath}. Make sure bot-deployment.yaml exists in the Next.js app root.` }, { status: 500 });
      }


    // --- Step 2: Generate and Apply Kubernetes Secret ---
    // Base64 encode the credentials
    const encodedIdentifier = Buffer.from(blueskyIdentifier).toString('base64');
    const encodedPassword = Buffer.from(blueskyPassword).toString('base64');
    const encodedShapesApiKey = Buffer.from(shapesApiKey).toString('base64');
    const encodedShapesUsername = Buffer.from(shapesUsername).toString('base64');

    const secretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: bot-secrets
type: Opaque
data:
  BLUESKY_IDENTIFIER: ${encodedIdentifier}
  BLUESKY_PASSWORD: ${encodedPassword}
  SHAPESINC_API_KEY: ${encodedShapesApiKey}
  SHAPESINC_SHAPE_USERNAME: ${encodedShapesUsername}
`;

    console.log('Applying Secret YAML...');
    // Use kubectl apply -f - to apply the generated YAML from stdin
    try {
        const { stdout: secretStdout, stderr: secretStderr } = await execAsync(`echo "${secretYaml.trim()}" | kubectl apply -f -`);
        console.log('Secret kubectl apply stdout:', secretStdout);
        if (secretStderr) {
             console.error('Secret kubectl apply stderr:', secretStderr);
             // Decide if stderr should be treated as an error
             if (secretStderr.toLowerCase().includes('error')) {
                 return NextResponse.json({ error: `Failed to apply Kubernetes Secret: ${secretStderr}` }, { status: 500 });
             }
         }
        console.log('Secret applied successfully.');
    } catch (error: any) {
         console.error('Error applying Secret:', error);
         return NextResponse.json({ error: `Error executing kubectl for Secret: ${error.message}` }, { status: 500 });
    }


    // --- Step 3: Apply Kubernetes Deployment ---
    console.log(`Applying Deployment from ${deploymentManifestPath}...`);
    try {
        const { stdout: deployStdout, stderr: deployStderr } = await execAsync(`kubectl apply -f ${deploymentManifestPath}`);
         console.log('Deployment kubectl apply stdout:', deployStdout);
        if (deployStderr) {
             console.error('Deployment kubectl apply stderr:', deployStderr);
              // Decide if stderr should be treated as an error
             if (deployStderr.toLowerCase().includes('error')) {
                 return NextResponse.json({ error: `Failed to apply Kubernetes Deployment: ${deployStderr}` }, { status: 500 });
             }
        }
         console.log('Deployment applied successfully.');
    } catch (error: any) {
         console.error('Error applying Deployment:', error);
         return NextResponse.json({ error: `Error executing kubectl for Deployment: ${error.message}` }, { status: 500 });
    }


    // --- Step 4: (Optional) Update Polling Interval in Deployment directly if needed ---
    // The current deployment YAML uses a hardcoded value. If you want the user input
    // to affect it, you'd need to patch the deployment. This is more complex.
    // For simplicity, we'll omit this step and let the polling interval be fixed
    // or managed manually in the deployment manifest.

    return NextResponse.json({ message: 'Bot deployment updated successfully.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}