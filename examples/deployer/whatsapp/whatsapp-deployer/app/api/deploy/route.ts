import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const deploymentManifestPath = path.join(process.cwd(), 'app', 'whatsapp-deployment.yaml');
const pvcManifestPath = path.join(process.cwd(), 'app', 'whatsapp-pvc.yaml');

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();
    const { shapesApiKey, shapesUsername } = credentials;

    if (!shapesApiKey || !shapesUsername) {
      return NextResponse.json({ error: 'Missing required Shapes.inc credentials' }, { status: 400 });
    }

    // Check for manifest existence
    if (!fs.existsSync(deploymentManifestPath)) {
      return NextResponse.json({
        error: `Kubernetes deployment manifest not found at ${deploymentManifestPath}.`,
      }, { status: 500 });
    }

    if (!fs.existsSync(pvcManifestPath)) {
      return NextResponse.json({
        error: `Kubernetes PVC manifest not found at ${pvcManifestPath}.`,
      }, { status: 500 });
    }

    // Base64 encode secrets
    const encodedShapesApiKey = Buffer.from(shapesApiKey).toString('base64');
    const encodedShapesUsername = Buffer.from(shapesUsername).toString('base64');
    // If you were previously encoding NGROK_AUTHTOKEN here, remove that as well.

    const secretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: whatsapp-secrets
type: Opaque
data:
  SHAPESINC_API_KEY: ${encodedShapesApiKey}
  SHAPESINC_SHAPE_USERNAME: ${encodedShapesUsername}
# Removed: NGROK_AUTHTOKEN entry if it was here
`;

    // Apply Secret
    try {
      const { stdout: secretOut } = await execAsync(`echo "${secretYaml.trim()}" | kubectl apply -f -`);
      console.log('Secret applied:', secretOut);
    } catch (error: any) {
      console.error('Error applying Secret:', error);
      return NextResponse.json({ error: `Failed to apply Secret: ${error.message}` }, { status: 500 });
    }

    // Apply PVC
    try {
      const { stdout: pvcOut } = await execAsync(`kubectl apply -f ${pvcManifestPath}`);
      console.log('PVC applied:', pvcOut);
    } catch (error: any) {
      console.error('Error applying PVC:', error);
      return NextResponse.json({ error: `Failed to apply PVC: ${error.message}` }, { status: 500 });
    }

    // Apply Deployment
    try {
      const { stdout: deployOut } = await execAsync(`kubectl apply -f ${deploymentManifestPath}`);
      console.log('Deployment applied:', deployOut);
    } catch (error: any) {
      console.error('Error applying Deployment:', error);
      return NextResponse.json({ error: `Failed to apply Deployment: ${error.message}` }, { status: 500 });
    }

    // --- DELAY AFTER DEPLOYMENT APPLY ---
    console.log('Waiting 10 seconds after deployment apply before fetching pod info...');
    await new Promise(resolve => setTimeout(resolve, 40000)); // 10 seconds delay
    // --- END DELAY ---



    let podName = '';
    try {
      // Added a timeout for getting the pod name, as it might take a moment to appear
      // Use a selector to find the pod associated with the deployment
      const { stdout: podOut } = await execAsync(`kubectl get pods -l app=whatsapp-shape-bot -o jsonpath="{.items[0].metadata.name}" --request-timeout=15s`);
      podName = podOut.replace(/"/g, '').trim();
      if (!podName) throw new Error('Pod not found within timeout after deployment');
      console.log('Pod name:', podName);
    } catch (error: any) {
      console.error('Error getting pod name after deployment:', error);
       // Return a success status for deployment, but indicate failure to get pod name
      return NextResponse.json({
          message: 'WhatsApp bot deployment succeeded, but failed to get pod name immediately.',
          error: `Failed to get pod name: ${error.message}`,
          podName: 'N/A - check kubectl',
          logs: `Initial logs could not be fetched without a pod name. Check 'kubectl get pods'.` // Updated log message
      }, { status: 200 }); // Return 200 because kubectl apply succeeded
    }

    // --- MODIFIED LOGIC FOR LOG FETCH ---

    console.log(`Attempting to fetch logs for pod: ${podName}`);
    // No additional delay needed here, the main 10s delay is before getting pod name

    // Get logs from the specific pod name
    let logs = ''; // Revert to using 'logs' variable to store the content
    try {
      // Fetching a reasonable number of lines for initial debugging
      // Using the obtained podName variable directly
      const { stdout: logsOut } = await execAsync(`kubectl logs ${podName} --tail=200 --timestamps --ignore-errors`);
      // --- STORE THE RAW LOG DATA IN 'logs' VARIABLE ---
      logs = logsOut; // Store the actual log content
      console.log(`Successfully fetched initial logs for pod ${podName} (content stored in response).`);
      // --- REMOVED: console.log(logsOut); ---
    } catch (error: any) {
      console.warn(`Warning: Failed to fetch initial pod logs for ${podName}:`, error.message);
      logs = `Warning: Could not fetch initial pod logs for pod ${podName}. Check 'kubectl logs ${podName}'. Error: ${error.message}`;
       // Do NOT return an error here, just include the warning in logs
    }

    // --- END MODIFIED LOGIC ---

    // Removed: URL extraction logic is no longer needed.

    return NextResponse.json({
      message: 'WhatsApp bot deployment process initiated successfully.',
      podName,
      logs: logs, // Return the actual logs content (or warning message)
      // Removed: url field is no longer returned
    });

  } catch (error: any) {
    console.error('Unhandled error during deployment API route:', error);
    // Ensure error response includes enough info
    const errorDetails = {
        error: `Unexpected server error during deployment process: ${error.message}`,
        details: error // Include full error object for server-side logging, be cautious returning it to client in production
    };
     console.error('Full error object:', error); // Log full error on the server
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
