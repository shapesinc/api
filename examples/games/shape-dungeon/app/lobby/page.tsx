"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Lobby from "@/components/game-ui/lobby"
import type { StoreItem } from "@/components/game-ui/store"
import { unlockAchievement } from "@/lib/achievements"
import UsernameForm from "@/components/game-ui/username-form"

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameState, setGameState] = useState({
    playerHealth: 100,
    playerMaxHealth: 100,
    playerMana: 50,
    playerMaxMana: 50,
    playerExperience: 0,
    playerLevel: 1,
    playerGold: 100,
    inventory: [] as StoreItem[],
    deathCooldown: 0,
    lastDeathTime: 0,
  })

  
  const activeTab = searchParams.get("tab") || "status"

  useEffect(() => {
    const savedUsername = localStorage.getItem("playerUsername")
    if (savedUsername) {
      setUsername(savedUsername)
    }
    const savedGameState = localStorage.getItem("gameState")
    if (savedGameState) {
      try {
        const parsedState = JSON.parse(savedGameState)
        setGameState((prev) => ({
          ...prev,
          playerHealth: parsedState.playerHealth || prev.playerHealth,
          playerMaxHealth: parsedState.playerMaxHealth || prev.playerMaxHealth,
          playerMana: parsedState.playerMana || prev.playerMana,
          playerMaxMana: parsedState.playerMaxMana || prev.playerMaxMana,
          playerExperience: parsedState.playerExperience || prev.playerExperience,
          playerLevel: parsedState.playerLevel || prev.playerLevel,
          playerGold: parsedState.playerGold || prev.playerGold,
          inventory: parsedState.inventory || prev.inventory,
          deathCooldown: parsedState.deathCooldown || prev.deathCooldown,
          lastDeathTime: parsedState.lastDeathTime || prev.lastDeathTime,
        }))
      } catch (error) {
        console.error("Error parsing saved game state:", error)
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const stateToSave = {
      playerHealth: gameState.playerHealth,
      playerMaxHealth: gameState.playerMaxHealth,
      playerMana: gameState.playerMana,
      playerMaxMana: gameState.playerMaxMana,
      playerExperience: gameState.playerExperience,
      playerLevel: gameState.playerLevel,
      playerGold: gameState.playerGold,
      inventory: gameState.inventory,
      deathCooldown: gameState.deathCooldown,
      lastDeathTime: gameState.lastDeathTime,
    }

    localStorage.setItem("gameState", JSON.stringify(stateToSave))
  }, [gameState, isLoading])

  const handleUsernameSet = (name: string) => {
    setUsername(name)
    unlockAchievement("first_steps")
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

  const handleDiscardItem = (index: number) => {
    const newInventory = [...gameState.inventory]
    const itemName = newInventory[index].name
    newInventory.splice(index, 1)

    setGameState({
      ...gameState,
      inventory: newInventory,
    })

    toast({
      title: "Item discarded",
      description: `You discarded ${itemName}.`,
    })
  }

  const handlePurchase = (item: StoreItem, cost: number) => {
    if (gameState.playerGold < cost) {
      toast({
        title: "Not enough gold",
        description: `You need ${cost - gameState.playerGold} more gold to buy this item.`,
        variant: "destructive",
      })
      return
    }

    if (gameState.playerLevel < item.levelRequired) {
      toast({
        title: "Level too low",
        description: `You need to be level ${item.levelRequired} to buy this item.`,
        variant: "destructive",
      })
      return
    }

    setGameState({
      ...gameState,
      playerGold: gameState.playerGold - cost,
      inventory: [...gameState.inventory, item],
    })

    toast({
      title: "Item purchased",
      description: `You bought ${item.name} for ${cost} gold.`,
    })
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

  return (
    <Lobby
      playerName={username}
      playerLevel={gameState.playerLevel}
      playerExperience={gameState.playerExperience}
      playerHealth={gameState.playerHealth}
      playerMaxHealth={gameState.playerMaxHealth}
      playerMana={gameState.playerMana}
      playerMaxMana={gameState.playerMaxMana}
      playerGold={gameState.playerGold}
      inventory={gameState.inventory}
      onUseItem={handleUseItem}
      onDiscardItem={handleDiscardItem}
      onPurchase={handlePurchase}
    />
  )
}
