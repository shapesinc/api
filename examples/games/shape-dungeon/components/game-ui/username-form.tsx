"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface UsernameFormProps {
  onComplete: (username: string) => void
}

export default function UsernameForm({ onComplete }: UsernameFormProps) {
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if username exists in localStorage
    const savedUsername = localStorage.getItem("playerUsername")
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Save username to localStorage
    localStorage.setItem("playerUsername", username)

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Username saved",
        description: "Your adventure awaits!",
      })
      onComplete(username)
    }, 1000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-black/50 border border-gray-200 dark:border-purple-900/50 text-gray-900 dark:text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 dark:text-purple-300">Choose Your Identity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enter a username to begin your adventure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="Enter your adventurer name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 text-white"
          >
            {isLoading ? "Saving..." : "Begin Adventure"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
