"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Achievement, loadAchievements } from "@/lib/achievements"
import {
  Trophy,
  Footprints,
  Swords,
  Skull,
  Shield,
  Map,
  ArrowUp,
  Gamepad2,
  Gem,
  MessageSquare,
  Lock,
} from "lucide-react"
import { motion } from "framer-motion"

export default function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    setAchievements(loadAchievements())
  }, [])

  const getIconComponent = (iconName: string) => {
    const iconProps = { className: "h-5 w-5" }
    switch (iconName) {
      case "Footprints":
        return <Footprints {...iconProps} />
      case "Swords":
        return <Swords {...iconProps} />
      case "Skull":
        return <Skull {...iconProps} />
      case "Shield":
        return <Shield {...iconProps} />
      case "Map":
        return <Map {...iconProps} />
      case "ArrowUp":
        return <ArrowUp {...iconProps} />
      case "Gamepad2":
        return <Gamepad2 {...iconProps} />
      case "Gem":
        return <Gem {...iconProps} />
      case "MessageSquare":
        return <MessageSquare {...iconProps} />
      default:
        return <Trophy {...iconProps} />
    }
  }

  const filteredAchievements = achievements.filter((achievement) => {
    if (activeTab === "all") return true
    if (activeTab === "unlocked") return achievement.unlocked
    if (activeTab === "locked") return !achievement.unlocked
    return true
  })

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100)

  return (
    <Card className="bg-black/50 border-purple-900/50 text-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl text-purple-300">Achievements</CardTitle>
            <CardDescription className="text-gray-400">Track your progress through the dungeon</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Completion</div>
            <div className="text-xl font-bold text-purple-300">{completionPercentage}%</div>
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2 bg-gray-800" />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 text-gray-400 mb-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-900 data-[state=active]:text-white">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unlocked" className="data-[state=active]:bg-purple-900 data-[state=active]:text-white">
              Unlocked ({unlockedCount})
            </TabsTrigger>
            <TabsTrigger value="locked" className="data-[state=active]:bg-purple-900 data-[state=active]:text-white">
              Locked ({totalCount - unlockedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="space-y-3">
              {filteredAchievements.map((achievement) => (
                <AchievementItem key={achievement.id} achievement={achievement} getIconComponent={getIconComponent} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unlocked" className="mt-0">
            <div className="space-y-3">
              {filteredAchievements.map((achievement) => (
                <AchievementItem key={achievement.id} achievement={achievement} getIconComponent={getIconComponent} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="mt-0">
            <div className="space-y-3">
              {filteredAchievements.map((achievement) => (
                <AchievementItem key={achievement.id} achievement={achievement} getIconComponent={getIconComponent} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface AchievementItemProps {
  achievement: Achievement
  getIconComponent: (iconName: string) => React.ReactNode
}

function AchievementItem({ achievement, getIconComponent }: AchievementItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-3 rounded-lg border ${
        achievement.unlocked ? "bg-purple-900/20 border-purple-700" : "bg-gray-900/30 border-gray-800"
      }`}
    >
      <div className="flex items-start">
        <div
          className={`p-2 rounded-full mr-3 ${
            achievement.unlocked ? "bg-purple-900/50 text-purple-300" : "bg-gray-800 text-gray-500"
          }`}
        >
          {achievement.unlocked ? getIconComponent(achievement.icon) : <Lock className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold ${achievement.unlocked ? "text-white" : "text-gray-500"}`}>{achievement.name}</h3>
            {achievement.unlocked && (
              <Badge variant="outline" className="border-purple-700 text-purple-300 text-xs">
                Unlocked
              </Badge>
            )}
            {achievement.secret && !achievement.unlocked && (
              <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                Secret
              </Badge>
            )}
          </div>
          <p className={`text-sm ${achievement.unlocked ? "text-gray-400" : "text-gray-600"}`}>
            {achievement.secret && !achievement.unlocked ? "???" : achievement.description}
          </p>
          {achievement.maxProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={achievement.unlocked ? "text-gray-400" : "text-gray-600"}>Progress</span>
                <span className={achievement.unlocked ? "text-purple-300" : "text-gray-500"}>
                  {achievement.progress}/{achievement.maxProgress}
                </span>
              </div>
              <Progress value={(achievement.progress! / achievement.maxProgress!) * 100} className="h-1 bg-gray-800" />
            </div>
          )}
          {achievement.timestamp && (
            <div className="mt-1 text-xs text-gray-500">
              Unlocked on {new Date(achievement.timestamp).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
