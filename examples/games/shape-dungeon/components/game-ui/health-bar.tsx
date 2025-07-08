"use client"
import { Heart } from "lucide-react"

interface HealthBarProps {
  current: number
  max: number
  showText?: boolean
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function HealthBar({
  current,
  max,
  showText = true,
  showIcon = true,
  size = "md",
  className = "",
}: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100))

  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && (
        <Heart
          className={`
          ${size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} 
          text-red-500 dark:text-red-400 mr-1
        `}
        />
      )}
      <div className="flex-1 flex items-center">
        <div
          className={`w-full h-${size === "sm" ? "1.5" : size === "lg" ? "3" : "2"} bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden`}
        >
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-500 dark:from-red-800 dark:to-red-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showText && (
          <span
            className={`ml-2 ${size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"} text-red-600 dark:text-red-400`}
          >
            {current}/{max}
          </span>
        )}
      </div>
    </div>
  )
}
