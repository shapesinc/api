export async function getBossDialog(
  bossName: string,
  playerName: string,
  context: string,
  channelId: string,
): Promise<string> {
  try {
    const response = await fetch("/api/boss-dialog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bossName,
        playerName,
        context,
        channelId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.dialog
  } catch (error) {
    console.error("Error getting boss dialog:", error)
    return "You dare challenge me, mortal?"
  }
}

export async function getBossCombatMove(
  bossName: string,
  playerName: string,
  playerHealth: number,
  bossHealth: number,
  channelId: string,
): Promise<{ moveName: string; description: string; damage: number }> {
  try {
    const response = await fetch("/api/boss-move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bossName,
        playerName,
        playerHealth,
        bossHealth,
        channelId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting boss combat move:", error)
    return {
      moveName: "Desperate Strike",
      description: "The boss lashes out with a powerful attack!",
      damage: Math.floor(Math.random() * 15) + 5,
    }
  }
}

export async function getBossDefeatDialog(bossName: string, playerName: string, channelId: string): Promise<string> {
  try {
    const response = await fetch("/api/boss-defeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bossName,
        playerName,
        channelId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.dialog
  } catch (error) {
    console.error("Error getting boss defeat dialog:", error)
    return "You... have defeated me... but this is not the end..."
  }
}

export async function getBossChatResponse(
  bossName: string,
  playerName: string,
  message: string,
  context: string,
  channelId: string,
): Promise<string> {
  try {
    const response = await fetch("/api/boss-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bossName,
        playerName,
        message,
        context,
        channelId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Error getting boss chat response:", error)
    return "Enough talk! Prepare to face my wrath!"
  }
}
