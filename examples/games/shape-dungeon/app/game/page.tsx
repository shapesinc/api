"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Skull, Trophy, ShoppingBag, Menu, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DungeonMap from "@/components/game-ui/dungeon-map"
import CombatInterface from "@/components/game-ui/combat-interface"
import BossMiniGame from "@/components/game-ui/mini-games"
import { getDungeonLevel, getRandomEnemy } from "@/lib/game-data"
import { unlockAchievement, updateAchievementProgress } from "@/lib/achievements"
import UsernameForm from "@/components/game-ui/username-form"
import HealthBar from "@/components/game-ui/health-bar"
import type { StoreItem } from "@/components/game-ui/store"
import { motion, AnimatePresence } from "framer-motion"

export default function GamePage() {
  const { toast } = useToast()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [gameState, setGameState] = useState({
    currentScreen: "map", // map, combat, boss, miniGame
    currentLevel: 1,
    playerHealth: 100,
    playerMaxHealth: 100,
    playerMana: 50,
    playerMaxMana: 50,
    playerExperience: 0,
    playerLevel: 1,
    playerGold: 100,
    currentEnemy: null as any,
    isBossFight: false,
    inventory: [] as StoreItem[],
    exploredRooms: 0,
    totalRooms: 5,
    unlockedLevels: [1],
    surpriseLevels: [] as number[],
    deathCooldown: 0, 
    lastDeathTime: 0, 
    gameSettings: {
      difficulty: "normal",
      showTutorials: true,
      enablePixelation: false,
      enableCameraShake: true,
      username: "Adventurer",
    },
  })

  
  useEffect(() => {

    const savedUsername = localStorage.getItem("playerUsername")
    if (savedUsername) {
      setUsername(savedUsername)
      setGameState((prev) => ({
        ...prev,
        gameSettings: {
          ...prev.gameSettings,
          username: savedUsername,
        },
      }))
    }

    const savedSettings = localStorage.getItem("gameSettings")
    if (savedSettings) {
      setGameState((prev) => ({
        ...prev,
        gameSettings: JSON.parse(savedSettings),
      }))
    }

    const savedCharacter = localStorage.getItem("character")
    if (savedCharacter) {
      const character = JSON.parse(savedCharacter)
      setGameState((prev) => ({
        ...prev,
        playerHealth: character.attributes.health * 20,
        playerMaxHealth: character.attributes.health * 20,
        playerMana: character.attributes.magic * 10,
        playerMaxMana: character.attributes.magic * 10,
        playerLevel: character.level,
        playerExperience: character.experience,
      }))
    }

  
    const savedGameState = localStorage.getItem("gameState")
    if (savedGameState) {
      try {
        const parsedState = JSON.parse(savedGameState)
        setGameState((prev) => ({
          ...prev,
          currentLevel: parsedState.currentLevel || prev.currentLevel,
          playerHealth: parsedState.playerHealth || prev.playerHealth,
          playerMaxHealth: parsedState.playerMaxHealth || prev.playerMaxHealth,
          playerMana: parsedState.playerMana || prev.playerMana,
          playerMaxMana: parsedState.playerMaxMana || prev.playerMaxMana,
          playerExperience: parsedState.playerExperience || prev.playerExperience,
          playerLevel: parsedState.playerLevel || prev.playerLevel,
          playerGold: parsedState.playerGold || prev.playerGold,
          inventory: parsedState.inventory || prev.inventory,
          unlockedLevels: parsedState.unlockedLevels || [1],
          surpriseLevels: parsedState.surpriseLevels || [],
          deathCooldown: parsedState.deathCooldown || 0,
          lastDeathTime: parsedState.lastDeathTime || 0,
        }))
      } catch (error) {
        console.error("Error parsing saved game state:", error)
      }
    }

    
    const surpriseLevels: number[] = []
    for (let i = 1; i <= 5; i++) {
      if (Math.random() < 0.2) {
        surpriseLevels.push(i)
      }
    }

    setGameState((prev) => ({
      ...prev,
      surpriseLevels: prev.surpriseLevels.length > 0 ? prev.surpriseLevels : surpriseLevels,
    }))

    setIsLoading(false)


    const settings = JSON.parse(localStorage.getItem("gameSettings") || '{"showTutorials": true}')
    if (settings.showTutorials) {
      setShowTutorial(true)
    }
  }, [])

  
  useEffect(() => {
    if (isLoading) return

    const stateToSave = {
      currentLevel: gameState.currentLevel,
      playerHealth: gameState.playerHealth,
      playerMaxHealth: gameState.playerMaxHealth,
      playerMana: gameState.playerMana,
      playerMaxMana: gameState.playerMaxMana,
      playerExperience: gameState.playerExperience,
      playerLevel: gameState.playerLevel,
      playerGold: gameState.playerGold,
      inventory: gameState.inventory,
      unlockedLevels: gameState.unlockedLevels,
      surpriseLevels: gameState.surpriseLevels,
      deathCooldown: gameState.deathCooldown,
      lastDeathTime: gameState.lastDeathTime,
    }

    localStorage.setItem("gameState", JSON.stringify(stateToSave))
  }, [
    gameState.currentLevel,
    gameState.playerHealth,
    gameState.playerMaxHealth,
    gameState.playerMana,
    gameState.playerMaxMana,
    gameState.playerExperience,
    gameState.playerLevel,
    gameState.playerGold,
    gameState.inventory,
    gameState.unlockedLevels,
    gameState.surpriseLevels,
    gameState.deathCooldown,
    gameState.lastDeathTime,
    isLoading,
  ])


  useEffect(() => {
    if (gameState.deathCooldown > 0 && gameState.lastDeathTime > 0) {
      const interval = setInterval(() => {
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - gameState.lastDeathTime) / 1000)
        const remainingCooldown = Math.max(0, gameState.deathCooldown - elapsedSeconds)

        if (remainingCooldown === 0 && gameState.deathCooldown > 0) {
          setGameState((prev) => ({
            ...prev,
            deathCooldown: 0,
          }))

          toast({
            title: "Cooldown expired",
            description: "You can now enter the dungeon again.",
          })
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [gameState.deathCooldown, gameState.lastDeathTime, toast])

  const handleUsernameSet = (name: string) => {
    setUsername(name)
    setGameState((prev) => ({
      ...prev,
      gameSettings: {
        ...prev.gameSettings,
        username: name,
      },
    }))
  }

  const startCombat = (isBoss = false) => {
    
    if (gameState.deathCooldown > 0) {
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - gameState.lastDeathTime) / 1000)
      const remainingCooldown = Math.max(0, gameState.deathCooldown - elapsedSeconds)

      toast({
        title: "Still recovering",
        description: `You must wait ${remainingCooldown} more seconds before entering combat.`,
        variant: "destructive",
      })
      return
    }

    let enemy

    if (isBoss) {
      const currentDungeonLevel = getDungeonLevel(gameState.currentLevel)
      if (currentDungeonLevel) {
        enemy = currentDungeonLevel.boss
      }
      setGameState((prev) => ({
        ...prev,
        currentScreen: "combat",
        currentEnemy: enemy,
        isBossFight: true,
      }))
    } else {
      enemy = getRandomEnemy(gameState.currentLevel)

      setGameState((prev) => ({
        ...prev,
        currentScreen: "combat",
        currentEnemy: enemy,
        isBossFight: false,
        exploredRooms: prev.exploredRooms + 1,
      }))

      
      if (gameState.exploredRooms + 1 >= gameState.totalRooms) {
        unlockAchievement("dungeon_explorer")
      }
    }

    toast({
      title: `Combat started!`,
      description: `You encounter ${enemy.name}!`,
    })
  }

  const endCombat = (victory: boolean, rewards?: { experience: number; gold: number }) => {
    if (victory) {
      if (gameState.isBossFight) {
      
        setGameState((prev) => ({
          ...prev,
          currentScreen: "miniGame",
        }))

        toast({
          title: "Boss defeated!",
          description: "Complete the mini-game to claim your reward!",
        })
      } else {
         
        const expGain = rewards?.experience || gameState.currentEnemy?.experience || 0
        const goldGain = rewards?.gold || Math.floor(Math.random() * 20) + 10
        const newExp = gameState.playerExperience + expGain
        const expToLevel = gameState.playerLevel * 100
        let newLevel = gameState.playerLevel

        
        if (newExp >= expToLevel) {
          newLevel = gameState.playerLevel + 1
          toast({
            title: "Level Up!",
            description: `You are now level ${newLevel}!`,
          })

        
          updateAchievementProgress("level_up", newLevel)
        }

        setGameState((prev) => ({
          ...prev,
          currentScreen: "map",
          currentEnemy: null,
          playerExperience: newExp % expToLevel,
          playerLevel: newLevel,
          playerGold: prev.playerGold + goldGain,
        }))

        toast({
          title: "Victory!",
          description: `You defeated the ${gameState.currentEnemy?.name}!`,
        })
      }
    } else {
      const cooldownTime = 60

      setGameState((prev) => ({
        ...prev,
        currentScreen: "map",
        currentEnemy: null,
        playerHealth: Math.floor(prev.playerMaxHealth * 0.5), // Respawn with 50% health
        deathCooldown: cooldownTime,
        lastDeathTime: Date.now(),
      }))

      toast({
        title: "Defeat!",
        description: `You were defeated and must wait ${cooldownTime} seconds before entering combat again.`,
        variant: "destructive",
      })
    }
  }

  const completeMiniGame = (success: boolean) => {
    if (success) {
      
      const miniGameType = gameState.currentEnemy?.miniGame || ""
      if (miniGameType) {
        updateAchievementProgress("mini_game_master", gameState.currentLevel)
      }

      
      const expReward = gameState.currentEnemy?.experience * 2 || 50
      const goldReward = Math.floor(Math.random() * 50) + 50

      
      const nextLevel = gameState.currentLevel + 1
      const updatedUnlockedLevels = [...gameState.unlockedLevels]
      if (!updatedUnlockedLevels.includes(nextLevel) && nextLevel <= 5) {
        updatedUnlockedLevels.push(nextLevel)
      }

  
      setGameState((prev) => ({
        ...prev,
        currentScreen: "map",
        currentLevel: nextLevel <= 5 ? nextLevel : prev.currentLevel,
        currentEnemy: null,
        isBossFight: false,
        playerExperience: (prev.playerExperience + expReward) % (prev.playerLevel * 100),
        playerGold: prev.playerGold + goldReward,
        exploredRooms: 0,
        totalRooms: getDungeonLevel(nextLevel)?.roomCount || 5,
        unlockedLevels: updatedUnlockedLevels,
      }))

      toast({
        title: "Level complete!",
        description: `You've advanced to the next dungeon level and earned ${goldReward} gold!`,
      })
    } else {
    
      setGameState((prev) => ({
        ...prev,
        currentScreen: "map",
        currentEnemy: null,
        isBossFight: false,
      }))

      toast({
        title: "Mini-game failed",
        description: "You didn't complete the challenge, but the boss is still defeated.",
      })
    }
  }

  const handleUseItem = (item: StoreItem, index: number) => {
    
    const newGameState = { ...gameState }

    if (item.effect.health) {
      newGameState.playerHealth = Math.min(newGameState.playerMaxHealth, newGameState.playerHealth + item.effect.health)
    }

    if (item.effect.mana) {
      newGameState.playerMana = Math.min(newGameState.playerMaxMana, newGameState.playerMana + item.effect.mana)
    }

    const newInventory = [...newGameState.inventory]
    newInventory.splice(index, 1)
    newGameState.inventory = newInventory

    setGameState(newGameState)

    toast({
      title: "Item used",
      description: `You used ${item.name}.`,
    })
  }

  const handleLevelSelect = (level: number) => {
    
    if (!gameState.unlockedLevels.includes(level)) {
      toast({
        title: "Level locked",
        description: `You need to complete level ${level - 1} first.`,
        variant: "destructive",
      })
      return
    }

    const isSurpriseLevel = gameState.surpriseLevels.includes(level)

    
    setGameState((prev) => ({
      ...prev,
      currentLevel: level,
      exploredRooms: 0,
      totalRooms: getDungeonLevel(level)?.roomCount || 5,
    }))

    if (isSurpriseLevel) {
      toast({
        title: "Surprise Level!",
        description: "This level has special challenges and rewards!",
      })
    } else {
      toast({
        title: "Level Selected",
        description: `You are now in level ${level}.`,
      })
    }
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeTutorial = () => {
    setShowTutorial(false)
    setTutorialStep(0)
  }

  const nextTutorialStep = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1)
    } else {
      closeTutorial()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white p-4 flex items-center justify-center">
        <UsernameForm onComplete={handleUsernameSet} />
      </div>
    )
  }

  let remainingCooldown = 0
  if (gameState.deathCooldown > 0 && gameState.lastDeathTime > 0) {
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - gameState.lastDeathTime) / 1000)
    remainingCooldown = Math.max(0, gameState.deathCooldown - elapsedSeconds)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white font-sans">
      
      <div className="bg-white/80 dark:bg-black/70 border-b border-gray-200 dark:border-purple-900/50 p-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <Link href="/lobby">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/20"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Lobby</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="ml-2 sm:ml-4 text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Level:</span>
                <span className="ml-1 text-purple-700 dark:text-purple-300 font-bold">{gameState.currentLevel}</span>
              </div>
            </div>

            <div className="flex items-center">
              <div className="mr-2 text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Player:</span>
                <span className="ml-1 text-purple-700 dark:text-purple-300 font-bold">
                  {gameState.gameSettings.username}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

        
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 space-y-3">
                  <div className="flex items-center">
                    <HealthBar
                      current={gameState.playerHealth}
                      max={gameState.playerMaxHealth}
                      size="sm"
                      className="flex-1"
                    />
                  </div>

                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-blue-500 mr-1" />
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-800 dark:to-blue-500 transition-all duration-300"
                        style={{ width: `${(gameState.playerMana / gameState.playerMaxMana) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      {gameState.playerMana}/{gameState.playerMaxMana}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Skull className="h-4 w-4 text-purple-500 mr-1" />
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-800 dark:to-purple-500 transition-all duration-300"
                        style={{ width: `${((gameState.playerExperience % 100) / 100) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                      Lvl {gameState.playerLevel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">{gameState.playerGold} Gold</span>

                    <div className="flex space-x-2">
                      <Link href="/achievements">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:text-yellow-100 dark:hover:bg-yellow-900/20"
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href="/lobby?tab=inventory">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/20"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden md:flex items-center space-x-4 mt-2">
            <div className="flex items-center flex-1">
              <HealthBar current={gameState.playerHealth} max={gameState.playerMaxHealth} size="sm" />
            </div>

            <div className="flex items-center flex-1">
              <Zap className="h-4 w-4 text-blue-500 mr-1" />
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-800 dark:to-blue-500 transition-all duration-300"
                  style={{ width: `${(gameState.playerMana / gameState.playerMaxMana) * 100}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                {gameState.playerMana}/{gameState.playerMaxMana}
              </span>
            </div>

            <div className="flex items-center flex-1">
              <Skull className="h-4 w-4 text-purple-500 mr-1" />
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-800 dark:to-purple-500 transition-all duration-300"
                  style={{ width: `${((gameState.playerExperience % 100) / 100) * 100}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">Lvl {gameState.playerLevel}</span>
            </div>

            <div className="hidden md:flex items-center">
              <span className="text-yellow-600 dark:text-yellow-400 font-bold">{gameState.playerGold} Gold</span>
            </div>

            <div className="hidden md:flex space-x-2">
              <Link href="/achievements">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:text-yellow-100 dark:hover:bg-yellow-900/20"
                >
                  <Trophy className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/lobby?tab=inventory">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/20"
                >
                  <ShoppingBag className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {remainingCooldown > 0 && (
        <div className="bg-red-500/90 dark:bg-red-900/90 text-white p-2 text-center">
          <p>You are recovering from your last defeat. Cooldown: {remainingCooldown} seconds remaining.</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        {gameState.currentScreen === "map" && (
          <DungeonMap
            currentLevel={gameState.currentLevel}
            onStartCombat={startCombat}
            exploredRooms={gameState.exploredRooms}
            totalRooms={gameState.totalRooms}
            unlockedLevels={gameState.unlockedLevels}
            surpriseLevels={gameState.surpriseLevels}
            onLevelSelect={handleLevelSelect}
            playerLevel={gameState.playerLevel}
          />
        )}

        {gameState.currentScreen === "combat" && (
          <CombatInterface
            enemy={gameState.currentEnemy}
            isBossFight={gameState.isBossFight}
            playerHealth={gameState.playerHealth}
            playerMaxHealth={gameState.playerMaxHealth}
            playerMana={gameState.playerMana}
            playerMaxMana={gameState.playerMaxMana}
            onCombatEnd={endCombat}
            difficulty={gameState.gameSettings.difficulty}
            playerName={gameState.gameSettings.username}
            dungeonLevel={gameState.currentLevel}
            inventory={gameState.inventory}
            onUseItem={handleUseItem}
          />
        )}

        {gameState.currentScreen === "miniGame" && (
          <BossMiniGame
            bossName={gameState.currentEnemy?.name}
            miniGameType={gameState.currentEnemy?.miniGame}
            onComplete={completeMiniGame}
          />
        )}
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Welcome to the Dungeon!</h2>

            {tutorialStep === 0 && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  This is your first adventure into the Shape Dungeon. Let me show you around!
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You'll explore rooms, fight enemies, and collect treasures as you progress.
                </p>
              </div>
            )}

            {tutorialStep === 1 && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The dungeon map shows all available rooms. Click on a room to select it, then click "Enter" to
                  explore.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Each level has a boss that guards the path to the next level. Defeat them to progress!
                </p>
              </div>
            )}

            {tutorialStep === 2 && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  During combat, you can attack, cast spells, defend, or use items from your inventory.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Boss fights are challenging but rewarding. You can even talk to bosses to learn more about them!
                </p>
              </div>
            )}

            {tutorialStep === 3 && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Visit the town to buy items, check your achievements, and prepare for your next adventure.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Good luck, adventurer! The fate of the dungeon is in your hands.
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={closeTutorial}>
                Skip Tutorial
              </Button>
              <Button onClick={nextTutorialStep}>{tutorialStep < 3 ? "Next" : "Start Adventure"}</Button>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={(e) => {
                    const settings = JSON.parse(localStorage.getItem("gameSettings") || "{}")
                    settings.showTutorials = !e.target.checked
                    localStorage.setItem("gameSettings", JSON.stringify(settings))
                  }}
                />
                Don't show tutorials again
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
