import type { Player, Game, StatEvent, GameRoster } from './types'

// Empty data - ready for real data
export const samplePlayers: Player[] = []

export const sampleGames: Game[] = []

export const sampleGameRosters: GameRoster[] = []

export const sampleStats: StatEvent[] = []

// Helper functions for calculating stats
export function calculatePlayerStats(playerId: string, stats: StatEvent[], gameId?: string): {
  completions: number
  turnovers: number
  turnoversCaused: number
  goals: number
  assists: number
  callahans: number
} {
  const filtered = stats.filter(s => 
    s.playerId === playerId && 
    (gameId ? s.gameId === gameId : true)
  )
  
  return {
    completions: filtered.filter(s => s.type === 'completion').length,
    receptions: filtered.filter(s => s.type === 'reception').length,
    turnovers: filtered.filter(s => s.type === 'turnover').length,
    turnoversCaused: filtered.filter(s => s.type === 'turnover_caused').length,
    goals: filtered.filter(s => s.type === 'goal').length,
    assists: filtered.filter(s => s.type === 'assist').length,
    callahans: filtered.filter(s => s.type === 'callahan').length,
  }
}

export function calculateTeamStats(stats: StatEvent[], gameId?: string): {
  completions: number
  turnovers: number
  turnoversCaused: number
  goals: number
  assists: number
  callahans: number
  opponentScores: number
} {
  const filtered = stats.filter(s => gameId ? s.gameId === gameId : true)
  
  return {
    completions: filtered.filter(s => s.type === 'completion').length,
    receptions: filtered.filter(s => s.type === 'reception').length,
    turnovers: filtered.filter(s => s.type === 'turnover').length,
    turnoversCaused: filtered.filter(s => s.type === 'turnover_caused').length,
    goals: filtered.filter(s => s.type === 'goal').length,
    assists: filtered.filter(s => s.type === 'assist').length,
    callahans: filtered.filter(s => s.type === 'callahan').length,
    opponentScores: filtered.filter(s => s.type === 'opponent_score').length,
  }
}
