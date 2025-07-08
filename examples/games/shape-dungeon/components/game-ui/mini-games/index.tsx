"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Brain } from "lucide-react"
import { motion } from "framer-motion"
import MemoryMatchGame from "./memory-match"
import ReactionTestGame from "./reaction-test"
import PatternMatchGame from "./pattern-match"

interface BossMiniGameProps {
  bossName: string
  miniGameType: string
  onComplete: (success: boolean) => void
}

export default function BossMiniGame({ bossName, miniGameType, onComplete }: BossMiniGameProps) {
  const [gameState, setGameState] = useState<"intro" | "playing" | "success" | "failure">("intro")

  const handleStartGame = () => {
    setGameState("playing")
  }

  const handleGameComplete = (success: boolean) => {
    setGameState(success ? "success" : "failure")

    setTimeout(() => {
      onComplete(success)
    }, 3000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {gameState === "intro" && (
        <Card className="bg-black/50 border-purple-900/50 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-300">Boss Challenge</CardTitle>
            <CardDescription className="text-gray-400">Complete the mini-game to claim your reward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-10 w-10 text-purple-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">{bossName}'s Challenge</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                {miniGameType === "memoryMatch" && "Test your memory by matching pairs of cards before time runs out."}
                {miniGameType === "reactionTest" && "Test your reflexes by clicking targets as quickly as possible."}
                {miniGameType === "patternMatch" && "Memorize and repeat the pattern to prove your worth."}
              </p>
              <Button className="bg-purple-900 hover:bg-purple-800 text-white" onClick={handleStartGame}>
                Begin Challenge
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {gameState === "playing" && (
        <div className="bg-black/50 border border-purple-900/50 rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-purple-300">
              {miniGameType === "memoryMatch" && "Memory Match Challenge"}
              {miniGameType === "reactionTest" && "Reaction Test Challenge"}
              {miniGameType === "patternMatch" && "Pattern Match Challenge"}
            </h2>
            <p className="text-gray-400">
              {miniGameType === "memoryMatch" && "Find all matching pairs before time runs out"}
              {miniGameType === "reactionTest" && "Click on the targets as quickly as possible"}
              {miniGameType === "patternMatch" && "Memorize and repeat the pattern correctly"}
            </p>
          </div>

          {miniGameType === "memoryMatch" && <MemoryMatchGame onComplete={handleGameComplete} />}

          {miniGameType === "reactionTest" && <ReactionTestGame onComplete={handleGameComplete} />}

          {miniGameType === "patternMatch" && <PatternMatchGame onComplete={handleGameComplete} />}
        </div>
      )}

      {gameState === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-green-900/50 rounded-full flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-green-300" />
          </div>
          <h2 className="text-2xl font-bold text-green-300 mb-2">Challenge Complete!</h2>
          <p className="text-gray-300 mb-4">You've successfully completed the challenge and earned a reward.</p>
          <p className="text-sm text-gray-400">Returning to dungeon...</p>
        </motion.div>
      )}

      {gameState === "failure" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-red-900/30 border border-red-700 rounded-lg p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <X className="h-10 w-10 text-red-300" />
          </div>
          <h2 className="text-2xl font-bold text-red-300 mb-2">Challenge Failed</h2>
          <p className="text-gray-300 mb-4">You didn't complete the challenge, but the boss is still defeated.</p>
          <p className="text-sm text-gray-400">Returning to dungeon...</p>
        </motion.div>
      )}
    </div>
  )
}
