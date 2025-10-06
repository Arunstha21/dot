"use server"

import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Team, Player } from "@/lib/database/schema"

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }
  await dbConnect()
  return null
}

export async function getTeamsByGroup(groupId: string) {
  await dbConnect()
  console.log(groupId);
  
  const teams = await Team.find({ group: groupId })
    .populate({
      path: "players",
      populate: {
        path: "discord",
        model: "RoleManagerUser",
      },
    })
    .lean()
  return JSON.parse(JSON.stringify(teams))
}

export async function updateTeamAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const schema = z.object({
    teamId: z.string().min(1),
    name: z.string().min(1).optional(),
    tag: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    slot: z.coerce.number().optional(),
  })

  const parsed = schema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    tag: formData.get("tag"),
    email: formData.get("email"),
    slot: formData.get("slot"),
  })

  if (!parsed.success) return { status: "error", message: "Invalid fields" }

  try {
    const update: any = {}
    if (parsed.data.name) update.name = parsed.data.name
    if (parsed.data.tag !== undefined) update.tag = parsed.data.tag
    if (parsed.data.email !== undefined) update.email = parsed.data.email || undefined
    if (parsed.data.slot !== undefined) update.slot = parsed.data.slot

    await Team.findByIdAndUpdate(parsed.data.teamId, update)
    revalidatePath("/settings")
    return { status: "success", message: "Team updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update team" }
  }
}

export async function deleteTeamAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const teamId = String(formData.get("teamId") || "")
  if (!teamId) return { status: "error", message: "Missing team id" }

  try {
    // Delete all players in the team
    await Player.deleteMany({ team: teamId })
    await Team.findByIdAndDelete(teamId)
    revalidatePath("/settings")
    return { status: "success", message: "Team deleted" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to delete team" }
  }
}
