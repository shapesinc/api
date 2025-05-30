import WebSocket from 'ws';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const OAUTH_TOKEN = process.env.TWITCH_OAUTH;
const TWITCH_CHANNEL = process.env.TWITCH_CHANNEL;

const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1',
});

const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

socket.on('open', () => {
  socket.send(`PASS oauth:${OAUTH_TOKEN}`);
  socket.send(`NICK ${process.env.SHAPESINC_SHAPE_USERNAME}`);
  socket.send(`JOIN #${TWITCH_CHANNEL}`);
});

socket.on('message', async (data) => {
  const message = data.toString();
  console.log(message);
  if (message.includes("!ask")) {
    const userQuestion = message.replace('!ask', '').trim();
    if (userQuestion) {
      try {
        const shaperesponse = await processWithShapes(userQuestion);
        socket.send(`${TWITCH_CHANNEL} :${shaperesponse}`);
      } catch (error) {
        console.error('Error processing with Shapes API:', error.message);
        socket.send(`${TWITCH_CHANNEL} :Sorry, I encountered an error.`);
      }
    }
  }

  if (message.includes("!shape")) {
    const shapePrompt = message.replace('!shape', '').trim();
    if (shapePrompt) {
      try {
        const shaperesponse = await processWithShapes(shapePrompt);
        socket.send(`PRIVMSG #${TWITCH_CHANNEL} :${shaperesponse}`);
      } catch (error) {
        console.error('Error processing with Shapes API:', error.message);
        socket.send(`PRIVMSG #${TWITCH_CHANNEL} :Sorry, I encountered an error.`);
      }
    }
  }
});

async function processWithShapes(prompt, userId, channelId) {
  try {
    console.log('Sending to Shapes API:', prompt);
    
    const response = await shapes.chat.completions.create(
      {
        model: `shapesinc/${SHAPES_USERNAME}`,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "X-User-Id": userId,
          "X-Channel-Id": channelId,
        },
      }
    );

    const shaperesponseText = response.choices[0].message.content;
    console.log('Shapes Response:', shaperesponseText);
    return shaperesponseText;

  } catch (error) {
    console.error('Error processing with Shapes API:', error.message);
    return `Sorry, I encountered an error while processing your request.`;
  }
}

export default { processWithShapes };
