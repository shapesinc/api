"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Sword, User, Trophy, Settings, ShoppingBag, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface HamburgerMenuProps {
  currentPage: string
}

export default function HamburgerMenu({ currentPage }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const menuItems = [
    { name: "Home", icon: <Home className="h-5 w-5" />, href: "/" },
    { name: "Dungeon", icon: <Sword className="h-5 w-5" />, href: "/game" },
    { name: "Character", icon: <User className="h-5 w-5" />, href: "/character" },
    { name: "Achievements", icon: <Trophy className="h-5 w-5" />, href: "/achievements" },
    { name: "Inventory", icon: <ShoppingBag className="h-5 w-5" />, href: "/lobby?tab=inventory" },
    { name: "Settings", icon: <Settings className="h-5 w-5" />, href: "/settings" },
    { name: "Exit Game", icon: <LogOut className="h-5 w-5" />, href: "/" },
  ]

  return (
    <div className="relative z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="md:hidden text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={currentPage === item.href ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
