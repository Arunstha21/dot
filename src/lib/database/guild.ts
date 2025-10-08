import mongoose, { Schema, type Document, type Types } from "mongoose"

export interface IGuild extends Document {
  guildId: string
  guildName: string

  // Members & administration
  users: Types.ObjectId[]
  admins: Types.ObjectId[]

  // Discord features
  ticketConfig?: Types.ObjectId
  matchLogger?: Types.ObjectId
  roleManager?: boolean

  // Tournament integration
  events: Types.ObjectId[]

  resultChannel?: string

  createdAt: Date
  updatedAt: Date
}

const guildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true },
    guildName: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "RoleManagerUser" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "RoleManagerUser" }],
    ticketConfig: { type: Schema.Types.ObjectId, ref: "TicketConfig" },
    matchLogger: { type: Schema.Types.ObjectId, ref: "MatchLogger" },
    roleManager: { type: Boolean, default: true },
    events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    resultChannel: { type: String },
  },
  { timestamps: true },
)


export const Guild = mongoose.models?.Guild || mongoose.model<IGuild>("Guild", guildSchema)