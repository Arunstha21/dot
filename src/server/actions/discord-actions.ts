"use server"

import { Guild, IGuild } from "@/lib/database/guild"
import { IMatchLog, IMatchLogger, MatchLog, MatchLogger } from "@/lib/database/matchLog"
import { IRoleManagerUser, IStage, RoleManagerUser, Stage } from "@/lib/database/schema"
import { ITicketConfig, ITicketDocument, TicketConfig, TicketDocument } from "@/lib/database/ticket"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getStageWithGuild, linkGuildToStage } from "../DiscordResultStage"
import { checkBotInServer, getDiscordChannels } from "@/discord/results/send"

// Mock data structure - replace with your actual database calls
export interface GuildData {
  _id: string
  guildId: string
  guildName: string
  ticketConfig?: {
    _id: string
    status: "active" | "inactive"
    ticketChannel: string
    transcriptChannel: string
    ticketCount: number
  }
  matchLogger?: {
    _id: string
    active: boolean
    loggerChannelId: string
  }
  resultChannel?: string
  roleManager?: boolean
  users?: any[]
  admins?: any[]
}

interface ActionResult {
  status: "success" | "error"
  message: string
}

export async function getAllGuilds(stageId: string): Promise<GuildData> {
  try {
    await dbConnect()
    const StageDoc = await Stage.findOne({ _id: stageId })
      .populate({
        path: "guild",
        populate: [{
          path: "users"
        }, {
          path: "admins"
        },{
          path: "ticketConfig"
        },{
          path: "matchLogger"
        }]
      }) as IStage & { guild: GuildData }

    const guildData = {
      _id: StageDoc.guild._id.toString(),
      guildId: StageDoc.guild.guildId,
      guildName: StageDoc.guild.guildName,
      ticketConfig: StageDoc.guild.ticketConfig ? {
        _id: (StageDoc.guild.ticketConfig as any)._id.toString(),
        status: (StageDoc.guild.ticketConfig as any).status,
        ticketChannel: (StageDoc.guild.ticketConfig as any).ticketChannel,
        transcriptChannel: (StageDoc.guild.ticketConfig as any).transcriptChannel,
        ticketCount: (StageDoc.guild.ticketConfig as any).ticketCount || 0,
      } : undefined,
      matchLogger: StageDoc.guild.matchLogger ? {
        _id: (StageDoc.guild.matchLogger as any)._id.toString(),
        active: (StageDoc.guild.matchLogger as any).active,
        loggerChannelId: (StageDoc.guild.matchLogger as any).loggerChannelId,
      } : undefined,
      resultChannel: StageDoc.guild.resultChannel,
      roleManager: StageDoc.guild.roleManager,
      users: StageDoc.guild.users || [],
      admins: StageDoc.guild.admins || [],
    }

    return guildData as GuildData
  } catch (error) {
    console.error("Error fetching guilds:", error)
    throw new Error("Failed to fetch guilds")
  }
}

export async function toggleTicketConfigAction(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const ticketConfigId = formData.get("ticketConfigId") as string
    const active = formData.get("active") === "true"

    if (!ticketConfigId) {
      return {
        status: "error",
        message: "Ticket config ID is required",
      }
    }

    await dbConnect()
    await TicketConfig.findByIdAndUpdate(ticketConfigId, {
      status: active ? "active" : "inactive",
    })

    revalidatePath("/dashboard")

    return {
      status: "success",
      message: `Ticket system ${active ? "enabled" : "disabled"} successfully`,
    }
  } catch (error) {
    console.error("Error toggling ticket config:", error)
    return {
      status: "error",
      message: "Failed to toggle ticket system",
    }
  }
}

export async function toggleMatchLoggerAction(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const matchLoggerId = formData.get("matchLoggerId") as string
    const active = formData.get("active") === "true"

    if (!matchLoggerId) {
      return {
        status: "error",
        message: "Match logger ID is required",
      }
    }

    await dbConnect()
    await MatchLogger.findByIdAndUpdate(matchLoggerId, {
      active: active,
    })

    revalidatePath("/dashboard")

    return {
      status: "success",
      message: `Match logger ${active ? "enabled" : "disabled"} successfully`,
    }
  } catch (error) {
    console.error("Error toggling match logger:", error)
    return {
      status: "error",
      message: "Failed to toggle match logger",
    }
  }
}

export async function toggleRoleManagerAction(guildId: string, enabled: boolean): Promise<ActionResult> {
  try {
    if (!guildId) {
      return {
        status: "error",
        message: "Guild ID is required",
      }
    }

    await dbConnect()
    await Guild.findByIdAndUpdate(guildId, {
      roleManager: enabled,
    })

    revalidatePath("/dashboard")

    return {
      status: "success",
      message: `Role Manager ${enabled ? "enabled" : "disabled"} successfully`,
    }
  } catch (error) {
    console.error("Error toggling role manager:", error)
    return {
      status: "error",
      message: "Failed to toggle Role Manager",
    }
  }
}

// CRUD operations for Role Manager users

export async function getRoleManagerUsers(guildId: string): Promise<{ success: boolean; users: IRoleManagerUser[] }> {
  try {
    await dbConnect()
    const users = await RoleManagerUser.find({ guild: guildId }).populate("team").populate("player")

    return {
      success: true,
      users: users as IRoleManagerUser[],
    }
  } catch (error) {
    console.error("Error fetching role manager users:", error)
    return {
      success: false,
      users: [],
    }
  }
}

export async function createRoleManagerUser(data: {
  userName: string
  email: string
  role: string[]
  guild: string
  serverJoined: boolean
  emailSent: boolean
}): Promise<ActionResult> {
  try {
    if (!data.userName || !data.email || !data.guild) {
      return {
        status: "error",
        message: "Username, email, and guild ID are required",
      }
    }

    await dbConnect()
    await RoleManagerUser.create({
      userName: data.userName,
      email: data.email,
      role: data.role,
      guild: data.guild,
      serverJoined: data.serverJoined,
      emailSent: data.emailSent ? 1 : 0,
      sender: "admin", // Default sender
      player: null, // Will be set when player is created
    })

    revalidatePath("/dashboard")

    return {
      status: "success",
      message: "User created successfully",
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return {
      status: "error",
      message: "Failed to create user",
    }
  }
}

export async function updateRoleManagerUser(
  userId: string,
  data: {
    userName: string
    email: string
    role: string[]
    serverJoined: boolean
    emailSent: boolean
  },
): Promise<ActionResult> {
  try {
    if (!userId) {
      return {
        status: "error",
        message: "User ID is required",
      }
    }

    await dbConnect()
    await RoleManagerUser.findByIdAndUpdate(userId, {
      userName: data.userName,
      email: data.email,
      role: data.role,
      serverJoined: data.serverJoined,
      emailSent: data.emailSent ? 1 : 0,
    })

    revalidatePath("/dashboard")

    return {
      status: "success",
      message: "User updated successfully",
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return {
      status: "error",
      message: "Failed to update user",
    }
  }
}

export async function deleteRoleManagerUser(userId: string): Promise<ActionResult> {
  try {
    if (!userId) {
      return {
        status: "error",
        message: "User ID is required",
      }
    }

    await dbConnect()
    await RoleManagerUser.findByIdAndDelete(userId)

    revalidatePath("/dashboard")

    return {
      status: "success",
      message: "User deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    return {
      status: "error",
      message: "Failed to delete user",
    }
  }
}

// Server actions for Discord Results Setup

export async function fetchDiscordChannels(guildId: string) {
  try {
    const channels = await getDiscordChannels(guildId)
    return {
      success: true,
      channels,
    }
  } catch (error) {
    console.error("Error fetching Discord channels:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      channels: [],
    }
  }
}

export async function getDiscordClientId() {
  try {
    return process.env.DISCORD_CLIENT_ID || ""
  } catch (error) {
    console.error("Error getting Discord client ID:", error)
    return ""
  }
}

export async function selectDiscordChannel(guildId: string, channelId: string) {
  try {
    await dbConnect()
    await Guild.findOneAndUpdate({ guildId: guildId }, { resultChannel: channelId })

    revalidatePath("/dashboard")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error selecting Discord channel:", error)
    return {
      success: false,
      error: "Failed to select channel",
    }
  }
}

export async function setupGuildForStage(stageId: string, guildId: string, guildName: string) {
  try {
    // Check if guild already exists in database
    let guild = await Guild.findOne({ guildId }).lean().exec() as IGuild | null

    // If guild doesn't exist, create it
    if (!guild) {
      const stage = await Stage.findById(stageId).exec()
      if (!stage) {
        return {
          success: false,
          error: "Stage not found",
        }
      }
      const newGuild = new Guild({
        guildId,
        guildName,
        users: [],
        admins: [],
        events: [stage.event],
        roleManager: false,
      })
      guild = (await newGuild.save()).toObject()
    }
    if (!guild?._id) {
      throw new Error("Guild ID not found after creation")
    }

    // Link guild to stage
    const result = await linkGuildToStage(stageId, guild._id.toString())

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to link guild to stage",
      }
    }

    return {
      success: true,
      guild: JSON.parse(JSON.stringify(guild)),
    }
  } catch (error) {
    console.error("Error setting up guild:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Server actions for Ticket System
export async function getTicketConfig(guildId: string) {
  try {
    await dbConnect()
    const guild = await Guild.findOne({ guildId: guildId }).populate("ticketConfig")
    const config = guild?.ticketConfig as ITicketConfig | null

    return {
      success: true,
      config: config,
    }
  } catch (error) {
    console.error("Error fetching ticket config:", error)
    return {
      success: false,
      config: null,
    }
  }
}

export async function setupTicketConfig(
  guildId: string,
  ticketChannelId: string,
  transcriptChannelId: string,
  categories: string[],
) {
  try {
    await dbConnect()
    const guild = await Guild.findOne({ guildId: guildId })

    if (!guild) {
      return {
        success: false,
        error: "Guild not found",
        config: null,
      }
    }

    const config = await TicketConfig.findOneAndUpdate(
      { guild: guild._id },
      {
        guild: guild._id,
        ticketChannel: ticketChannelId,
        transcriptChannel: transcriptChannelId,
        ticketCategories: categories,
        status: "active",
      },
      { upsert: true, new: true },
    )

    // Update guild with ticket config reference
    await Guild.findByIdAndUpdate(guild._id, { ticketConfig: config._id })

    revalidatePath("/dashboard")

    return {
      success: true,
      config: config,
    }
  } catch (error) {
    console.error("Error setting up ticket config:", error)
    return {
      success: false,
      error: "Failed to setup ticket config",
      config: null,
    }
  }
}

export async function toggleTicketStatus(configId: string, active: boolean) {
  try {
    await dbConnect()
    await TicketConfig.findByIdAndUpdate(configId, { status: active ? "active" : "inactive" })

    revalidatePath("/dashboard")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error toggling ticket status:", error)
    return {
      success: false,
      error: "Failed to toggle status",
    }
  }
}

export async function getTicketDocuments(guildId: string) {
  try {
    await dbConnect()
    const guild = await Guild.findOne({ guildId: guildId })

    if (!guild) {
      return {
        success: false,
        tickets: [],
      }
    }

    const tickets = await TicketDocument.find({ guild: guild._id }).sort({ createdAt: -1 }).limit(50)

    return {
      success: true,
      tickets: tickets as ITicketDocument[],
    }
  } catch (error) {
    console.error("Error fetching ticket documents:", error)
    return {
      success: false,
      tickets: [],
    }
  }
}

// Server actions for Match Logger
export async function getMatchLogger(guildId: string) {
  try {
    await dbConnect()
    const guild = await Guild.findOne({ guildId: guildId }).populate("matchLogger")
    const logger = guild?.matchLogger as IMatchLogger | null

    return {
      success: true,
      logger: logger,
    }
  } catch (error) {
    console.error("Error fetching match logger:", error)
    return {
      success: false,
      logger: null,
    }
  }
}

export async function setupMatchLogger(guildId: string, loggerChannelId: string) {
  try {
    await dbConnect()
    const guild = await Guild.findOne({ guildId: guildId })

    if (!guild) {
      return {
        success: false,
        error: "Guild not found",
        logger: null,
      }
    }

    const logger = await MatchLogger.findOneAndUpdate(
      { guild: guild._id },
      {
        guild: guild._id,
        loggerChannelId: loggerChannelId,
        active: true,
      },
      { upsert: true, new: true },
    )

    // Update guild with match logger reference
    await Guild.findByIdAndUpdate(guild._id, { matchLogger: logger._id })

    revalidatePath("/dashboard")

    return {
      success: true,
      logger: logger,
    }
  } catch (error) {
    console.error("Error setting up match logger:", error)
    return {
      success: false,
      error: "Failed to setup match logger",
      logger: null,
    }
  }
}

export async function toggleMatchLoggerStatus(loggerId: string, active: boolean) {
  try {
    await dbConnect()
    await MatchLogger.findByIdAndUpdate(loggerId, { active })

    revalidatePath("/dashboard")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error toggling match logger status:", error)
    return {
      success: false,
      error: "Failed to toggle status",
    }
  }
}

export async function getMatchLogs(guildId: string) {
  try {
    await dbConnect()
    const guild = await Guild.findOne({ guildId: guildId }).populate("matchLogger")

    if (!guild || !guild.matchLogger) {
      return {
        success: false,
        logs: [],
      }
    }

    const logs = await MatchLog.find({ logger: guild.matchLogger }).sort({ time: -1 }).limit(200)

    return {
      success: true,
      logs: logs as IMatchLog[],
    }
  } catch (error) {
    console.error("Error fetching match logs:", error)
    return {
      success: false,
      logs: [],
    }
  }
}

export async function checkDiscordSetup(stageId: string) {
  try {
    const result = await getStageWithGuild(stageId)

    if (!result || !result.guild) {
      return {
        success: true,
        setupStep: "no-guild" as const,
        guild: null,
        channels: [],
      }
    }

    const guild = result.guild

    if (!guild.resultChannel) {
      const botPresent = await checkBotInServer(guild.guildId)

      if (!botPresent) {
        return {
          success: true,
          setupStep: "no-bot" as const,
          guild: JSON.parse(JSON.stringify(guild)), // Deep clone to remove any non-serializable data
          channels: [],
        }
      }

      const channelList = await getDiscordChannels(guild.guildId)
      return {
        success: true,
        setupStep: "no-channel" as const,
        guild: JSON.parse(JSON.stringify(guild)),
        channels: channelList,
      }
    }

    return {
      success: true,
      setupStep: "ready" as const,
      guild: JSON.parse(JSON.stringify(guild)),
      channels: [],
      selectedChannel: guild.resultChannel,
    }
  } catch (error) {
    console.error("Error checking Discord setup:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      setupStep: "no-guild" as const,
      guild: null,
      channels: [],
    }
  }
}

export async function getDiscordToken() {
  try {
    return process.env.DISCORD_TOKEN || "" 
  } catch (error) {
    console.error("Error getting Discord token:", error)
    return ""
  }
}