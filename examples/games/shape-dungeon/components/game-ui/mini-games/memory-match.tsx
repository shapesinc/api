"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"

interface MemoryMatchGameProps {
  onComplete: (success: boolean) => void
}

interface Card {
  id: number
  value: string
  flipped: boolean
  matched: boolean
}

export default function MemoryMatchGame({ onComplete }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [gameStarted, setGameStarted] = useState<boolean>(false)

  // Card symbols
  const symbols = ["🗡️", "🛡️", "🧪", "💎", "🔮", "🏹", "🪄", "🧙"]

  // Initialize game
  useEffect(() => {
    const cardValues = [...symbols, ...symbols]
    const shuffledCards = cardValues
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false,
      }))

    setCards(shuffledCards)
    setMatchedPairs(0)
    setFlippedCards([])
    setTimeLeft(60)
    setGameStarted(true)
  }, [])

  // Timer
  useEffect(() => {
    if (!gameStarted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onComplete(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, onComplete])

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards

      if (cards[first].value === cards[second].value) {
        // Match found
        setCards((prev) =>
          prev.map((card) => (card.id === first || card.id === second ? { ...card, matched: true } : card)),
        )
        setMatchedPairs((prev) => prev + 1)
        setFlippedCards([])
      } else {
        // No match, flip back after delay
        const timer = setTimeout(() => {
          setCards((prev) =>
            prev.map((card) => (card.id === first || card.id === second ? { ...card, flipped: false } : card)),
          )
          setFlippedCards([])
        }, 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [flippedCards, cards])

  // Check for win condition
  useEffect(() => {
    if (matchedPairs === symbols.length && gameStarted) {
      onComplete(true)
    }
  }, [matchedPairs, gameStarted, onComplete, symbols.length])

  const handleCardClick = (id: number) => {
    // Ignore if already flipped or matched
    if (cards[id].flipped || cards[id].matched || flippedCards.length >= 2) return

    // Flip the card
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, flipped: true } : card)))

    // Add to flipped cards
    setFlippedCards((prev) => [...prev, id])
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-purple-300 font-bold">
          Pairs: {matchedPairs}/{symbols.length}
        </div>
        <div className="flex items-center bg-gray-900 px-3 py-1 rounded-full">
          <Clock className="h-4 w-4 text-yellow-400 mr-2" />
          <span className={`font-mono ${timeLeft <= 10 ? "text-red-400" : "text-yellow-400"}`}>{timeLeft}s</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
            whileTap={{ scale: card.flipped || card.matched ? 1 : 0.95 }}
            className={`aspect-square rounded-lg cursor-pointer ${
              !card.flipped && !card.matched ? "bg-purple-900/50 hover:bg-purple-800/50" : "bg-transparent"
            }`}
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={`w-full h-full flex items-center justify-center rounded-lg transition-all duration-300 ${
                card.flipped || card.matched
                  ? "bg-gray-800/80 border border-purple-500"
                  : "bg-purple-900/50 border border-purple-700"
              }`}
            >
              {(card.flipped || card.matched) && <span className="text-3xl">{card.value}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
