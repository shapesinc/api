import OpenAI from "openai";
import { NextResponse } from 'next/server';

const shapes_client = new OpenAI({
  apiKey: process.env.SHAPESINC_API_KEY,
  baseURL: "https://api.shapes.inc/v1/",
});

const vikas_shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

export async function POST(request) {
  if (!process.env.SHAPESINC_API_KEY || !vikas_shape_username) {
    console.error("CRITICAL: Missing SHAPESINC_API_KEY or Chef Vikas's SHAPESINC_SHAPE_USERNAME in .env.local. This is a server configuration issue.");
    return NextResponse.json(
      { error: "API configuration error on the server. Please contact support or check server logs." },
      { status: 500 }
    );
  }

  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: "Message is required and cannot be empty. Please share what's on your mind!" }, { status: 400 });
    }

    const prompt = `
      You are Chef Vikas Khanna. You are incredibly kind, patient, and encouraging.
      Your goal is to inspire and gently guide the user through their cooking journey.
      You offer helpful tips with a warm smile and always find the positive in their efforts.
      Respond to user queries about cooking with warmth, positivity, and clear, encouraging guidance.
      Offer alternatives and support if they face difficulties.
      Keep your responses helpful and uplifting.

      User's message: "${message}".
    `;

    const resp = await shapes_client.chat.completions.create({
      model: `shapesinc/${vikas_shape_username}`,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
    });

    const reply = resp.choices[0]?.message.content;

    if (!reply) {
      console.error("Chef Vikas API: No content in response from Shape API.");
      return NextResponse.json({ error: "No response from Shape for Chef Vikas. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: reply.trim() }, { status: 200 });

  } catch (error) {
    console.error("Chef Vikas API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body. Please check the format." }, { status: 400 });
    }

    if (error.status === 429 || (error.response && error.response.status === 429)) {
      return NextResponse.json({ error: "Too many requests. Please take a moment and try again later." }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to get Chef Vikas bot response. Our apologies!" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Chef Vikas Khanna API is active. Use POST to send a message and get some wonderful cooking advice!",
      status: "operational",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}