import { dbConnect } from "@/lib/db"
import {
  Schedule,
} from "@/lib/database/schema"

export interface TeamResultDoc {
  cRank: number
  team: string
  killNum: number
  damage: number
  placePoint: number
  totalPoint: number
  wwcd: number
  matchesPlayed: number
}
export interface PlayerResultDoc {
  cRank: number
  inGameName: string
  teamName: string
  killNum: number
  damage: number
  avgSurvivalTime: number
  assists: number
  heal: number
  matchesPlayed: number
  mvp: number
}
export type MatchData = any

function aggregateTeams(matches: TeamResultDoc[][]): TeamResultDoc[] {
  const map = new Map<string, TeamResultDoc>()
  for (const arr of matches) {
    for (const t of arr) {
      const key = t.team.toString()
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
      // avgSurvivalTime: running average by matchesPlayed
      const totalBefore = acc.avgSurvivalTime * acc.matchesPlayed
      acc.matchesPlayed += 1
      acc.avgSurvivalTime = (totalBefore + (p.avgSurvivalTime || 0)) / acc.matchesPlayed
    }
  }
  const out = Array.from(map.values()).sort((a, b) => b.killNum - a.killNum || b.damage - a.damage)
  out.forEach((p, i) => (p.cRank = i + 1))
  return out
}

export async function getMatchData(scheduleIds: string[]): Promise<{
  data: { teamResults: TeamResultDoc[]; playerResults: PlayerResultDoc[] } | null
  matchExists: boolean
  message?: string
}> {
  await dbConnect()
  const schedules = await Schedule.find({ _id: { $in: scheduleIds } }).lean()
  if (!schedules.length) return { data: null, matchExists: false, message: "No matches found" }

  const teamBuckets: TeamResultDoc[][] = []
  const playerBuckets: PlayerResultDoc[][] = []
  for (const s of schedules) {
    const tr = s.matchData?.teamResults || []
    const pr = s.matchData?.playerResults || []
    if (tr.length || pr.length) {
      teamBuckets.push(tr)
      playerBuckets.push(pr)
    }
  }
  const matchExists = teamBuckets.length > 0 || playerBuckets.length > 0
  const teamResults = aggregateTeams(teamBuckets)
  const playerResults = aggregatePlayers(playerBuckets)
  return { data: { teamResults, playerResults }, matchExists }
}

export async function updateGameData(
  data: MatchData,
  scheduleId: string,
): Promise<{ status: "success" | "error"; message?: string }> {
  try {
    await dbConnect()
    const schedule = await Schedule.findById(scheduleId)
    if (!schedule) return { status: "error", message: "Schedule not found" }

    // Normalize input. If data already has expected arrays, use them.
    let teamResults: TeamResultDoc[] = []
    let playerResults: PlayerResultDoc[] = []

    if (Array.isArray(data?.teamResults) && Array.isArray(data?.playerResults)) {
      teamResults = data.teamResults
      playerResults = data.playerResults
    } else if (data?.allinfo) {
      // Attempt to map from common PUBG formats (best-effort fallback)
      // This mapping can be customized for your exact JSON export.
      const teams: Record<string, TeamResultDoc> = {}
      for (const p of data.allinfo?.TotalPlayerList || []) {
        const team = p.TeamName || p.teamName || "Unknown"
        if (!teams[team]) {
          teams[team] = {
            cRank: 0,
            team,
            killNum: 0,
            damage: 0,
            placePoint: 0,
            totalPoint: 0,
            wwcd: 0,
            matchesPlayed: 1,
          }
        }
        teams[team].killNum += Number(p.Kill || p.kills || 0)
        teams[team].damage += Number(p.Damage || p.damage || 0)
      }
      teamResults = Object.values(teams).map((t) => ({
        ...t,
        totalPoint: t.killNum + t.placePoint,
      }))

      playerResults = (data.allinfo?.TotalPlayerList || []).map((p: any) => ({
        cRank: 0,
        inGameName: p.PlayerName || p.name || "Unknown",
        teamName: p.TeamName || p.teamName || "Unknown",
        kill: Number(p.Kill || p.kills || 0),
        damage: Number(p.Damage || p.damage || 0),
        avgSurvivalTime: Number(p.SurvivalTime || p.surv || 0),
        assists: Number(p.Assists || p.assists || 0),
        heal: Number(p.Heal || p.heal || 0),
        matchesPlayed: 1,
        mvp: Number(p.MVP || p.mvp || 0),
      }))
    } else {
      // Unsupported format; store minimal
      teamResults = []
      playerResults = []
    }

    // Rank within the match
    teamResults = teamResults.sort((a, b) => b.totalPoint - a.totalPoint)
    teamResults.forEach((t, i) => (t.cRank = i + 1))
    playerResults = playerResults.sort((a, b) => b.killNum - a.killNum || b.damage - a.damage)
    playerResults.forEach((p, i) => (p.cRank = i + 1))

    schedule.matchData = { teamResults, playerResults }
    await schedule.save()

    return { status: "success" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update match data" }
  }
}
