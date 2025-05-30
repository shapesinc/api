// app/api/deploy/route.ts

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs'; // Still needed for fs.existsSync for deployment.yaml check
import yaml from 'js-yaml'; // Make sure you have installed js-yaml

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    console.log("Received deployment request.");
    const body = await req.json();

    // Define keys expected from the frontend form
    const frontendKeys = [
      'SHAPES_API_KEY',
      'DEFAULT_SHAPE_USER',
      'TEST_USER_ID',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
      'USER_PHONE_NUMBER',
    ];

    // Define static/hardcoded values for other required variables
    const staticSecrets = {
      SHAPES_API_URL: 'https://api.shapes.inc/v1', // Hardcoded as requested
      OPERATOR_SHAPE_USERNAME: 'tenshi', // Hardcoded as requested
      LOG_LEVEL: 'INFO', // Example static value, adjust if needed
      REDIS_AVAILABLE: 'false', // Example static value, adjust if using Redis
      // Add other static Redis fields here if REDIS_AVAILABLE is true and not using URL
      // REDIS_HOST: 'redis-service',
      // REDIS_PORT: '6379',
      // ...
       // Add Sendblue keys here if they are required by Node.js app but not from frontend
       // SENDBLUE_API_KEY_ID: 'your_sendblue_api_key_id',
       // SENDBLUE_API_SECRET_KEY: 'your_sendblue_api_secret_key',
       // SENDBLUE_PHONE_NUMBER: 'your_sendblue_imessage_number',
    };

    // Prepare data for the secret
    const secretData: { [key: string]: string } = {};
    const encode = (v: string) => Buffer.from(v).toString('base64');

    // Include values from the frontend body
    frontendKeys.forEach(key => {
      // Only include keys that were actually sent in the body and are not null/undefined
      if (body[key] !== undefined && body[key] !== null) {
        secretData[key] = encode(String(body[key])); // Ensure value is string before encoding
      } else {
          console.warn(`Frontend did not provide expected key: ${key}. Skipping.`);
      }
    });

    // Include static/hardcoded values
    Object.entries(staticSecrets).forEach(([key, value]) => {
        secretData[key] = encode(String(value)); // Encode static values
    });

     // --- Check for kubectl and minikube availability ---
    try {
        await execAsync('which kubectl', { shell: '/bin/bash' });
        console.log("kubectl found in PATH.");
         await execAsync('which minikube', { shell: '/bin/bash' });
        console.log("minikube found in PATH.");
        // Also check if minikube is running
        const { stdout: minikubeStatus } = await execAsync('minikube status --format {{.Host}}', { shell: '/bin/bash' });
        if (minikubeStatus.trim().toLowerCase() !== 'running') {
             throw new Error(`Minikube host is not running. Status: ${minikubeStatus.trim()}`);
        }
        console.log("Minikube host is running.");

    } catch (checkErr: any) {
        const errorMessage = checkErr.stderr || checkErr.message;
        console.error(`Dependency check failed: ${errorMessage}`);
        return NextResponse.json({ error: `Dependency check failed: Ensure kubectl and minikube are installed and minikube is running. Details: ${errorMessage}` }, { status: 500 });
    }
    // --- End Dependency Check ---


    // Construct the Secret YAML object
    const secretObject = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'shapestext-secrets', // Use a consistent name
      },
      type: 'Opaque',
      data: secretData,
    };

    // Convert the Secret object to YAML string
    const secretYaml = yaml.dump(secretObject);

    // Define paths
    // Corrected path: deployment.yaml is in the 'app' directory relative to the project root
    const deploymentYamlDir = path.join(process.cwd(), 'app'); // Directory containing deployment.yaml
    const deploymentYamlFilename = 'deployment.yaml';
    const deploymentYamlPath = path.join(deploymentYamlDir, deploymentYamlFilename); // Full path for fs.existsSync

     // Check if the deployment manifest exists
      if (!fs.existsSync(deploymentYamlPath)) {
          console.error(`Deployment manifest not found at: ${deploymentYamlPath}`);
          return NextResponse.json({ error: `Kubernetes deployment manifest not found at ${deploymentYamlPath}. Make sure deployment.yaml exists in the correct directory ('app' relative to project root).` }, { status: 500 });
      }


    // --- Apply the Kubernetes Secret using piping ---
    console.log('Applying Secret YAML via piping...');
    // Use echo to print the YAML and pipe it to kubectl apply -f -
    // Ensure the YAML string is correctly quoted for the shell
    const kubectlApplySecretCommand = `echo '${secretYaml.replace(/'/g, `'\\''`)}' | kubectl apply -f -`; // Handle single quotes in YAML
    try {
        const { stdout: secretStdout, stderr: secretStderr } = await execAsync(kubectlApplySecretCommand, { shell: '/bin/bash' });
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


    // --- Apply Kubernetes Deployment ---
    console.log(`Applying Deployment from ${deploymentYamlPath}...`);
    try {
        // Use the cwd option and explicitly use bash shell
        // The cwd is now the 'app' directory, so we just use the filename
        const { stdout: deployStdout, stderr: deployStderr } = await execAsync(`kubectl apply -f "${deploymentYamlFilename}"`, { cwd: deploymentYamlDir, shell: '/bin/bash' });
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

    // Optionally, get public NodePort or external IP
    // Check if the service exists before trying to get its info
    try {
        // Use bash shell for kubectl command
        const { stdout: svcStdout } = await execAsync(`kubectl get svc shapestext-service -o json`, { shell: '/bin/bash' });
        const serviceInfo = JSON.parse(svcStdout);
        // Find the NodePort for the correct targetPort (8080)
        const nodePortEntry = serviceInfo.spec.ports.find((p: any) => p.targetPort === 8080);

        if (nodePortEntry && nodePortEntry.nodePort) {
             const nodePort = nodePortEntry.nodePort;
             // Get minikube IP using bash shell
             const { stdout: minikubeIpStdout } = await execAsync(`minikube ip`, { shell: '/bin/bash' });
             const minikubeIp = minikubeIpStdout.trim();
             const publicUrl = `http://${minikubeIp}:${nodePort}`;
             console.log(`Service found. Public URL: ${publicUrl}`);
             return NextResponse.json({ publicUrl }, { status: 200 });
        } else {
             console.warn("Service found, but NodePort for targetPort 8080 not found or service type is not NodePort/LoadBalancer.");
              return NextResponse.json({ message: "Deployment applied. Service details (NodePort) may not be available immediately or service type is not compatible. Check with 'kubectl get svc shapestext-service'." }, { status: 200 });
        }

    } catch (svcErr: any) {
        console.warn(`Could not get service info: ${svcErr.message}`);
        // If service info can't be retrieved immediately, return a success status
        // and let the user check kubectl manually.
         return NextResponse.json({ message: "Deployment applied. Service details may not be available immediately. Check with 'kubectl get svc shapestext-service'." }, { status: 200 });
    }


  } catch (err: any) {
    console.error(`Deployment failed: ${err}`);
    // Include stderr if available from execAsync errors
    const errorMessage = err.stderr || err.message;
    return NextResponse.json({ error: `Deployment failed: ${errorMessage}` }, { status: 500 });
  }
}
