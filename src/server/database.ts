'use server';

import { EventDB, Group, IEvent, IStage, Player, RoleManagerUser, Schedule, Stage, Team } from "@/lib/database/schema";
import { dbConnect } from "@/lib/db"
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "./auth";
import { User } from "@/lib/database/user";
import { Guild } from "@/lib/database/guild";

export type Schedule = { id: string; matchNo: number; map: string; startTime: string; date: string }
export type GroupAndSchedule = {
  id: string
  name: string
  data: { slot: number; team: string; email?: string }[]
  schedule: (Schedule & {
    matchData?: { teamResults: any[]; playerResults: any[] }
    afterMatchData?: { teamResults: any[]; playerResults: any[] }
  })[]
}
export type EventData = {
  id: string
  name: string
  discordLink?: string
  organizer?: string
  stages: { id: string; name: string }[]
}
export type EventDataE = EventData

export type ScheduleData = {
  event: string
  stage: string
  group: string
  matchNo: number
  map: string
  startTime: string
  date: string
  match?: string
  overallMatchNo?: number
}

export async function getEventData(): Promise<EventData[]> {
  const session = await getServerSession(authConfig)
  await dbConnect()
  if (!session?.user?.id) return []
  const userDoc = await User.findById(session.user.id);
  if (!userDoc) return []
  let events: IEvent[] = []
  if (!userDoc.superUser) {
    events = await EventDB.find({ _id: { $in: userDoc.events } }) as IEvent[]
  } else {
    events = await EventDB.find() as IEvent[]
  }

  const result: EventData[] = []
  for (const e of events) {
    const stages = await Stage.find({ event: e._id }) as IStage[]
    result.push({
      id: e._id.toString(),
      name: e.name,
      organizer: e.organizer,
      stages: stages.map((s) => ({ id: s._id.toString(), name: s.name })),
    })
  }
  return result
}

export async function getGroupAndSchedule(
  stageId: string,
): Promise<{ groups: GroupAndSchedule[]; isMultiGroup: boolean }> {
  await dbConnect();

  const groups = await Group.find({ stage: stageId }).populate("teams").exec();
  const out: GroupAndSchedule[] = [];

  for (const g of groups) {
    const schedules = await Schedule.find({ groups: g._id })
      .sort({ matchNo: 1 })
      .exec();

    out.push({
      id: g._id.toString(),
      name: g.name,
      data: (g.teams || []).map((d: any) => ({
        slot: d.slot,
        team: d.team,
        email: d.email,
      })),
      schedule: schedules.map((s) => ({
        id: s._id.toString(),
        matchNo: s.matchNo,
        map: s.map,
        startTime: s.startTime,
        date: s.date,
        match: s.match ? s.match.toString() : undefined,
        overallMatchNo: s.overallMatchNo
      })),
    });
  }
  return { groups: out, isMultiGroup: out.length > 1 };
}

export async function ImportDataDB(
  rows: any[],
  type: "event" | "schedule" | "discordRoleData",
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) return { status: "error", message: "Unauthorized" };
    const userDoc = await User.findById(session.user.id);
    if (!userDoc?.superUser) return { status: "error", message: "Unauthorized" };

    await dbConnect();

    if (type === "event") {
      for (const r of rows) {
        if (!r.event || !r.stage || !r.group || !r.team) continue;

        // 1. Event
        const event = await EventDB.findOneAndUpdate(
          { name: r.event },
          { $setOnInsert: { name: r.event } },
          { new: true, upsert: true }
        );

        // 2. Stage
        const stage = await Stage.findOneAndUpdate(
          { name: r.stage, event: event._id },
          { $setOnInsert: { name: r.stage, event: event._id } },
          { new: true, upsert: true }
        );
        await EventDB.updateOne(
          { _id: event._id },
          { $addToSet: { stages: stage._id } }
        );

        if (!userDoc.events.map((e: mongoose.Types.ObjectId) => e.toString()).includes(event._id.toString())) {
          (userDoc.events as mongoose.Types.ObjectId[]).push(event._id as mongoose.Types.ObjectId);
          await userDoc.save();
        }

        // 3. Group
        const group = await Group.findOneAndUpdate(
          { name: r.group, stage: stage._id, event: event._id },
          { $setOnInsert: { name: r.group, stage: stage._id, event: event._id } },
          { new: true, upsert: true }
        );
        await Stage.updateOne(
          { _id: stage._id },
          { $addToSet: { groups: group._id } }
        );

        // 4. Team
        let team = await Team.findOne({ name: r.team, stage: stage._id });
        if (!team) {
          team = await Team.create({
            name: r.team,
            tag: r.tag,
            email: r.email,
            slot: r.slot,
            event: event._id,
            stage: stage._id,
            group: group._id,
          });
          await Group.updateOne(
            { _id: group._id },
            { $addToSet: { teams: team._id } }
          );
        } else {
          const updates: any = {};
          if (team.email !== r.email) updates.email = r.email;
          if (team.slot !== r.slot) updates.slot = r.slot;
          if (Object.keys(updates).length) {
            await Team.updateOne({ _id: team._id }, { $set: updates });
          }
          await Group.updateOne(
            { _id: group._id },
            { $addToSet: { teams: team._id } }
          );
        }

        // 5. Players
        if (r.players && Array.isArray(r.players)) {
          const existing = await Player.find({ team: team._id }, { uid: 1 });
          const existingUIDs = new Set(existing.map(p => p.uid));

            interface PlayerInput {
            name: string;
            uid: string;
            email?: string;
            }
            const newPlayers: PlayerInput[] = (r.players as PlayerInput[]).filter((p: PlayerInput) => !existingUIDs.has(p.uid));
          if (newPlayers.length) {
            const inserted = await Player.insertMany(
              newPlayers.map(p => ({
                name: p.name,
                uid: p.uid,
                email: p.email,
                team: team._id,
              }))
            );
            await Team.updateOne(
              { _id: team._id },
              { $push: { players: { $each: inserted.map(p => p._id) } } }
            );
          }
        }
      }

      return { status: "success", message: "Event data imported successfully" };
    }

    if (type === "schedule") {
      for (const r of rows) {
        if (!r.event || !r.stage || !r.group) continue;

        const event = await EventDB.findOne({ name: r.event });
        if (!event) continue;

        const stage = await Stage.findOne({ event: event._id, name: r.stage });
        if (!stage) continue;

        const groups = r.group.includes("&") ? r.group.split("&") : [r.group];
        const groupIds: mongoose.Types.ObjectId[] = [];

        for (const g of groups) {
          const group = await Group.findOne({
            name: g.trim(),
            stage: stage._id,
            event: event._id,
          });
          if (group) groupIds.push(group._id);
        }

        if (!groupIds.length) continue;

        const schedule = await Schedule.findOneAndUpdate(
          { stage: stage._id, matchNo: r.matchNo },
          {
            $set: {
              event: event._id,
              stage: stage._id,
              groups: groupIds,
              map: r.map,
              startTime: r.startTime,
              date: r.date,
              overallMatchNo: r.overallMatchNo ?? null,
            },
          },
          { new: true, upsert: true }
        );

        for (const gid of groupIds) {
          await Group.updateOne(
            { _id: gid },
            { $addToSet: { schedules: schedule._id } }
          );
        }
      }

      return { status: "success", message: "Schedule data imported successfully" };
    }

    if (type === "discordRoleData") {
      for (const r of rows) {
        if (!r.emailId || !r.guildId || !r.rolePlayer || !r.discordTag) continue;
        console.log(r);
        
        const event = await EventDB.findOneAndUpdate(
          { name: r.event },
          { $setOnInsert: { name: r.event } },
          { new: true, upsert: true }
        );

        const stage = await Stage.findOneAndUpdate(
          { name: r.stage, event: event._id },
          { $setOnInsert: { name: r.stage, event: event._id } },
          { new: true, upsert: true }
        );

        await EventDB.updateOne(
          { _id: event._id },
          { $addToSet: { stages: stage._id } }
        );

        const teamDoc = await Team.findOneAndUpdate(
          { name: r.teamName, stage: stage._id },
          { $setOnInsert: { name: r.teamName, tag: r.teamTag, event: event._id, stage: stage._id } },
          { new: true, upsert: true }
        );
        console.log({ teamDoc });
        
        const playerDoc = await Player.findOneAndUpdate(
          { uid: r.uid, email: r.emailId },
          { $setOnInsert: { uid: r.uid, email: r.emailId, team: teamDoc._id } },
          { new: true, upsert: true }
        );
        console.log({ playerDoc });
        
        const guildDoc = await Guild.findOneAndUpdate(
          { guildId: r.guildId },
          {
            $setOnInsert: { guildId: r.guildId, guildName: r.guildName, roleManager: true },
            $addToSet: { events: event._id }
          },
          { new: true, upsert: true }
        );

        console.log({ event, stage, teamDoc, playerDoc, guildDoc });
        

        await User.updateOne({ _id: userDoc._id }, { $addToSet: { events: event._id, guilds: guildDoc._id } });

        const roleManagerUser = await RoleManagerUser.findOneAndUpdate(
          { userName: r.discordTag, guild: guildDoc._id },
          {
            $set: {
              userName: r.discordTag,
              email: r.emailId,
              team: teamDoc ? teamDoc._id : null,
              player: playerDoc ? playerDoc._id : null,
              guild: guildDoc._id,
              serverJoined: false,
              role: [r.rolePlayer ? 'Player' : false, r.roleOwner ? 'Owner' : false,  r.roleExtra, r.teamName].filter(Boolean).map(r => r.trim())
            },
          },
          { new: true, upsert: true }
        );

        await Team.updateOne(
          { _id: teamDoc._id },
          { $addToSet: { players: playerDoc._id, discordUsers: roleManagerUser._id } }
        );

        await Player.updateOne(
          { _id: playerDoc._id },
          { $addToSet: { discord: roleManagerUser._id } }
        );

        await guildDoc.updateOne({ $addToSet: { users: roleManagerUser._id } });
      }
      return { status: "success", message: "Discord Role Manager data imported successfully" };
    }

    return { status: "error", message: "Unknown import type" };
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to import data" };
  }
}