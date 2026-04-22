'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Player, Game, StatEvent, GameRoster } from './types'
import { samplePlayers, sampleGames, sampleStats, sampleGameRosters } from './store'

interface GameContextType {
  // Data
  players: Player[]
  games: Game[]
  stats: StatEvent[]
  gameRosters: GameRoster[]
  
  // Current game state
  activeGameId: string | null
  setActiveGameId: (id: string | null) => void
  
  // Player management
  addPlayer: (name: string, number: number) => void
  removePlayer: (id: string) => void
  
  // Game management
  addGame: (game: Omit<Game, 'id' | 'isComplete' | 'ourScore' | 'opponentScore'>) => void
  updateGame: (id: string, updates: Partial<Game>) => void
  
  // Game roster management
  getGameRoster: (gameId: string) => string[]
  setGameRoster: (gameId: string, playerIds: string[]) => void
  addPlayerToGameRoster: (gameId: string, playerId: string) => void
  
  // Stats management
  addStat: (gameId: string, type: StatEvent['type'], playerId?: string) => void
  undoLastStat: (gameId: string) => void
  getGameStats: (gameId: string) => StatEvent[]
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(samplePlayers)
  const [games, setGames] = useState<Game[]>(sampleGames)
  const [stats, setStats] = useState<StatEvent[]>(sampleStats)
  const [gameRosters, setGameRosters] = useState<GameRoster[]>(sampleGameRosters)
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  const addPlayer = useCallback((name: string, number: number) => {
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name,
      number,
    }
    setPlayers(prev => [...prev, newPlayer])
  }, [])

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }, [])

  const addGame = useCallback((game: Omit<Game, 'id' | 'isComplete' | 'ourScore' | 'opponentScore'>) => {
    const newGame: Game = {
      ...game,
      id: `g${Date.now()}`,
      isComplete: false,
      ourScore: 0,
      opponentScore: 0,
    }
    setGames(prev => [...prev, newGame])
  }, [])

  const updateGame = useCallback((id: string, updates: Partial<Game>) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }, [])

  const getGameRoster = useCallback((gameId: string): string[] => {
    const roster = gameRosters.find(r => r.gameId === gameId)
    return roster?.playerIds ?? []
  }, [gameRosters])

  const setGameRoster = useCallback((gameId: string, playerIds: string[]) => {
    setGameRosters(prev => {
      const existing = prev.find(r => r.gameId === gameId)
      if (existing) {
        return prev.map(r => r.gameId === gameId ? { ...r, playerIds } : r)
      }
      return [...prev, { gameId, playerIds }]
    })
  }, [])

  const addPlayerToGameRoster = useCallback((gameId: string, playerId: string) => {
    setGameRosters(prev => {
      const existing = prev.find(r => r.gameId === gameId)
      if (existing) {
        if (existing.playerIds.includes(playerId)) return prev
        return prev.map(r => r.gameId === gameId ? { ...r, playerIds: [...r.playerIds, playerId] } : r)
      }
      return [...prev, { gameId, playerIds: [playerId] }]
    })
  }, [])

  const addStat = useCallback((gameId: string, type: StatEvent['type'], playerId?: string) => {
    const newStat: StatEvent = {
      id: `s${Date.now()}`,
      gameId,
      playerId,
      type,
      timestamp: Date.now(),
    }
    setStats(prev => [...prev, newStat])
    
    // Update game score
    if (type === 'goal' || type === 'callahan') {
      setGames(prev => prev.map(g => 
        g.id === gameId ? { ...g, ourScore: g.ourScore + 1 } : g
      ))
    } else if (type === 'opponent_score') {
      setGames(prev => prev.map(g => 
        g.id === gameId ? { ...g, opponentScore: g.opponentScore + 1 } : g
      ))
    }
  }, [])

  const undoLastStat = useCallback((gameId: string) => {
    const gameStats = stats.filter(s => s.gameId === gameId)
    if (gameStats.length === 0) return
    
    const lastStat = gameStats[gameStats.length - 1]
    setStats(prev => prev.filter(s => s.id !== lastStat.id))
    
    // Revert score if needed
    if (lastStat.type === 'goal' || lastStat.type === 'callahan') {
      setGames(prev => prev.map(g => 
        g.id === gameId ? { ...g, ourScore: Math.max(0, g.ourScore - 1) } : g
      ))
    } else if (lastStat.type === 'opponent_score') {
      setGames(prev => prev.map(g => 
        g.id === gameId ? { ...g, opponentScore: Math.max(0, g.opponentScore - 1) } : g
      ))
    }
  }, [stats])

  const getGameStats = useCallback((gameId: string): StatEvent[] => {
    return stats.filter(s => s.gameId === gameId)
  }, [stats])

  return (
    <GameContext.Provider value={{
      players,
      games,
      stats,
      gameRosters,
      activeGameId,
      setActiveGameId,
      addPlayer,
      removePlayer,
      addGame,
      updateGame,
      getGameRoster,
      setGameRoster,
      addPlayerToGameRoster,
      addStat,
      undoLastStat,
      getGameStats,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
