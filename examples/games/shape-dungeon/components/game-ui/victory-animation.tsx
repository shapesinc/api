"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VictoryAnimationProps {
  bossName: string
  onClose: () => void
  rewards: {
    experience: number
    gold: number
    items?: string[]
  }
}

export default function VictoryAnimation({ bossName, onClose, rewards }: VictoryAnimationProps) {
  useEffect(() => {
    // Launch confetti
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      >
        <motion.div
          initial={{ scale: 0.8, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 300,
            delay: 0.2,
          }}
          className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 10, 0] }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4"
          >
            <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-3xl font-bold font-cinzel text-gray-900 dark:text-white mb-2"
          >
            Victory!
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-gray-600 dark:text-gray-300 mb-6"
          >
            You have defeated {bossName}!
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rewards</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Experience</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">+{rewards.experience} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gold</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">+{rewards.gold} Gold</span>
              </div>
              {rewards.items && rewards.items.length > 0 && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Items</span>
                  <ul className="mt-1">
                    {rewards.items.map((item, index) => (
                      <li key={index} className="text-green-600 dark:text-green-400">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.3 }}>
            <Button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
