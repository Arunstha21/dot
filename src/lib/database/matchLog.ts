import mongoose, { Schema, type Document, type Types } from "mongoose"

export interface IMatchLogger extends Document {
  guild: Types.ObjectId
  active: boolean
  loggerChannelId: string
  logData: Types.ObjectId[]

  createdAt: Date
  updatedAt: Date
}

export interface IMatchLog extends Document {
  matchId: string
  region: "asia" | "europe" | "middle_east" | "north_america" | "south_america"
  logType: "issue" | "match_end" | "match_start"
  noOfPlayers: number
  log?: string
  time: Date

  logger: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

const matchLoggerSchema = new Schema<IMatchLogger>(
  {
    guild: { type: Schema.Types.ObjectId, ref: "Guild", required: true },
    active: { type: Boolean, default: true },
    loggerChannelId: { type: String, required: true },
    logData: [{ type: Schema.Types.ObjectId, ref: "MatchLog" }],
  },
  { timestamps: true },
)

const matchLogSchema = new Schema<IMatchLog>(
  {
    matchId: { type: String, required: true },
    region: {
      type: String,
      required: true,
      enum: ["asia", "europe", "middle_east", "north_america", "south_america"],
    },
    logType: {
      type: String,
      required: true,
      enum: ["issue", "match_end", "match_start"],
    },
    noOfPlayers: { type: Number, required: true },
    log: { type: String },
    time: { type: Date, default: Date.now },
    logger: { type: Schema.Types.ObjectId, ref: "MatchLogger", required: true },
  },
  { timestamps: true },
)

export const MatchLogger = mongoose.models?.MatchLogger || mongoose.model<IMatchLogger>("MatchLogger", matchLoggerSchema)
export const MatchLog = mongoose.models?.MatchLog || mongoose.model<IMatchLog>("MatchLog", matchLogSchema)