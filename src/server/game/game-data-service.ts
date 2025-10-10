import { DatabaseService } from "./game-database-services"
import type { MatchData, ServiceResponse, TeamResult, PlayerResult, StarOfMatch } from "./game-type"
import { PlayerValidationService } from "./player-validation-service"
import { StatsAggregationService } from "./stats-aggrigration-service"

export class GameDataService {
  static async checkPlayerData(data: MatchData, scheduleId: string) {
    return PlayerValidationService.checkPlayerData(data, scheduleId)
  }

  static async updateGameData(data: MatchData, scheduleId: string): Promise<ServiceResponse> {
    try {
      const {
        GameID,
        GameStartTime,
        FightingStartTime,
        FinishedStartTime,
        CurrentTime,
        TotalPlayerList,
        TeamInfoList,
      } = data.allinfo

      // Check if game already exists
      const gameExists = await DatabaseService.findMatchByGameId(GameID)
      if (gameExists) {
        return { status: "error", message: "Game data already exists" }
      }

      // Validate schedule and event
      const schedule = await DatabaseService.findScheduleById(scheduleId)
      if (!schedule) {
        return { status: "error", message: "Schedule not found" }
      }

      const event = await DatabaseService.findEventById(schedule.event)
      if (!event) {
        return { status: "error", message: "Event not found" }
      }

      // Create match data
      const matchData = {
        schedule: scheduleId,
        gameId: GameID,
        gameGlobalInfo: { GameStartTime, FightingStartTime, FinishedStartTime, CurrentTime },
        teamInfo: TeamInfoList,
        playerInfo: TotalPlayerList,
        pointSystem: event.pointSystem,
      }

      const match = await DatabaseService.upsertMatch(GameID, matchData)
      if (!match) {
        return { status: "error", message: "Error updating match data" }
      }

      // Update schedule with match reference
      schedule.match = match._id
      await schedule.save()

      // Process team stats
      await GameDataService.processTeamStats(schedule.groups, TotalPlayerList, match._id)

      return { status: "success", message: "Game data successfully updated!" }
    } catch (error) {
      console.error("Error updating game data:", error)
      return { status: "error", message: "Error updating game data" }
    }
  }

  static async getOverallResults(matchIds: string[]): Promise<
    ServiceResponse<{
      teamResults: TeamResult[]
      playerResults: PlayerResult[]
    }>
  > {
    try {
      const validMatches = await DatabaseService.findMatchesByIds(matchIds)
      if (validMatches.length !== matchIds.length) {
        return { status: "error", message: "Invalid match IDs provided" }
      }

      const scheduleDoc = await DatabaseService.findScheduleByMatch(matchIds[0])
      if (!scheduleDoc) {
        return { status: "error", message: "Schedule not found for the match" }
      }

      const pointSystem = await DatabaseService.findPointSystemById(scheduleDoc.event.pointSystem)
      if (!pointSystem) {
        return { status: "error", message: "Point system not found" }
      }

      const validMatchIds = validMatches.map((match) => match._id)
      const [teamStats, playerStats] = await Promise.all([
        DatabaseService.findTeamStatsByMatches(validMatchIds),
        DatabaseService.findPlayerStatsByMatches(validMatchIds),
      ])

      const teamResults = StatsAggregationService.aggregateTeamStats(teamStats, pointSystem)
      const playerResults = StatsAggregationService.aggregatePlayerStats(playerStats)

      return {
        status: "success",
        message: "Successfully retrieved results",
        data: { teamResults, playerResults },
      }
    } catch (error) {
      console.error("Error fetching overall results:", error)
      return { status: "error", message: "Error fetching overall results" }
    }
  }

  static async getPerMatchResults(matchId: string): Promise<
    ServiceResponse<{
      teamResults: TeamResult[]
      playerResults: PlayerResult[]
    }>
  > {
    try {
      const scheduleDoc = await DatabaseService.findScheduleByMatch(matchId)
      if (!scheduleDoc) {
        return { status: "error", message: "Schedule not found for the match" }
      }

      const pointSystem = await DatabaseService.findPointSystemById(scheduleDoc.event.pointSystem)
      if (!pointSystem) {
        return { status: "error", message: "Point system not found" }
      }
      
      const [teamStats, playerStats] = await Promise.all([
        DatabaseService.findTeamStatsByMatches([scheduleDoc.match]),
        DatabaseService.findPlayerStatsByMatches([scheduleDoc.match]),
      ])

      const teamResults = StatsAggregationService.aggregateTeamStats(teamStats, pointSystem)
      const playerResults = StatsAggregationService.aggregatePlayerStats(playerStats)

      return {
        status: "success",
        message: "Successfully retrieved match results",
        data: { teamResults, playerResults },
      }
    } catch (error) {
      console.error("Error fetching per-match results:", error)
      return { status: "error", message: "Error fetching per-match results" }
    }
  }

  static async getStarOfTheMatch(matchId: string): Promise<ServiceResponse<StarOfMatch>> {
    try {
      const scheduleDoc = await DatabaseService.findScheduleByMatch(matchId)
      if (!scheduleDoc) {
        return { status: "error", message: "Schedule not found for the match" }
      }

      const playerStats = await DatabaseService.findPlayerStatsByMatches([scheduleDoc.match])
      const starData = this.calculateStarOfMatch(playerStats)

      return {
        status: "success",
        message: "Successfully retrieved star of the match",
        data: starData,
      }
    } catch (error) {
      console.error("Error fetching star of the match:", error)
      return { status: "error", message: "Error fetching star of the match" }
    }
  }

  private static async processTeamStats(groups: any, totalPlayerList: any[], matchId: any) {
    if (!Array.isArray(groups)) {
      throw new Error("Invalid group data")
    }

    const teams: string[] = []
    for (const group of groups) {
      if (group.teams && Array.isArray(group.teams)) {
        teams.push(...group.teams)
      }
    }
    
    await Promise.all(
      teams.map(async (teamId: string) => {
        const playerList = await DatabaseService.findPlayersByTeam(teamId)
        const teamStatsMap: Record<string, any> = {}
        const playerMap = new Map(playerList.map((p) => [p.uid.toString(), p]))

        for (const player of totalPlayerList) {
          const playerData = playerMap.get(player.uId.toString())
          if (!playerData) continue

          const playerStats = this.createPlayerStatsObject(player, playerData._id, matchId)
          await DatabaseService.upsertPlayerStats(playerData._id, matchId, playerStats)
          console.log(playerStats);
          
          this.updateTeamStatsMap(teamStatsMap, playerData, player, matchId)
        }

        // Save team stats
        for (const teamId in teamStatsMap) {
          await DatabaseService.upsertTeamStats(teamStatsMap[teamId].team, matchId, teamStatsMap[teamId])
        }
      }),
    )
  }

  private static createPlayerStatsObject(player: any, playerId: any, matchId: any) {
    return {
      player: playerId,
      match: matchId,
      killNum: player.killNum,
      killNumBeforeDie: player.killNumBeforeDie,
      gotAirDropNum: player.gotAirDropNum,
      maxKillDistance: player.maxKillDistance,
      damage: player.damage,
      killNumInVehicle: player.killNumInVehicle,
      killNumByGrenade: player.killNumByGrenade,
      AIKillNum: player.AIKillNum,
      BossKillNum: player.BossKillNum,
      rank: player.rank,
      inDamage: player.inDamage,
      heal: player.heal,
      headShotNum: player.headShotNum,
      survivalTime: player.survivalTime,
      driveDistance: player.driveDistance,
      marchDistance: player.marchDistance,
      assists: player.assists,
      knockouts: player.knockouts,
      rescueTimes: player.rescueTimes,
      useSmokeGrenadeNum: player.useSmokeGrenadeNum,
      useFragGrenadeNum: player.useFragGrenadeNum,
      useBurnGrenadeNum: player.useBurnGrenadeNum,
      useFlashGrenadeNum: player.useFlashGrenadeNum,
      PoisonTotalDamage: player.PoisonTotalDamage,
      UseSelfRescueTime: player.UseSelfRescueTime,
      UseEmergencyCallTime: player.UseEmergencyCallTime,
    }
  }

  private static updateTeamStatsMap(teamStatsMap: Record<string, any>, playerData: any, player: any, matchId: any) {
    const teamId = playerData.team.toString()

    if (!teamStatsMap[teamId]) {
      teamStatsMap[teamId] = this.createEmptyTeamStats(playerData.team, matchId, player.rank)
    }

    const teamStats = teamStatsMap[teamId]
    this.aggregateTeamStatsFromPlayer(teamStats, player)
  }

  private static createEmptyTeamStats(teamId: any, matchId: any, rank: number) {
    return {
      team: teamId,
      match: matchId,
      killNum: 0,
      killNumBeforeDie: 0,
      gotAirDropNum: 0,
      maxKillDistance: 0,
      damage: 0,
      killNumInVehicle: 0,
      killNumByGrenade: 0,
      AIKillNum: 0,
      BossKillNum: 0,
      rank: rank,
      inDamage: 0,
      heal: 0,
      headShotNum: 0,
      survivalTime: 0,
      driveDistance: 0,
      marchDistance: 0,
      assists: 0,
      knockouts: 0,
      rescueTimes: 0,
      useSmokeGrenadeNum: 0,
      useFragGrenadeNum: 0,
      useBurnGrenadeNum: 0,
      useFlashGrenadeNum: 0,
      PoisonTotalDamage: 0,
      UseSelfRescueTime: 0,
      UseEmergencyCallTime: 0,
    }
  }

  private static aggregateTeamStatsFromPlayer(teamStats: any, player: any) {
    teamStats.killNum += player.killNum
    teamStats.killNumBeforeDie += player.killNumBeforeDie
    teamStats.gotAirDropNum += player.gotAirDropNum
    teamStats.maxKillDistance = Math.max(teamStats.maxKillDistance, player.maxKillDistance)
    teamStats.damage += player.damage
    teamStats.killNumInVehicle += player.killNumInVehicle
    teamStats.killNumByGrenade += player.killNumByGrenade
    teamStats.AIKillNum += player.AIKillNum
    teamStats.BossKillNum += player.BossKillNum
    teamStats.rank = Math.min(teamStats.rank, player.rank)
    teamStats.inDamage += player.inDamage
    teamStats.heal += player.heal
    teamStats.headShotNum += player.headShotNum
    teamStats.survivalTime += player.survivalTime
    teamStats.driveDistance += player.driveDistance
    teamStats.marchDistance += player.marchDistance
    teamStats.assists += player.assists
    teamStats.knockouts += player.knockouts
    teamStats.rescueTimes += player.rescueTimes
    teamStats.useSmokeGrenadeNum += player.useSmokeGrenadeNum
    teamStats.useFragGrenadeNum += player.useFragGrenadeNum
    teamStats.useBurnGrenadeNum += player.useBurnGrenadeNum
    teamStats.useFlashGrenadeNum += player.useFlashGrenadeNum
    teamStats.PoisonTotalDamage += player.PoisonTotalDamage
    teamStats.UseSelfRescueTime += player.UseSelfRescueTime
    teamStats.UseEmergencyCallTime += player.UseEmergencyCallTime
  }

  private static calculateStarOfMatch(playerStats: any[]): StarOfMatch {
    const playerResults = StatsAggregationService.aggregatePlayerStats(playerStats)

    const maxKills = Math.max(...playerResults.map((p) => p.kill))
    const maxRescueTimes = Math.max(...playerResults.map((p) => p.rescueTimes || 0))

    return {
      goingAllOut: playerResults
        .filter((p) => p.kill === maxKills)
        .map((p) => ({
          inGameName: p.inGameName,
          uId: p.uId,
          teamName: p.teamName,
          knockouts: p.knockouts,
          kill: p.kill,
          bonus: 0,
          damage: p.damage,
        })),
      bestCompanion: playerResults
        .filter((p) => (p.rescueTimes || 0) === maxRescueTimes)
        .map((p) => ({
          inGameName: p.inGameName,
          uId: p.uId,
          teamName: p.teamName,
          assists: p.assists,
          rescueTimes: p.rescueTimes || 0,
          heal: p.heal,
          survivalTime: p.survivalTime,
        })),
      finishers: playerResults
        .filter((p) => p.cRank === 1)
        .map((p) => ({
          inGameName: p.inGameName,
          uId: p.uId,
          teamName: p.teamName,
          kill: p.kill,
          assists: p.assists,
          travelDistance: p.vecileTravelDistance,
          survivalTime: p.survivalTime,
        })),
    }
  }
}
