export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  secret?: boolean
  progress?: number
  maxProgress?: number
  timestamp?: number
}

export const achievementsList: Achievement[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Begin your adventure in the Shape Dungeon",
    icon: "Footprints",
    unlocked: false,
  },
  {
    id: "first_blood",
    name: "First Blood",
    description: "Defeat your first enemy",
    icon: "Swords",
    unlocked: false,
  },
  {
    id: "boss_slayer",
    name: "Boss Slayer",
    description: "Defeat your first dungeon boss",
    icon: "Skull",
    unlocked: false,
  },
  {
    id: "master_tactician",
    name: "Master Tactician",
    description: "Win a battle without taking damage",
    icon: "Shield",
    unlocked: false,
  },
  {
    id: "dungeon_explorer",
    name: "Dungeon Explorer",
    description: "Explore all rooms in a dungeon level",
    icon: "Map",
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: "level_up",
    name: "Level Up",
    description: "Reach player level 5",
    icon: "ArrowUp",
    unlocked: false,
    progress: 1,
    maxProgress: 5,
  },
  {
    id: "mini_game_master",
    name: "Mini-Game Master",
    description: "Complete all types of boss mini-games",
    icon: "Gamepad2",
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: "treasure_hunter",
    name: "Treasure Hunter",
    description: "Find 10 rare items",
    icon: "Gem",
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: "shape_whisperer",
    name: "Shape Whisperer",
    description: "Interact with all boss Shapes",
    icon: "MessageSquare",
    unlocked: false,
    secret: true,
    progress: 0,
    maxProgress: 5,
  },
]

export function loadAchievements(): Achievement[] {
  if (typeof window === "undefined") return achievementsList

  const savedAchievements = localStorage.getItem("achievements")
  if (savedAchievements) {
    try {
      return JSON.parse(savedAchievements)
    } catch (e) {
      console.error("Error parsing achievements:", e)
    }
  }
  return achievementsList
}

export function saveAchievements(achievements: Achievement[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("achievements", JSON.stringify(achievements))
}

export function unlockAchievement(id: string): Achievement | null {
  const achievements = loadAchievements()
  const achievement = achievements.find((a) => a.id === id)

  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true
    achievement.timestamp = Date.now()
    saveAchievements(achievements)
    return achievement
  }

  return null
}

export function updateAchievementProgress(id: string, progress: number): Achievement | null {
  const achievements = loadAchievements()
  const achievement = achievements.find((a) => a.id === id)

  if (achievement && achievement.maxProgress) {
    achievement.progress = Math.min(progress, achievement.maxProgress)

    if (achievement.progress >= achievement.maxProgress && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.timestamp = Date.now()
    }

    saveAchievements(achievements)
    return achievement
  }

  return null
}
