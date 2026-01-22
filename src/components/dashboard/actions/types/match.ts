// Match and schedule types
export type Event = { id: string; name: string }
export type Stage = { id: string; name: string }

export type EventDataE = {
  id: string
  name: string
  discordLink?: string
  organizer?: string
  stages: Stage[]
}
