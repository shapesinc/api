"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import AchievementsPanel from "@/components/game-ui/achievements-panel"

export default function AchievementsPage() {
  const [username, setUsername] = useState<string>("Adventurer")

  useEffect(() => {
    const savedUsername = localStorage.getItem("playerUsername")
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Menu
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4 text-purple-300">Achievements</h1>
        </div>

        <div className="mb-4 p-4 bg-black/50 border border-purple-900/50 rounded-lg">
          <h2 className="text-xl font-bold text-purple-300">{username}'s Journey</h2>
          <p className="text-gray-400 mt-1">
            Track your accomplishments and unlock rewards as you explore the Shape Dungeon
          </p>
        </div>

        <AchievementsPanel />
      </div>
    </div>
  )
}
