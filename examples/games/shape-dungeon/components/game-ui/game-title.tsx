"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function GameTitle() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-32" />

  return (
    <motion.div
      className="relative text-center py-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h1
        className="text-6xl md:text-7xl font-bold tracking-tight font-cinzel"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 dark:from-purple-400 dark:via-pink-500 dark:to-red-500 game-text-glow">
          SHAPE DUNGEON
        </span>
      </motion.h1>

      <motion.div
        className="mt-2 text-xl text-purple-700 dark:text-purple-300 font-cinzel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        A perilous adventure awaits
      </motion.div>

      <motion.div
        className="absolute -z-10 inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-400 via-violet-500 to-purple-400 dark:from-purple-800 dark:via-violet-900 dark:to-purple-800 rounded-full"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 4,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
