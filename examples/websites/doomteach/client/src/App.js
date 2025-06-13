import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [videoGenerated, setVideoGenerated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Generating...');
    setVideoGenerated(false);
    try {
      const res = await axios.post('http://localhost:5000/api/generate', { prompt });
      setStatus('');
      setVideoGenerated(true);
    } catch (err) {
      setStatus('Error generating video.');
    }
  };

  return (
    <div className="app">
      <h1 className="title">doomteach</h1>
      <div className="subtitle">Your viral video is just a prompt away (once I deploy this ;))</div>
      <form onSubmit={handleSubmit} className="prompt-form">
        <input
          type="text"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
      {status === 'Generating...' && (
        <div className="generating-text">Generating...</div>
      )}
      {videoGenerated && (
        <div className="video-generated-text">
          Video generated at <span className="video-path">doomteach/media/generated/video/doom_video.mp4</span>
        </div>
      )}
    </div>
  );
}

export default App;
