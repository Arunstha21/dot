"use server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Match, PlayerStats, Schedule, TeamStats } from "@/lib/database/schema"

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }
  await dbConnect()
  return null
}

export async function getMatchesByGroup(groupId: string) {
  await dbConnect()
  const schedules = await Schedule.find({ groups: groupId }).populate("match").lean()
  return JSON.parse(JSON.stringify(schedules))
}

export interface PlayerStats {
  _id: string
  player: { _id: string; name: string }
  killNum: number
  damage: number
  assists: number
  rank: number
  survivalTime: number
}

export interface TeamStats {
  _id: string
  team: { _id: string; name: string }
  killNum: number
  damage: number
  assists: number
  rank: number
  survivalTime: number
}

export async function getMatchById(matchId: string) {
  try {
    await dbConnect();

    const matchDoc = await Match.findById(matchId)
      .populate([
        { path: "gameGlobalInfo" },
        { path: "teamInfo" },
        { path: "playerInfo" },
      ])
      .lean();

    if (!matchDoc) {
      return { status: "error", message: "Match not found" };
    }

    const playerStats = await PlayerStats.find({ match: matchId })
      .populate("player", "name email discord")
      .lean();

    const teamStats = await TeamStats.find({ match: matchId })
      .populate("team", "name tag email")
      .lean();

    // Convert all non-serializable fields to JSON-safe versions
    const match = JSON.parse(
      JSON.stringify(matchDoc, (_, value) =>
        value && typeof value === "object" && value.type === "Buffer"
          ? Array.from(value.data)
          : value
      )
    );

    const typedPlayerStats = JSON.parse(
      JSON.stringify(playerStats, (_, value) =>
        value && typeof value === "object" && value.type === "Buffer"
          ? Array.from(value.data)
          : value
      )
    );

    const typedTeamStats = JSON.parse(
      JSON.stringify(teamStats, (_, value) =>
        value && typeof value === "object" && value.type === "Buffer"
          ? Array.from(value.data)
          : value
      )
    );

    return {
      status: "success",
      data: {
        match,
        playerStats: typedPlayerStats,
        teamStats: typedTeamStats,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching match:", error);
    return { status: "error", message: "Failed to fetch match details" };
  }
}


export async function updateMatchAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const matchId = String(formData.get("matchId") || "")
  const playerInfo = formData.get("playerInfo")
  const teamInfo = formData.get("teamInfo")
  const gameGlobalInfo = formData.get("gameGlobalInfo")

  if (!matchId) return { status: "error", message: "Missing match id" }

  try {
    const update: any = {}
    if (playerInfo) update.playerInfo = JSON.parse(playerInfo as string)
    if (teamInfo) update.teamInfo = JSON.parse(teamInfo as string)
    if (gameGlobalInfo) update.gameGlobalInfo = JSON.parse(gameGlobalInfo as string)

    await Match.findByIdAndUpdate(matchId, update)
    revalidatePath("/settings")
    return { status: "success", message: "Match updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update match" }
  }
}
