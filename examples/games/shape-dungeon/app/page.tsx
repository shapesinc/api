"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sword, Settings, User, Trophy } from "lucide-react"
import GameTitle from "@/components/game-ui/game-title"
import UsernameForm from "@/components/game-ui/username-form"
import { unlockAchievement } from "@/lib/achievements"

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if username exists in localStorage
    const savedUsername = localStorage.getItem("playerUsername")
    if (savedUsername) {
      setUsername(savedUsername)
    }
    setIsLoading(false)
  }, [])

  const handleUsernameSet = (name: string) => {
    setUsername(name)
    // Unlock the first achievement
    unlockAchievement("first_steps")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black dark:from-gray-900 dark:to-black">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white p-4 font-sans">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <GameTitle />

        {!username ? (
          <UsernameForm onComplete={handleUsernameSet} />
        ) : (
          <div className="mt-8 w-full max-w-md p-6 bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 rounded-lg shadow-lg dark:shadow-[0_0_15px_rgba(128,0,255,0.3)] backdrop-blur-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-purple-300">Welcome, {username}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Prepare to face the challenges that await in the depths below
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/game" className="w-full">
                <Button
                  variant="default"
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 text-white border border-purple-400 dark:border-purple-700 h-12"
                >
                  <Sword className="mr-2 h-5 w-5" />
                  Enter the Dungeon
                </Button>
              </Link>

              <Link href="/character" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-purple-400 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 h-12"
                >
                  <User className="mr-2 h-5 w-5" />
                  Character Creation
                </Button>
              </Link>

              <Link href="/achievements" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-purple-400 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 h-12"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Achievements
                </Button>
              </Link>

              <Link href="/settings" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-purple-400 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 h-12"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Game Settings
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
              <p>Version 2.0.0 | The Shape Dungeon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
