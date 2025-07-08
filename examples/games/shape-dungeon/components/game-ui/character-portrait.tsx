import Image from "next/image"

interface CharacterPortraitProps {
  classType: string
}

export default function CharacterPortrait({ classType }: CharacterPortraitProps) {
  const portraitMap = {
    warrior: "/placeholder.svg?height=150&width=150",
    mage: "/placeholder.svg?height=150&width=150",
    rogue: "/placeholder.svg?height=150&width=150",
    cleric: "/placeholder.svg?height=150&width=150",
  }

  const portrait = portraitMap[classType as keyof typeof portraitMap] || portraitMap.warrior

  return (
    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-700 shadow-[0_0_15px_rgba(128,0,255,0.5)]">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-black/50 z-10" />
      <Image
        src={portrait || "/placeholder.svg"}
        alt={`${classType} character`}
        width={150}
        height={150}
        className="object-cover"
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-1/4 z-20 ${
          classType === "warrior"
            ? "bg-red-900/70"
            : classType === "mage"
              ? "bg-blue-900/70"
              : classType === "rogue"
                ? "bg-green-900/70"
                : "bg-yellow-900/70"
        }`}
      />
    </div>
  )
}
