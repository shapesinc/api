'use client';

import { useState, FormEvent } from 'react';

export default function HomePage() {
  const [shapesUsername, setShapesUsername] = useState('');
  const [shapesApiKey, setShapesApiKey] = useState('');
  const [twitchOauth, setTwitchOauth] = useState('');
  const [twitchChannel, setTwitchChannel] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    setMessage('');

    const config = {
      shapesUsername,
      shapesApiKey,
      twitchOauth,
      twitchChannel,
    };

    try {
      const response = await fetch('/api/deploy-twitch', { // Updated API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Deployment successful: ${data.message}`);
      } else {
        setMessage(`Deployment failed: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`An error occurred during deployment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/stop-twitch', { // Updated API endpoint
        method: 'POST', // POST is used as it's an action
        headers: {
          'Content-Type': 'application/json',
        },
        // No body needed for stop
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Stop successful: ${data.message}`);
      } else {
        setMessage(`Stop failed: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`An error occurred during stop: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Deploy Your Twitch Bot (Minikube)</h1>
      {/* Note: In React Strict Mode (development), components may render twice to help detect side effects.
          This might make it appear that handlers like handleSubmit run twice, but event.preventDefault()
          prevents the form from actually submitting multiple times. Check the Network tab to confirm
          only one request is sent to the API endpoint. */}
      <p>Ensure you have run <code>eval $(minikube docker-env)</code> and built the <code>twitch-shape-bot:latest</code> Docker image in the Minikube daemon before deploying.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2>Bot Configuration</h2>
        <div>
          <label htmlFor="shapesUsername" style={{ display: 'block', marginBottom: '5px' }}>Shapes.inc Username:</label>
          <input
            id="shapesUsername"
            type="text"
            value={shapesUsername}
            onChange={(e) => setShapesUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div>
          <label htmlFor="shapesApiKey" style={{ display: 'block', marginBottom: '5px' }}>Shapes.inc API Key:</label>
          <input
            id="shapesApiKey"
            type="text" // Use type="password" for production
            value={shapesApiKey}
            onChange={(e) => setShapesApiKey(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div>
          <label htmlFor="twitchOauth" style={{ display: 'block', marginBottom: '5px' }}>Twitch OAuth Token (e.g., oauth:xxxxx):</label>
          <input
            id="twitchOauth"
            type="text" // Use type="password" for production
            value={twitchOauth}
            onChange={(e) => setTwitchOauth(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div>
          <label htmlFor="twitchChannel" style={{ display: 'block', marginBottom: '5px' }}>Twitch Channel Name:</label>
          <input
            id="twitchChannel"
            type="text"
            value={twitchChannel}
            onChange={(e) => setTwitchChannel(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: 'green', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Deploying...' : 'Deploy Bot'}
        </button>
      </form>

      <button
        onClick={handleStop}
        disabled={loading}
        style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {loading ? 'Stopping...' : 'Stop Bot'}
      </button>

      {message && (
        <p style={{ marginTop: '20px', color: message.includes('failed') || message.includes('error') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
    </div>
  );
}
