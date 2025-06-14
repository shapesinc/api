const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/prompt', (req, res) => {
  const { prompt } = req.body;
  console.log("User prompt:", prompt);
  // Replace this with actual ChatGPT API logic if needed
  res.json({ response: `You said: ${prompt}` });
});

app.post('/api/generate', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // // Call the new pipeline.py script, for fakeyou
  // const py = spawn('python3', [
  //   './generator/pipeline.py',
  //   prompt
  // ], { cwd: __dirname + '/..' });

//for Shapes API
  const py = spawn('python3', [
    './generator/pipeline2.py',
    prompt
  ], { cwd: __dirname + '/..' });




  let output = '';
  let statusUpdates = [];

  py.stdout.on('data', (data) => {
    // Expect pipeline.py to send status updates as lines starting with "STATUS:"
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.startsWith('STATUS:')) {
        statusUpdates.push(line.replace('STATUS:', '').trim());
      } else {
        output += line + '\n';
      }
    });
  });

  py.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  py.on('close', (code) => {
    // Expect output as JSON on the last line
    let result = {};
    try {
      // Find the last non-empty line and parse as JSON
      const lines = output.trim().split('\n').filter(Boolean);
      result = JSON.parse(lines[lines.length - 1]);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse pipeline output' });
    }
    // Pass through script, characters, tokens, indices, and statusUpdates
    res.json({ 
      script: result.script, // may be undefined
      characters: result.characters,
      tokens: result.tokens,
      indices: result.indices,
      statusUpdates
    });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
