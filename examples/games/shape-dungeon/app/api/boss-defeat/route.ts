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
    const { bossName, playerName, channelId } = await request.json()

    const response = await shapesClient.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `You are ${bossName}, a powerful dungeon boss who has just been defeated by ${playerName}. Create a dramatic defeat speech. Keep it under 100 words.`,
        },
      ],
      headers: {
        "X-User-Id": playerName,
        "X-Channel-Id": channelId,
      },
    })

    return NextResponse.json({
      dialog: response.choices[0]?.message.content || "You... have defeated me...",
    })
  } catch (error) {
    console.error("Error getting boss defeat dialog:", error)
    return NextResponse.json(
      { error: "Failed to generate boss defeat dialog", dialog: "You... have defeated me..." },
      { status: 500 },
    )
  }
}
