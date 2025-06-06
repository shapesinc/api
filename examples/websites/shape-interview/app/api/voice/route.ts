import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { OpenAI } from "openai"

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1/",
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const interviewId = formData.get("interviewId") as string
    const textMessage = formData.get("message") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const blob = await put(`interviews/${interviewId}/${Date.now()}.mp3`, audioFile, {
      access: "public",
    })

    
    try {
      const response = await shapesClient.chat.completions.create({
        model: "shapesinc/voiceinterviewer", 
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: textMessage || "Here is my voice response to your interview question.",
              },
              {
                type: "audio_url",
                audio_url: {
                  url: blob.url,
                },
              },
            ],
          },
        ],
        headers: {
          "X-User-Id": interviewId, 
          "X-Channel-Id": `voice-interview-${interviewId}`, 

      const aiResponse = response.choices[0].message.content

      return NextResponse.json({
        message: aiResponse,
        audioUrl: blob.url,
      })
    } catch (error) {
      console.error("Error calling Shapes API:", error)
      return NextResponse.json(
        {
          error: "Failed to process audio",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in voice API:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
