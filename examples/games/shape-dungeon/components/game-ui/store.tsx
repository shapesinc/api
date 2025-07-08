"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Zap, Shield, Sword, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface StoreProps {
  playerGold: number
  playerLevel: number
  onPurchase: (item: StoreItem, cost: number) => void
}

export interface StoreItem {
  id: string
  name: string
  description: string
  cost: number
  effect: {
    health?: number
    mana?: number
    strength?: number
    defense?: number
  }
  type: "potion" | "equipment" | "consumable"
  levelRequired: number
  icon: React.ReactNode
}

export default function Store({ playerGold, playerLevel, onPurchase }: StoreProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("potions")

  const storeItems: StoreItem[] = [
    // Potions
    {
      id: "health_potion_small",
      name: "Small Health Potion",
      description: "Restores 30 health points",
      cost: 25,
      effect: { health: 30 },
      type: "potion",
      levelRequired: 1,
      icon: <Heart className="h-5 w-5 text-red-500" />,
    },
    {
      id: "health_potion_medium",
      name: "Medium Health Potion",
      description: "Restores 75 health points",
      cost: 50,
      effect: { health: 75 },
      type: "potion",
      levelRequired: 3,
      icon: <Heart className="h-5 w-5 text-red-500" />,
    },
    {
      id: "health_potion_large",
      name: "Large Health Potion",
      description: "Restores 150 health points",
      cost: 100,
      effect: { health: 150 },
      type: "potion",
      levelRequired: 5,
      icon: <Heart className="h-5 w-5 text-red-500" />,
    },
    {
      id: "mana_potion_small",
      name: "Small Mana Potion",
      description: "Restores 20 mana points",
      cost: 25,
      effect: { mana: 20 },
      type: "potion",
      levelRequired: 1,
      icon: <Zap className="h-5 w-5 text-blue-500" />,
    },
    {
      id: "mana_potion_medium",
      name: "Medium Mana Potion",
      description: "Restores 50 mana points",
      cost: 50,
      effect: { mana: 50 },
      type: "potion",
      levelRequired: 3,
      icon: <Zap className="h-5 w-5 text-blue-500" />,
    },
    {
      id: "mana_potion_large",
      name: "Large Mana Potion",
      description: "Restores 100 mana points",
      cost: 100,
      effect: { mana: 100 },
      type: "potion",
      levelRequired: 5,
      icon: <Zap className="h-5 w-5 text-blue-500" />,
    },

    // Equipment
    {
      id: "iron_sword",
      name: "Iron Sword",
      description: "Increases strength by 5",
      cost: 150,
      effect: { strength: 5 },
      type: "equipment",
      levelRequired: 2,
      icon: <Sword className="h-5 w-5 text-gray-500" />,
    },
    {
      id: "steel_sword",
      name: "Steel Sword",
      description: "Increases strength by 10",
      cost: 300,
      effect: { strength: 10 },
      type: "equipment",
      levelRequired: 4,
      icon: <Sword className="h-5 w-5 text-gray-600" />,
    },
    {
      id: "mythril_sword",
      name: "Mythril Sword",
      description: "Increases strength by 20",
      cost: 600,
      effect: { strength: 20 },
      type: "equipment",
      levelRequired: 7,
      icon: <Sword className="h-5 w-5 text-blue-400" />,
    },
    {
      id: "leather_armor",
      name: "Leather Armor",
      description: "Increases defense by 5",
      cost: 150,
      effect: { defense: 5 },
      type: "equipment",
      levelRequired: 2,
      icon: <Shield className="h-5 w-5 text-yellow-700" />,
    },
    {
      id: "chainmail",
      name: "Chainmail",
      description: "Increases defense by 10",
      cost: 300,
      effect: { defense: 10 },
      type: "equipment",
      levelRequired: 4,
      icon: <Shield className="h-5 w-5 text-gray-500" />,
    },
    {
      id: "plate_armor",
      name: "Plate Armor",
      description: "Increases defense by 20",
      cost: 600,
      effect: { defense: 20 },
      type: "equipment",
      levelRequired: 7,
      icon: <Shield className="h-5 w-5 text-gray-600" />,
    },

    // Consumables
    {
      id: "strength_elixir",
      name: "Strength Elixir",
      description: "Temporarily increases strength by 15",
      cost: 200,
      effect: { strength: 15 },
      type: "consumable",
      levelRequired: 3,
      icon: <Sword className="h-5 w-5 text-red-400" />,
    },
    {
      id: "defense_elixir",
      name: "Defense Elixir",
      description: "Temporarily increases defense by 15",
      cost: 200,
      effect: { defense: 15 },
      type: "consumable",
      levelRequired: 3,
      icon: <Shield className="h-5 w-5 text-blue-400" />,
    },
  ]

  const handleBuyItem = (item: StoreItem) => {
    if (playerGold < item.cost) {
      toast({
        title: "Not enough gold",
        description: `You need ${item.cost - playerGold} more gold to buy this item.`,
        variant: "destructive",
      })
      return
    }

    if (playerLevel < item.levelRequired) {
      toast({
        title: "Level too low",
        description: `You need to be level ${item.levelRequired} to buy this item.`,
        variant: "destructive",
      })
      return
    }

    onPurchase(item, item.cost)

    toast({
      title: "Item purchased",
      description: `You bought ${item.name} for ${item.cost} gold.`,
    })
  }

  const filteredItems = (type: string) => {
    return storeItems.filter((item) => item.type === type)
  }

  return (
    <Card className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-cinzel text-gray-900 dark:text-purple-300">Merchant</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Buy potions and equipment</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Your Gold</div>
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{playerGold}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="potions" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 dark:bg-gray-800 mb-4">
            <TabsTrigger
              value="potions"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              Potions
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              Equipment
            </TabsTrigger>
            <TabsTrigger
              value="consumables"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              Consumables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="potions" className="space-y-3">
            {filteredItems("potion").map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                playerLevel={playerLevel}
                playerGold={playerGold}
                onBuy={handleBuyItem}
              />
            ))}
          </TabsContent>

          <TabsContent value="equipment" className="space-y-3">
            {filteredItems("equipment").map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                playerLevel={playerLevel}
                playerGold={playerGold}
                onBuy={handleBuyItem}
              />
            ))}
          </TabsContent>

          <TabsContent value="consumables" className="space-y-3">
            {filteredItems("consumable").map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                playerLevel={playerLevel}
                playerGold={playerGold}
                onBuy={handleBuyItem}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface StoreItemCardProps {
  item: StoreItem
  playerLevel: number
  playerGold: number
  onBuy: (item: StoreItem) => void
}

function StoreItemCard({ item, playerLevel, playerGold, onBuy }: StoreItemCardProps) {
  const isLocked = playerLevel < item.levelRequired
  const canAfford = playerGold >= item.cost

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      className={`p-3 rounded-lg border ${
        isLocked
          ? "bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700"
          : "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div
            className={`p-2 rounded-full mr-3 ${
              isLocked
                ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                : "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
            }`}
          >
            {item.icon}
          </div>
          <div>
            <h3
              className={`font-bold ${isLocked ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"}`}
            >
              {item.name}
            </h3>
            <p
              className={`text-sm ${
                isLocked ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {item.description}
            </p>
            {isLocked && (
              <div className="flex items-center mt-1 text-xs text-red-500 dark:text-red-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                Requires level {item.levelRequired}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`font-bold ${
              canAfford ? "text-yellow-600 dark:text-yellow-400" : "text-red-500 dark:text-red-400"
            }`}
          >
            {item.cost} gold
          </div>
          <Button
            size="sm"
            onClick={() => onBuy(item)}
            disabled={isLocked || !canAfford}
            className="mt-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
          >
            Buy
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
