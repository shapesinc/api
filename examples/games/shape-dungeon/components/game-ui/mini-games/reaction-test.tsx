"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Clock, Target } from "lucide-react"

interface ReactionTestGameProps {
  onComplete: (success: boolean) => void
}

interface TargetProps {
  id: number
  x: number
  y: number
  size: number
  hit: boolean
}

export default function ReactionTestGame({ onComplete }: ReactionTestGameProps) {
  const [targets, setTargets] = useState<TargetProps[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameStarted, setGameStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const targetCount = 15
  const requiredScore = 10

  // Initialize game
  useEffect(() => {
    setGameStarted(true)
    generateTargets()
  }, [])

  // Timer
  useEffect(() => {
    if (!gameStarted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Check if player hit enough targets
          onComplete(score >= requiredScore)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, onComplete, score, requiredScore])

  const generateTargets = () => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    const newTargets: TargetProps[] = []

    for (let i = 0; i < targetCount; i++) {
      const size = Math.floor(Math.random() * 30) + 30 // 30-60px

      // Ensure targets don't overlap too much
      let validPosition = false
      let x = 0
      let y = 0

      while (!validPosition) {
        x = Math.floor(Math.random() * (containerWidth - size))
        y = Math.floor(Math.random() * (containerHeight - size))

        validPosition = true

        // Check against existing targets
        for (const target of newTargets) {
          const distance = Math.sqrt(Math.pow(target.x - x, 2) + Math.pow(target.y - y, 2))

          if (distance < (target.size + size) / 1.5) {
            validPosition = false
            break
          }
        }
      }

      newTargets.push({
        id: i,
        x,
        y,
        size,
        hit: false,
      })
    }

    setTargets(newTargets)
  }

  const handleTargetClick = (id: number) => {
    setTargets((prev) => prev.map((target) => (target.id === id ? { ...target, hit: true } : target)))

    setScore((prev) => prev + 1)

    // Check if all targets are hit
    if (score + 1 >= requiredScore) {
      onComplete(true)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-purple-300 font-bold">
          Targets: {score}/{requiredScore}
        </div>
        <div className="flex items-center bg-gray-900 px-3 py-1 rounded-full">
          <Clock className="h-4 w-4 text-yellow-400 mr-2" />
          <span className={`font-mono ${timeLeft <= 10 ? "text-red-400" : "text-yellow-400"}`}>{timeLeft}s</span>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-[400px] bg-gray-900/50 rounded-lg overflow-hidden">
        {targets.map(
          (target) =>
            !target.hit && (
              <motion.div
                key={target.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute cursor-pointer"
                style={{
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                }}
                onClick={() => handleTargetClick(target.id)}
              >
                <div className="w-full h-full rounded-full bg-red-500/80 flex items-center justify-center">
                  <Target className="w-1/2 h-1/2 text-white" />
                </div>
              </motion.div>
            ),
        )}
      </div>
    </div>
  )
}
