
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    console.log('Attempting to stop deployment whatsapp-shape-bot...');
    // Delete the deployment. This will also terminate the pod(s) managed by it.
    // We don't delete the Secret or PVC here, allowing credentials and session data to persist.
// Use --wait=false to prevent the API route from hanging if termination takes time
    const { stdout, stderr } = await execAsync('kubectl delete deployment whatsapp-shape-bot --ignore-not-found --wait=false');

    // Log stderr even for "not found" which goes to stderr
if (stderr) {
    console.warn('kubectl delete stderr:', stderr);
}

    console.log('kubectl delete stdout:', stdout);

    // Check if the deployment was actually deleted or not found based on stdout
    const message = stdout.includes('deleted') ?
                      'Deployment whatsapp-shape-bot deletion initiated.' :
                      'Deployment whatsapp-shape-bot not found or already stopped.';

// Frontend's Socket.IO connection will likely disconnect or report 'disconnected' state shortly after pod terminates

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('API Error during stop:', error);
    return NextResponse.json({ error: `Server error during stop: ${error.message}` }, { status: 500 });
  }
}