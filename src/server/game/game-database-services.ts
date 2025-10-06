import { EventDB, Match, Player, PlayerStats, PointSystem, Schedule, TeamStats } from "@/lib/database/schema"
import type { ObjectId } from "mongoose"
import { ScheduleDoc } from "./game-type"

export class DatabaseService {
  static async findMatchByGameId(gameId: string) {
    return Match.findOne({ gameId })
  }

  static async findScheduleById(scheduleId: string) {
    return Schedule.findById(scheduleId).populate({
      path: "groups",
      populate: {
        path: "team",
        strictPopulate: false,
      },
      strictPopulate: false,
    })
  }

  static async findSchedulesByIds(scheduleIds: string[]) {
    return Schedule.find({ _id: { $in: scheduleIds } }).populate({
      path: "groups",
      strictPopulate: false,
    })
  }

  static async findEventById(eventId: ObjectId) {
    return EventDB.findById(eventId)
  }

  static async findPointSystemById(pointId: ObjectId) {
    return PointSystem.findById(pointId)
  }

  static async findPlayersByTeam(teamId: string) {
    return Player.find({ team: teamId })
  }

  static async findPlayersByTeams(teamIds: string[]) {
    return Player.find({ team: { $in: teamIds } })
  }

  static async findMatchesByIds(matchIds: string[]) {
    return Match.find({ _id: { $in: matchIds } })
  }

  static async findScheduleByMatch(matchId: string): Promise<ScheduleDoc | null> {
    return Schedule.findOne({ match: matchId })
      .populate([
        { path: "groups", strictPopulate: false },
        { path: "stage", strictPopulate: false },
        { path: "event", strictPopulate: false }
      ])
      .lean<ScheduleDoc>()
  }

  static async findSchedulesByStage(stageId: string): Promise<ScheduleDoc[]> {
    return Schedule.find({ stage: stageId })
  }

  static async findTeamStatsByMatches(matchIds: ObjectId[]) {
    return TeamStats.find({ match: { $in: matchIds } })
      .populate({ path: "team", strictPopulate: false })
      .lean()
  }

  static async findPlayerStatsByMatches(matchIds: ObjectId[]) {
    return PlayerStats.find({ match: { $in: matchIds } })
      .populate({
        path: "player",
        populate: {
          path: "team",
          strictPopulate: false,
        },
        strictPopulate: false,
      })
      .lean()
  }

  static async upsertMatch(gameId: string, matchData: any) {
    return Match.findOneAndUpdate({ gameId }, { $set: matchData }, { upsert: true, new: true })
  }

  static async upsertPlayerStats(playerId: ObjectId, matchId: ObjectId, stats: any) {
    return PlayerStats.findOneAndUpdate({ player: playerId, match: matchId }, { $set: stats }, { upsert: true })
  }

  static async upsertTeamStats(teamId: ObjectId, matchId: ObjectId, stats: any) {
    return TeamStats.findOneAndUpdate({ team: teamId, match: matchId }, { $set: stats }, { upsert: true })
  }
}
