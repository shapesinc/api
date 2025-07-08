"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sword, Skull, Map, ArrowRight, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getDungeonLevel } from "@/lib/game-data"

interface DungeonMapProps {
  currentLevel: number
  onStartCombat: (isBoss: boolean) => void
  exploredRooms: number
  totalRooms: number
  unlockedLevels: number[]
  surpriseLevels: number[]
  onLevelSelect: (level: number) => void
  playerLevel: number
}

export default function DungeonMap({
  currentLevel,
  onStartCombat,
  exploredRooms,
  totalRooms,
  unlockedLevels,
  surpriseLevels,
  onLevelSelect,
  playerLevel,
}: DungeonMapProps) {
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [showLevelSelector, setShowLevelSelector] = useState(false)

  const currentDungeon = getDungeonLevel(currentLevel)

  // Generate random rooms for the current dungeon level
  useEffect(() => {
    const roomTypes = [
      { type: "enemy", name: "Dark Corridor", description: "A narrow passage with echoing sounds." },
      { type: "enemy", name: "Flooded Chamber", description: "Water drips from the ceiling in this damp room." },
      { type: "enemy", name: "Collapsed Hall", description: "Rubble and debris make navigation difficult." },
      { type: "enemy", name: "Fungal Grove", description: "Bioluminescent fungi cover the walls." },
      { type: "enemy", name: "Ancient Library", description: "Dusty tomes line the walls of this forgotten room." },
      { type: "enemy", name: "Armory", description: "Rusted weapons and armor hang on the walls." },
      { type: "enemy", name: "Torture Chamber", description: "Instruments of pain still litter this grim room." },
      { type: "enemy", name: "Dining Hall", description: "A long-abandoned feast still sits on the tables." },
    ]

    // Shuffle room types
    const shuffledRooms = [...roomTypes].sort(() => Math.random() - 0.5)

    // Take the first (totalRooms - 1) rooms and add the boss room
    const generatedRooms = shuffledRooms.slice(0, totalRooms - 1).map((room, index) => ({
      id: index + 1,
      ...room,
      explored: false,
    }))

    // Add boss room
    generatedRooms.push({
      id: totalRooms,
      type: "boss",
      name: currentDungeon.boss.name,
      description: currentDungeon.boss.description,
      explored: false,
    })

    setRooms(generatedRooms)
  }, [currentLevel, totalRooms, currentDungeon.boss.name, currentDungeon.boss.description])

  // Mark rooms as explored based on exploredRooms count
  useEffect(() => {
    if (exploredRooms > 0) {
      setRooms((prevRooms) =>
        prevRooms.map((room, index) => (index < exploredRooms ? { ...room, explored: true } : room)),
      )
    }
  }, [exploredRooms])

  const handleRoomSelect = (roomId: number) => {
    // Can't select rooms that are beyond the explored rooms + 1
    if (roomId > exploredRooms + 1) return

    setSelectedRoom(roomId)
  }

  const handleEnterRoom = () => {
    if (selectedRoom === null) return

    const room = rooms.find((r) => r.id === selectedRoom)
    if (!room) return

    if (room.type === "boss") {
      onStartCombat(true)
    } else {
      onStartCombat(false)
    }
  }

  const toggleLevelSelector = () => {
    setShowLevelSelector(!showLevelSelector)
  }

  // Check if player meets level requirements for current dungeon
  const meetsLevelRequirement = playerLevel >= currentLevel * 2 - 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 shadow-lg">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <CardTitle className="text-2xl font-cinzel text-gray-900 dark:text-purple-300">
                  {currentDungeon.name}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {currentDungeon.description}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLevelSelector}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30"
                >
                  <Map className="h-4 w-4 mr-1" />
                  Level {currentLevel}
                </Button>
                {!meetsLevelRequirement && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Recommended Level: {currentLevel * 2 - 1}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Level Selector */}
            <AnimatePresence>
              {showLevelSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Select Dungeon Level</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Button
                          key={level}
                          variant={currentLevel === level ? "default" : "outline"}
                          size="sm"
                          disabled={!unlockedLevels.includes(level)}
                          onClick={() => {
                            onLevelSelect(level)
                            setShowLevelSelector(false)
                          }}
                          className={`relative ${
                            surpriseLevels.includes(level) ? "border-yellow-400 dark:border-yellow-600" : ""
                          }`}
                        >
                          {level}
                          {surpriseLevels.includes(level) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 dark:bg-yellow-600 rounded-full" />
                          )}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <p>Defeat the boss of each level to unlock the next.</p>
                      <p className="mt-1">
                        <span className="inline-block w-3 h-3 bg-yellow-400 dark:bg-yellow-600 rounded-full mr-1" />
                        Surprise levels have special challenges and rewards!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dungeon Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dungeon Progress</span>
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {exploredRooms}/{totalRooms} Rooms
                </span>
              </div>
              <Progress value={(exploredRooms / totalRooms) * 100} className="h-2 bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Dungeon Map */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: room.id <= exploredRooms + 1 ? 1.03 : 1 }}
                  whileTap={{ scale: room.id <= exploredRooms + 1 ? 0.98 : 1 }}
                  className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                    room.id <= exploredRooms
                      ? "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
                      : room.id === exploredRooms + 1
                        ? selectedRoom === room.id
                          ? "bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-700"
                          : "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700"
                        : "bg-gray-100/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => handleRoomSelect(room.id)}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div>
                      <h3
                        className={`text-sm sm:text-base font-bold ${room.explored ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}
                      >
                        {room.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{room.description}</p>
                    </div>
                    <div
                      className={`p-2 rounded-full ${
                        room.type === "boss"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {room.type === "boss" ? <Skull className="h-4 w-4" /> : <Sword className="h-4 w-4" />}
                    </div>
                  </div>

                  {room.explored && (
                    <Badge
                      variant="outline"
                      className="mt-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      Explored
                    </Badge>
                  )}

                  {room.id === exploredRooms + 1 && selectedRoom === room.id && (
                    <div className="mt-3 text-right">
                      <Button
                        size="sm"
                        onClick={handleEnterRoom}
                        className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
                      >
                        Enter
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 shadow-lg">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-xl font-cinzel text-gray-900 dark:text-purple-300">Dungeon Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</h3>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-4 h-4 rounded-full mr-1 ${
                      level <= currentDungeon.difficulty ? "bg-red-500 dark:bg-red-600" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {currentDungeon.difficulty === 1
                    ? "Easy"
                    : currentDungeon.difficulty === 2
                      ? "Moderate"
                      : currentDungeon.difficulty === 3
                        ? "Challenging"
                        : currentDungeon.difficulty === 4
                          ? "Hard"
                          : "Extreme"}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Boss</h3>
              <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-3">
                    <Skull className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{currentDungeon.boss.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{currentDungeon.boss.description}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enemies</h3>
              <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                <ul className="space-y-1 sm:space-y-2">
                  {currentDungeon.enemies.map((enemy, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-600 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {enemy.replace("_", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedRoom !== null && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selected Room</h3>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {rooms.find((r) => r.id === selectedRoom)?.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {rooms.find((r) => r.id === selectedRoom)?.description}
                  </p>
                  {rooms.find((r) => r.id === selectedRoom)?.type === "boss" && (
                    <Badge className="mt-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                      Boss Room
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 sm:p-6 pt-0 sm:pt-0">
            {selectedRoom !== null && selectedRoom <= exploredRooms + 1 && (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
                onClick={handleEnterRoom}
              >
                {rooms.find((r) => r.id === selectedRoom)?.type === "boss" ? (
                  <>
                    <Skull className="mr-2 h-4 w-4" />
                    Challenge Boss
                  </>
                ) : (
                  <>
                    <Sword className="mr-2 h-4 w-4" />
                    Enter Room
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
