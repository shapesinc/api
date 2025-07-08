"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sword, Shield, Zap, Heart, MessageCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getBossDialog, getBossCombatMove, getBossDefeatDialog } from "@/lib/shapes-api"
import { unlockAchievement, updateAchievementProgress } from "@/lib/achievements"
import BossChatInterface from "./boss-chat-interface"
import VictoryAnimation from "./victory-animation"
import HealthBar from "./health-bar"

interface CombatInterfaceProps {
  enemy: any
  isBossFight: boolean
  playerHealth: number
  playerMaxHealth: number
  playerMana: number
  playerMaxMana: number
  onCombatEnd: (victory: boolean, rewards?: { experience: number; gold: number }) => void
  difficulty: string
  playerName: string
  dungeonLevel: number
  inventory: any[]
  onUseItem: (item: any, index: number) => void
}

export default function CombatInterface({
  enemy,
  isBossFight,
  playerHealth,
  playerMaxHealth,
  playerMana,
  playerMaxMana,
  onCombatEnd,
  difficulty,
  playerName,
  dungeonLevel,
  inventory = [],
  onUseItem = () => {},
}: CombatInterfaceProps) {
  const [currentPlayerHealth, setCurrentPlayerHealth] = useState(playerHealth)
  const [currentPlayerMana, setCurrentPlayerMana] = useState(playerMana)
  const [currentEnemyHealth, setCurrentEnemyHealth] = useState(enemy?.health || 100)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState<string | null>(null)
  const [bossDialog, setBossDialog] = useState<string>("")
  const [showBossDialog, setShowBossDialog] = useState(false)
  const [isLoadingDialog, setIsLoadingDialog] = useState(false)
  const [bossDefeated, setBossDefeated] = useState(false)
  const [defeatDialog, setDefeatDialog] = useState<string>("")
  const [showBossChat, setShowBossChat] = useState(false)
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false)
  const [rewards, setRewards] = useState({ experience: 0, gold: 0 })
  const [showInventory, setShowInventory] = useState(false)
  const [cameraShake, setCameraShake] = useState(false)

  const combatLogRef = useRef<HTMLDivElement>(null)
  const channelId = `dungeon_${dungeonLevel}_${enemy?.id || "unknown"}`

  // Apply difficulty modifier
  const difficultyModifier =
    difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.2 : difficulty === "nightmare" ? 1.5 : 1.0 // normal

  // Calculate enemy stats based on difficulty
  const enemyAttack = Math.floor((enemy?.attack || 10) * difficultyModifier)
  const enemyDefense = Math.floor((enemy?.defense || 5) * difficultyModifier)

  // Load camera shake setting
  useEffect(() => {
    const savedSettings = localStorage.getItem("gameSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      if (settings.enableCameraShake !== undefined) {
        // We'll use this setting later for camera shake effects
      }
    }
  }, [])

  // Fetch boss dialog on component mount
  useEffect(() => {
    if (isBossFight) {
      setIsLoadingDialog(true)
      setShowBossDialog(true)

      const fetchBossDialog = async () => {
        try {
          const dialog = await getBossDialog(
            enemy.name,
            playerName,
            enemy.dialogueContext || "powerful dungeon boss",
            channelId,
          )
          setBossDialog(dialog)
          setCombatLog([`${enemy.name}: "${dialog}"`])
        } catch (error) {
          console.error("Error fetching boss dialog:", error)
          setBossDialog(`You dare challenge me, ${playerName}? Prepare to meet your doom!`)
          setCombatLog([`${enemy.name}: "You dare challenge me, ${playerName}? Prepare to meet your doom!"`])
        } finally {
          setIsLoadingDialog(false)
          // After 5 seconds, hide the dialog
          setTimeout(() => {
            setShowBossDialog(false)
          }, 5000)
        }
      }

      fetchBossDialog()
    } else {
      setCombatLog([`You encounter ${enemy?.name}!`])
    }

    // Unlock achievement for first combat
    if (!isBossFight) {
      unlockAchievement("first_blood")
    }
  }, [enemy, isBossFight, playerName, channelId])

  // Auto-scroll combat log
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight
    }
  }, [combatLog])

  // Handle enemy turn
  useEffect(() => {
    if (!isPlayerTurn && !bossDefeated) {
      const timer = setTimeout(async () => {
        // Enemy attacks
        setShowAnimation("enemyAttack")

        // Apply camera shake if enabled
        const savedSettings = localStorage.getItem("gameSettings")
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          if (settings.enableCameraShake) {
            setCameraShake(true)
            setTimeout(() => setCameraShake(false), 500)
          }
        }

        let damage = Math.max(5, enemyAttack - Math.floor(Math.random() * 5))
        let attackDescription = `${enemy.name} attacks for ${damage} damage!`

        // For all enemies, use the Shapes API to generate a combat move
        try {
          const bossMove = await getBossCombatMove(
            enemy.name,
            playerName,
            Math.round((currentPlayerHealth / playerMaxHealth) * 100),
            Math.round((currentEnemyHealth / enemy.health) * 100),
            channelId,
          )

          damage = bossMove.damage
          attackDescription = `${enemy.name} uses ${bossMove.moveName}: ${bossMove.description} (${damage} damage)`
        } catch (error) {
          console.error("Error getting boss combat move:", error)
        }

        setTimeout(() => {
          setCurrentPlayerHealth((prev) => Math.max(0, prev - damage))
          setCombatLog((prev) => [...prev, attackDescription])
          setShowAnimation(null)

          // Check if player is defeated
          if (currentPlayerHealth - damage <= 0) {
            setCombatLog((prev) => [...prev, "You have been defeated!"])
            setTimeout(() => onCombatEnd(false), 2000)
          } else {
            setIsPlayerTurn(true)
          }
        }, 1000)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [
    isPlayerTurn,
    enemy,
    enemyAttack,
    currentPlayerHealth,
    onCombatEnd,
    isBossFight,
    playerName,
    currentEnemyHealth,
    playerMaxHealth,
    channelId,
    bossDefeated,
  ])

  const handleAction = (action: string) => {
    if (!isPlayerTurn) return

    setSelectedAction(action)

    if (action === "attack") {
      // Basic attack
      setShowAnimation("playerAttack")
      setTimeout(() => {
        const damage = Math.max(8, 15 - enemyDefense + Math.floor(Math.random() * 10))
        setCurrentEnemyHealth((prev) => Math.max(0, prev - damage))
        setCombatLog((prev) => [...prev, `You attack ${enemy.name} for ${damage} damage!`])
        setShowAnimation(null)

        // Check if enemy is defeated
        if (currentEnemyHealth - damage <= 0) {
          handleEnemyDefeat()
        } else {
          setIsPlayerTurn(false)
        }
      }, 1000)
    } else if (action === "magic") {
      // Magic attack
      if (currentPlayerMana < 15) {
        setCombatLog((prev) => [...prev, "Not enough mana!"])
        setSelectedAction(null)
        return
      }

      setShowAnimation("playerMagic")
      setTimeout(() => {
        const damage = Math.max(15, 25 - Math.floor(enemyDefense / 2) + Math.floor(Math.random() * 10))
        setCurrentPlayerMana((prev) => Math.max(0, prev - 15))
        setCurrentEnemyHealth((prev) => Math.max(0, prev - damage))
        setCombatLog((prev) => [...prev, `You cast a spell on ${enemy.name} for ${damage} damage!`])
        setShowAnimation(null)

        // Check if enemy is defeated
        if (currentEnemyHealth - damage <= 0) {
          handleEnemyDefeat()
        } else {
          setIsPlayerTurn(false)
        }
      }, 1000)
    } else if (action === "defend") {
      // Defend - reduce incoming damage and recover some mana
      setShowAnimation("playerDefend")
      setTimeout(() => {
        setCurrentPlayerMana((prev) => Math.min(playerMaxMana, prev + 10))
        setCombatLog((prev) => [
          ...prev,
          "You take a defensive stance, recovering 10 mana and reducing incoming damage.",
        ])
        setShowAnimation(null)
        setIsPlayerTurn(false)
      }, 1000)
    } else if (action === "heal") {
      // Heal - use mana to recover health
      if (currentPlayerMana < 20) {
        setCombatLog((prev) => [...prev, "Not enough mana!"])
        setSelectedAction(null)
        return
      }

      setShowAnimation("playerHeal")
      setTimeout(() => {
        const healAmount = 25 + Math.floor(Math.random() * 10)
        setCurrentPlayerMana((prev) => Math.max(0, prev - 20))
        setCurrentPlayerHealth((prev) => Math.min(playerMaxHealth, prev + healAmount))
        setCombatLog((prev) => [...prev, `You heal yourself for ${healAmount} health!`])
        setShowAnimation(null)
        setIsPlayerTurn(false)
      }, 1000)
    } else if (action === "inventory") {
      // Toggle inventory
      setShowInventory(!showInventory)
      setSelectedAction(null)
    }
  }

  const handleUseInventoryItem = (item: any, index: number) => {
    // Apply item effects
    if (item.effect.health) {
      setCurrentPlayerHealth((prev) => Math.min(playerMaxHealth, prev + item.effect.health))
      setCombatLog((prev) => [...prev, `You used ${item.name} and recovered ${item.effect.health} health!`])
    }

    if (item.effect.mana) {
      setCurrentPlayerMana((prev) => Math.min(playerMaxMana, prev + item.effect.mana))
      setCombatLog((prev) => [...prev, `You used ${item.name} and recovered ${item.effect.mana} mana!`])
    }

    // Call the parent component's onUseItem function
    onUseItem(item, index)

    // Close inventory and end turn
    setShowInventory(false)
    setIsPlayerTurn(false)
  }

  const handleEnemyDefeat = async () => {
    setCombatLog((prev) => [...prev, `${enemy.name} has been defeated!`])

    // Calculate rewards based on difficulty
    const difficultyExpMultiplier =
      difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.5 : difficulty === "nightmare" ? 2.0 : 1.0 // normal

    // Base experience is affected by enemy level and boss status
    const baseExpReward = isBossFight ? enemy.experience * 2 || 50 : enemy.experience || 20

    // Final experience calculation
    const expReward = Math.floor(baseExpReward * difficultyExpMultiplier)

    // Gold is also affected by difficulty
    const goldMultiplier =
      difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.3 : difficulty === "nightmare" ? 1.8 : 1.0 // normal

    // Base gold calculation
    const baseGold = isBossFight ? Math.floor(Math.random() * 50) + 50 : Math.floor(Math.random() * 20) + 10

    // Final gold calculation
    const goldReward = Math.floor(baseGold * goldMultiplier)

    setRewards({
      experience: expReward,
      gold: goldReward,
    })

    if (isBossFight) {
      setBossDefeated(true)
      setShowBossDialog(true)

      try {
        const dialog = await getBossDefeatDialog(enemy.name, playerName, channelId)
        setDefeatDialog(dialog)
        setCombatLog((prev) => [...prev, `${enemy.name}: "${dialog}"`])
      } catch (error) {
        console.error("Error fetching boss defeat dialog:", error)
        setDefeatDialog("Impossible... I cannot be defeated... You will regret this...")
        setCombatLog((prev) => [
          ...prev,
          `${enemy.name}: "Impossible... I cannot be defeated... You will regret this..."`,
        ])
      }

      // Unlock boss slayer achievement
      unlockAchievement("boss_slayer")

      // Update shape whisperer achievement progress
      updateAchievementProgress("shape_whisperer", dungeonLevel)

      // After 5 seconds, show victory animation
      setTimeout(() => {
        setShowBossDialog(false)
        setShowVictoryAnimation(true)
      }, 5000)
    } else {
      // For regular enemies, end combat after a short delay
      setTimeout(() => {
        onCombatEnd(true, { experience: expReward, gold: goldReward })
      }, 2000)
    }
  }

  const handleVictoryAnimationClose = () => {
    setShowVictoryAnimation(false)
    onCombatEnd(true, rewards)
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${cameraShake ? "animate-shake" : ""}`}>
      <div className="lg:col-span-2">
        <div className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 rounded-lg p-4 h-full relative overflow-hidden">
          <div className="flex justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-purple-300">Combat</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isBossFight ? "Boss Encounter" : "Enemy Encounter"}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">{enemy?.name}</h3>
              <HealthBar current={currentEnemyHealth} max={enemy?.health} size="sm" className="w-40" />
            </div>
          </div>

          <div className="relative h-64 md:h-80 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900/50 dark:to-black/50 rounded-lg mb-4 overflow-hidden">
            {/* Combat Animations */}
            <AnimatePresence>
              {showAnimation === "playerAttack" && (
                <motion.div
                  className="absolute inset-0 bg-red-500/20 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {showAnimation === "playerMagic" && (
                <motion.div
                  className="absolute inset-0 bg-blue-500/20 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {showAnimation === "playerDefend" && (
                <motion.div
                  className="absolute inset-0 bg-green-500/20 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {showAnimation === "playerHeal" && (
                <motion.div
                  className="absolute inset-0 bg-purple-500/20 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {showAnimation === "enemyAttack" && (
                <motion.div
                  className="absolute inset-0 bg-red-900/20 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

            {/* Boss Dialog */}
            {showBossDialog && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 z-20"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-red-400 font-bold mb-1">{enemy.name}</h3>
                {isLoadingDialog ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-300"></div>
                  </div>
                ) : (
                  <p className="text-white">{bossDefeated ? defeatDialog : bossDialog}</p>
                )}
              </motion.div>
            )}

            {/* Enemy Placeholder */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${
                  isBossFight
                    ? "from-red-500 to-purple-500 dark:from-red-900 dark:to-purple-900 shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                    : "from-blue-500 to-purple-500 dark:from-blue-900 dark:to-purple-900"
                } flex items-center justify-center`}
              >
                <span className="text-4xl font-bold text-white">{enemy?.name?.charAt(0) || "?"}</span>
              </div>
            </div>

            {/* Boss Chat Button */}
            {isBossFight && !bossDefeated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBossChat(true)}
                className="absolute top-4 right-4 bg-white/80 dark:bg-black/80 border-gray-300 dark:border-gray-700"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Talk
              </Button>
            )}

            {/* Player Turn Indicator */}
            <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-black/80 px-3 py-1 rounded-full text-sm">
              {isPlayerTurn ? (
                <span className="text-green-600 dark:text-green-400">Your Turn</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">Enemy Turn</span>
              )}
            </div>
          </div>

          {/* Inventory Panel */}
          <AnimatePresence>
            {showInventory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Inventory</h3>
                    <Button size="sm" variant="ghost" onClick={() => setShowInventory(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {inventory.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {inventory.map((item, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2"
                          onClick={() => handleUseInventoryItem(item, index)}
                        >
                          <div>
                            <div className="font-bold text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.effect.health
                                ? `+${item.effect.health} HP`
                                : item.effect.mana
                                  ? `+${item.effect.mana} MP`
                                  : "Use item"}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-gray-500">No items in inventory</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className={`border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30 ${
                selectedAction === "attack" ? "bg-red-50 dark:bg-red-900/50" : ""
              } ${!isPlayerTurn ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAction("attack")}
              disabled={!isPlayerTurn}
            >
              <Sword className="mr-2 h-4 w-4" />
              <span className="sm:block hidden">Attack</span>
            </Button>

            <Button
              variant="outline"
              className={`border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30 ${
                selectedAction === "magic" ? "bg-blue-50 dark:bg-blue-900/50" : ""
              } ${!isPlayerTurn || currentPlayerMana < 15 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAction("magic")}
              disabled={!isPlayerTurn || currentPlayerMana < 15}
            >
              <Zap className="mr-2 h-4 w-4" />
              <span className="sm:block hidden">Magic</span>
            </Button>

            <Button
              variant="outline"
              className={`border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30 ${
                selectedAction === "defend" ? "bg-green-50 dark:bg-green-900/50" : ""
              } ${!isPlayerTurn ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAction("defend")}
              disabled={!isPlayerTurn}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span className="sm:block hidden">Defend</span>
            </Button>

            <Button
              variant="outline"
              className={`border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 ${
                selectedAction === "heal" ? "bg-purple-50 dark:bg-purple-900/50" : ""
              } ${!isPlayerTurn || currentPlayerMana < 20 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAction("heal")}
              disabled={!isPlayerTurn || currentPlayerMana < 20}
            >
              <Heart className="mr-2 h-4 w-4" />
              <span className="sm:block hidden">Heal</span>
            </Button>

            <Button
              variant="outline"
              className={`border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30 ${
                showInventory ? "bg-yellow-50 dark:bg-yellow-900/50" : ""
              } ${!isPlayerTurn ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAction("inventory")}
              disabled={!isPlayerTurn}
            >
              <span className="sm:block hidden">Items</span>
              <span className="sm:hidden">Bag</span>
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 rounded-lg p-4 h-full">
          <h2 className="text-xl font-bold text-gray-900 dark:text-purple-300 mb-4">Combat Log</h2>

          <div className="space-y-2 mb-4">
            <HealthBar current={currentPlayerHealth} max={playerMaxHealth} size="md" />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Mana</span>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(currentPlayerMana / playerMaxMana) * 100}
                  className="w-24 h-2 bg-gray-200 dark:bg-gray-800 mr-2"
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {currentPlayerMana}/{playerMaxMana}
                </span>
              </div>
            </div>
          </div>

          <div
            ref={combatLogRef}
            className="h-64 overflow-y-auto bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3 text-sm"
          >
            {combatLog.map((log, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="text-gray-500">&gt; </span>
                <span className="text-gray-700 dark:text-gray-300">{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Boss Chat Interface */}
      {showBossChat && (
        <BossChatInterface
          bossName={enemy.name}
          playerName={playerName}
          channelId={channelId}
          onClose={() => setShowBossChat(false)}
          context={enemy.dialogueContext || "powerful dungeon boss"}
        />
      )}

      {/* Victory Animation */}
      {showVictoryAnimation && (
        <VictoryAnimation bossName={enemy.name} onClose={handleVictoryAnimationClose} rewards={rewards} />
      )}
    </div>
  )
}
