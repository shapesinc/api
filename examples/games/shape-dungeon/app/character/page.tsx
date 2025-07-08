"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Sword, Shield, Zap, Heart, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CharacterPortrait from "@/components/game-ui/character-portrait"
import { characterClasses } from "@/lib/game-data"

export default function CharacterPage() {
  const { toast } = useToast()
  const [selectedClass, setSelectedClass] = useState("warrior")
  const [attributePoints, setAttributePoints] = useState({
    strength: 5,
    defense: 5,
    magic: 5,
    health: 5,
  })
  const [playerLevel, setPlayerLevel] = useState(1)
  const [showTutorial, setShowTutorial] = useState(false)

  const totalPoints = Object.values(attributePoints).reduce((a, b) => a + b, 0)
  const maxPoints = 25

  useEffect(() => {
    const savedCharacter = localStorage.getItem("character")
    if (savedCharacter) {
      try {
        const character = JSON.parse(savedCharacter)
        setSelectedClass(character.class || "warrior")
        setAttributePoints(character.attributes || attributePoints)
      } catch (error) {
        console.error("Error parsing saved character:", error)
      }
    }

    const savedGameState = localStorage.getItem("gameState")
    if (savedGameState) {
      try {
        const gameState = JSON.parse(savedGameState)
        setPlayerLevel(gameState.playerLevel || 1)
      } catch (error) {
        console.error("Error parsing game state:", error)
      }
    }

    const settings = JSON.parse(localStorage.getItem("gameSettings") || '{"showTutorials": true}')
    if (settings.showTutorials) {
      setShowTutorial(true)
    }
  }, [])

  const handleAttributeChange = (attribute: string, value: number[]) => {
    const newValue = value[0]
    const currentTotal = totalPoints - attributePoints[attribute as keyof typeof attributePoints]

    if (currentTotal + newValue > maxPoints) {
      toast({
        title: "Maximum points reached",
        description: "You cannot allocate more than 25 total attribute points.",
        variant: "destructive",
      })
      return
    }

    setAttributePoints((prev) => ({
      ...prev,
      [attribute]: newValue,
    }))
  }

  const handleClassSelect = (classId: string) => {
    const requiredLevel = 3 

    if (selectedClass !== classId && playerLevel < requiredLevel) {
      toast({
        title: "Level too low",
        description: `You need to be level ${requiredLevel} to change your class.`,
        variant: "destructive",
      })
      return
    }

    setSelectedClass(classId)
  }

  const handleSaveCharacter = () => {
    localStorage.setItem(
      "character",
      JSON.stringify({
        class: selectedClass,
        attributes: attributePoints,
        level: playerLevel,
        experience: 0,
      }),
    )

    toast({
      title: "Character saved!",
      description: "Your character has been created successfully.",
    })
  }

  const closeTutorial = () => {
    setShowTutorial(false)

    const settings = JSON.parse(localStorage.getItem("gameSettings") || "{}")
    settings.showTutorials = false
    localStorage.setItem("gameSettings", JSON.stringify(settings))
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold ml-4 text-purple-300">Character Creation</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/50 border-purple-900/50 text-white col-span-1">
            <CardHeader>
              <CardTitle className="text-purple-300">Character Preview</CardTitle>
              <CardDescription className="text-gray-400">Your adventurer</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <CharacterPortrait classType={selectedClass} />

              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-purple-300 capitalize">{selectedClass}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {characterClasses.find((c) => c.id === selectedClass)?.description}
                </p>
              </div>

              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sword className="h-4 w-4 text-red-400 mr-2" />
                    <span className="text-gray-300">Strength</span>
                  </div>
                  <span className="text-red-400 font-bold">{attributePoints.strength}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-400 mr-2" />
                    <span className="text-gray-300">Defense</span>
                  </div>
                  <span className="text-blue-400 font-bold">{attributePoints.defense}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                    <span className="text-gray-300">Magic</span>
                  </div>
                  <span className="text-yellow-400 font-bold">{attributePoints.magic}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-gray-300">Health</span>
                  </div>
                  <span className="text-green-400 font-bold">{attributePoints.health}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-purple-900/50 text-white col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-purple-300">Customize Character</CardTitle>
              <CardDescription className="text-gray-400">Points remaining: {maxPoints - totalPoints}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="class">
                <TabsList className="bg-gray-800 text-gray-400">
                  <TabsTrigger
                    value="class"
                    className="data-[state=active]:bg-purple-900 data-[state=active]:text-white"
                  >
                    Class
                  </TabsTrigger>
                  <TabsTrigger
                    value="attributes"
                    className="data-[state=active]:bg-purple-900 data-[state=active]:text-white"
                  >
                    Attributes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="class" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {characterClasses.map((charClass) => {
                      const isLocked = selectedClass !== charClass.id && playerLevel < 3

                      return (
                        <div
                          key={charClass.id}
                          className={`p-4 rounded-lg cursor-pointer transition-all border relative ${
                            selectedClass === charClass.id
                              ? "border-purple-500 bg-purple-900/30"
                              : isLocked
                                ? "border-gray-700 bg-gray-800/30 opacity-60"
                                : "border-gray-700 bg-gray-800/30 hover:bg-gray-700/30"
                          }`}
                          onClick={() => handleClassSelect(charClass.id)}
                        >
                          <div className="flex items-center">
                            <div className="mr-3">{charClass.icon}</div>
                            <div>
                              <h3 className="font-bold capitalize">{charClass.id}</h3>
                              <p className="text-xs text-gray-400">{charClass.specialty}</p>
                            </div>
                          </div>

                          {isLocked && (
                            <div className="absolute top-2 right-2 text-gray-400">
                              <Lock className="h-4 w-4" />
                              <span className="text-xs ml-1">Lvl 3+</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {playerLevel < 3 && (
                    <p className="text-sm text-yellow-400 mt-2">
                      Reach level 3 to unlock the ability to change your class.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="attributes" className="mt-4 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center text-gray-300">
                        <Sword className="h-4 w-4 text-red-400 mr-2" />
                        Strength
                      </label>
                      <span className="text-red-400 font-bold">{attributePoints.strength}</span>
                    </div>
                    <Slider
                      value={[attributePoints.strength]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleAttributeChange("strength", value)}
                      className="[&>span:first-child]:bg-red-900/50 [&>span:first-child_span]:bg-red-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Affects damage and carrying capacity</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center text-gray-300">
                        <Shield className="h-4 w-4 text-blue-400 mr-2" />
                        Defense
                      </label>
                      <span className="text-blue-400 font-bold">{attributePoints.defense}</span>
                    </div>
                    <Slider
                      value={[attributePoints.defense]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleAttributeChange("defense", value)}
                      className="[&>span:first-child]:bg-blue-900/50 [&>span:first-child_span]:bg-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Reduces damage taken from enemies</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center text-gray-300">
                        <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                        Magic
                      </label>
                      <span className="text-yellow-400 font-bold">{attributePoints.magic}</span>
                    </div>
                    <Slider
                      value={[attributePoints.magic]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleAttributeChange("magic", value)}
                      className="[&>span:first-child]:bg-yellow-900/50 [&>span:first-child_span]:bg-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Increases spell power and mana pool</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center text-gray-300">
                        <Heart className="h-4 w-4 text-green-400 mr-2" />
                        Health
                      </label>
                      <span className="text-green-400 font-bold">{attributePoints.health}</span>
                    </div>
                    <Slider
                      value={[attributePoints.health]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleAttributeChange("health", value)}
                      className="[&>span:first-child]:bg-green-900/50 [&>span:first-child_span]:bg-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Determines maximum health points</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="border-purple-700 text-purple-300 hover:bg-purple-900/30">
                Reset
              </Button>
              <Button className="bg-purple-900 hover:bg-purple-800 text-white" onClick={handleSaveCharacter}>
                Save Character
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Character Creation Tutorial */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Character Creation</h2>

            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Welcome to character creation! Here you can customize your adventurer for the Shape Dungeon.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Class:</strong> Choose your character's class. Each class has unique abilities and playstyles.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Attributes:</strong> Distribute points among Strength, Defense, Magic, and Health to customize
                your character's abilities.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Note:</strong> You'll need to reach level 3 before you can change your class.
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={closeTutorial}>Got it!</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
