"use server"

import { z } from "zod"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { EventDB, Group, IGroup, ISchedule, PointSystem, Schedule, Stage } from "@/lib/database/schema"
import { EventsData } from "@/app/settings/components/EventsManagement"
import { User } from "@/lib/database/user"

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }
  await dbConnect()
  return null
}

export async function createEventAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const schema = z.object({
    name: z.string().min(1),
    organizer: z.string().optional(),
    discordLink: z.string().optional(),
  })
  const parsed = schema.safeParse({
    name: formData.get("name"),
    organizer: formData.get("organizer"),
    discordLink: formData.get("discordLink"),
  })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  try {
    await EventDB.create(parsed.data)
    revalidatePath("/settings/events")
    return { status: "success", message: "Event created" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to create event" }
  }
}

export async function addStageAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const schema = z.object({ eventId: z.string().min(1), name: z.string().min(1) })
  const parsed = schema.safeParse({ eventId: formData.get("eventId"), name: formData.get("name") })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  try {
    await Stage.create({ eventId: parsed.data.eventId, name: parsed.data.name })
    revalidatePath("/settings/events")
    return { status: "success", message: "Stage added" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to add stage" }
  }
}

export async function addGroupAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const schema = z.object({ stageId: z.string().min(1), name: z.string().min(1) })
  const parsed = schema.safeParse({ stageId: formData.get("stageId"), name: formData.get("name") })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  try {
    await Group.create({ stageId: parsed.data.stageId, name: parsed.data.name, data: [] })
    revalidatePath("/settings/events")
    return { status: "success", message: "Group added" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to add group" }
  }
}

export async function deleteEventAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const eventId = String(formData.get("eventId") || "")
  if (!eventId) return { status: "error", message: "Missing event id" }
  try {
    // cascade delete: stages -> groups -> schedules handled by application level if needed
    const stages = await Stage.find({ eventId }).lean()
    const stageIds = stages.map((s) => s._id)
    const groups = await Group.find({ stageId: { $in: stageIds } }).lean()
    const groupIds = groups.map((g) => g._id)
    await Schedule.deleteMany({ groupId: { $in: groupIds } })
    await Group.deleteMany({ stageId: { $in: stageIds } })
    await Schedule.deleteMany({ eventId })
    await EventDB.deleteOne({ _id: eventId })
    revalidatePath("/settings/events")
    return { status: "success", message: "Event deleted" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to delete event" }
  }
}

export async function deleteStageAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const stageId = String(formData.get("stageId") || "")
  if (!stageId) return { status: "error", message: "Missing stage id" }
  try {
    const groups = await Group.find({ stageId }).lean()
    const groupIds = groups.map((g) => g._id)
    await Schedule.deleteMany({ groupId: { $in: groupIds } })
    await Group.deleteMany({ stageId })
    await Stage.deleteOne({ _id: stageId })
    revalidatePath("/settings/events")
    return { status: "success", message: "Stage deleted" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to delete stage" }
  }
}

export async function deleteGroupAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const groupId = String(formData.get("groupId") || "")
  if (!groupId) return { status: "error", message: "Missing group id" }
  try {
    await Schedule.deleteMany({ groupId })
    await Group.deleteOne({ _id: groupId })
    revalidatePath("/settings/events")
    return { status: "success", message: "Group deleted" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to delete group" }
  }
}

export async function listAllHierarchy(): Promise<{
  events: EventsData[], status: "success" | "error"; message?: string }> {
  const session = await getServerSession(authConfig);
  await dbConnect()
  const user = await User.findById(session?.user.id);
  if(!user){
    return {events: [], status: "error", message: "Unauthorized"}
  }
  const events = await EventDB.find({ _id: { $in: user.events } })
  const out = []
  for (const e of events) {
    const stages = await Stage.find({ event: e._id })
    const stagesOut = []
    for (const s of stages) {
      const groups = await Group.find({ stage: s._id }).populate("schedules") as (IGroup & { schedules: ISchedule[] })[]

      stagesOut.push({
        id: s._id.toString(),
        name: s.name,
        groups: groups.map((g) => ({ id: g._id.toString(), name: g.name, schedules: g.schedules.map((sched : ISchedule) => ({
          id: sched._id.toString(),
          matchNo: sched.matchNo,
          map: sched.map,
          date: sched.date,
          startTime: sched.startTime,
          overallMatchNo: sched.overallMatchNo
        })) })),
      })
    }
    out.push({
      id: e._id.toString(),
      name: e.name,
      organizer: e.organizer,
      discordLink: e.discordLink,
      isPublic: e.isPublic,
      stages: stagesOut,
    })
  }
  
  return { events: out, status: "success" }
}

export async function updateEventAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard

  const schema = z.object({
    eventId: z.string().min(1),
    name: z.string().min(1),
    organizer: z.string().optional(),
    discordLink: z.string().optional(),
    isPublic: z.boolean().optional(),
    pointSystem: z.string().optional(),
  })

  const parsed = schema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    organizer: formData.get("organizer"),
    discordLink: formData.get("discordLink"),
    isPublic: formData.get("isPublic") === "on" ? true : false,
    pointSystem: formData.get("pointSystem") ? String(formData.get("pointSystem")) : undefined,
  })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  try {
    await EventDB.updateOne(
      { _id: parsed.data.eventId },
      { name: parsed.data.name, organizer: parsed.data.organizer, discordLink: parsed.data.discordLink, isPublic: parsed.data.isPublic, pointSystem: parsed.data.pointSystem },
    )
    revalidatePath("/settings")
    return { status: "success", message: "Event updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update event" }
  }
}

export async function updateStageAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const schema = z.object({ stageId: z.string().min(1), name: z.string().min(1) })
  const parsed = schema.safeParse({ stageId: formData.get("stageId"), name: formData.get("name") })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  try {
    await Stage.updateOne({ _id: parsed.data.stageId }, { name: parsed.data.name })
    revalidatePath("/settings")
    return { status: "success", message: "Stage updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update stage" }
  }
}

export async function updateGroupAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const schema = z.object({ groupId: z.string().min(1), name: z.string().min(1) })
  const parsed = schema.safeParse({ groupId: formData.get("groupId"), name: formData.get("name") })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  try {
    await Group.updateOne({ _id: parsed.data.groupId }, { name: parsed.data.name })
    revalidatePath("/settings")
    return { status: "success", message: "Group updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update group" }
  }
}

export async function bulkUpdateSchedulesAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await ensureAdmin()
  if (guard) return guard
  const schema = z.object({
    groupId: z.string().min(1),
    schedules: z.string().min(1),
  })
  const parsed = schema.safeParse({ groupId: formData.get("groupId"), schedules: formData.get("schedules") })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }
  let schedules: ISchedule[]
  try {
    schedules = JSON.parse(parsed.data.schedules)
    if (!Array.isArray(schedules)) throw new Error("Schedules is not an array")
  } catch (e) {
    return { status: "error", message: "Invalid schedules format" }
  }
  try {
    await Schedule.findOneAndUpdate(
      { groupId: parsed.data.groupId },
      { schedules },
      { upsert: true, new: true },
    )
    revalidatePath("/settings")
    return { status: "success", message: "Schedules updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update schedules" }
  }
}

export default async function listPointSystems(): Promise<{ id: string; name: string }[]> {
  try {
    await dbConnect()
  
    const pointSystems = await PointSystem.find().lean()
    return pointSystems.map((ps) => ({ id: (ps._id as string).toString(), name: ps.name }))
  } catch (error) {
    console.error("Error listing point systems:", error)
    return []
  }
}