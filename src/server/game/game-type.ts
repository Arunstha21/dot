import type { ObjectId } from "mongoose"

export interface Location {
  x: number
  y: number
  z: number
}

export interface Player {
  uId: number
  playerName: string
  playerOpenId: string
  picUrl: string
  showPicUrl: boolean
  teamId: number
  teamName: string
  character: string
  isFiring: boolean
  bHasDied: boolean
  location: Location
  health: number
  healthMax: number
  liveState: number
  killNum: number
  killNumBeforeDie: number
  playerKey: number
  gotAirDropNum: number
  maxKillDistance: number
  damage: number
  killNumInVehicle: number
  killNumByGrenade: number
  AIKillNum: number
  BossKillNum: number
  rank: number
  isOutsideBlueCircle: boolean
  inDamage: number
  heal: number
  headShotNum: number
  survivalTime: number
  driveDistance: number
  marchDistance: number
  assists: number
  outsideBlueCircleTime: number
  knockouts: number
  rescueTimes: number
  useSmokeGrenadeNum: number
  useFragGrenadeNum: number
  useBurnGrenadeNum: number
  useFlashGrenadeNum: number
  PoisonTotalDamage: number
  UseSelfRescueTime: number
  UseEmergencyCallTime: number
}

export interface Team {
  teamId: number
  teamName: string
  isShowLogo: boolean
  logoPicUrl: string
  killNum: number
  liveMemberNum: number
}

export interface MatchData {
  allinfo: {
    TotalPlayerList: Player[]
    GameID: string
    GameStartTime: string
    FightingStartTime: string
    FinishedStartTime: string
    CurrentTime: string
    TeamInfoList: Team[]
  }
}

export interface TeamResult {
  team: string
  kill: number
  damage: number
  placePoint: number
  totalPoint: number
  wwcd: number
  matchesPlayed: number
  cRank?: number
  rank?: number
  lastMatchRank?: number
  survivalTime: number
  assists: number
  knockouts: number
  heal: number
  grenadeKills: number
  vehicleKills: number
  headShotNum: number
  smokeGrenadeUsed: number
  fragGrenadeUsed: number
  burnGrenadeUsed: number
  vecileTravelDistance: number
  killDistance: number
}

export interface PlayerResult {
  inGameName: string
  uId: string
  teamName: string
  kill: number
  damage: number
  survivalTime: number
  avgSurvivalTime?: number
  assists: number
  heal: number
  matchesPlayed: number
  cRank?: number
  mvp: number
  knockouts: number
  rescueTimes: number
  grenadeKills: number
  vehicleKills: number
  headShotNum: number
  smokeGrenadeUsed: number
  fragGrenadeUsed: number
  burnGrenadeUsed: number
  vecileTravelDistance: number
  killDistance: number
  travelDistance?: number
}

export interface Event {
  _id: ObjectId
  name: string
  stage: ObjectId[]
  __v: number
  pointSystem: ObjectId
}

export interface Stage {
  _id: ObjectId
  name: string
  event: ObjectId
  group: ObjectId[]
  __v: number
}

export interface ScheduleDoc {
  _id: ObjectId
  event: Event
  stage: Stage
  match: ObjectId
}

export interface StarOfMatch {
  goingAllOut: Array<{
    inGameName: string
    uId: string
    teamName: string
    knockouts: number
    kill: number
    bonus: number
    damage: number
  }>
  bestCompanion: Array<{
    inGameName: string
    uId: string
    teamName: string
    assists: number
    rescueTimes: number
    heal: number
    survivalTime: number
  }>
  finishers: Array<{
    inGameName: string
    uId: string
    teamName: string
    kill: number
    assists: number
    travelDistance: number
    survivalTime: number
  }>
}

export interface ServiceResponse<T = any> {
  status: "success" | "error"
  message: string
  data?: T
}
