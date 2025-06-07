"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateInterview() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "normal",
    type: "text",
    questions: "",
    duration: 15,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/interview/${data.id}`)
      } else {
        throw new Error("Failed to create interview")
      }
    } catch (error) {
      console.error("Error creating interview:", error)
      alert("Failed to create interview. Please try again.")
    }
  }

  return (
    <div>
      <h1>Create Custom Interview</h1>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Interview Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level</label>
            <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} required>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="type">Interview Type</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} required>
              <option value="text">Text</option>
              <option value="voice">Voice</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="questions">Custom Questions (one per line)</label>
            <textarea
              id="questions"
              name="questions"
              value={formData.questions}
              onChange={handleChange}
              placeholder="Enter your custom questions here, one per line..."
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="5"
              max="60"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="button">
            Create Interview
          </button>
        </form>
      </div>
    </div>
  )
}
