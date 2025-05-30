import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Define the path to your Kubernetes deployment manifest
// Assuming the deployment file is named reddit-bot-deployment.yaml and is in the app directory
const deploymentManifestPath = path.join(process.cwd(), 'app', 'reddit-bot-deployment.yaml');
// Assuming your bot code is in the project root directory relative to the Next.js app
const botCodePath = path.join(process.cwd(), '..', 'index.js'); // Adjust path as needed

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();

    const {
      redditClientId,
      redditClientSecret,
      redditUsername,
      redditPassword,
      redditSubreddit,
      shapesApiKey,
      shapesUsername,
      pollingIntervalMs,
    } = credentials;

    // Validate required Reddit and Shapes.inc credentials
    if (!redditClientId || !redditClientSecret || !redditUsername || !redditPassword || !redditSubreddit || !shapesApiKey || !shapesUsername) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    // --- Pre-checks ---
    // Check if the bot code file exists (useful if you need to build the image here)
    // Although the current logic assumes the image is pre-built, this check is good practice.
     if (!fs.existsSync(botCodePath)) {
         console.error(`Bot code not found at: ${botCodePath}`);
         // Decide if this is a fatal error or just a warning based on your build process
         // For this example, it's a warning as we assume the image is pre-built.
         // return NextResponse.json({ error: `Bot code file not found at ${botCodePath}. Make sure it exists.` }, { status: 500 });
     }

     // Check if the deployment manifest exists
      if (!fs.existsSync(deploymentManifestPath)) {
          console.error(`Deployment manifest not found at: ${deploymentManifestPath}`);
          return NextResponse.json({ error: `Kubernetes deployment manifest not found at ${deploymentManifestPath}. Make sure reddit-bot-deployment.yaml exists in the Next.js app root or adjust the deploymentManifestPath.` }, { status: 500 });
      }

    // --- Step 1: Generate and Apply Kubernetes Secret ---
    // Base64 encode the credentials and configuration
    const encodedRedditClientId = Buffer.from(redditClientId).toString('base64');
    const encodedRedditClientSecret = Buffer.from(redditClientSecret).toString('base64');
    const encodedRedditUsername = Buffer.from(redditUsername).toString('base64');
    const encodedRedditPassword = Buffer.from(redditPassword).toString('base64');
    const encodedRedditSubreddit = Buffer.from(redditSubreddit).toString('base64');
    const encodedShapesApiKey = Buffer.from(shapesApiKey).toString('base64');
    const encodedShapesUsername = Buffer.from(shapesUsername).toString('base64');
    const encodedPollingIntervalMs = Buffer.from(pollingIntervalMs.toString()).toString('base64');


    const secretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: bot-secrets
type: Opaque
data:
  REDDIT_CLIENT_ID: ${encodedRedditClientId}
  REDDIT_CLIENT_SECRET: ${encodedRedditClientSecret}
  REDDIT_USERNAME: ${encodedRedditUsername}
  REDDIT_PASSWORD: ${encodedRedditPassword}
  REDDIT_SUBREDDIT: ${encodedRedditSubreddit}
  SHAPESINC_API_KEY: ${encodedShapesApiKey}
  SHAPESINC_SHAPE_USERNAME: ${encodedShapesUsername}
  POLLING_INTERVAL_MS: ${encodedPollingIntervalMs}
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


    // --- Step 2: Apply Kubernetes Deployment ---
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

    return NextResponse.json({ message: 'Bot deployment updated successfully.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
