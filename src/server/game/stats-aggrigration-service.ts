import { textDecoder } from "@/lib/utils"
import type { TeamResult, PlayerResult } from "./game-type"
import { MVP_MULTIPLIER, MVP_WEIGHTS } from "./constants"

export class StatsAggregationService {
  static aggregateTeamStats(teamStats: any[], pointSystem: any): TeamResult[] {
    const teamResultsMap: Record<string, TeamResult> = {}

    for (const stat of teamStats) {
      const teamId = stat.team._id.toString()

      // Skip disqualified teams
      if (stat.team.dq === true) {
        continue
      }

      if (!teamResultsMap[teamId]) {
        teamResultsMap[teamId] = this.createEmptyTeamResult(stat.team.name)
      }

      this.updateTeamStats(teamResultsMap[teamId], stat, pointSystem)
    }

    return this.sortAndRankTeams(Object.values(teamResultsMap))
  }

  static aggregatePlayerStats(playerStats: any[]): PlayerResult[] {
    const playerResultsMap: Record<string, PlayerResult> = {}
    let totalSurvivalTime = 0
    let totalDamage = 0
    let totalKills = 0

    // Aggregate stats
    for (const stat of playerStats) {
      const playerId = stat.player._id.toString()

      if (!playerResultsMap[playerId]) {
        playerResultsMap[playerId] = this.createEmptyPlayerResult(stat.player)
      }

      this.updatePlayerStats(playerResultsMap[playerId], stat)

      totalSurvivalTime += stat.survivalTime
      totalDamage += stat.damage
      totalKills += stat.killNum
    }

    // Calculate MVP scores
    this.calculateMVPScores(playerResultsMap, totalSurvivalTime, totalDamage, totalKills)

    return this.sortAndRankPlayers(Object.values(playerResultsMap))
  }

  private static createEmptyTeamResult(teamName: string): TeamResult {
    return {
      team: textDecoder(teamName) || "Unknown Team",
      kill: 0,
      damage: 0,
      placePoint: 0,
      totalPoint: 0,
      wwcd: 0,
      matchesPlayed: 0,
      lastMatchRank: 0,
      survivalTime: 0,
      assists: 0,
      knockouts: 0,
      heal: 0,
      grenadeKills: 0,
      vehicleKills: 0,
      headShotNum: 0,
      smokeGrenadeUsed: 0,
      fragGrenadeUsed: 0,
      burnGrenadeUsed: 0,
      vecileTravelDistance: 0,
      killDistance: 0,
    }
  }

  private static createEmptyPlayerResult(player: any): PlayerResult {
    return {
      inGameName: textDecoder(player.name) || "Unknown Player",
      uId: player.uid || "N/A",
      teamName: textDecoder(player.team.name) || "Unknown Team",
      kill: 0,
      damage: 0,
      survivalTime: 0,
      avgSurvivalTime: 0,
      assists: 0,
      heal: 0,
      matchesPlayed: 0,
      mvp: 0,
      knockouts: 0,
      rescueTimes: 0,
      grenadeKills: 0,
      vehicleKills: 0,
      headShotNum: 0,
      smokeGrenadeUsed: 0,
      fragGrenadeUsed: 0,
      burnGrenadeUsed: 0,
      vecileTravelDistance: 0,
      killDistance: 0,
    }
  }

  private static updateTeamStats(teamData: TeamResult, stat: any, pointSystem: any) {
    teamData.kill += stat.killNum
    teamData.damage += stat.damage
    teamData.placePoint +=
      pointSystem.pointSystem.find((point: { rank: number; point: number }) => point.rank === stat.rank)?.point || 0
    teamData.totalPoint = teamData.placePoint + teamData.kill
    teamData.wwcd += stat.rank === 1 ? 1 : 0
    teamData.matchesPlayed += 1
    teamData.lastMatchRank = stat.rank

    // Additional stats
    teamData.survivalTime += stat.survivalTime
    teamData.assists += stat.assists
    teamData.knockouts += stat.knockouts
    teamData.heal += stat.heal
    teamData.grenadeKills += stat.killNumByGrenade
    teamData.vehicleKills += stat.killNumInVehicle
    teamData.headShotNum += stat.headShotNum
    teamData.smokeGrenadeUsed += stat.useSmokeGrenadeNum
    teamData.fragGrenadeUsed += stat.useFragGrenadeNum
    teamData.burnGrenadeUsed += stat.useBurnGrenadeNum
    teamData.vecileTravelDistance += stat.driveDistance
    teamData.killDistance = Math.max(teamData.killDistance, stat.maxKillDistance)
  }

  private static updatePlayerStats(playerData: PlayerResult, stat: any) {
    playerData.kill += stat.killNum
    playerData.damage += stat.damage
    playerData.survivalTime += stat.survivalTime
    playerData.assists += stat.assists
    playerData.heal += stat.heal
    playerData.matchesPlayed += 1
    playerData.knockouts += stat.knockouts
    playerData.rescueTimes += stat.rescueTimes || 0
    playerData.grenadeKills += stat.killNumByGrenade
    playerData.vehicleKills += stat.killNumInVehicle
    playerData.headShotNum += stat.headShotNum
    playerData.smokeGrenadeUsed += stat.useSmokeGrenadeNum
    playerData.fragGrenadeUsed += stat.useFragGrenadeNum
    playerData.burnGrenadeUsed += stat.useBurnGrenadeNum
    playerData.vecileTravelDistance += stat.driveDistance
    playerData.killDistance = Math.max(playerData.killDistance, stat.maxKillDistance)
  }

  private static calculateMVPScores(
    playerResultsMap: Record<string, PlayerResult>,
    totalSurvivalTime: number,
    totalDamage: number,
    totalKills: number,
  ) {
    for (const playerId in playerResultsMap) {
      const player = playerResultsMap[playerId]

      const survivalRatio = player.survivalTime / totalSurvivalTime
      const damageRatio = player.damage / totalDamage
      const killRatio = player.kill / totalKills

      player.avgSurvivalTime = player.survivalTime / player.matchesPlayed
      player.mvp = Number.parseFloat(
        (
          (survivalRatio * MVP_WEIGHTS.SURVIVAL_TIME +
            damageRatio * MVP_WEIGHTS.DAMAGE +
            killRatio * MVP_WEIGHTS.KILLS) *
          MVP_MULTIPLIER
        ).toFixed(2),
      )
    }
  }

  private static sortAndRankTeams(teams: TeamResult[]): TeamResult[] {
    teams.sort((a, b) => {
      if (a.totalPoint !== b.totalPoint) return b.totalPoint - a.totalPoint
      if (a.wwcd !== b.wwcd) return b.wwcd - a.wwcd
      if (a.placePoint !== b.placePoint) return b.placePoint - a.placePoint
      if (a.kill !== b.kill) return b.kill - a.kill
      if (a.lastMatchRank && b.lastMatchRank && a.lastMatchRank !== b.lastMatchRank) {
        return a.lastMatchRank - b.lastMatchRank
      }
      if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed
      return a.team.localeCompare(b.team)
    })

    teams.forEach((item, index) => {
      item.cRank = index + 1
    })

    return teams
  }

  private static sortAndRankPlayers(players: PlayerResult[]): PlayerResult[] {
    players.sort((a, b) => {
      if (a.mvp !== b.mvp) return b.mvp - a.mvp
      if (a.kill !== b.kill) return b.kill - a.kill
      if (a.damage !== b.damage) return b.damage - a.damage
      return b.survivalTime - a.survivalTime
    })

    players.forEach((item, index) => {
      item.cRank = index + 1
    })

    return players
  }
}
