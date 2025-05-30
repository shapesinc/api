import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const deploymentManifestPath = path.join(process.cwd(), 'app', 'bot-deployment.yaml'); 

export async function POST() {
  try {
     // Check if the deployment manifest exists
      if (!fs.existsSync(deploymentManifestPath)) {
          console.error(`Deployment manifest not found at: ${deploymentManifestPath}`);
          return NextResponse.json({ error: `Kubernetes deployment manifest not found at ${deploymentManifestPath}. Make sure bot-deployment.yaml exists in the Next.js app root.` }, { status: 500 });
      }

    // --- Step 1: Delete the Deployment ---
    console.log(`Deleting Deployment from ${deploymentManifestPath}...`);
    try {
        const { stdout: deleteStdout, stderr: deleteStderr } = await execAsync(`kubectl delete -f ${deploymentManifestPath}`);
         console.log('Deployment kubectl delete stdout:', deleteStdout);
        if (deleteStderr && !deleteStderr.toLowerCase().includes('not found')) { // Ignore "not found" errors if already deleted
             console.error('Deployment kubectl delete stderr:', deleteStderr);
              if (deleteStderr.toLowerCase().includes('error')) {
                 return NextResponse.json({ error: `Failed to delete Kubernetes Deployment: ${deleteStderr}` }, { status: 500 });
              }
        }
         console.log('Deployment deleted successfully.');
    } catch (error: any) {
         console.error('Error deleting Deployment:', error);
         return NextResponse.json({ error: `Error executing kubectl for Delete: ${error.message}` }, { status: 500 });
    }
// deletion of secrets keys when bot is stop is important we don't want to store data / credentials
// or either keep them 'without' encrypted

    return NextResponse.json({ message: 'Bot deployment stopped successfully.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}