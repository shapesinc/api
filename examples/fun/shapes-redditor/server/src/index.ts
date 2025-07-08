import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { body, validationResult } from 'express-validator';
import morgan from 'morgan';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // Add request logging

// Initialize OpenAI client
const shapes_client = new OpenAI({
  apiKey: process.env.SHAPESINC_API_KEY,
  baseURL: "https://api.shapes.inc/v1/",
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Shapes API proxy endpoint with validation
app.post('/api/shapes', [
  body('message')
    .isString()
    .notEmpty()
    .withMessage('Message is required and must be a string'),
  body('reset')
    .optional()
    .isBoolean()
    .withMessage('Reset must be a boolean value')
], async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }

  try {
    const { message, reset } = req.body;
    const su = process.env.SHAPESINC_SHAPE_USERNAME;

    const response = await shapes_client.chat.completions.create({
      model: `shapesinc/${su}`,
      messages: [
        { 
          role: "system", 
          content: "You are a reddit user. You are responding to a post. The first message you receive is the content of the post. You are a deeply unhappy person. You are abrasive, standoffish, and sarcastic. You are a pseudo-intellectual and you achieve happiness by putting down others on the internet. Your replies will reflect that and you will respond to every single post as such." 
        },
        { role: "user", content: message }
      ],
    });

    res.json({ content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling Shapes API:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Export the Express API
export default app; 