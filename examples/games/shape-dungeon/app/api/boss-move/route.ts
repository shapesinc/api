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
    const { bossName, playerName, playerHealth, bossHealth, channelId } = await request.json()

    const response = await shapesClient.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `You are ${bossName}, a powerful dungeon boss. Create a combat move against the player named ${playerName}. Player health: ${playerHealth}%, Boss health: ${bossHealth}%. Respond in JSON format with moveName, description, and damage (number between 5-20). Make it creative and thematic.`,
        },
      ],
      headers: {
        "X-User-Id": playerName,
        "X-Channel-Id": channelId,
      },
    })

    const content = response.choices[0]?.message.content || ""

    try {
      // Try to parse the JSON response
      const moveData = JSON.parse(content)
      return NextResponse.json({
        moveName: moveData.moveName || "Attack",
        description: moveData.description || "The boss attacks you!",
        damage: typeof moveData.damage === "number" ? moveData.damage : Math.floor(Math.random() * 15) + 5,
      })
    } catch (e) {
      const moveName = content.match(/moveName["\s:]+([^"]+)/i)?.[1] || "Attack"
      const description = content.match(/description["\s:]+([^"]+)/i)?.[1] || "The boss attacks you!"
      const damage = Number.parseInt(content.match(/damage["\s:]+(\d+)/i)?.[1] || "10", 10)

      return NextResponse.json({
        moveName,
        description,
        damage: isNaN(damage) ? Math.floor(Math.random() * 15) + 5 : damage,
      })
    }
  } catch (error) {
    console.error("Error getting boss combat move:", error)
    return NextResponse.json(
      {
        error: "Failed to generate boss move",
        moveName: "Desperate Strike",
        description: "The boss lashes out with a powerful attack!",
        damage: Math.floor(Math.random() * 15) + 5,
      },
      { status: 500 },
    )
  }
}
