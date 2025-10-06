import mongoose, { Schema, type Document, type Types } from "mongoose"

export interface ITicketConfig extends Document {
  guild: Types.ObjectId
  ticketChannel: string
  transcriptChannel: string
  status: "active" | "inactive"
  ticketCategories?: string[]
  ticketCount: number

  createdAt: Date
  updatedAt: Date
}

export interface ITicketDocument extends Document {
  guild: Types.ObjectId
  channelId: string
  user: string
  ticketType?: string
  status: "open" | "closed"
  closedBy?: Types.ObjectId
  closeReason?: string

  messages: [
    {
      user: Types.ObjectId
      content: string
      timestamp: Date
    },
  ]

  renameTimestamp?: Date
  createdAt: Date
  updatedAt: Date
}


const ticketConfigSchema = new Schema<ITicketConfig>(
  {
    guild: { type: Schema.Types.ObjectId, ref: "Guild", required: true },
    ticketChannel: { type: String, required: true },
    transcriptChannel: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    ticketCategories: { type: [String] },
    ticketCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const ticketDocumentSchema = new Schema<ITicketDocument>(
  {
    guild: { type: Schema.Types.ObjectId, ref: "Guild", required: true },
    channelId: { type: String, required: true },
    user: { type: String, required: true },
    ticketType: { type: String, default: "general" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    closedBy: { type: Schema.Types.ObjectId, ref: "User" },
    closeReason: { type: String },
    messages: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    renameTimestamp: { type: Date },
  },
  { timestamps: true },
)

export const TicketConfig = mongoose.models?.TicketConfig || mongoose.model<ITicketConfig>("TicketConfig", ticketConfigSchema)
export const TicketDocument = mongoose.models?.TicketDocument || mongoose.model<ITicketDocument>("TicketDocument", ticketDocumentSchema)