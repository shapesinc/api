"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

interface PatternMatchGameProps {
  onComplete: (success: boolean) => void
}

export default function PatternMatchGame({ onComplete }: PatternMatchGameProps) {
  const [pattern, setPattern] = useState<number[]>([])
  const [playerPattern, setPlayerPattern] = useState<number[]>([])
  const [isShowingPattern, setIsShowingPattern] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [gamePhase, setGamePhase] = useState<"watch" | "repeat" | "success" | "failure">("watch")
  const [round, setRound] = useState(1)

  const colors = [
    { id: 0, color: "bg-red-500", activeColor: "bg-red-400" },
    { id: 1, color: "bg-blue-500", activeColor: "bg-blue-400" },
    { id: 2, color: "bg-green-500", activeColor: "bg-green-400" },
    { id: 3, color: "bg-yellow-500", activeColor: "bg-yellow-400" },
  ]

  // Initialize game
  useEffect(() => {
    generatePattern()
  }, [])

  // Show pattern
  useEffect(() => {
    if (gamePhase !== "watch" || !pattern.length) return

    setIsShowingPattern(true)

    let step = 0
    const interval = setInterval(() => {
      setCurrentStep(step)

      step++
      if (step >= pattern.length) {
        clearInterval(interval)
        setTimeout(() => {
          setCurrentStep(-1)
          setIsShowingPattern(false)
          setGamePhase("repeat")
        }, 500)
      }
    }, 800)

    return () => clearInterval(interval)
  }, [gamePhase, pattern])

  // Check player pattern
  useEffect(() => {
    if (gamePhase !== "repeat" || !playerPattern.length) return

    const lastIndex = playerPattern.length - 1

    if (playerPattern[lastIndex] !== pattern[lastIndex]) {
      // Wrong pattern
      setGamePhase("failure")
      setTimeout(() => {
        onComplete(false)
      }, 1500)
      return
    }

    if (playerPattern.length === pattern.length) {
      // Correct pattern
      if (round >= 3) {
        // Game complete
        setGamePhase("success")
        setTimeout(() => {
          onComplete(true)
        }, 1500)
      } else {
        // Next round
        setRound((prev) => prev + 1)
        setPlayerPattern([])
        setTimeout(() => {
          generatePattern(pattern)
          setGamePhase("watch")
        }, 1000)
      }
    }
  }, [playerPattern, pattern, gamePhase, round, onComplete])

  const generatePattern = (existingPattern: number[] = []) => {
    const newPattern = [...existingPattern]

    // Add 2 new steps per round
    for (let i = 0; i < 2; i++) {
      newPattern.push(Math.floor(Math.random() * 4))
    }

    setPattern(newPattern)
  }

  const handleColorClick = (colorId: number) => {
    if (gamePhase !== "repeat") return

    setPlayerPattern((prev) => [...prev, colorId])
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-purple-300 font-bold">Round: {round}/3</div>
        <div className="flex items-center bg-gray-900 px-3 py-1 rounded-full">
          {gamePhase === "watch" ? (
            <span className="text-blue-400 font-medium">Watch the pattern</span>
          ) : gamePhase === "repeat" ? (
            <span className="text-green-400 font-medium">Repeat the pattern</span>
          ) : gamePhase === "success" ? (
            <span className="text-green-400 font-medium">Success!</span>
          ) : (
            <span className="text-red-400 font-medium">Failed!</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
        {colors.map((color) => (
          <motion.div
            key={color.id}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square rounded-lg cursor-pointer ${
              isShowingPattern && currentStep === pattern.findIndex((p) => p === color.id)
                ? color.activeColor
                : color.color
            } opacity-90 hover:opacity-100`}
            onClick={() => handleColorClick(color.id)}
          />
        ))}
      </div>

      <div className="flex justify-center space-x-2">
        {pattern.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < playerPattern.length
                ? playerPattern[index] === pattern[index]
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-gray-600"
            }`}
          />
        ))}
      </div>

      {gamePhase === "success" && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-900/50 mb-2">
            <Check className="h-6 w-6 text-green-400" />
          </div>
          <p className="text-green-400 font-bold">Pattern complete!</p>
        </div>
      )}

      {gamePhase === "failure" && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-900/50 mb-2">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-red-400 font-bold">Wrong pattern!</p>
        </div>
      )}
    </div>
  )
}
