"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Monitor, Gamepad, Sparkles, Zap, Shield, Sword } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    difficulty: "normal",
    showTutorials: true,
    enablePixelation: false,
    enableCameraShake: true,
    enableParticleEffects: true,
    combatStyle: "balanced",
    username: "",
  })


  useEffect(() => {
    const savedSettings = localStorage.getItem("gameSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    
    const savedUsername = localStorage.getItem("playerUsername")
    if (savedUsername) {
      setSettings((prev) => ({
        ...prev,
        username: savedUsername,
      }))
    } else if (process.env.PLAYER_USERNAME) {
      setSettings((prev) => ({
        ...prev,
        username: process.env.PLAYER_USERNAME || "Adventurer",
      }))
    }
  }, [])

  const handleSaveSettings = () => {
    localStorage.setItem("gameSettings", JSON.stringify(settings))
    toast({
      title: "Settings saved!",
      description: "Your game settings have been updated.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Menu
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold ml-4 text-purple-300">Game Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/50 border-purple-900/50 text-white">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-purple-300">Game Options</CardTitle>
              <CardDescription className="text-gray-400">Adjust your gameplay experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Difficulty</label>
                <Select
                  value={settings.difficulty}
                  onValueChange={(value) => setSettings({ ...settings, difficulty: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="easy">Easy - For casual players</SelectItem>
                    <SelectItem value="normal">Normal - Balanced challenge</SelectItem>
                    <SelectItem value="hard">Hard - For experienced players</SelectItem>
                    <SelectItem value="nightmare">Nightmare - Extreme difficulty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Combat Style</label>
                <Select
                  value={settings.combatStyle}
                  onValueChange={(value) => setSettings({ ...settings, combatStyle: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select combat style" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="aggressive">Aggressive - More damage, less defense</SelectItem>
                    <SelectItem value="balanced">Balanced - Equal offense and defense</SelectItem>
                    <SelectItem value="defensive">Defensive - Less damage, more defense</SelectItem>
                    <SelectItem value="magical">Magical - Focus on spell power</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Gamepad className="h-4 w-4 text-purple-400 mr-2" />
                    Show Tutorials
                  </label>
                  <Switch
                    checked={settings.showTutorials}
                    onCheckedChange={(checked) => setSettings({ ...settings, showTutorials: checked })}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <p className="text-xs text-gray-500">Display tutorial messages for game mechanics</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Monitor className="h-4 w-4 text-purple-400 mr-2" />
                    Pixel Art Filter
                  </label>
                  <Switch
                    checked={settings.enablePixelation}
                    onCheckedChange={(checked) => setSettings({ ...settings, enablePixelation: checked })}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <p className="text-xs text-gray-500">Enable retro pixel art visual style</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Zap className="h-4 w-4 text-purple-400 mr-2" />
                    Camera Shake
                  </label>
                  <Switch
                    checked={settings.enableCameraShake}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableCameraShake: checked })}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <p className="text-xs text-gray-500">Enable camera shake effects during combat</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
                    Particle Effects
                  </label>
                  <Switch
                    checked={settings.enableParticleEffects}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableParticleEffects: checked })}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <p className="text-xs text-gray-500">Enable visual particle effects for spells and abilities</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-purple-900/50 text-white">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-purple-300">Combat Settings</CardTitle>
              <CardDescription className="text-gray-400">Customize your battle experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Sword className="h-4 w-4 text-red-400 mr-2" />
                    Attack Power
                  </label>
                  <span className="text-red-300 font-bold">
                    {settings.combatStyle === "aggressive"
                      ? "High"
                      : settings.combatStyle === "defensive"
                        ? "Low"
                        : settings.combatStyle === "magical"
                          ? "Medium"
                          : "Balanced"}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{
                      width:
                        settings.combatStyle === "aggressive"
                          ? "80%"
                          : settings.combatStyle === "defensive"
                            ? "40%"
                            : settings.combatStyle === "magical"
                              ? "60%"
                              : "60%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Shield className="h-4 w-4 text-blue-400 mr-2" />
                    Defense Rating
                  </label>
                  <span className="text-blue-300 font-bold">
                    {settings.combatStyle === "aggressive"
                      ? "Low"
                      : settings.combatStyle === "defensive"
                        ? "High"
                        : settings.combatStyle === "magical"
                          ? "Medium"
                          : "Balanced"}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width:
                        settings.combatStyle === "aggressive"
                          ? "40%"
                          : settings.combatStyle === "defensive"
                            ? "80%"
                            : settings.combatStyle === "magical"
                              ? "50%"
                              : "60%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-gray-300">
                    <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                    Magic Power
                  </label>
                  <span className="text-yellow-300 font-bold">
                    {settings.combatStyle === "aggressive"
                      ? "Low"
                      : settings.combatStyle === "defensive"
                        ? "Medium"
                        : settings.combatStyle === "magical"
                          ? "High"
                          : "Balanced"}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600"
                    style={{
                      width:
                        settings.combatStyle === "aggressive"
                          ? "30%"
                          : settings.combatStyle === "defensive"
                            ? "50%"
                            : settings.combatStyle === "magical"
                              ? "90%"
                              : "60%",
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Player Information</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Username</label>
                    <div className="bg-gray-800 p-2 rounded text-purple-300 font-medium">
                      {settings.username || "Adventurer"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Set via environment variable or login</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-purple-900 hover:bg-purple-800 text-white" onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
