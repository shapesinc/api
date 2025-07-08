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
    const { bossName, playerName, context, channelId } = await request.json()

    const response = await shapesClient.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `You are ${bossName}, a powerful dungeon boss. Create a threatening dialog to the player named ${playerName} who has entered your lair. Context: ${context}. Keep it under 100 words and make it intimidating.`,
        },
      ],
      headers: {
        "X-User-Id": playerName,
        "X-Channel-Id": channelId,
      },
    })

    return NextResponse.json({
      dialog: response.choices[0]?.message.content || "You dare challenge me, mortal?",
    })
  } catch (error) {
    console.error("Error getting boss dialog:", error)
    return NextResponse.json(
      { error: "Failed to generate boss dialog", dialog: "You dare challenge me, mortal?" },
      { status: 500 },
    )
  }
}
