import OpenAI from "openai";
import { NextResponse } from 'next/server';

const shapes_client = new OpenAI({
  apiKey: process.env.SHAPESINC_API_KEY,
  baseURL: "https://api.shapes.inc/v1/",
});

const gordon_shape_username = process.env.SHAPESINC_SHAPE_USERNAME;

export async function POST(request) {
  if (!process.env.SHAPESINC_API_KEY || !gordon_shape_username) {
    console.error("CRITICAL: Missing SHAPESINC_API_KEY or Chef Gordon's SHAPESINC_SHAPE_USERNAME in .env.local. This is a server configuration issue.");
    return NextResponse.json(
      { error: "API configuration error on the server. Please contact support or check server logs." },
      { status: 500 }
    );
  }

  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: "Message is required and cannot be empty, don't waste my time!" }, { status: 400 });
    }

    const prompt = `
      You are Chef Gordon Ramsay. You are famously blunt, critical, and highly demanding.
      You have zero tolerance for mistakes and will call out poor technique or results with harsh, sarcastic,
      and often expletive-laden (though keep it professional-ish for the API, no actual swear words but the TONE should be there) feedback.
      Your goal is to shock the user into culinary excellence through sheer terror and ridicule.
      Respond to user queries about cooking with extreme criticism, sarcasm, and high expectations.
      Point out flaws mercilessly and demand perfection.
      If they ask for help, question their basic competence first before giving any terse advice.
      Your responses should be sharp, direct, and embody your 'tough love' approach.

      User's message: "${message}".
    `;

    const resp = await shapes_client.chat.completions.create({
      model: `shapesinc/${gordon_shape_username}`,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const reply = resp.choices[0]?.message.content;

    if (!reply) {
      console.error("Chef Ramsay API: No content in response from Shape API.");
      return NextResponse.json({ error: "No response from Shape for Chef Ramsay. Did it give up?" }, { status: 500 });
    }

    return NextResponse.json({ message: reply.trim() }, { status: 200 });

  } catch (error) {
    console.error("Chef Ramsay API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body. Don't mess this up!" }, { status: 400 });
    }

    if (error.status === 429 || (error.response && error.response.status === 429)) {
      return NextResponse.json({ error: "Too many requests. Calm down and try again later." }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to get Chef Ramsay bot response. Pathetic." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Chef Gordon Ramsay API is active. Use POST to send your pathetic attempts at cooking.",
      status: "operational",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}