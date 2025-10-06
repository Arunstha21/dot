"use server"

import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Player } from "@/lib/database/schema"

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }
  await dbConnect()
  return null
}

export async function getPlayersByTeam(teamId: string) {
  await dbConnect()
  const players = await Player.find({ team: teamId }).populate("discord").lean()
  return JSON.parse(JSON.stringify(players))
}

export async function updatePlayerAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const schema = z.object({
    playerId: z.string().min(1),
    name: z.string().min(1).optional(),
    uid: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    gacUsername: z.string().optional(),
    gacPassword: z.string().optional(),
    gacIngameName: z.string().optional(),
  })

  const parsed = schema.safeParse({
    playerId: formData.get("playerId"),
    name: formData.get("name"),
    uid: formData.get("uid"),
    email: formData.get("email"),
    gacUsername: formData.get("gacUsername"),
    gacPassword: formData.get("gacPassword"),
    gacIngameName: formData.get("gacIngameName"),
  })

  if (!parsed.success) return { status: "error", message: "Invalid fields" }

  try {
    const update: any = {}
    if (parsed.data.name) update.name = parsed.data.name
    if (parsed.data.uid) update.uid = parsed.data.uid
    if (parsed.data.email !== undefined) update.email = parsed.data.email || undefined
    if (parsed.data.gacUsername !== undefined) update.gacUsername = parsed.data.gacUsername
    if (parsed.data.gacPassword !== undefined) update.gacPassword = parsed.data.gacPassword
    if (parsed.data.gacIngameName !== undefined) update.gacIngameName = parsed.data.gacIngameName

    await Player.findByIdAndUpdate(parsed.data.playerId, update)
    revalidatePath("/settings")
    return { status: "success", message: "Player updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update player" }
  }
}

export async function deletePlayerAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const playerId = String(formData.get("playerId") || "")
  if (!playerId) return { status: "error", message: "Missing player id" }

  try {
    await Player.findByIdAndDelete(playerId)
    revalidatePath("/settings")
    return { status: "success", message: "Player deleted" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to delete player" }
  }
}
