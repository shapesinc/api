import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Define the deployment name for the Twitch bot
const deploymentName = 'twitch-shape-bot';

export async function POST() {
  try {
    console.log(`Attempting to delete deployment ${deploymentName}...`);
    // Use kubectl delete deployment
    const { stdout: deleteStdout, stderr: deleteStderr } = await execAsync(`kubectl delete deployment/${deploymentName}`);

    console.log('kubectl delete stdout:', deleteStdout);
    if (deleteStderr) {
        console.error('kubectl delete stderr:', deleteStderr);
        // If it's a "not found" error, we can treat it as a success (already stopped)
        if (deleteStderr.toLowerCase().includes('not found')) {
            return NextResponse.json({ message: `Deployment ${deploymentName} not found, nothing to stop.` });
        }
         if (deleteStderr.toLowerCase().includes('error')) {
            // Return error if kubectl reported an error other than not found
            return NextResponse.json({ error: `Failed to delete deployment: ${deleteStderr}` }, { status: 500 });
        }
    }
    console.log('Deployment deleted successfully.');

    // Optional: Delete the secret as well
    // console.log(`Attempting to delete secret ${secretName}...`);
    // try {
    //     const { stdout: secretStdout, stderr: secretStderr } = await execAsync(`kubectl delete secret/${secretName}`);
    //     console.log('Secret delete stdout:', secretStdout);
    //      if (secretStderr && !secretStderr.toLowerCase().includes('not found')) {
    //          console.error('Secret delete stderr:', secretStderr);
    //      } else if (secretStderr && secretStderr.toLowerCase().includes('not found')) {
    //           console.log(`Secret ${secretName} not found, nothing to delete.`);
    //      }
    //      console.log('Secret delete command executed.');
    // } catch (error: any) {
    //      console.error('Error deleting secret:', error);
    //      // Decide if secret deletion error should prevent successful stop message
    // }


    return NextResponse.json({ message: 'Twitch bot deployment stopped successfully.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}

