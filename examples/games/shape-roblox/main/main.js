import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const shapeApiKey = process.env.SHAPESINC_API_KEY;
const shapeUsername = process.env.SHAPESINC_SHAPE_USERNAME || 'shaperobot';
const model = `shapesinc/${shapeUsername}`;

// 🧠 Call Shapes API with prompt + history
async function sendMessage(prompt, history = []) {
  try {
    const messages = [...history, { role: 'user', content: prompt }];

    const response = await axios.post(
      'https://api.shapes.inc/v1/chat/completions',
      {
        model: model,
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${shapeApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content;
    return reply || 'No reply found.';
  } catch (error) {
    console.error('Shapes API Error:', error.response?.data || error.message);
    return 'Failed to get a response from Shapes API.';
  }
}

// ✅ Accepts both `prompt` and optional `history`
app.post('/processshape', async (req, res) => {
  const prompt = req.body.prompt;
  const history = req.body.history || [];

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  const reply = await sendMessage(prompt, history);
  res.json({ reply });
});

app.listen(port, () => {
  console.log(`✅ Shapes proxy running at http://localhost:${port}`);
});
