import mongoose, { Schema, type Document, type Types } from "mongoose"

export interface IUser extends Document {
  // Core identity (admin & SendGrid only)
  userName: string
  email: string
  password?: string

  // Admin permissions & roles
  superUser: boolean

  // Admin relationships only
  guilds: Types.ObjectId[] // Guilds they administrate
  events: Types.ObjectId[] // Events they manage

  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    superUser: { type: Boolean, default: false },
    guilds: [{ type: Schema.Types.ObjectId, ref: "Guild" }],
    events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  },
  { timestamps: true },
)

export const User = mongoose.models?.User || mongoose.model<IUser>("User", userSchema)