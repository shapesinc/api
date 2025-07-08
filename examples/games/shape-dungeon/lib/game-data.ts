import { Sword, Wand, Footprints, Heart, Skull, Flame, Droplets, Zap, Mountain } from "lucide-react"
import React from "react"

export const characterClasses = [
  {
    id: "warrior",
    name: "Warrior",
    description: "A mighty fighter skilled in close combat and heavy armor.",
    specialty: "Melee combat specialist",
    icon: React.createElement(Sword, { className: "h-5 w-5 text-red-400" }),
    baseStats: {
      strength: 8,
      defense: 7,
      magic: 3,
      health: 7,
    },
    abilities: [
      { name: "Cleave", description: "A powerful attack that hits multiple enemies", manaCost: 15 },
      { name: "Shield Wall", description: "Reduces incoming damage for 3 turns", manaCost: 20 },
    ],
  },
  {
    id: "mage",
    name: "Mage",
    description: "A powerful spellcaster who harnesses arcane energies.",
    specialty: "Destructive magic",
    icon: React.createElement(Wand, { className: "h-5 w-5 text-blue-400" }),
    baseStats: {
      strength: 3,
      defense: 4,
      magic: 9,
      health: 5,
    },
    abilities: [
      { name: "Fireball", description: "Launches a ball of fire at the enemy", manaCost: 15 },
      { name: "Frost Nova", description: "Freezes enemies, reducing their attack speed", manaCost: 25 },
    ],
  },
  {
    id: "rogue",
    name: "Rogue",
    description: "A stealthy adventurer who excels at finding traps and striking from shadows.",
    specialty: "Stealth and critical hits",
    icon: React.createElement(Footprints, { className: "h-5 w-5 text-green-400" }),
    baseStats: {
      strength: 6,
      defense: 5,
      magic: 4,
      health: 6,
    },
    abilities: [
      { name: "Backstab", description: "A powerful attack from stealth that deals critical damage", manaCost: 10 },
      { name: "Smoke Bomb", description: "Reduces enemy accuracy for 3 turns", manaCost: 15 },
    ],
  },
  {
    id: "cleric",
    name: "Cleric",
    description: "A divine spellcaster who can heal allies and smite enemies.",
    specialty: "Healing and support",
    icon: React.createElement(Heart, { className: "h-5 w-5 text-yellow-400" }),
    baseStats: {
      strength: 5,
      defense: 6,
      magic: 7,
      health: 7,
    },
    abilities: [
      { name: "Divine Heal", description: "Restores a significant amount of health", manaCost: 20 },
      { name: "Holy Smite", description: "Deals damage and has a chance to stun", manaCost: 25 },
    ],
  },
]

export const dungeonLevels = [
  {
    id: 1,
    name: "The Forgotten Catacombs",
    description: "Ancient burial chambers filled with restless undead.",
    difficulty: 1,
    boss: {
      name: "The Bone Collector",
      description: "A massive skeletal monstrosity that animates the bones of fallen adventurers.",
      health: 100,
      attack: 10,
      defense: 5,
      miniGame: "memoryMatch",
      dialogueContext: "ancient undead guardian of forgotten tombs",
    },
    enemies: ["skeleton", "zombie", "ghost"],
    roomCount: 5,
  },
  {
    id: 2,
    name: "Fungal Caverns",
    description: "Damp caves filled with bioluminescent fungi and slimes.",
    difficulty: 2,
    boss: {
      name: "The Spore Lord",
      description: "A sentient fungal colony that spreads toxic spores.",
      health: 150,
      attack: 15,
      defense: 8,
      miniGame: "reactionTest",
      dialogueContext: "ancient fungal entity that consumes all life",
    },
    enemies: ["slime", "fungal_zombie", "spore_beast"],
    roomCount: 6,
  },
  {
    id: 3,
    name: "Molten Core",
    description: "Scorching tunnels filled with lava and fire elementals.",
    difficulty: 3,
    boss: {
      name: "Inferno",
      description: "A massive fire elemental that controls the flow of magma.",
      health: 200,
      attack: 20,
      defense: 10,
      miniGame: "patternMatch",
      dialogueContext: "ancient fire elemental born from the planet's core",
    },
    enemies: ["fire_imp", "lava_golem", "ash_wraith"],
    roomCount: 7,
  },
  {
    id: 4,
    name: "Abyssal Depths",
    description: "Flooded chambers deep beneath the surface, home to strange aquatic creatures.",
    difficulty: 4,
    boss: {
      name: "The Kraken",
      description: "A colossal tentacled horror that lurks in the darkest depths.",
      health: 250,
      attack: 25,
      defense: 12,
      miniGame: "memoryMatch",
      dialogueContext: "ancient sea monster that has devoured countless ships",
    },
    enemies: ["deep_one", "sahuagin", "water_elemental"],
    roomCount: 7,
  },
  {
    id: 5,
    name: "Storm Peaks",
    description: "Treacherous mountain paths where lightning strikes without warning.",
    difficulty: 5,
    boss: {
      name: "Thunderwing",
      description: "A massive storm dragon that commands the power of lightning and wind.",
      health: 300,
      attack: 30,
      defense: 15,
      miniGame: "reactionTest",
      dialogueContext: "ancient storm dragon that rules the skies",
    },
    enemies: ["storm_harpy", "lightning_elemental", "cloud_giant"],
    roomCount: 8,
  },
]

export const items = [
  {
    id: "health_potion",
    name: "Health Potion",
    description: "Restores 50 health points.",
    type: "consumable",
    effect: { health: 50 },
    rarity: "common",
    value: 10,
  },
  {
    id: "mana_potion",
    name: "Mana Potion",
    description: "Restores 50 mana points.",
    type: "consumable",
    effect: { mana: 50 },
    rarity: "common",
    value: 10,
  },
  {
    id: "steel_sword",
    name: "Steel Sword",
    description: "A well-crafted steel sword.",
    type: "weapon",
    effect: { attack: 15 },
    rarity: "uncommon",
    value: 50,
    requiredClass: ["warrior", "rogue"],
  },
  {
    id: "oak_staff",
    name: "Oak Staff",
    description: "A staff carved from ancient oak, imbued with magical energy.",
    type: "weapon",
    effect: { magicAttack: 18 },
    rarity: "uncommon",
    value: 50,
    requiredClass: ["mage", "cleric"],
  },
  {
    id: "plate_armor",
    name: "Plate Armor",
    description: "Heavy armor that provides excellent protection.",
    type: "armor",
    effect: { defense: 20 },
    rarity: "rare",
    value: 100,
    requiredClass: ["warrior"],
  },
  {
    id: "leather_armor",
    name: "Leather Armor",
    description: "Light armor that allows for quick movement.",
    type: "armor",
    effect: { defense: 10, speed: 5 },
    rarity: "uncommon",
    value: 75,
    requiredClass: ["rogue"],
  },
  {
    id: "mage_robes",
    name: "Mage Robes",
    description: "Enchanted robes that enhance magical abilities.",
    type: "armor",
    effect: { defense: 5, magicPower: 15 },
    rarity: "uncommon",
    value: 75,
    requiredClass: ["mage"],
  },
  {
    id: "holy_symbol",
    name: "Holy Symbol",
    description: "A sacred symbol that enhances divine magic.",
    type: "accessory",
    effect: { magicPower: 10, healingPower: 15 },
    rarity: "rare",
    value: 100,
    requiredClass: ["cleric"],
  },
  {
    id: "fire_gem",
    name: "Fire Gem",
    description: "A gem infused with elemental fire energy.",
    type: "material",
    rarity: "rare",
    value: 150,
  },
  {
    id: "water_gem",
    name: "Water Gem",
    description: "A gem infused with elemental water energy.",
    type: "material",
    rarity: "rare",
    value: 150,
  },
  {
    id: "earth_gem",
    name: "Earth Gem",
    description: "A gem infused with elemental earth energy.",
    type: "material",
    rarity: "rare",
    value: 150,
  },
  {
    id: "air_gem",
    name: "Air Gem",
    description: "A gem infused with elemental air energy.",
    type: "material",
    rarity: "rare",
    value: 150,
  },
]

export const enemies = [
  // Level 1 - Forgotten Catacombs
  {
    id: "skeleton",
    name: "Skeleton",
    description: "A reanimated skeleton wielding a rusty sword.",
    health: 30,
    attack: 5,
    defense: 2,
    experience: 10,
    loot: ["health_potion"],
    level: 1,
  },
  {
    id: "zombie",
    name: "Zombie",
    description: "A shambling corpse with decaying flesh.",
    health: 40,
    attack: 4,
    defense: 1,
    experience: 8,
    loot: ["mana_potion"],
    level: 1,
  },
  {
    id: "ghost",
    name: "Restless Spirit",
    description: "A translucent apparition that phases through solid objects.",
    health: 25,
    attack: 7,
    defense: 3,
    experience: 12,
    loot: ["mana_potion"],
    level: 1,
  },

  // Level 2 - Fungal Caverns
  {
    id: "slime",
    name: "Toxic Slime",
    description: "A gelatinous blob that oozes corrosive fluid.",
    health: 50,
    attack: 8,
    defense: 3,
    experience: 15,
    loot: ["health_potion", "mana_potion"],
    level: 2,
  },
  {
    id: "fungal_zombie",
    name: "Fungal Zombie",
    description: "A zombie infested with parasitic fungi.",
    health: 60,
    attack: 10,
    defense: 4,
    experience: 18,
    loot: ["health_potion"],
    level: 2,
  },
  {
    id: "spore_beast",
    name: "Spore Beast",
    description: "A quadrupedal creature covered in toxic spores.",
    health: 45,
    attack: 12,
    defense: 2,
    experience: 20,
    loot: ["mana_potion"],
    level: 2,
  },

  // Level 3 - Molten Core
  {
    id: "fire_imp",
    name: "Fire Imp",
    description: "A small, mischievous creature made of living flame.",
    health: 40,
    attack: 15,
    defense: 5,
    experience: 25,
    loot: ["fire_gem"],
    level: 3,
  },
  {
    id: "lava_golem",
    name: "Lava Golem",
    description: "A massive humanoid formed from molten rock.",
    health: 80,
    attack: 18,
    defense: 10,
    experience: 35,
    loot: ["fire_gem", "health_potion"],
    level: 3,
  },
  {
    id: "ash_wraith",
    name: "Ash Wraith",
    description: "A spectral entity formed from the ashes of those who died in fire.",
    health: 60,
    attack: 20,
    defense: 8,
    experience: 30,
    loot: ["mana_potion"],
    level: 3,
  },

  // Level 4 - Abyssal Depths
  {
    id: "deep_one",
    name: "Deep One",
    description: "A humanoid fish creature with glowing eyes.",
    health: 70,
    attack: 22,
    defense: 12,
    experience: 40,
    loot: ["water_gem"],
    level: 4,
  },
  {
    id: "sahuagin",
    name: "Sahuagin",
    description: "A savage aquatic predator with sharp teeth and claws.",
    health: 85,
    attack: 25,
    defense: 15,
    experience: 45,
    loot: ["water_gem", "health_potion"],
    level: 4,
  },
  {
    id: "water_elemental",
    name: "Water Elemental",
    description: "A sentient vortex of water with crushing power.",
    health: 100,
    attack: 20,
    defense: 18,
    experience: 50,
    loot: ["water_gem", "mana_potion"],
    level: 4,
  },

  // Level 5 - Storm Peaks
  {
    id: "storm_harpy",
    name: "Storm Harpy",
    description: "A winged humanoid that commands lightning.",
    health: 90,
    attack: 28,
    defense: 15,
    experience: 55,
    loot: ["air_gem"],
    level: 5,
  },
  {
    id: "lightning_elemental",
    name: "Lightning Elemental",
    description: "A crackling entity of pure electrical energy.",
    health: 110,
    attack: 32,
    defense: 12,
    experience: 60,
    loot: ["air_gem", "mana_potion"],
    level: 5,
  },
  {
    id: "cloud_giant",
    name: "Cloud Giant",
    description: "A massive humanoid that dwells among the storm clouds.",
    health: 150,
    attack: 30,
    defense: 20,
    experience: 70,
    loot: ["air_gem", "health_potion"],
    level: 5,
  },
]

export const getEnemiesByLevel = (level: number) => {
  return enemies.filter((enemy) => enemy.level === level)
}

export const getRandomEnemy = (level: number) => {
  const levelEnemies = getEnemiesByLevel(level)
  const randomIndex = Math.floor(Math.random() * levelEnemies.length)
  return levelEnemies[randomIndex]
}

export const getDungeonLevel = (id: number) => {
  return dungeonLevels.find((level) => level.id === id) || dungeonLevels[0]
}

export const getElementIcon = (element: string) => {
  switch (element) {
    case "fire":
      return React.createElement(Flame, { className: "h-5 w-5 text-red-400" })
    case "water":
      return React.createElement(Droplets, { className: "h-5 w-5 text-blue-400" })
    case "earth":
      return React.createElement(Mountain, { className: "h-5 w-5 text-green-400" })
    case "air":
      return React.createElement(Zap, { className: "h-5 w-5 text-yellow-400" })
    default:
      return React.createElement(Skull, { className: "h-5 w-5 text-purple-400" })
  }
}
