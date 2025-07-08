"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sword, Shield, Scroll, ShoppingBag, Trophy, Settings, User, Menu, X, Heart, Zap, Skull } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Store, { type StoreItem } from "./store"
import Inventory from "./inventory"

interface LobbyProps {
  playerName: string
  playerLevel: number
  playerExperience: number
  playerHealth: number
  playerMaxHealth: number
  playerMana: number
  playerMaxMana: number
  playerGold: number
  inventory: StoreItem[]
  onUseItem: (item: StoreItem, index: number) => void
  onDiscardItem: (index: number) => void
  onPurchase: (item: StoreItem, cost: number) => void
}

export default function Lobby({
  playerName,
  playerLevel,
  playerExperience,
  playerHealth,
  playerMaxHealth,
  playerMana,
  playerMaxMana,
  playerGold,
  inventory,
  onUseItem,
  onDiscardItem,
  onPurchase,
}: LobbyProps) {
  const [activeTab, setActiveTab] = useState("status")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto p-4">
        {/* Mobile Menu Button */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold font-cinzel text-purple-700 dark:text-purple-300">Town Square</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Sidebar Navigation */}
          <AnimatePresence>
            {(mobileMenuOpen || !mobileMenuOpen) && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`${mobileMenuOpen ? "block" : "hidden md:block"} w-full md:w-64 shrink-0`}
              >
                <Card className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 shadow-lg">
                  <CardContent className="p-4">
                    <div className="mb-6 text-center">
                      <div className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-2">
                        <User className="h-10 w-10 text-purple-600 dark:text-purple-300" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{playerName}</h2>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Level {playerLevel} Adventurer</div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Health</span>
                            <span className="text-red-600 dark:text-red-400">
                              {playerHealth}/{playerMaxHealth}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 dark:bg-red-600"
                              style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Mana</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {playerMana}/{playerMaxMana}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 dark:bg-blue-600"
                              style={{ width: `${(playerMana / playerMaxMana) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">XP</span>
                            <span className="text-purple-600 dark:text-purple-400">{playerExperience}/100</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 dark:bg-purple-600"
                              style={{ width: `${playerExperience % 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-yellow-600 dark:text-yellow-400 font-bold">{playerGold} Gold</div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant={activeTab === "status" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("status")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Status
                      </Button>

                      <Button
                        variant={activeTab === "inventory" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("inventory")}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Inventory
                      </Button>

                      <Button
                        variant={activeTab === "store" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("store")}
                      >
                        <Scroll className="mr-2 h-4 w-4" />
                        Store
                      </Button>

                      <Link href="/game" className="w-full block">
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
                        >
                          <Sword className="mr-2 h-4 w-4" />
                          Enter Dungeon
                        </Button>
                      </Link>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
                        <Link href="/achievements" className="w-full block mb-2">
                          <Button variant="outline" className="w-full justify-start">
                            <Trophy className="mr-2 h-4 w-4" />
                            Achievements
                          </Button>
                        </Link>

                        <Link href="/character" className="w-full block mb-2">
                          <Button variant="outline" className="w-full justify-start">
                            <Shield className="mr-2 h-4 w-4" />
                            Character
                          </Button>
                        </Link>

                        <Link href="/settings" className="w-full block">
                          <Button variant="outline" className="w-full justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            <div className="hidden md:block mb-4">
              <h1 className="text-3xl font-bold font-cinzel text-purple-700 dark:text-purple-300">Town Square</h1>
              <p className="text-gray-600 dark:text-gray-400">A safe haven for adventurers</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-100 dark:bg-gray-800 mb-4 hidden">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="store">Store</TabsTrigger>
              </TabsList>

              <TabsContent value="status">
                <Card className="bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-2xl font-bold font-cinzel text-gray-900 dark:text-purple-300 mb-4">
                          Adventurer Status
                        </h2>

                        <div className="space-y-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                              <User className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
                              <div className="font-bold text-gray-900 dark:text-white">{playerName}</div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center mr-3">
                              <Skull className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                              <div className="font-bold text-gray-900 dark:text-white">{playerLevel}</div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-3">
                              <Heart className="h-5 w-5 text-red-600 dark:text-red-300" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Health</div>
                                <div className="text-sm text-red-600 dark:text-red-400">
                                  {playerHealth}/{playerMaxHealth}
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-500 dark:bg-red-600"
                                  style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Mana</div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">
                                  {playerMana}/{playerMaxMana}
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 dark:bg-blue-600"
                                  style={{ width: `${(playerMana / playerMaxMana) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold font-cinzel text-gray-900 dark:text-purple-300 mb-4">
                          Town Crier
                        </h2>

                        <div className="bg-gray-100 dark:bg-gray-900/70 rounded-lg p-4 h-64 overflow-y-auto">
                          <div className="space-y-3">
                            <div className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-purple-500 dark:border-purple-700">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                Welcome to Town Square!
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Rest, restock, and prepare for your next adventure.
                              </p>
                            </div>

                            <div className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-red-500 dark:border-red-700">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">Dungeon Alert</div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Rumors speak of powerful bosses lurking in the depths of the dungeon.
                              </p>
                            </div>

                            <div className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-yellow-500 dark:border-yellow-700">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">Merchant News</div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                New items have arrived at the store! Check them out.
                              </p>
                            </div>

                            <div className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-green-500 dark:border-green-700">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">Adventurer Tip</div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Don't forget to stock up on health potions before entering the dungeon.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Link href="/game">
                            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600">
                              <Sword className="mr-2 h-5 w-5" />
                              Enter Dungeon
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory">
                <Inventory inventory={inventory} onUseItem={onUseItem} onDiscardItem={onDiscardItem} />
              </TabsContent>

              <TabsContent value="store">
                <Store playerGold={playerGold} playerLevel={playerLevel} onPurchase={onPurchase} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
