import { NextResponse } from "next/server"

// Mock database for interviews
const interviews = [
  {
    id: "1",
    title: "Technical Interview",
    description: "Practice coding questions and system design problems commonly asked in tech interviews.",
    difficulty: "hard",
    type: "voice",
    questions: [
      "Tell me about a challenging technical problem you've solved recently.",
      "How would you design a scalable web application?",
      "Explain the concept of recursion and provide an example.",
    ],
  },
  {
    id: "2",
    title: "Behavioral Interview",
    description: "Prepare for questions about your past experiences and how you handled various situations.",
    difficulty: "normal",
    type: "text",
    questions: [
      "Tell me about a time when you had to work with a difficult team member.",
      "Describe a situation where you had to meet a tight deadline.",
      "Give an example of a time when you showed leadership.",
    ],
  },
  // Add more predefined interviews here
]

export async function GET() {
  return NextResponse.json(interviews)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newId = (interviews.length + 1).toString()

    let questions = data.questions
    if (typeof questions === "string") {
      questions = questions
        .split("\n")
        .filter((q) => q.trim() !== "")
        .map((q) => q.trim())
    }

    const newInterview = {
      id: newId,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      type: data.type,
      questions: questions || [],
      duration: data.duration || 15,
    }

    interviews.push(newInterview)

    return NextResponse.json(newInterview, { status: 201 })
  } catch (error) {
    console.error("Error creating interview:", error)
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 })
  }
}
