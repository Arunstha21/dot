"use server"

import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkBotInServer, getDiscordChannels } from "@/discord/results/send"
import { getStageWithGuild, linkGuildToStage, updateGuildResultChannel } from "../DiscordResultStage"
import { Guild, IGuild } from "@/lib/database/guild"
import { Stage } from "@/lib/database/schema"
import { TicketConfig } from "@/lib/database/ticket"
import { MatchLogger } from "@/lib/database/matchLog"

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

export async function selectDiscordChannel(guildId: string, channelId: string) {
  try {
    const result = await updateGuildResultChannel(guildId, channelId)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to update channel",
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error selecting Discord channel:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

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
        events: [stage.eventId],
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

export async function fetchUserGuilds() {
  try {
    // TODO: Implement Discord OAuth to get user's guilds
    // For now, return empty array - this would require Discord OAuth integration
    // The user will need to manually enter guild ID and name
    return {
      success: true,
      guilds: [],
    }
  } catch (error) {
    console.error("Error fetching user guilds:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      guilds: [],
    }
  }
}

export async function getDiscordClientId(){
    return process.env.DISCORD_CLIENT_ID || "";
}

export async function getDiscordToken(){
    return process.env.DISCORD_TOKEN || "";
}

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }
  await dbConnect()
  return null
}

export async function updateStageDiscordAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const schema = z.object({
    stageId: z.string().min(1),
    guildId: z.string().optional(),
    resultChannel: z.string().optional(),
  })

  const parsed = schema.safeParse({
    stageId: formData.get("stageId"),
    guildId: formData.get("guildId"),
    resultChannel: formData.get("resultChannel"),
  })

  if (!parsed.success) return { status: "error", message: "Invalid fields" }

  try {
    const update: any = {}
    if (parsed.data.guildId) update.guild = parsed.data.guildId
    if (parsed.data.resultChannel !== undefined) {
      // Also update the guild's result channel
      if (parsed.data.guildId) {
        await Guild.findByIdAndUpdate(parsed.data.guildId, { resultChannel: parsed.data.resultChannel })
      }
    }

    await Stage.findByIdAndUpdate(parsed.data.stageId, update)
    revalidatePath("/settings")
    return { status: "success", message: "Discord settings updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update Discord settings" }
  }
}

export async function toggleTicketConfigAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const ticketConfigId = String(formData.get("ticketConfigId") || "")
  const active = formData.get("active") === "true"

  if (!ticketConfigId) return { status: "error", message: "Missing ticket config id" }

  try {
    await TicketConfig.findByIdAndUpdate(ticketConfigId, { status: active ? "active" : "inactive" })
    revalidatePath("/settings")
    return { status: "success", message: `Ticket system ${active ? "enabled" : "disabled"}` }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to toggle ticket system" }
  }
}

export async function toggleMatchLoggerAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const matchLoggerId = String(formData.get("matchLoggerId") || "")
  const active = formData.get("active") === "true"

  if (!matchLoggerId) return { status: "error", message: "Missing match logger id" }

  try {
    await MatchLogger.findByIdAndUpdate(matchLoggerId, { active })
    revalidatePath("/settings")
    return { status: "success", message: `Match logger ${active ? "enabled" : "disabled"}` }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to toggle match logger" }
  }
}

export async function getAllGuilds() {
  await dbConnect()
  const guilds = await Guild.find().populate("ticketConfig").populate("matchLogger").lean()
  return JSON.parse(JSON.stringify(guilds))
}
