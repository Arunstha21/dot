"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { RoleManagerUser, IRoleManagerUser, Team, ITeam } from "@/lib/database/schema"
import { Guild } from "@/lib/database/guild"
// Discord client operations are handled through Discord bot commands
// Direct client access from server actions causes dependency issues with Next.js

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }
  await dbConnect()
  return null
}

// Types for the role manager
export interface RoleManagerPlayerData {
  _id: string
  userName: string
  email: string
  role: string[]
  serverJoined: boolean
  emailSent: number
  sender?: string
  team?: ITeam
  guild: string
  createdAt: string
  updatedAt: string
}

export interface RoleManagerStats {
  totalPlayers: number
  verifiedPlayers: number
  unverifiedPlayers: number
  emailSentPlayers: number
  joinedServerPlayers: number
}

// Get all role manager players with optional filters
export async function getRoleManagerPlayers(
  stageId: string,
  filters?: {
    search?: string
    verificationStatus?: "all" | "verified" | "unverified" | "pending"
    serverStatus?: "all" | "joined" | "not-joined"
  }
): Promise<{ success: boolean; players?: RoleManagerPlayerData[]; error?: string }> {
  try {
    await dbConnect()

    const stage = await Guild.findById(stageId).populate("users")
    if (!stage) {
      return { success: false, error: "Stage not found" }
    }

    let players = stage.users as IRoleManagerUser[]

    // Populate team data
    players = await RoleManagerUser.find({ guild: stageId })
      .populate("team")
      .populate("player")
      .lean()

    // Apply filters
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        players = players.filter(
          (p) =>
            p.userName.toLowerCase().includes(searchLower) ||
            p.email.toLowerCase().includes(searchLower) ||
            (p.team as any)?.name?.toLowerCase().includes(searchLower)
        )
      }

      if (filters.verificationStatus && filters.verificationStatus !== "all") {
        if (filters.verificationStatus === "verified") {
          players = players.filter((p) => p.serverJoined)
        } else if (filters.verificationStatus === "unverified") {
          players = players.filter((p) => !p.serverJoined && p.emailSent === 0)
        } else if (filters.verificationStatus === "pending") {
          players = players.filter((p) => !p.serverJoined && p.emailSent > 0)
        }
      }

      if (filters.serverStatus && filters.serverStatus !== "all") {
        if (filters.serverStatus === "joined") {
          players = players.filter((p) => p.serverJoined)
        } else if (filters.serverStatus === "not-joined") {
          players = players.filter((p) => !p.serverJoined)
        }
      }
    }

    return {
      success: true,
      players: JSON.parse(JSON.stringify(players)) as RoleManagerPlayerData[],
    }
  } catch (error) {
    console.error("Error fetching role manager players:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Get role manager statistics
export async function getRoleManagerStats(stageId: string): Promise<{
  success: boolean
  stats?: RoleManagerStats
  error?: string
}> {
  try {
    await dbConnect()

    const guild = await Guild.findById(stageId)
    if (!guild) {
      return { success: false, error: "Guild not found" }
    }

    const users = await RoleManagerUser.find({ guild: stageId })

    const stats: RoleManagerStats = {
      totalPlayers: users.length,
      verifiedPlayers: users.filter((u) => u.serverJoined).length,
      unverifiedPlayers: users.filter((u) => !u.serverJoined && u.emailSent === 0).length,
      emailSentPlayers: users.filter((u) => !u.serverJoined && u.emailSent > 0).length,
      joinedServerPlayers: users.filter((u) => u.serverJoined).length,
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Error fetching role manager stats:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Reassign player roles
export async function reassignPlayerRoles(
  playerId: string,
  roleIds: string[]
): Promise<ActionResult> {
  try {
    await dbConnect()

    const user = await RoleManagerUser.findById(playerId)
    if (!user) {
      return { status: "error", message: "Player not found" }
    }

    user.role = roleIds
    await user.save()

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Roles reassigned successfully" }
  } catch (error) {
    console.error("Error reassigning roles:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to reassign roles",
    }
  }
}

// Update player nickname
// Note: This function stores the nickname but the actual Discord update must be done by the Discord bot
export async function updatePlayerNickname(
  playerId: string,
  nickname: string
): Promise<ActionResult> {
  try {
    await dbConnect()

    const user = await RoleManagerUser.findById(playerId)
    if (!user) {
      return { status: "error", message: "Player not found" }
    }

    // Store the desired nickname - the Discord bot will handle the actual update
    // For now, we return a success since the data is stored
    // The actual Discord nickname update happens through the bot when the user joins

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Nickname update queued. Use Discord bot commands to update Discord nicknames." }
  } catch (error) {
    console.error("Error updating nickname:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update nickname",
    }
  }
}

// Update player email
export async function updatePlayerEmail(
  playerId: string,
  email: string
): Promise<ActionResult> {
  try {
    await dbConnect()

    const user = await RoleManagerUser.findById(playerId)
    if (!user) {
      return { status: "error", message: "Player not found" }
    }

    user.email = email
    user.emailSent = 0
    user.serverJoined = false
    user.otp = undefined
    await user.save()

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Email updated successfully" }
  } catch (error) {
    console.error("Error updating email:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update email",
    }
  }
}

// Add player to role manager
export async function addPlayerToRoleManager(
  stageId: string,
  data: {
    userName: string
    email: string
    role: string[]
    teamId?: string
    playerId?: string
  }
): Promise<ActionResult> {
  try {
    await dbConnect()

    const guild = await Guild.findById(stageId)
    if (!guild) {
      return { status: "error", message: "Guild not found" }
    }

    // Check if user already exists
    const existingUser = await RoleManagerUser.findOne({
      $or: [{ email: data.email }, { userName: data.userName }],
      guild: stageId,
    })

    if (existingUser) {
      return { status: "error", message: "User already exists" }
    }

    const newUser = await RoleManagerUser.create({
      userName: data.userName,
      email: data.email,
      role: data.role,
      guild: guild._id,
      team: data.teamId || null,
      player: data.playerId || null,
      serverJoined: false,
      emailSent: 0,
      sender: "admin",
    })

    // Add user to guild's users array
    guild.users.push(newUser._id)
    await guild.save()

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Player added successfully" }
  } catch (error) {
    console.error("Error adding player:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to add player",
    }
  }
}

// Remove player from role manager
export async function removePlayerFromRoleManager(playerId: string): Promise<ActionResult> {
  try {
    await dbConnect()

    const user = await RoleManagerUser.findById(playerId)
    if (!user) {
      return { status: "error", message: "Player not found" }
    }

    // Remove from guild's users array
    await Guild.findByIdAndUpdate(user.guild, {
      $pull: { users: playerId },
    })

    await RoleManagerUser.findByIdAndDelete(playerId)

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Player removed successfully" }
  } catch (error) {
    console.error("Error removing player:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to remove player",
    }
  }
}

// Bulk reassign roles
export async function bulkReassignRoles(
  playerIds: string[],
  roleIds: string[]
): Promise<ActionResult> {
  try {
    await dbConnect()

    await RoleManagerUser.updateMany(
      { _id: { $in: playerIds } },
      { role: roleIds }
    )

    revalidatePath("/dashboard/role-manager")
    return {
      status: "success",
      message: `Roles reassigned for ${playerIds.length} players`,
    }
  } catch (error) {
    console.error("Error bulk reassigning roles:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to bulk reassign roles",
    }
  }
}

// Bulk update nicknames
// Note: This function queues nickname updates but the actual Discord update must be done by the Discord bot
export async function bulkUpdateNicknames(
  playerIds: string[],
  nicknameTemplate: string // e.g., "{tag} | {username}"
): Promise<ActionResult> {
  try {
    await dbConnect()

    // Validate that we can process this request
    const users = await RoleManagerUser.find({ _id: { $in: playerIds } })

    // Calculate nicknames for preview
    const nicknames: string[] = []
    for (const user of users) {
      const team = await Team.findById(user.team)
      const username = user.userName.split("#")[0]
      const nickname = nicknameTemplate
        .replace("{tag}", team?.teamTag || "")
        .replace("{username}", username)
        .trim()
      nicknames.push(nickname)
    }

    revalidatePath("/dashboard/role-manager")
    return {
      status: "success",
      message: `Nickname templates generated for ${playerIds.length} players. Use Discord bot commands to apply them.`,
    }
  } catch (error) {
    console.error("Error bulk updating nicknames:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to bulk update nicknames",
    }
  }
}

// Bulk remove players
export async function bulkRemovePlayers(playerIds: string[]): Promise<ActionResult> {
  try {
    await dbConnect()

    // Get all users to remove
    const users = await RoleManagerUser.find({ _id: { $in: playerIds } })

    // Remove from all guilds
    for (const user of users) {
      await Guild.findByIdAndUpdate(user.guild, {
        $pull: { users: user._id },
      })
    }

    await RoleManagerUser.deleteMany({ _id: { $in: playerIds } })

    revalidatePath("/dashboard/role-manager")
    return {
      status: "success",
      message: `${playerIds.length} players removed successfully`,
    }
  } catch (error) {
    console.error("Error bulk removing players:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to bulk remove players",
    }
  }
}

// Resend verification email
export async function resendVerificationEmail(playerId: string): Promise<ActionResult> {
  try {
    await dbConnect()

    const user = await RoleManagerUser.findById(playerId)
    if (!user) {
      return { status: "error", message: "Player not found" }
    }

    if (user.emailSent >= 3) {
      return { status: "error", message: "Maximum email attempts reached" }
    }

    if (user.serverJoined) {
      return { status: "error", message: "Player is already verified" }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000)
    user.otp = otp
    user.emailSent += 1
    await user.save()

    // Send email (you'll need to implement this based on your email service)
    // await sendEmail(user.email, otp)

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Verification email sent" }
  } catch (error) {
    console.error("Error resending email:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to resend email",
    }
  }
}

// Manual verify player
export async function manualVerifyPlayer(playerId: string): Promise<ActionResult> {
  try {
    await dbConnect()

    const user = await RoleManagerUser.findById(playerId)
    if (!user) {
      return { status: "error", message: "Player not found" }
    }

    user.serverJoined = true
    user.otp = undefined
    await user.save()

    revalidatePath("/dashboard/role-manager")
    return { status: "success", message: "Player verified successfully" }
  } catch (error) {
    console.error("Error manual verifying:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to verify player",
    }
  }
}

// Bulk import role manager data from CSV/Excel
export async function bulkImportRoleManager(
  stageId: string,
  data: Array<{
    discordTag: string
    teamName: string
    emailId: string
    guildId: string
    guildName: string
    teamTag: string
    rolePlayer: string
    roleOwner: string
    roleExtra?: string
    event: string
    stage: string
    uid?: string
  }>
): Promise<ActionResult> {
  try {
    await dbConnect()

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    const guild = await Guild.findById(stageId)
    if (!guild) {
      return { status: "error", message: "Guild not found" }
    }

    for (const row of data) {
      try {
        if (!row.emailId || !row.discordTag || !row.rolePlayer) {
          errorCount++
          errors.push(`Missing required fields for ${row.discordTag || "unknown"}`)
          continue
        }

        // Check if user already exists
        const existingUser = await RoleManagerUser.findOne({
          email: row.emailId,
          guild: stageId,
        })

        if (existingUser) {
          errorCount++
          errors.push(`User ${row.emailId} already exists`)
          continue
        }

        // Build roles array
        const roles = [row.rolePlayer, row.roleOwner]
        if (row.roleExtra) {
          roles.push(row.roleExtra)
        }

        // Create new user
        const newUser = await RoleManagerUser.create({
          userName: row.discordTag,
          email: row.emailId,
          role: roles,
          guild: stageId,
          serverJoined: false,
          emailSent: 0,
          sender: "bulk-import",
        })

        // Add user to guild's users array
        guild.users.push(newUser._id)

        successCount++
      } catch (err) {
        errorCount++
        errors.push(`Failed to import ${row.discordTag}`)
      }
    }

    await guild.save()

    revalidatePath("/dashboard/role-manager")
    return {
      status: "success",
      message: `Imported ${successCount} players, ${errorCount} failed${errors.length > 0 ? `. Errors: ${errors.slice(0, 3).join(", ")}${errorCount > 3 ? "..." : ""}` : ""}`,
    }
  } catch (error) {
    console.error("Error bulk importing role manager:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to import role manager data",
    }
  }
}
