import type { Player, StatEvent, Game, GameRoster } from './types'

export interface PlayEntry {
  type: 'our_goal' | 'callahan' | 'opponent_score'
  scorer?: Player
  assister?: Player
  ourScore: number
  theirScore: number
}

export interface AssistGoalCombo {
  assister: Player
  scorer: Player
  count: number
}

export function buildPlayByPlay(
  stats: StatEvent[],
  gameId: string,
  players: Player[]
): PlayEntry[] {
  const gameStats = stats
    .filter(s => s.gameId === gameId)
    .sort((a, b) => a.timestamp - b.timestamp)

  const plays: PlayEntry[] = []
  const usedAssistIds = new Set<string>()
  const assists = gameStats.filter(e => e.type === 'assist')
  let ourScore = 0
  let theirScore = 0

  for (const event of gameStats) {
    if (event.type === 'opponent_score') {
      theirScore++
      plays.push({ type: 'opponent_score', ourScore, theirScore })
    } else if (event.type === 'goal') {
      ourScore++
      const scorer = players.find(p => p.id === event.playerId)
      const assist = assists
        .filter(a => !usedAssistIds.has(a.id) && Math.abs(a.timestamp - event.timestamp) < 5000)
        .sort((a, b) => Math.abs(a.timestamp - event.timestamp) - Math.abs(b.timestamp - event.timestamp))[0]
      if (assist) usedAssistIds.add(assist.id)
      plays.push({
        type: 'our_goal',
        scorer,
        assister: assist ? players.find(p => p.id === assist.playerId) : undefined,
        ourScore,
        theirScore,
      })
    } else if (event.type === 'callahan') {
      ourScore++
      plays.push({
        type: 'callahan',
        scorer: players.find(p => p.id === event.playerId),
        ourScore,
        theirScore,
      })
    }
  }

  return plays
}

export function buildAssistGoalCombos(
  stats: StatEvent[],
  players: Player[]
): AssistGoalCombo[] {
  const byGame = new Map<string, StatEvent[]>()
  for (const event of stats) {
    const list = byGame.get(event.gameId) ?? []
    list.push(event)
    byGame.set(event.gameId, list)
  }

  const combos = new Map<string, AssistGoalCombo>()

  for (const events of byGame.values()) {
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
    const goals = sorted.filter(e => e.type === 'goal')
    const assists = sorted.filter(e => e.type === 'assist')
    const usedIds = new Set<string>()

    for (const goal of goals) {
      const assist = assists
        .filter(a => !usedIds.has(a.id) && Math.abs(a.timestamp - goal.timestamp) < 5000)
        .sort((a, b) => Math.abs(a.timestamp - goal.timestamp) - Math.abs(b.timestamp - goal.timestamp))[0]
      if (!assist) continue
      usedIds.add(assist.id)

      const scorer = players.find(p => p.id === goal.playerId)
      const assister = players.find(p => p.id === assist.playerId)
      if (!scorer || !assister) continue

      const key = `${assister.id}→${scorer.id}`
      const existing = combos.get(key)
      if (existing) {
        existing.count++
      } else {
        combos.set(key, { assister, scorer, count: 1 })
      }
    }
  }

  return Array.from(combos.values()).sort((a, b) => b.count - a.count)
}

// Empty data - ready for real data
export const samplePlayers: Player[] = []

export const sampleGames: Game[] = []

export const sampleGameRosters: GameRoster[] = []

export const sampleStats: StatEvent[] = []

// Helper functions for calculating stats
export function calculatePlayerStats(playerId: string, stats: StatEvent[], gameId?: string): {
  completions: number
  receptions: number
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
  receptions: number
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
