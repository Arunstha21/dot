import { ISchedule, Schedule } from "@/lib/database/schema";
import { PlayerResult } from "./game/game-type";
import { dbConnect } from "@/lib/db"
import { getMatchData } from "./game/match";


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

export async function getMatchDatas(scheduleIds: string[]): Promise<{
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

export const getTournamentHighlights = async (eventId: string) => {
  try {
    const scheduleDocs: ISchedule[] = await Schedule.find({ event: eventId });

    if (!scheduleDocs.length) {
      return { status: "error", message: "No schedules found for the event" };
    }

    const matchesByDate: Record<string, string[]> = {};
    const scheduleIds: string[] = [];

    for (const doc of scheduleDocs) {
      const rawDate = doc.date;
      const dateKey =
        typeof rawDate === "string" && /^\d{1,2}-\d{1,2}-\d{4}$/.test(rawDate)
          ? (() => {
              const [d, m, y] = rawDate.split("-");
              return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            })()
          : "unknown";

      if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
      if (doc.match) {
        matchesByDate[dateKey].push(doc._id.toString());
        scheduleIds.push(doc._id.toString());
      }
    }

    // Fetch all match results in parallel
    const matchResults = await Promise.all(
      scheduleIds.map(async (scheduleId) => {
        const res = await getMatchData([scheduleId]);
        return { matchId: scheduleId, status: res.data ? "success" : "no_data", ...res.data };
      })
    );

    // Initialize tracking structures
    const wwcdMap: Record<string, number> = {};
    const datePlayerElims: Record<string, Record<string, number>> = {};
    let topMatch: { matchId: string; team: string; totalPoint: number } | null = null;
    let topWWCD: { team: string; count: number } | null = null;
    let topElimMatch: { player: string; team: string; kills: number; matchId: string } | null = null;
    let topElimDay: { player: string; team: string; kills: number; date: string } | null = null;

    for (const { matchId, status, teamResults, playerResults } of matchResults) {
      if (status !== "success" || !teamResults || !playerResults) continue;

      // Top single-match team
      const topTeam = teamResults.find(t => t.cRank === 1);
      if (topTeam && (!topMatch || topTeam.totalPoint > topMatch.totalPoint)) {
        topMatch = { matchId, team: topTeam.team, totalPoint: topTeam.totalPoint };
      }

      // WWCD count
      for (const team of teamResults) {
        wwcdMap[team.team] = (wwcdMap[team.team] || 0) + team.wwcd;
      }

      // Player stats: most kills in a match + per-day kills
      const matchDate = Object.entries(matchesByDate).find(([, ids]) => ids.includes(matchId))?.[0] || "unknown";
      if (!datePlayerElims[matchDate]) datePlayerElims[matchDate] = {};

      for (const player of playerResults) {
        // Top kill in a match
        if (!topElimMatch || player.kill > topElimMatch.kills) {
          topElimMatch = {
            player: player.inGameName,
            team: player.teamName,
            kills: player.kill,
            matchId,
          };
        }

        // Track daily kills
        const uid = player.uId;
        datePlayerElims[matchDate][uid] = (datePlayerElims[matchDate][uid] || 0) + player.kill;
      }
    }

    // Find team with most WWCD
    for (const [team, count] of Object.entries(wwcdMap)) {
      if (!topWWCD || count > topWWCD.count) {
        topWWCD = { team, count };
      }
    }

    // Most kills by a player in one day
    for (const [date, players] of Object.entries(datePlayerElims)) {
      for (const [uid, kills] of Object.entries(players)) {
        const exampleMatch = matchResults.find(r => r.playerResults?.some(p => p.uId === uid));
        const playerInfo = exampleMatch?.playerResults?.find(p => p.uId === uid);
        if (playerInfo && (!topElimDay || kills > topElimDay.kills)) {
          topElimDay = {
            player: playerInfo.inGameName,
            team: playerInfo.teamName,
            kills,
            date,
          };
        }
      }
    }

    // Best daily team performance
    const dailyResults = await Promise.all(
      Object.entries(matchesByDate).map(async ([date, ids]) => {
        const res = await getMatchData(ids);
        if(res.matchExists === false || !res.data) return null;
        const { teamResults } = res.data;
        if (!teamResults || teamResults.length === 0) return null;
        const topTeam = teamResults.reduce((prev, curr) => (curr.totalPoint > prev.totalPoint ? curr : prev), teamResults[0]);
        return {
          date,
          team: topTeam.team,
          totalPoint: topTeam.totalPoint,
          matchCount: ids.length,
        };
      })
    );

    const topDay = dailyResults
      .filter(Boolean)
      .reduce((prev, curr) => (curr!.totalPoint > prev!.totalPoint ? curr : prev), dailyResults[0]);

    const dailyMVPs = await Promise.all(
      Object.entries(matchesByDate).map(async ([date, ids]) => {
        const res = await getMatchData(ids);
        if(res.matchExists === false || !res.data) return null;
        const { playerResults } = res.data;
        if (!playerResults || playerResults.length === 0) return null;
        const mvpOfTheDay = playerResults.reduce((prev, curr) => (curr.mvp > prev.mvp ? curr : prev), playerResults[0]);
        return {
          date,
          stats: mvpOfTheDay,
        }
      })
    );

    return {
      status: "success",
      message: "Tournament highlights fetched successfully",
      data: {
        highestSingleMatch: topMatch,
        highestDailyPerformance: topDay,
        mostWWCDTeam: topWWCD,
        mostElimsInSingleMatch: topElimMatch,
        mostElimsInSingleDay: topElimDay,
        dayWiseMVPs: dailyMVPs.filter(Boolean) as { date: string; stats: PlayerResult }[],
      },
    };
  } catch (error) {
    console.error("Error in getTournamentHighlights:", error);
    return {
      status: "error",
      message: "Internal error fetching tournament highlights",
    };
  }
};