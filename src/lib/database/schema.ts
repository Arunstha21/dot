import mongoose, { Schema, type Document, type Types } from "mongoose"

// ===== TEAM MANAGEMENT (UNIFIED) =====

export interface ITeam extends Document {
  _id: Types.ObjectId;
  // Basic info
  name: string
  tag?: string
  email?: string

  // Tournament context
  event?: Types.ObjectId
  stage?: Types.ObjectId
  group?: Types.ObjectId
  slot?: number

  // Members
  players: Types.ObjectId[]

  createdAt: Date
  updatedAt: Date
}

export interface IRoleManagerUser extends Document {
    _id: Types.ObjectId;
    userName: string
    email: string
    role: string[]
    guild: Types.ObjectId
    serverJoined: boolean
    emailSent: number
    otp?: number
    sender?: string
    player: Types.ObjectId
}

export interface IPlayer extends Document {
  _id: Types.ObjectId;
  // Core identity
  name: string
  uid: string
  email?: string

  discord?: Types.ObjectId

  gacUsername?: string
  gacPassword?: string
  gacIngameName?: string

  // Relationships (gaming only)
  team: Types.ObjectId
  matches: Types.ObjectId[]

  createdAt: Date
  updatedAt: Date
}

// ===== TOURNAMENT & EVENT SYSTEM =====

export interface IEvent extends Document {
  _id: Types.ObjectId;
  name: string
  organizer?: string
  isPublic: boolean

  // Structure
  stages: Types.ObjectId[]
  pointSystem?: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

export interface IStage extends Document {
  _id: Types.ObjectId;
  name: string
  event: Types.ObjectId
  groups: Types.ObjectId[]
  isMultiGroup: boolean

  guild?: Types.ObjectId

  bonus?: boolean
  bonusPoint?: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string
  event: Types.ObjectId
  stage: Types.ObjectId
  teams: Types.ObjectId[]
  schedules: Types.ObjectId[]

  createdAt: Date
  updatedAt: Date
}

export interface ISchedule extends Document {
  _id: Types.ObjectId;
  event: Types.ObjectId
  stage: Types.ObjectId
  groups: Types.ObjectId[]

  matchNo: number
  map: "Erangel" | "Miramar" | "Sanhok" | "Vikendi" | "Karakin" | "Livik" | "Rondo"
  startTime: string
  date: string
  overallMatchNo?: number

  match?: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

export interface IMatch extends Document {
  _id: Types.ObjectId;
  group: Types.ObjectId
  schedule: Types.ObjectId
  gameId: string

  // Match data
  playerInfo: any[]
  teamInfo: any[]
  gameGlobalInfo: any
  pointSystem: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

// ===== STATISTICS & POINTS =====

export interface IPointSystem extends Document {
  _id: Types.ObjectId;
  name: string
  pointSystem: any

  createdAt: Date
  updatedAt: Date
}

export interface IPlayerStats extends Document {
  _id: Types.ObjectId;
  player: Types.ObjectId
  match: Types.ObjectId

  // Combat stats
  killNum: number
  killNumBeforeDie: number
  maxKillDistance: number
  damage: number
  inDamage: number
  headShotNum: number
  assists: number
  knockouts: number

  // Survival stats
  rank: number
  survivalTime: number
  heal: number
  rescueTimes: number

  // Movement stats
  driveDistance: number
  marchDistance: number

  // Item usage
  gotAirDropNum: number
  killNumInVehicle: number
  killNumByGrenade: number
  useSmokeGrenadeNum: number
  useFragGrenadeNum: number
  useBurnGrenadeNum: number
  useFlashGrenadeNum: number

  // Special stats
  AIKillNum: number
  BossKillNum: number
  PoisonTotalDamage: number
  UseSelfRescueTime: number
  UseEmergencyCallTime: number

  createdAt: Date
  updatedAt: Date
}

export interface ITeamStats extends Document {
  _id: Types.ObjectId;
  team: Types.ObjectId
  match: Types.ObjectId

  // Same structure as player stats but aggregated for team
  killNum: number
  killNumBeforeDie: number
  maxKillDistance: number
  damage: number
  inDamage: number
  headShotNum: number
  assists: number
  knockouts: number
  rank: number
  survivalTime: number
  heal: number
  rescueTimes: number
  driveDistance: number
  marchDistance: number
  gotAirDropNum: number
  killNumInVehicle: number
  killNumByGrenade: number
  useSmokeGrenadeNum: number
  useFragGrenadeNum: number
  useBurnGrenadeNum: number
  useFlashGrenadeNum: number
  AIKillNum: number
  BossKillNum: number
  PoisonTotalDamage: number
  UseSelfRescueTime: number
  UseEmergencyCallTime: number

  createdAt: Date
  updatedAt: Date
}

// ===== MONGOOSE SCHEMAS =====

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    tag: { type: String },
    email: { type: String },
    event: { type: Schema.Types.ObjectId, ref: "Event" },
    stage: { type: Schema.Types.ObjectId, ref: "Stage" },
    group: { type: Schema.Types.ObjectId, ref: "Group" },
    slot: { type: Number },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true },
)

const roleManagerUserSchema = new Schema<IRoleManagerUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true },
    role: [{ type: String, required: true }],
    guild: { type: Schema.Types.ObjectId, ref: "Guild", required: true },
    serverJoined: { type: Boolean, default: false },
    emailSent: { type: Number, default: 0 },
    otp: { type: String },
    sender: { type: String, required: true },
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
  },
  { timestamps: true },
)

const playerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true },
    uid: { type: String, required: true },
    email: { type: String },
    discord: { type: Schema.Types.ObjectId, ref: "RoleManagerUser"},
    gacUsername: { type: String },
    gacPassword: { type: String },
    gacIngameName: { type: String },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    matches: [{ type: Schema.Types.ObjectId, ref: "Match" }],
  },
  { timestamps: true },
)

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    organizer: { type: String },
    isPublic: { type: Boolean, default: false },
    stages: [{ type: Schema.Types.ObjectId, ref: "Stage" }],
    pointSystem: { type: Schema.Types.ObjectId, ref: "PointSystem" },
  },
  { timestamps: true },
)

const stageSchema = new Schema<IStage>(
  {
    name: { type: String, required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    isMultiGroup: { type: Boolean, default: false },
    guild: { type: Schema.Types.ObjectId, ref: "Guild" },
    bonus: { type: Boolean, default: false },
    bonusPoint: { type: Schema.Types.ObjectId, ref: "PointSystem" },
  },
  { timestamps: true },
)

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    stage: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    schedules: [{ type: Schema.Types.ObjectId, ref: "Schedule" }],
  },
  { timestamps: true },
)

const scheduleSchema = new Schema<ISchedule>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    stage: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group", required: true }],
    matchNo: { type: Number, required: true },
    map: {
      type: String,
      enum: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Karakin", "Livik", "Rondo"],
      required: true,
    },
    startTime: { type: String, required: true },
    date: { type: String, required: true },
    overallMatchNo: { type: Number },
    match: { type: Schema.Types.ObjectId, ref: "Match" },
  },
  { timestamps: true },
)

const matchSchema = new Schema<IMatch>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    schedule: { type: Schema.Types.ObjectId, ref: "Schedule", required: true },
    gameId: { type: String, required: true },
    playerInfo: [{ type: Object, required: true }],
    teamInfo: [{ type: Object, required: true }],
    gameGlobalInfo: { type: Object, required: true },
    pointSystem: { type: Schema.Types.ObjectId, ref: "PointSystem", required: true },
  },
  { timestamps: true },
)

const pointSystemSchema = new Schema<IPointSystem>(
  {
    name: { type: String, required: true },
    pointSystem: { type: Object, required: true },
  },
  { timestamps: true },
)

const playerStatsSchema = new Schema<IPlayerStats>(
  {
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    killNum: { type: Number, required: true },
    killNumBeforeDie: { type: Number, required: true },
    maxKillDistance: { type: Number, required: true },
    damage: { type: Number, required: true },
    inDamage: { type: Number, required: true },
    headShotNum: { type: Number, required: true },
    assists: { type: Number, required: true },
    knockouts: { type: Number, required: true },
    rank: { type: Number, required: true },
    survivalTime: { type: Number, required: true },
    heal: { type: Number, required: true },
    rescueTimes: { type: Number, required: true },
    driveDistance: { type: Number, required: true },
    marchDistance: { type: Number, required: true },
    gotAirDropNum: { type: Number, required: true },
    killNumInVehicle: { type: Number, required: true },
    killNumByGrenade: { type: Number, required: true },
    useSmokeGrenadeNum: { type: Number, required: true },
    useFragGrenadeNum: { type: Number, required: true },
    useBurnGrenadeNum: { type: Number, required: true },
    useFlashGrenadeNum: { type: Number, required: true },
    AIKillNum: { type: Number, required: true },
    BossKillNum: { type: Number, required: true },
    PoisonTotalDamage: { type: Number, required: true },
    UseSelfRescueTime: { type: Number, required: true },
    UseEmergencyCallTime: { type: Number, required: true },
  },
  { timestamps: true },
)

const teamStatsSchema = new Schema<ITeamStats>(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    killNum: { type: Number, required: true },
    killNumBeforeDie: { type: Number, required: true },
    maxKillDistance: { type: Number, required: true },
    damage: { type: Number, required: true },
    inDamage: { type: Number, required: true },
    headShotNum: { type: Number, required: true },
    assists: { type: Number, required: true },
    knockouts: { type: Number, required: true },
    rank: { type: Number, required: true },
    survivalTime: { type: Number, required: true },
    heal: { type: Number, required: true },
    rescueTimes: { type: Number, required: true },
    driveDistance: { type: Number, required: true },
    marchDistance: { type: Number, required: true },
    gotAirDropNum: { type: Number, required: true },
    killNumInVehicle: { type: Number, required: true },
    killNumByGrenade: { type: Number, required: true },
    useSmokeGrenadeNum: { type: Number, required: true },
    useFragGrenadeNum: { type: Number, required: true },
    useBurnGrenadeNum: { type: Number, required: true },
    useFlashGrenadeNum: { type: Number, required: true },
    AIKillNum: { type: Number, required: true },
    BossKillNum: { type: Number, required: true },
    PoisonTotalDamage: { type: Number, required: true },
    UseSelfRescueTime: { type: Number, required: true },
    UseEmergencyCallTime: { type: Number, required: true },
  },
  { timestamps: true },
)

// ===== MODEL EXPORTS =====
export const Team = mongoose.models?.Team || mongoose.model<ITeam>("Team", teamSchema)
export const Player = mongoose.models?.Player || mongoose.model<IPlayer>("Player", playerSchema)
export const EventDB = mongoose.models?.Event || mongoose.model<IEvent>("Event", eventSchema)
export const Stage = mongoose.models?.Stage || mongoose.model<IStage>("Stage", stageSchema)
export const Group = mongoose.models?.Group || mongoose.model<IGroup>("Group", groupSchema)
export const Schedule = mongoose.models?.Schedule || mongoose.model<ISchedule>("Schedule", scheduleSchema)
export const Match = mongoose.models?.Match || mongoose.model<IMatch>("Match", matchSchema)
export const PointSystem = mongoose.models?.PointSystem || mongoose.model<IPointSystem>("PointSystem", pointSystemSchema)
export const PlayerStats = mongoose.models?.PlayerStats || mongoose.model<IPlayerStats>("PlayerStats", playerStatsSchema)
export const TeamStats = mongoose.models?.TeamStats || mongoose.model<ITeamStats>("TeamStats", teamStatsSchema)
export const RoleManagerUser = mongoose.models?.RoleManagerUser || mongoose.model<IRoleManagerUser>("RoleManagerUser", roleManagerUserSchema)
