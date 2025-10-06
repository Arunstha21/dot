export const MVP_WEIGHTS = {
  SURVIVAL_TIME: 0.2,
  DAMAGE: 0.3,
  KILLS: 0.5,
} as const

export const MVP_MULTIPLIER = 100

export const TEAM_SORT_PRIORITIES = {
  TOTAL_POINT: "totalPoint",
  WWCD: "wwcd",
  PLACE_POINT: "placePoint",
  KILL: "kill",
  LAST_MATCH_RANK: "lastMatchRank",
  MATCHES_PLAYED: "matchesPlayed",
  TEAM_NAME: "team",
} as const
