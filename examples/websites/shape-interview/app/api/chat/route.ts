import { NextResponse } from "next/server"
import { OpenAI } from "openai"

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1/",
})

export async function POST(request: Request) {
  try {
    const { message, interviewId, questionNumber, totalQuestions } = await request.json()

    try {
      const response = await shapesClient.chat.completions.create({
        model: "shapesinc/textinterviewer", 
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        headers: {
          "X-User-Id": interviewId, 
          "X-Channel-Id": `interview-${interviewId}`, 
        },
      })

      const aiResponse = response.choices[0].message.content

      return NextResponse.json({
        message: aiResponse,        
      })
    } catch (error) {
      console.error("Error calling Shapes API:", error)
      return NextResponse.json(
        {
          error: "Failed to process message",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
