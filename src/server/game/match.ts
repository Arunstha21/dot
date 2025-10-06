"use server"

import { GameDataService } from "./game-data-service"
import { DatabaseService } from "./game-database-services"
import type { ServiceResponse, TeamResult, PlayerResult } from "./game-type"

export const checkPlayerData = GameDataService.checkPlayerData
export const updateGameData = GameDataService.updateGameData
export const getOverallResults = GameDataService.getOverallResults
export const getPerMatchResults = GameDataService.getPerMatchResults
export const getStarOfTheMatch = GameDataService.getStarOfTheMatch

export const getMatchData = async (
  scheduleIds: string[],
): Promise<{
  matchExists: boolean
  data: { teamResults: TeamResult[]; playerResults: PlayerResult[] } | null
  message?: string
}> => {
  try {
    const schedules = await DatabaseService.findSchedulesByIds(scheduleIds)

    if (schedules.length === 1) {
      const schedule = schedules[0]
      if (!schedule.match) {
        return { matchExists: false, data: null, message: "Match data not found" }
      }

      const result = await GameDataService.getPerMatchResults(schedule.match.toString())
      if (result.status === "error") {
        return { matchExists: false, data: null, message: result.message }
      }

      return { matchExists: true, data: result.data!, message: "Match data found" }
    } else if (schedules.length > 1) {
      const matchIds = schedules.map((s) => s.match.toString()).filter(Boolean)
      const result = await GameDataService.getOverallResults(matchIds)

      if (result.status === "error") {
        return { matchExists: false, data: null, message: result.message }
      }

      return { matchExists: true, data: result.data! }
    } else {
      return { matchExists: false, data: null, message: "Schedule not found" }
    }
  } catch (error) {
    console.error("Error fetching match data:", error)
    return { matchExists: false, data: null, message: "Error fetching match data" }
  }
}

export const getResultsData = async (
  stageId: string,
): Promise<ServiceResponse<{ teamResults: TeamResult[]; playerResults: PlayerResult[] }>> => {
  try {
    const scheduleDocs = await DatabaseService.findSchedulesByStage(stageId)
    if (scheduleDocs.length === 0) {
      return { status: "error", message: "No schedules found for the stage" }
    }

    const matchIds = scheduleDocs
      .map((doc) => doc.match)
      .filter(Boolean)
      .map((id) => id.toString())

    if (matchIds.length === 0) {
      return { status: "error", message: "No matches found for the stage" }
    }

    const result = await GameDataService.getOverallResults(matchIds)
    if (result.status === "error") {
      return { status: "error", message: result.message }
    }

    return {
      status: "success",
      message: "Results data fetched successfully",
      data: result.data!,
    }
  } catch (error) {
    console.error("Error fetching results data:", error)
    return { status: "error", message: "Error fetching results data" }
  }
}
