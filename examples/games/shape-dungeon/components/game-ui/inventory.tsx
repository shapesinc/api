"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Zap, Shield, Sword, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import type { StoreItem } from "./store"

interface InventoryProps {
  inventory: StoreItem[]
  onUseItem: (item: StoreItem, index: number) => void
  onDiscardItem: (index: number) => void
}

export default function Inventory({ inventory, onUseItem, onDiscardItem }: InventoryProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")

  const handleUseItem = (item: StoreItem, index: number) => {
    onUseItem(item, index)

    toast({
      title: "Item used",
      description: `You used ${item.name}.`,
    })
  }

  const handleDiscardItem = (index: number) => {
    onDiscardItem(index)

    toast({
      title: "Item discarded",
      description: "The item has been discarded.",
    })
  }

  const filteredItems = (type: string | null) => {
    if (type === "all") return inventory
    return inventory.filter((item) => item.type === type)
  }

  const getItemCount = (type: string | null) => {
    return filteredItems(type).length
  }

  return (
    <Card className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-cinzel text-gray-900 dark:text-purple-300">Inventory</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {inventory.length} items in your bag
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 dark:bg-gray-800 mb-4">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              All ({getItemCount("all")})
            </TabsTrigger>
            <TabsTrigger
              value="potion"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              Potions ({getItemCount("potion")})
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              Equipment ({getItemCount("equipment")})
            </TabsTrigger>
            <TabsTrigger
              value="consumable"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-900"
            >
              Consumables ({getItemCount("consumable")})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {inventory.length > 0 ? (
              filteredItems("all").map((item, index) => (
                <InventoryItemCard
                  key={`${item.id}-${index}`}
                  item={item}
                  index={index}
                  onUse={handleUseItem}
                  onDiscard={handleDiscardItem}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Your inventory is empty</div>
            )}
          </TabsContent>

          <TabsContent value="potion" className="space-y-3">
            {getItemCount("potion") > 0 ? (
              filteredItems("potion").map((item, index) => {
                // Find the actual index in the full inventory
                const realIndex = inventory.findIndex((i) => i === item)
                return (
                  <InventoryItemCard
                    key={`${item.id}-${realIndex}`}
                    item={item}
                    index={realIndex}
                    onUse={handleUseItem}
                    onDiscard={handleDiscardItem}
                  />
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No potions in inventory</div>
            )}
          </TabsContent>

          <TabsContent value="equipment" className="space-y-3">
            {getItemCount("equipment") > 0 ? (
              filteredItems("equipment").map((item, index) => {
                // Find the actual index in the full inventory
                const realIndex = inventory.findIndex((i) => i === item)
                return (
                  <InventoryItemCard
                    key={`${item.id}-${realIndex}`}
                    item={item}
                    index={realIndex}
                    onUse={handleUseItem}
                    onDiscard={handleDiscardItem}
                  />
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No equipment in inventory</div>
            )}
          </TabsContent>

          <TabsContent value="consumable" className="space-y-3">
            {getItemCount("consumable") > 0 ? (
              filteredItems("consumable").map((item, index) => {
                // Find the actual index in the full inventory
                const realIndex = inventory.findIndex((i) => i === item)
                return (
                  <InventoryItemCard
                    key={`${item.id}-${realIndex}`}
                    item={item}
                    index={realIndex}
                    onUse={handleUseItem}
                    onDiscard={handleDiscardItem}
                  />
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No consumables in inventory</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface InventoryItemCardProps {
  item: StoreItem
  index: number
  onUse: (item: StoreItem, index: number) => void
  onDiscard: (index: number) => void
}

function InventoryItemCard({ item, index, onUse, onDiscard }: InventoryItemCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const getItemIcon = () => {
    if (item.effect.health) return <Heart className="h-5 w-5 text-red-500" />
    if (item.effect.mana) return <Zap className="h-5 w-5 text-blue-500" />
    if (item.effect.strength) return <Sword className="h-5 w-5 text-yellow-500" />
    if (item.effect.defense) return <Shield className="h-5 w-5 text-green-500" />
    return item.icon
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-3 rounded-lg border bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="p-2 rounded-full mr-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
            {getItemIcon()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!showConfirm ? (
            <>
              <Button
                size="sm"
                onClick={() => onUse(item, index)}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
              >
                Use
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="destructive" onClick={() => onDiscard(index)}>
                Confirm
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
