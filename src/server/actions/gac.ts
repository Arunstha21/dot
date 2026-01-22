"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Player, IPlayer, Team } from "@/lib/database/schema"
import { Stage } from "@/lib/database/schema"

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

export interface SendGACResult {
  success: boolean
  message?: string
  error?: string
  teamsSent?: number
}

// Discord REST API types
interface DiscordChannel {
  id: string
  name: string
  type: number
}

interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: DiscordEmbedField[]
  footer?: { text: string }
  timestamp?: string
}

const DISCORD_API_BASE = "https://discord.com/api/v10"

async function getDiscordToken(): Promise<string> {
  return process.env.DISCORD_TOKEN || ""
}

async function discordFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getDiscordToken()
  if (!token || token === "") {
    throw new Error("Discord bot token not configured.")
  }
  const res = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(
      `Discord API error ${res.status}: ${await res.text()}`
    )
  }

  return res
}

async function sendDiscordEmbed(
  channelId: string,
  embed: DiscordEmbed
): Promise<{ success: boolean; error?: string }> {
  try {
    await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ embeds: [embed] }),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Types for GAC data
export interface PlayerGACData {
  _id: string
  name: string
  uid: string
  email?: string
  gacUsername?: string
  gacPassword?: string
  gacIngameName?: string
}

export interface TeamGACData {
  _id: string
  name: string
  tag: string
  players: PlayerGACData[]
}

// Get all teams with GAC data for a stage
export async function getTeamsWithGAC(stageId: string): Promise<{
  success: boolean
  teams?: TeamGACData[]
  error?: string
}> {
  try {
    await dbConnect()

    const stage = await Stage.findById(stageId)
    if (!stage) {
      return { success: false, error: "Stage not found" }
    }

    // Get all groups for this stage
    const groups = await Stage.findById(stageId).populate("groups").lean()
    if (!groups) {
      return { success: false, error: "Groups not found" }
    }

    // Get all teams from all groups
    const groupIds = (groups as any).groups.map((g: any) => g._id)
    const teams = await Team.find({ group: { $in: groupIds } })
      .populate({
        path: "players",
        options: { sort: { name: 1 } },
      })
      .sort({ name: 1 })
      .lean()

    const teamGACData: TeamGACData[] = teams.map((team) => ({
      _id: team._id.toString(),
      name: team.name,
      tag: team.tag,
      players: (team.players as IPlayer[])
        .filter((p) => p) // Filter out null players
        .map((player) => ({
          _id: player._id.toString(),
          name: player.name,
          uid: player.uid,
          email: player.email || undefined,
          gacUsername: player.gacUsername || undefined,
          gacPassword: player.gacPassword || undefined,
          gacIngameName: player.gacIngameName || undefined,
        })),
    }))

    return { success: true, teams: teamGACData }
  } catch (error) {
    console.error("Error fetching teams with GAC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Update player GAC data
export async function updatePlayerGAC(
  playerId: string,
  data: {
    gacUsername?: string
    gacPassword?: string
    gacIngameName?: string
  }
): Promise<ActionResult> {
  try {
    await dbConnect()

    const player = await Player.findById(playerId)
    if (!player) {
      return { status: "error", message: "Player not found" }
    }

    const update: any = {}
    if (data.gacUsername !== undefined) update.gacUsername = data.gacUsername
    if (data.gacPassword !== undefined) update.gacPassword = data.gacPassword
    if (data.gacIngameName !== undefined) update.gacIngameName = data.gacIngameName

    await Player.findByIdAndUpdate(playerId, update)

    revalidatePath("/dashboard/gac")
    return { status: "success", message: "GAC data updated successfully" }
  } catch (error) {
    console.error("Error updating GAC data:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update GAC data",
    }
  }
}

// Delete player GAC data
export async function deletePlayerGAC(playerId: string): Promise<ActionResult> {
  try {
    await dbConnect()

    const player = await Player.findById(playerId)
    if (!player) {
      return { status: "error", message: "Player not found" }
    }

    await Player.findByIdAndUpdate(playerId, {
      $unset: { gacUsername: "", gacPassword: "", gacIngameName: "" },
    })

    revalidatePath("/dashboard/gac")
    return { status: "success", message: "GAC data deleted successfully" }
  } catch (error) {
    console.error("Error deleting GAC data:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete GAC data",
    }
  }
}

// Bulk import GAC data from CSV/Excel
export async function bulkImportGAC(
  stageId: string,
  data: Array<{
    playerName: string
    playerUid: string
    gacUsername?: string
    gacPassword?: string
    gacIngameName?: string
  }>
): Promise<ActionResult> {
  try {
    await dbConnect()

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        const player = await Player.findOne({ uid: row.playerUid })
        if (!player) {
          errorCount++
          errors.push(`Player not found: ${row.playerName}`)
          continue
        }

        const update: any = {}
        if (row.gacUsername !== undefined) update.gacUsername = row.gacUsername
        if (row.gacPassword !== undefined) update.gacPassword = row.gacPassword
        if (row.gacIngameName !== undefined) update.gacIngameName = row.gacIngameName

        await Player.findByIdAndUpdate(player._id, update)
        successCount++
      } catch (err) {
        errorCount++
        errors.push(`Failed to import: ${row.playerName}`)
      }
    }

    revalidatePath("/dashboard/gac")
    return {
      status: "success",
      message: `Imported ${successCount} players, ${errorCount} failed`,
    }
  } catch (error) {
    console.error("Error bulk importing GAC:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to import GAC data",
    }
  }
}

// Bulk update team GAC data
export async function bulkUpdateTeamGAC(
  updates: Array<{
    playerId: string
    gacUsername?: string
    gacPassword?: string
    gacIngameName?: string
  }>
): Promise<ActionResult> {
  try {
    await dbConnect()

    let updatedCount = 0

    for (const update of updates) {
      const updateObj: any = {}

      // Only include non-empty fields
      if (update.gacUsername !== undefined && update.gacUsername !== "") {
        updateObj.gacUsername = update.gacUsername
      }
      if (update.gacPassword !== undefined && update.gacPassword !== "") {
        updateObj.gacPassword = update.gacPassword
      }
      if (update.gacIngameName !== undefined && update.gacIngameName !== "") {
        updateObj.gacIngameName = update.gacIngameName
      }

      // Only update if there are actual changes
      if (Object.keys(updateObj).length > 0) {
        await Player.findByIdAndUpdate(update.playerId, updateObj)
        updatedCount++
      }
    }

    revalidatePath("/dashboard/gac")
    return {
      status: "success",
      message: `Updated ${updatedCount} player(s)`,
    }
  } catch (error) {
    console.error("Error bulk updating GAC:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to bulk update GAC data",
    }
  }
}

// Export team GAC data
export async function exportTeamGAC(teamId: string): Promise<{
  success: boolean
  data?: string // CSV formatted data
  error?: string
}> {
  try {
    await dbConnect()

    const team = await Team.findById(teamId).populate("players")
    if (!team) {
      return { success: false, error: "Team not found" }
    }

    const players = team.players as IPlayer[]

    // Generate CSV
    const headers = ["Player Name", "UID", "Email", "GAC Username", "GAC Password", "In-Game Name"]
    const rows = players.map((p) => [
      p.name,
      p.uid,
      p.email || "",
      p.gacUsername || "",
      p.gacPassword || "",
      p.gacIngameName || "",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    return { success: true, data: csv }
  } catch (error) {
    console.error("Error exporting GAC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export GAC data",
    }
  }
}

// Export all teams GAC data for a stage
export async function exportAllTeamsGAC(stageId: string): Promise<{
  success: boolean
  data?: string // CSV formatted data
  error?: string
}> {
  try {
    await dbConnect()

    const result = await getTeamsWithGAC(stageId)
    if (!result.success || !result.teams) {
      return { success: false, error: result.error || "Failed to fetch teams" }
    }

    const headers = ["Team", "Player Name", "UID", "Email", "GAC Username", "GAC Password", "In-Game Name"]
    const rows: string[][] = []

    for (const team of result.teams) {
      for (const player of team.players) {
        rows.push([
          team.name,
          player.name,
          player.uid,
          player.email || "",
          player.gacUsername || "",
          player.gacPassword || "",
          player.gacIngameName || "",
        ])
      }
    }

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    return { success: true, data: csv }
  } catch (error) {
    console.error("Error exporting all GAC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export GAC data",
    }
  }
}

// Copy player GAC credentials to clipboard (returns the formatted string)
export async function copyPlayerGAC(playerId: string): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    await dbConnect()

    const player = await Player.findById(playerId)
    if (!player) {
      return { success: false, error: "Player not found" }
    }

    const text = `Username: ${player.gacUsername || "N/A"}\nPassword: ${player.gacPassword || "N/A"}`

    return { success: true, data: text }
  } catch (error) {
    console.error("Error copying GAC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to copy GAC data",
    }
  }
}

// Copy all team GAC credentials to clipboard
export async function copyTeamGAC(teamId: string): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    await dbConnect()

    const team = await Team.findById(teamId).populate("players")
    if (!team) {
      return { success: false, error: "Team not found" }
    }

    const players = team.players as IPlayer[]

    let text = `${team.name} GAC Credentials\n${"=".repeat(50)}\n\n`

    for (const player of players) {
      text += `${player.name}:\n`
      text += `  Username: ${player.gacUsername || "N/A"}\n`
      text += `  Password: ${player.gacPassword || "N/A"}\n`
      text += `  In-Game: ${player.gacIngameName || "N/A"}\n\n`
    }

    return { success: true, data: text }
  } catch (error) {
    console.error("Error copying team GAC:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to copy team GAC data",
    }
  }
}

// Send GAC credentials to Discord
export async function sendGACToDiscord(
  stageId: string,
  teamIds?: string[]
): Promise<SendGACResult> {
  try {
    await dbConnect()

    const stage = await Stage.findById(stageId).populate("guild")
    if (!stage || !(stage as any).guild) {
      return { success: false, error: "Stage or guild not found" }
    }

    const guild = (stage as any).guild as { guildId: string; guildName: string; resultChannel?: string }
    if (!guild.resultChannel) {
      return { success: false, error: "Discord channel not configured for this stage" }
    }

    // Get teams with GAC data
    const result = await getTeamsWithGAC(stageId)
    if (!result.success || !result.teams) {
      return { success: false, error: result.error || "Failed to fetch teams" }
    }

    // Filter teams if teamIds provided
    const teamsToSend = teamIds
      ? result.teams.filter((t) => teamIds.includes(t._id))
      : result.teams

    if (teamsToSend.length === 0) {
      return { success: false, error: "No teams found with GAC data" }
    }

    let teamsSent = 0
    const errors: string[] = []

    for (const team of teamsToSend) {
      // Filter players with GAC credentials
      const playersWithCreds = team.players.filter(
        (p) => p.gacUsername && p.gacPassword
      )

      if (playersWithCreds.length === 0) {
        errors.push(`No GAC credentials found for team ${team.name}`)
        continue
      }

      // Create Discord embed
      const embed: DiscordEmbed = {
        title: `GAC Credentials for ${team.name}`,
        color: 0x2ecc71,
        footer: { text: "Use responsibly. Do not share publicly." },
        timestamp: new Date().toISOString(),
        fields: playersWithCreds
          .sort((a, b) => a.uid.localeCompare(b.uid))
          .map((player, index) => ({
            name: `#${index + 1} - ${player.gacIngameName || player.gacUsername || player.name}`,
            value: `**UID:** \`${player.uid}\`\n**Username:** \`${player.gacUsername}\`\n**Password:** \`${player.gacPassword}\``,
            inline: false,
          })),
      }

      // Send to Discord
      const sendResult = await sendDiscordEmbed(guild.resultChannel, embed)
      if (sendResult.success) {
        teamsSent++
      } else {
        errors.push(`Failed to send ${team.name}: ${sendResult.error}`)
      }
    }

    if (teamsSent === 0) {
      return {
        success: false,
        error: errors.join("; ") || "Failed to send any teams",
      }
    }

    return {
      success: true,
      message: `Sent GAC credentials for ${teamsSent} of ${teamsToSend.length} team(s)` +
        (errors.length > 0 ? `. Errors: ${errors.join("; ")}` : ""),
      teamsSent,
    }
  } catch (error) {
    console.error("Error sending GAC to Discord:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send GAC to Discord",
    }
  }
}

// Send a single team's GAC credentials to Discord
export async function sendSingleTeamGACToDiscord(
  teamId: string
): Promise<SendGACResult> {
  try {
    await dbConnect()

    const team = await Team.findById(teamId).populate("players")
    if (!team) {
      return { success: false, error: "Team not found" }
    }

    // Find the stage for this team
    const stage = await Stage.findOne({ groups: { $in: [team.group] } }).populate("guild")
    if (!stage || !(stage as any).guild) {
      return { success: false, error: "Stage or guild not found" }
    }

    const guild = (stage as any).guild as { guildId: string; guildName: string; resultChannel?: string }
    if (!guild.resultChannel) {
      return { success: false, error: "Discord channel not configured for this stage" }
    }

    const players = team.players as IPlayer[]
    const playersWithCreds = players.filter(
      (p) => p.gacUsername && p.gacPassword
    )

    if (playersWithCreds.length === 0) {
      return { success: false, error: "No GAC credentials found for this team" }
    }

    // Create Discord embed
    const embed: DiscordEmbed = {
      title: `GAC Credentials for ${team.name}`,
      color: 0x2ecc71,
      footer: { text: "Use responsibly. Do not share publicly." },
      timestamp: new Date().toISOString(),
      fields: playersWithCreds
        .sort((a, b) => a.uid.localeCompare(b.uid))
        .map((player, index) => ({
          name: `#${index + 1} - ${player.gacIngameName || player.gacUsername || player.name}`,
          value: `**UID:** \`${player.uid}\`\n**Username:** \`${player.gacUsername}\`\n**Password:** \`${player.gacPassword}\``,
          inline: false,
        })),
    }

    // Send to Discord
    const sendResult = await sendDiscordEmbed(guild.resultChannel, embed)
    if (sendResult.success) {
      return {
        success: true,
        message: `Sent GAC credentials for ${team.name}`,
        teamsSent: 1,
      }
    } else {
      return {
        success: false,
        error: sendResult.error || "Failed to send to Discord",
      }
    }
  } catch (error) {
    console.error("Error sending team GAC to Discord:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send GAC to Discord",
    }
  }
}
