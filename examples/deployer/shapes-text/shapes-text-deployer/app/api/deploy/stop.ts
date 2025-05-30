import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);


const deploymentManifestPath = path.join(process.cwd(), 'app', 'deployment.yaml');

const secretName = 'bot-secrets';


export async function POST() {
  try {
     // Check if the deployment manifest exists (optional but good practice)
      if (!fs.existsSync(deploymentManifestPath)) {
          console.warn(`Deployment manifest not found at: ${deploymentManifestPath}. Proceeding with deletion attempt.`);
          // It's possible the file was moved/deleted, but the deployment might still exist in K8s.
          // We'll proceed with kubectl delete by name if the file isn't found.
      }

    // --- Step 1: Delete the Deployment ---
    console.log(`Attempting to delete Deployment...`);
    try {
        // Prefer deleting by file if it exists, otherwise delete by name
        const deleteCommand = fs.existsSync(deploymentManifestPath)
            ? `kubectl delete -f ${deploymentManifestPath}`
            : `kubectl delete deployment reddit-shape-bot`; // Use the deployment name from your YAML

        const { stdout: deleteStdout, stderr: deleteStderr } = await execAsync(deleteCommand);
         console.log('Deployment kubectl delete stdout:', deleteStdout);
        // Ignore "not found" errors if the deployment was already deleted
        if (deleteStderr && !deleteStderr.toLowerCase().includes('not found')) {
             console.error('Deployment kubectl delete stderr:', deleteStderr);
              if (deleteStderr.toLowerCase().includes('error')) {
                 // Decide if this error is fatal or if we should continue to delete the secret
                 // For now, we'll return an error.
                 return NextResponse.json({ error: `Failed to delete Kubernetes Deployment: ${deleteStderr}` }, { status: 500 });
              }
        }
         console.log('Deployment deletion command executed.');
    } catch (error: any) {
         console.error('Error deleting Deployment:', error);
         // Catch errors like 'command not found' or issues with kubectl
         return NextResponse.json({ error: `Error executing kubectl for Delete Deployment: ${error.message}` }, { status: 500 });
    }

    // --- Step 2: Delete the Secret ---
    console.log(`Attempting to delete Secret '${secretName}'...`);
    try {
        const { stdout: secretStdout, stderr: secretStderr } = await execAsync(`kubectl delete secret ${secretName}`);
         console.log('Secret kubectl delete stdout:', secretStdout);
        // Ignore "not found" errors if the secret was already deleted
        if (secretStderr && !secretStderr.toLowerCase().includes('not found')) {
             console.error('Secret kubectl delete stderr:', secretStderr);
              if (secretStderr.toLowerCase().includes('error')) {
                 // Decide if this error is fatal or if we should ignore it if deployment deletion was successful
                 // For now, we'll return an error if secret deletion fails.
                 return NextResponse.json({ error: `Failed to delete Kubernetes Secret: ${secretStderr}` }, { status: 500 });
              }
        }
         console.log('Secret deletion command executed.');
    } catch (error: any) {
         console.error('Error deleting Secret:', error);
         // Catch errors like 'command not found' or issues with kubectl
         return NextResponse.json({ error: `Error executing kubectl for Delete Secret: ${error.message}` }, { status: 500 });
    }


    return NextResponse.json({ message: 'Bot deployment and secret deleted successfully.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
