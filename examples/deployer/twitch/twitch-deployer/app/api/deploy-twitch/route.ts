import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Define the path to your Kubernetes deployment manifest for the Twitch bot
const deploymentManifestPath = path.join(process.cwd(), 'app' ,'deployment-twitch-bot.yaml'); // Updated path

export async function POST(req: NextRequest) {
  try {
    const {
      shapesUsername,
      shapesApiKey,
      twitchOauth,
      twitchChannel,
    } = await req.json();

    // Basic validation for required fields
    if (!shapesUsername || !shapesApiKey || !twitchOauth || !twitchChannel) {
      return NextResponse.json({ error: 'Missing required configuration values' }, { status: 400 });
    }

    // Check if the deployment manifest exists
    if (!fs.existsSync(deploymentManifestPath)) {
        console.error(`Deployment manifest not found at: ${deploymentManifestPath}`);
        return NextResponse.json({ error: `Kubernetes deployment manifest not found at ${deploymentManifestPath}. Make sure deployment-twitch-bot.yaml exists in the Next.js app root.` }, { status: 500 });
    }

    // --- Step 1: Generate and Apply Kubernetes Secret ---
    // Base64 encode the credentials
    const encodedShapesApiKey = Buffer.from(shapesApiKey).toString('base64');
    const encodedShapesUsername = Buffer.from(shapesUsername).toString('base64');
    const encodedTwitchOauth = Buffer.from(twitchOauth).toString('base64');
    const encodedTwitchChannel = Buffer.from(twitchChannel).toString('base64');

    const secretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: twitch-bot-secrets # Updated Secret name
type: Opaque
data:
  SHAPESINC_API_KEY: ${encodedShapesApiKey}
  SHAPESINC_SHAPE_USERNAME: ${encodedShapesUsername}
  TWITCH_OAUTH: ${encodedTwitchOauth}
  TWITCH_CHANNEL: ${encodedTwitchChannel}
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
                 // Return error if kubectl reported an error
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
    const deploymentName = 'twitch-shape-bot'; // Define deployment name here

    try {
        // Using kubectl apply will create or update the deployment.
        const { stdout: deployStdout, stderr: deployStderr } = await execAsync(`kubectl apply -f ${deploymentManifestPath}`);
        console.log('Deployment kubectl apply stdout:', deployStdout);
        if (deployStderr) {
             console.error('Deployment kubectl apply stderr:', deployStderr);
             if (deployStderr.toLowerCase().includes('error')) {
                 return NextResponse.json({ error: `Failed to apply Kubernetes Deployment: ${deployStderr}` }, { status: 500 });
             }
        }
        console.log('Deployment applied successfully.');

        // Trigger a rollout restart to pick up the new secret data
        console.log(`Triggering rollout restart for deployment ${deploymentName}...`);
         const { stdout: rolloutStdout, stderr: rolloutStderr } = await execAsync(`kubectl rollout restart deployment/${deploymentName}`);
         console.log('Rollout restart stdout:', rolloutStdout);
         if (rolloutStderr) {
             console.error('Rollout restart stderr:', rolloutStderr);
             if (rolloutStderr.toLowerCase().includes('error')) {
                  console.warn(`Rollout restart failed for ${deploymentName}. It might be starting up.`);
             }
         }
         console.log('Rollout restart command executed.');


    } catch (error: any) {
         console.error('Error applying Deployment or triggering rollout:', error);
         if (error.message && error.message.includes('waiting for deployment')) {
              return NextResponse.json({ message: 'Deployment applied, rollout restart might take a moment as the deployment starts.' });
         }
         return NextResponse.json({ error: `Error executing kubectl for Deployment: ${error.message}` }, { status: 500 });
    }


    return NextResponse.json({ message: 'Twitch bot deployment initiated and rollout triggered successfully.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}

