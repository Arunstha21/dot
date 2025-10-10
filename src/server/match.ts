import { ISchedule, Schedule } from "@/lib/database/schema";
import { getMatchData } from "./game/match";
import { PlayerResult } from "./game/game-type";

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