import { NextResponse } from "next/server"

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
  {
    id: "3",
    title: "Leadership Assessment",
    description: "Evaluate your leadership skills and decision-making abilities in various scenarios.",
    difficulty: "hard",
    type: "text",
    questions: [
      "How do you motivate your team during challenging times?",
      "Describe a situation where you had to make a difficult decision.",
      "How do you handle conflicts within your team?",
    ],
  },
  {
    id: "4",
    title: "Quick Interview",
    description: "A short 5-minute interview to practice your elevator pitch and quick thinking.",
    difficulty: "easy",
    type: "voice",
    questions: ["Tell me about yourself in 30 seconds.", "What's your greatest strength?", "Why should we hire you?"],
  },
  {
    id: "5",
    title: "Performance Review",
    description: "Simulate a performance review discussion to practice highlighting your achievements.",
    difficulty: "normal",
    type: "text",
    questions: [
      "What were your major accomplishments this year?",
      "What areas do you think you need to improve?",
      "What are your goals for the next year?",
    ],
  },
  {
    id: "6",
    title: "Job-Specific Interview",
    description: "Tailored questions for specific roles like product management, design, or marketing.",
    difficulty: "hard",
    type: "voice",
    questions: [
      "How would you approach launching a new product?",
      "How do you measure the success of your projects?",
      "Describe your process for solving complex problems.",
    ],
  },
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  const interview = interviews.find((interview) => interview.id === id)

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 })
  }

  return NextResponse.json(interview)
}
