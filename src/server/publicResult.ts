/**
 Public results data for the results pages (SSR only).
 We compute cumulative (afterMatch) data on-demand to avoid denormalization.
*/
import { dbConnect } from "@/lib/db"
import { EventDB, Group, Schedule, Stage } from "@/lib/database/schema"
import { PlayerResultDoc, TeamResultDoc } from "./match"

export type EventData = {
  id: string
  name: string
  stages: { id: string; name: string; groups: { id: string; name: string }[] }[]
}

export type GroupAndSchedule = {
  id: string
  name: string
  data: { slot: number; team: string; email?: string }[]
  schedule: {
    id: string
    matchNo: number
    map: string
    startTime: string
    date: string
    matchData: { teamResults: TeamResultDoc[]; playerResults: PlayerResultDoc[] }
    afterMatchData: { teamResults: TeamResultDoc[]; playerResults: PlayerResultDoc[] }
  }[]
}

function aggregateTeams(matches: TeamResultDoc[][]): TeamResultDoc[] {
  const map = new Map<string, TeamResultDoc>()
  for (const arr of matches) {
    for (const t of arr) {
      const key = t.team
      if (!map.has(key)) {
        map.set(key, {
          cRank: 0,
          team: t.team,
          killNum: 0,
          damage: 0,
          placePoint: 0,
          totalPoint: 0,
          wwcd: 0,
          matchesPlayed: 0,
        })
      }
      const acc = map.get(key)!
      acc.killNum += t.killNum || 0
      acc.damage += t.damage || 0
      acc.placePoint += t.placePoint || 0
      acc.totalPoint += t.totalPoint || 0
      acc.wwcd += t.wwcd || 0
      acc.matchesPlayed += 1
    }
  }
  const out = Array.from(map.values()).sort((a, b) => b.totalPoint - a.totalPoint)
  out.forEach((t, i) => (t.cRank = i + 1))
  return out
}

function aggregatePlayers(matches: PlayerResultDoc[][]): PlayerResultDoc[] {
  const map = new Map<string, PlayerResultDoc>()
  for (const arr of matches) {
    for (const p of arr) {
      const key = `${p.teamName}::${p.inGameName}`
      if (!map.has(key)) {
        map.set(key, {
          cRank: 0,
          inGameName: p.inGameName,
          teamName: p.teamName,
          killNum: 0,
          damage: 0,
          avgSurvivalTime: 0,
          assists: 0,
          heal: 0,
          matchesPlayed: 0,
          mvp: 0,
        })
      }
      const acc = map.get(key)!
      acc.killNum += p.killNum || 0
      acc.damage += p.damage || 0
      acc.assists += p.assists || 0
      acc.heal += p.heal || 0
      acc.mvp += p.mvp || 0
      const totalBefore = acc.avgSurvivalTime * acc.matchesPlayed
      acc.matchesPlayed += 1
      acc.avgSurvivalTime = (totalBefore + (p.avgSurvivalTime || 0)) / acc.matchesPlayed
    }
  }
  const out = Array.from(map.values()).sort((a, b) => b.killNum - a.killNum || b.damage - a.damage)
  out.forEach((p, i) => (p.cRank = i + 1))
  return out
}

export async function getEventData(): Promise<EventData[]> {
  await dbConnect()
  const events = await EventDB.find()
  const out: EventData[] = []
  for (const e of events) {
    const stages = await Stage.find({ eventId: e._id })
    const stageOut: EventData["stages"] = []
    for (const s of stages) {
      const groups = await Group.find({ stageId: s._id })
      stageOut.push({
        id: s._id.toString(),
        name: s.name,
        groups: groups.map((g) => ({ id: g._id.toString(), name: g.name })),
      })
    }
    out.push({ id: e._id.toString(), name: e.name, stages: stageOut })
  }
  return out
}

export async function getGroupData(groupId: string): Promise<{ groups: GroupAndSchedule[]; isMultiGroup: boolean }> {
  await dbConnect()
  const group = await Group.findById(groupId)
  if (!group) return { groups: [], isMultiGroup: false }
  const schedules = await Schedule.find({ groupId }).sort({ matchNo: 1 })

  // Build afterMatch cumulative per schedule index
  const cumulativeTeamBuckets: TeamResultDoc[][] = []
  const cumulativePlayerBuckets: PlayerResultDoc[][] = []

  const schedOut = schedules.map((s) => {
    const currentTeam = s.matchData?.teamResults || []
    const currentPlayer = s.matchData?.playerResults || []

    cumulativeTeamBuckets.push(currentTeam)
    cumulativePlayerBuckets.push(currentPlayer)

    const afterTeam = aggregateTeams(cumulativeTeamBuckets)
    const afterPlayer = aggregatePlayers(cumulativePlayerBuckets)

    return {
      id: s._id.toString(),
      matchNo: s.matchNo,
      map: s.map,
      startTime: s.startTime,
      date: s.date,
      matchData: { teamResults: currentTeam, playerResults: currentPlayer },
      afterMatchData: { teamResults: afterTeam, playerResults: afterPlayer },
    }
  })

  const groups: GroupAndSchedule[] = [
    {
      id: group._id.toString(),
      name: group.name,
      data: (group.team || []).map((d: any) => ({ slot: d.slot, team: d.team, email: d.email })),
      schedule: schedOut,
    },
  ]

  return { groups, isMultiGroup: false }
}
