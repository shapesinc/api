"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Mic, MicOff, Send, Loader2, CheckCircle, Clock, Star } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
  audioUrl?: string
  timestamp: Date
}

interface Interview {
  id: string
  title: string
  description: string
  difficulty: string
  type: "text" | "voice"
  questions?: string[]
}

interface InterviewSession {
  questionsAsked: number
  totalQuestions: number
  startTime: Date
  responses: Message[]
  isComplete: boolean
  feedback?: {
    strengths: string[]
    improvements: string[]
    overallScore: number
    summary: string
  }
}

export default function InterviewPage() {
  const params = useParams()
  const { id } = params

  const [interview, setInterview] = useState<Interview | null>(null)
  const [session, setSession] = useState<InterviewSession>({
    questionsAsked: 0,
    totalQuestions: 0,
    startTime: new Date(),
    responses: [],
    isComplete: false,
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${id}`)
        if (response.ok) {
          const data = await response.json()
          setInterview(data)

          const totalQuestions = data.questions?.length || 5
          setSession((prev) => ({ ...prev, totalQuestions }))

          const initialMessage: Message = {
            role: "assistant",
            content: `Hello! Welcome to your **${data.title}** interview. ${data.description}\n\nI'll be asking you ${totalQuestions} questions today. Take your time with each response, and remember - this is a safe space to practice and improve.\n\nLet's begin with the first question.`,
            timestamp: new Date(),
          }
          setMessages([initialMessage])
        } else {
          throw new Error("Failed to fetch interview")
        }
      } catch (error) {
        console.error("Error fetching interview:", error)
      }
    }

    fetchInterview()
  }, [id])

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const checkInterviewCompletion = (aiResponse: string) => {
    const completionSignals = [
      "interview complete",
      "interview is complete",
      "completed the interview",
      "interview session is over",
      "that concludes our interview",
      "!feedback",
      "final question",
      "last question",
    ]

    const isComplete = completionSignals.some((signal) => aiResponse.toLowerCase().includes(signal.toLowerCase()))

    if (isComplete && !session.isComplete) {
      generateFeedback()
    }
  }

  const generateFeedback = async () => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: id,
          messages: messages,
          interviewType: interview?.type,
        }),
      })

      if (response.ok) {
        const feedback = await response.json()
        setSession((prev) => ({
          ...prev,
          isComplete: true,
          feedback: feedback.feedback,
        }))

        const feedbackMessage: Message = {
          role: "assistant",
          content: `## 🎉 Interview Complete!\n\n**Overall Performance:** ${feedback.feedback.overallScore}/10\n\n### 💪 Strengths:\n${feedback.feedback.strengths.map((s: string) => `• ${s}`).join("\n")}\n\n### 🎯 Areas for Improvement:\n${feedback.feedback.improvements.map((i: string) => `• ${i}`).join("\n")}\n\n### 📝 Summary:\n${feedback.feedback.summary}\n\n---\n\nGreat job completing the interview! Use this feedback to continue improving your interview skills.`,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, feedbackMessage])
      }
    } catch (error) {
      console.error("Error generating feedback:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() && !audioBlob) return
    if (session.isComplete) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")

    setSession((prev) => ({
      ...prev,
      questionsAsked: prev.questionsAsked + 1,
      responses: [...prev.responses, userMessage],
    }))

    setIsLoading(true)

    try {
      let response

      if (audioBlob) {
        const formData = new FormData()
        formData.append("audio", audioBlob)
        formData.append("interviewId", id as string)
        formData.append("message", input.trim() || "Here is my voice response")

        response = await fetch("/api/voice", {
          method: "POST",
          body: formData,
        })
      } else {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input.trim(),
            interviewId: id,
          }),
        })
      }

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }

        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)

        checkInterviewCompletion(data.message)
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      console.error("Error getting response:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, but I'm having trouble processing your response. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setAudioBlob(null)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Failed to start recording. Please check your microphone permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const progress =
    session.totalQuestions > 0 ? Math.min((session.questionsAsked / session.totalQuestions) * 100, 100) : 0

  if (!interview) {
    return (
      <div className="interview-container">
        <div className="loading">
          <Loader2 className="spinner" />
          Loading interview...
        </div>
      </div>
    )
  }

  return (
    <div className="interview-container">
      <div className="interview-header">
        <h1>{interview.title}</h1>
        <p>{interview.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className={`difficulty-badge difficulty-${interview.difficulty}`}>
            {interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1)}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span className="text-sm text-gray-600">{formatTime(elapsedTime)}</span>
            </div>
            {session.isComplete && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Complete</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>
              {session.questionsAsked}/{session.totalQuestions} questions
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                maxWidth: "100%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role === "user" ? "message-user" : "message-ai"}`}>
            {message.audioUrl && (
              <div className="mb-3">
                <audio controls className="w-full max-w-sm">
                  <source src={message.audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            {message.role === "assistant" ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              <div>
                {message.content && <p>{message.content}</p>}
                {message.audioUrl && !message.content && <p className="text-sm opacity-75">🎤 Voice response</p>}
              </div>
            )}
            <div className="text-xs opacity-50 mt-2">{message.timestamp.toLocaleTimeString()}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message message-ai">
            <div className="loading">
              <Loader2 className="spinner" />
              Analyzing your response...
            </div>
          </div>
        )}
      </div>

      {!session.isComplete && (
        <form onSubmit={handleSubmit}>
          {interview.type === "voice" && (
            <div className="controls-container">
              <div className="voice-controls">
                <button
                  type="button"
                  className={`voice-button ${isRecording ? "recording" : ""}`}
                  onClick={toggleRecording}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <span className="audio-status">
                  {isRecording ? "Recording..." : audioBlob ? "Audio recorded!" : "Click to record"}
                </span>
                {audioBlob && (
                  <audio controls className="ml-4">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/mp3" />
                  </audio>
                )}
              </div>
            </div>
          )}

          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={audioBlob ? "Add a text message or just send your voice response" : "Type your response..."}
              disabled={isLoading}
            />
            <button type="submit" className="button" disabled={isLoading || (!input.trim() && !audioBlob)}>
              {isLoading ? <Loader2 className="spinner" /> : <Send size={20} />}
            </button>
          </div>
        </form>
      )}

      {session.isComplete && session.feedback && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-yellow-500" size={20} />
            <h3 className="font-semibold">Interview Complete!</h3>
          </div>
          <p className="text-sm text-gray-600">
            Check the feedback above to see how you performed and areas for improvement.
          </p>
        </div>
      )}
    </div>
  )
}
