export interface Player {
  id: string
  name: string
  number: number
}

export interface GameRoster {
  gameId: string
  playerIds: string[]
}

export interface StatEvent {
  id: string
  gameId: string
  playerId?: string
  type: 'completion' | 'turnover' | 'turnover_caused' | 'goal' | 'assist' | 'callahan' | 'opponent_score' | 'pull'
  timestamp: number
}

export interface Game {
  id: string
  opponent: string
  date: string
  time: string
  location: string
  isHome: boolean
  isComplete: boolean
  ourScore: number
  opponentScore: number
}

export interface TeamStats {
  completions: number
  turnovers: number
  turnoversCaused: number
  goals: number
  assists: number
  callahans: number
  pointsPlayed: number
}

export interface PlayerStats extends TeamStats {
  playerId: string
  completionPercentage: number
}
