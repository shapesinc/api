// app/page.tsx - Modified to include Socket.IO for QR Code and improved QR image styling
'use client';

// Import necessary hooks and socket.io-client
import { useState, FormEvent, useEffect } from 'react'; // Added useEffect
import io from 'socket.io-client'; // Import socket.io-client

export default function HomePage() {
  const [shapesApiKey, setShapesApiKey] = useState('');
  const [shapesUsername, setShapesUsername] = useState('');
  const [status, setStatus] = useState(''); // Status from deploy/stop actions
  const [isLoading, setIsLoading] = useState(false);
  const [podLogs, setPodLogs] = useState(''); // State for displaying logs from deploy API response
  const [podName, setPodName] = useState(''); // State for displaying pod name from deploy API response

  // States for Socket.IO based status and QR code from the bot (real-time)
  const [qrCodeImageSrc, setQrCodeImageSrc] = useState<string | null>(null); // State for QR code image Data URL
  const [botRealtimeStatus, setBotRealtimeStatus] = useState('Initializing Socket connection...'); // Status derived from bot events via Socket.IO

  // --- Socket.IO Client Logic ---
  // This useEffect hook establishes and manages the Socket.IO connection
  useEffect(() => {
    // Establish Socket.IO connection
    // IMPORTANT: This URL must match the address used in your kubectl port-forward command
    // e.g., if you use 'kubectl port-forward deployment/whatsapp-shape-bot 8000:3000'
    // then the URL here should be 'http://localhost:8000'
    const socket = io('http://localhost:8000'); // <<< Connect to the port-forwarded address

    // Event listeners for bot status updates from Socket.IO
    socket.on('connect', () => {
      console.log('Socket.IO connected!');
      setBotRealtimeStatus('Connected to bot backend.');
    });

    socket.on('qrCode', (dataUrl: string) => {
      console.log('Socket.IO: Received QR Code data (Data URL)');
      setQrCodeImageSrc(dataUrl); // Set the state to display the image
      setBotRealtimeStatus('Scan the QR code below:'); // Update real-time status
    });

    socket.on('ready', (data: { message: string }) => {
      console.log('Socket.IO: Bot ready', data.message);
      setQrCodeImageSrc(null); // Clear QR code once ready
      setBotRealtimeStatus(data.message); // e.g., "Client is ready! Logged in as..."
    });

    socket.on('authenticated', () => {
        console.log('Socket.IO: Authenticated');
        setBotRealtimeStatus('Authenticated successfully.');
        // QR will be cleared when 'ready' comes shortly after 'authenticated'
    });

    socket.on('auth_failure', (data: { message: string, details: any }) => {
        console.error('Socket.IO: Authentication failed', data.details);
        setQrCodeImageSrc(null); // Clear QR
        setBotRealtimeStatus(`Authentication failed: ${data.message}`);
    });

    socket.on('disconnected', (data: { message: string, reason: string }) => {
      console.warn('Socket.IO: Disconnected', data.reason);
      setQrCodeImageSrc(null); // Clear QR on disconnect
      setBotRealtimeStatus(`Disconnected: ${data.message} (Reason: ${data.reason})`);
    });

    socket.on('state_changed', (data: { state: string }) => {
      console.log('Socket.IO: State changed:', data.state);
       // Optional: setBotRealtimeStatus(`State changed: ${data.state}`); // More verbose status
    });

     socket.on('api_error', (data: { message: string, details: any }) => {
         console.error('Socket.IO: API Error:', data.details);
         setBotRealtimeStatus(`API Error: ${data.message}`);
     });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected.');
      setBotRealtimeStatus('Socket disconnected. Bot may not be running.');
       setQrCodeImageSrc(null); // Clear QR
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO Connection Error:', err);
      // Use err.message or err.stack for more details if needed
      setBotRealtimeStatus(`Connection Error: Could not reach bot backend. Ensure kubectl port-forward is running.`); // More specific error message
      setQrCodeImageSrc(null); // Clear QR
    });

    // Clean up socket connection on component unmount
    return () => {
      console.log('Disconnecting Socket.IO...');
      socket.disconnect();
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // --- Form Submission Logic (for Deploy/Stop API calls) ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Deploying...'); // Status for the deployment process itself
    setIsLoading(true);
    setPodLogs(''); // Clear previous logs from previous deploy attempts
    setPodName(''); // Clear previous pod name
    // Socket.IO status (botRealtimeStatus) is independent, driven by Socket.IO events

    const credentials = {
      shapesApiKey,
      shapesUsername,
    };

    try {
      // Send credentials to the deploy API
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      // --- Log the entire JSON response from /api/deploy to the browser console ---
      console.log('Response from /api/deploy:', data);
      // --- END Log ---

      if (response.ok) {
        // Deployment process completed successfully (or timed out waiting for readiness)
        // The 'logs' field in 'data' will now contain the actual logs content (or a warning)
        setStatus(`Deployment command finished: ${data.message || data.error || 'Success'}`); // Status reflects the outcome of the backend process
        setPodName(data.podName || 'N/A'); // Set pod name if returned
        // --- SET podLogs STATE WITH THE ACTUAL LOG CONTENT FROM API RESPONSE ---
        setPodLogs(data.logs || data.error || 'No initial logs or status message returned from API.'); // Display initial logs content or error message
        // --- END SET podLogs ---

        // Optional: Update main status if the backend message indicates successful initiation
        if (data.message && data.message.includes('initiated successfully')) {
             setStatus('Deployment process initiated successfully. Check logs below and Bot Status above.');
        }

      } else {
        // Deployment failed immediately (e.g., validation error, kubectl apply error)
        setStatus(`Deployment failed: ${data.error || 'Unknown error'}`);
         // The 'logs' field in 'data' might contain an error message from the backend
         setPodLogs(data.logs || data.error || ''); // Still display any partial logs or errors returned by backend
         setPodName(data.podName || ''); // Still display pod name if returned
      }
    } catch (error: any) {
      // Network error or unexpected error during the fetch
      setStatus(`Deployment request failed: ${error.message || 'An error occurred during fetch'}`);
      setPodLogs('');
      setPodName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setStatus('Stopping...'); // Status for the stop process
    setIsLoading(true);
    setPodLogs(''); // Clear logs when stopping
    setPodName(''); // Clear pod name when stopping
    setQrCodeImageSrc(null); // Clear QR on stop
    setBotRealtimeStatus('Stopping bot...'); // Update real-time bot status

    try {
      const response = await fetch('/api/stop', { method: 'POST' });
      const data = await response.json();

      // --- Log the entire JSON response from /api/stop ---
      console.log('Response from /api/stop:', data);
      // --- END Log ---

      if (response.ok) {
        setStatus(`Stop command successful: ${data.message}`);
        setBotRealtimeStatus('Bot stop command sent. Waiting for socket disconnect...'); // Status after stop command
      } else {
        setStatus(`Stop command failed: ${data.error || 'Unknown error'}`);
        setBotRealtimeStatus(`Stop failed: ${data.error || 'Unknown error'}`); // Update bot status as well
      }
    } catch (error: any) {
      setStatus(`Stop command failed: ${error.message || 'An error occurred'}`);
      setBotRealtimeStatus(`Stop failed: ${error.message || 'An error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Rendering Logic ---

  return (
    // Increased maxWidth and added minHeight for the main container
    <div style={{ padding: '20px', maxWidth: '800px', minHeight: '600px', margin: 'auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ textAlign: 'center', color: 'white' }}>Deploy WhatsApp Shape Bot on Minikube</h1>
      <p style={{ textAlign: 'center', color: 'white' }}>Enter your Shapes.inc credentials below to deploy the bot on your local Minikube cluster.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <div>
          <label htmlFor="shapesApiKey" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black' }}>Shapes.inc API Key:</label>
          <input
            id="shapesApiKey"
            type="password" // Use type="password" for API key input
            value={shapesApiKey}
            onChange={(e) => setShapesApiKey(e.target.value)}
            required
            style={{ color:'black' ,width: 'calc(100% - 18px)', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label htmlFor="shapesUsername" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color:'black'}}>Shapes.inc Shape Username:</label>
          <input
            id="shapesUsername"
            type="text"
            value={shapesUsername}
            onChange={(e) => setShapesUsername(e.target.value)}
            required
            style={{ width: 'calc(100% - 18px)', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', color:'black'}}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
        >
          {isLoading ? 'Processing...' : 'Deploy Bot'}
        </button>
      </form>

      <button
        onClick={handleStop}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          backgroundColor: isLoading ? '#ccc' : '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '10px',
          transition: 'background-color 0.3s ease'
        }}
      >
         {isLoading ? 'Processing...' : 'Stop Bot'}
      </button>

      {/* Display real-time bot status and QR code from Socket.IO */}
       <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #91d5ff', borderRadius: '4px', backgroundColor: '#e6f7ff', textAlign: 'center' }}>
           <p style={{ fontWeight: 'bold', color: '#0050b3' }}>Bot Status (Real-time via Socket):</p>

           {/* Display QR Code Image if available */}
           {qrCodeImageSrc ? (
               <div style={{
                   marginTop: '15px',
                   marginBottom: '15px', // Added some bottom margin for spacing below QR
                   display: 'inline-block', // Allows centering the block itself
               }}>
                   {/* The Image display (still needed to scan) */}
                   <img
                       src={qrCodeImageSrc} // This uses the full Data URL to display the image
                       alt="WhatsApp QR Code"
                       style={{
                           maxWidth: '10px', // <<< Adjusted max width for a smaller image
                           height: 'auto',
                           padding: '10px',
                           border: '1px solid #ccc',
                           backgroundColor: 'white',
                           display: 'block', // Ensures image is treated as a block for margin: auto
                           margin: '0 auto', // Centers the image within its parent div
                       }}
                   />
                   <p style={{
                       marginTop: '8px',
                       color: '#333',
                       textAlign: 'center', // Explicitly center the caption text
                       fontSize: '0.9em', // Slightly smaller text
                   }}>
                       {botRealtimeStatus} {/* Use the status derived from the QR event */}
                   </p>

                   {/* Removed: Raw QR Code Data Display Section */}

               </div>
           ) : (
               // Only show the status text when no QR code is being displayed
               <p style={{ color: '#333' }}>{botRealtimeStatus}</p>
           )}
       </div>


      {/* Show status and logs section from API response */}
      {(status || podName || podLogs) && ( // Show this section if any relevant state has data
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Deployment API Response Info & Initial Logs</h3>

          {status && ( // Display the main status message from the API response
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>API Response Status: {status}</p>
          )}

          {podName && podName !== 'N/A' && ( // Only show pod name if we have one and it's not N/A
              <p style={{ marginBottom: '10px' }}><strong>Pod Name (from API):</strong> {podName}</p>
          )}

          {/* Display the actual logs content received from the API */}
          {podLogs ? ( // Check if podLogs has content
              <> {/* Use a fragment to group the heading and pre tag */}
              <p style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px', color: '#333' }}>Initial Logs (from API response):</p>
              <pre style={{
                backgroundColor: '#002b36',
                color: '#839496',
                padding: '15px',
                borderRadius: '5px',
                overflow: 'auto', // Keep overflow auto for horizontal scrolling if needed
                overflowY: 'auto', // Ensure vertical scrolling is also auto
                maxHeight: '600px',
                fontSize: '10px',
                lineHeight: '1.5',
                whiteSpace: 'pre', // Use 'pre' to preserve exact formatting including wide characters
                wordWrap: 'normal', // Prevent breaking words in the middle
                wordBreak: 'normal' // Prevent breaking characters
              }}>
                {podLogs} {/* Display the actual logs content here */}
              </pre>
              </>
          ) : (
              // Message when podLogs is empty
              <p style={{ color: '#555' }}>Initial logs from the deployment API will appear here after the deploy command finishes.</p>
          )}

        </div>
      )}

      </div>
 
  );
}
