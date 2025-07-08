"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getBossChatResponse } from "@/lib/shapes-api"

interface BossChatInterfaceProps {
  bossName: string
  playerName: string
  channelId: string
  onClose: () => void
  context: string
}

export default function BossChatInterface({
  bossName,
  playerName,
  channelId,
  onClose,
  context,
}: BossChatInterfaceProps) {
  const [messages, setMessages] = useState<{ sender: string; content: string; timestamp: number }[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add initial boss message
  useEffect(() => {
    const initialMessage = {
      sender: bossName,
      content: `So, ${playerName}... you dare to face me?`,
      timestamp: Date.now(),
    }
    setMessages([initialMessage])
  }, [bossName, playerName])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!inputMessage.trim()) return

    // Add user message
    const userMessage = {
      sender: playerName,
      content: inputMessage,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Get response from Shapes API
      const response = await getBossChatResponse(bossName, playerName, inputMessage, context, channelId)

      // Add boss response
      const bossMessage = {
        sender: bossName,
        content: response,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, bossMessage])
    } catch (error) {
      console.error("Error getting boss response:", error)

      // Add fallback response
      const fallbackMessage = {
        sender: bossName,
        content: "Enough talk! Prepare to face my wrath!",
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-full max-w-md mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-white/90 dark:bg-black/90 border border-gray-200 dark:border-purple-900/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-cinzel text-gray-900 dark:text-purple-300">{bossName}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 overflow-y-auto bg-gray-100 dark:bg-gray-900/70 rounded-md p-3">
                {messages.map((message, index) => (
                  <div key={index} className={`mb-3 ${message.sender === playerName ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block max-w-[80%] px-3 py-2 rounded-lg ${
                        message.sender === playerName
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
