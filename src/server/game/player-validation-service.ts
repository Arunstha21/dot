import { textDecoder } from "@/lib/utils"
import { DatabaseService } from "./game-database-services"
import type { MatchData, ServiceResponse } from "./game-type"

export class PlayerValidationService {
  private static normalizeUid(uid: any): string {
    return uid.toString().trim()
  }

  static async checkPlayerData(
    data: MatchData,
    scheduleId: string,
  ): Promise<
    ServiceResponse<{
      unregisteredPlayersData: {
        gameData: { playerName: string; uId: string }[]
        dbData: { playerName: string; uId: string }[]
      }
    }>
  > {
    try {
      const { GameID, TotalPlayerList } = data.allinfo

      // Check if game already exists
      const gameExists = await DatabaseService.findMatchByGameId(GameID)
      if (gameExists) {
        return { status: "error", message: "Game data already exists" }
      }

      // Validate schedule
      const schedule = await DatabaseService.findScheduleById(scheduleId)
      if (!schedule) {
        return { status: "error", message: "Schedule not found" }
      }

      // Extract team IDs
      const teams = this.extractTeamIds(schedule.groups)
      if (!teams) {
        return { status: "error", message: "Invalid group data" }
      }

      // Get all players from database and game
      const [allDbPlayers, allGamePlayers] = await Promise.all([
        this.getDbPlayers(teams),
        this.getGamePlayers(TotalPlayerList),
      ])

      // Find unmatched players
      const unregisteredPlayersData = this.findUnmatchedPlayers(allDbPlayers, allGamePlayers)

      return {
        status: "success",
        message: "Game data successfully validated!",
        data: { unregisteredPlayersData },
      }
    } catch (error) {
      console.error("Error validating player data:", error)
      return { status: "error", message: "Error validating player data" }
    }
  }

  private static extractTeamIds(groups: any): string[] | null {
    if (!Array.isArray(groups)) {
      return null
    }

    const teams: string[] = []
    for (const group of groups) {
      for (const team of group.teams) {
        if (typeof team === "object" && team._id) {
          teams.push(team._id.toString());
        } else if (typeof team === "string") {
          teams.push(team);
        }
      }
    }
    return teams
  }

  private static async getDbPlayers(teamIds: string[]) {
    const allDbPlayers: { uid: string; name: string }[] = []

    const playersByTeam = await Promise.all(teamIds.map((teamId) => DatabaseService.findPlayersByTeam(teamId)))

    for (const players of playersByTeam) {
      for (const player of players) {
        allDbPlayers.push({
          uid: this.normalizeUid(player.uid),
          name: player.name,
        })
      }
    }

    return allDbPlayers
  }

  private static getGamePlayers(totalPlayerList: any[]) {
    return totalPlayerList.map((p) => ({
      uId: this.normalizeUid(p.uId),
      playerName: textDecoder(p.playerName),
    }))
  }

  private static findUnmatchedPlayers(
    dbPlayers: { uid: string; name: string }[],
    gamePlayers: { uId: string; playerName: string }[],
  ) {
    const dbUidSet = new Set(dbPlayers.map((p) => p.uid))
    const gameUidSet = new Set(gamePlayers.map((p) => p.uId))

    // Find game players not in database
    const unMatchedGamePlayerData: { playerName: string; uId: string }[] = []
    const seenGameUids = new Set<string>()

    for (const player of gamePlayers) {
      if (!dbUidSet.has(player.uId) && !seenGameUids.has(player.uId)) {
        unMatchedGamePlayerData.push(player)
        seenGameUids.add(player.uId)
      }
    }

    // Find database players not in game
    const unMatchedDBPlayerData: { playerName: string; uId: string }[] = []
    const seenDbUids = new Set<string>()

    for (const player of dbPlayers) {
      if (!gameUidSet.has(player.uid) && !seenDbUids.has(player.uid)) {
        unMatchedDBPlayerData.push({
          playerName: player.name,
          uId: player.uid,
        })
        seenDbUids.add(player.uid)
      }
    }

    return {
      gameData: unMatchedGamePlayerData,
      dbData: unMatchedDBPlayerData,
    }
  }
}
