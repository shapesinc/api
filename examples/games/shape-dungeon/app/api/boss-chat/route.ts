import { NextResponse } from "next/server"
import OpenAI from "openai"

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPESINC_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1",
})

const shapeUsername = process.env.SHAPESINC_SHAPE_USERNAME || "shaperobot"
const model = `shapesinc/${shapeUsername}`

export async function POST(request: Request) {
  try {
    const { bossName, playerName, message, context, channelId } = await request.json()

    const response = await shapesClient.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `You are ${bossName}, a powerful dungeon boss. ${context}. The player ${playerName} says: "${message}". Respond in character as ${bossName}. Keep it under 100 words.`,
        },
      ],
      headers: {
        "X-User-Id": playerName,
        "X-Channel-Id": channelId,
      },
    })

    return NextResponse.json({
      response: response.choices[0]?.message.content || "...",
    })
  } catch (error) {
    console.error("Error getting boss chat response:", error)
    return NextResponse.json({ error: "Failed to generate boss chat response", response: "..." }, { status: 500 })
  }
}
