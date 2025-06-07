import { NextResponse } from "next/server"
import { OpenAI } from "openai"

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1/",
})

interface Message {
  role: "user" | "assistant"
  content: string
  audioUrl?: string
  timestamp: Date
}

export async function POST(request: Request) {
  try {
    const { interviewId, messages, interviewType } = await request.json()

    try {
      const response = await shapesClient.chat.completions.create({
        model: "shapesinc/textinterviewer", 
        messages: [
          {
            role: "user",
            content: "!feedback", 
          },
        ],
        headers: {
          "X-User-Id": interviewId, 
          "X-Channel-Id": `interview-${interviewId}`, 
        },
      })

      const feedbackResponse = response.choices[0].message.content
      let feedback
      try {
        const jsonMatch = feedbackResponse?.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          feedback = JSON.parse(jsonMatch[0])
        } else {
          feedback = {
            overallScore: 8, 
            strengths: ["Completed the interview successfully", "Engaged with the process"],
            improvements: ["Continue practicing", "Work on specific examples"],
            summary: feedbackResponse || "Great job completing the interview practice session!",
          }
        }
      } catch {
        feedback = {
          overallScore: 7,
          strengths: ["Participated actively in the interview", "Showed commitment to improvement"],
          improvements: ["Practice providing more detailed responses", "Work on interview confidence"],
          summary:
            feedbackResponse || "You completed the interview successfully. Keep practicing to improve your skills!",
        }
      }

      return NextResponse.json({ feedback })
    } catch (error) {
      console.error("Error calling Shapes API for feedback:", error)

      const fallbackFeedback = {
        overallScore: 7,
        strengths: [
          "Completed all interview questions",
          "Demonstrated commitment to practice",
          "Engaged with the interview process",
        ],
        improvements: [
          "Practice providing more detailed examples",
          "Work on structuring responses clearly",
          "Consider preparing common interview scenarios",
        ],
        summary:
          "You successfully completed the interview practice session. Keep practicing to build confidence and refine your interview skills.",
      }

      return NextResponse.json({ feedback: fallbackFeedback })
    }
  } catch (error) {
    console.error("Error in feedback API:", error)
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 })
  }
}
