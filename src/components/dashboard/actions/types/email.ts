// Email composition types - exported from message.tsx
export type Groupings = {
  slot: string
  team: string
}

export type Matches = {
  map: string
  date: string
  startTime: string
}

export type IDPass = {
  event: string
  discordLink: string
  organizer: string
  stage: string
  matchNo: number
  map: string
  matchId: number
  password: string
  startTime: string
  date: string
  group: string
  groupName: string
  groupings: Groupings[]
  isMultiGroup: boolean // Indicates if this is a multi-group stage (groups playing against each other)
}

export type Grouping = {
  event: string
  discordLink: string
  organizer: string
  stage: string
  group: string
  groupName: string
  matches: Matches[]
  groupings: Groupings[]
  isMultiGroup: boolean // Indicates if this is a multi-group stage (groups playing against each other)
}
