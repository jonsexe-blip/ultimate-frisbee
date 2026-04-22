'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Player, Game, StatEvent, GameRoster } from './types'
import {
  getPlayers,
  getGames,
  getStatEvents,
  getGameRosters,
  addPlayer as dbAddPlayer,
  removePlayer as dbRemovePlayer,
  reorderPlayers as dbReorderPlayers,
  addGame as dbAddGame,
  updateGame as dbUpdateGame,
  deleteGame as dbDeleteGame,
  addStatEvent,
  undoLastStatEvent,
  setGameRoster as dbSetGameRoster,
  addPlayerToGameRoster as dbAddPlayerToGameRoster,
} from './actions'

interface GameContextType {
  players: Player[]
  games: Game[]
  stats: StatEvent[]
  gameRosters: GameRoster[]
  loading: boolean

  activeGameId: string | null
  setActiveGameId: (id: string | null) => void

  addPlayer: (name: string, number: number) => Promise<string | null>
  removePlayer: (id: string) => Promise<void>
  reorderPlayers: (orderedIds: string[]) => Promise<void>

  addGame: (game: Omit<Game, 'id' | 'isComplete' | 'ourScore' | 'opponentScore'>) => Promise<void>
  updateGame: (id: string, updates: Partial<Game>) => Promise<void>
  deleteGame: (id: string) => Promise<void>

  getGameRoster: (gameId: string) => string[]
  setGameRoster: (gameId: string, playerIds: string[]) => Promise<void>
  addPlayerToGameRoster: (gameId: string, playerId: string) => Promise<void>

  addStat: (gameId: string, type: StatEvent['type'], playerId?: string, catcherId?: string) => Promise<void>
  undoLastStat: (gameId: string) => Promise<void>
  getGameStats: (gameId: string) => StatEvent[]
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [stats, setStats] = useState<StatEvent[]>([])
  const [gameRosters, setGameRosters] = useState<GameRoster[]>([])
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPlayers(), getGames(), getStatEvents(), getGameRosters()]).then(
      ([p, g, s, r]) => {
        setPlayers(p)
        setGames(g)
        setStats(s)
        setGameRosters(
          Object.entries(
            r.reduce<Record<string, string[]>>((acc, row) => {
              if (!acc[row.game_id]) acc[row.game_id] = []
              acc[row.game_id].push(row.player_id)
              return acc
            }, {})
          ).map(([gameId, playerIds]) => ({ gameId, playerIds }))
        )
        setLoading(false)
      }
    )
  }, [])

  const addPlayer = useCallback(async (name: string, number: number): Promise<string | null> => {
    const player = await dbAddPlayer(name, number)
    if (player) setPlayers(prev => [...prev, player])
    return player?.id ?? null
  }, [])

  const reorderPlayers = useCallback(async (orderedIds: string[]) => {
    await dbReorderPlayers(orderedIds)
    setPlayers(prev => {
      const map = new Map(prev.map(p => [p.id, p]))
      return orderedIds.map((id, i) => ({ ...map.get(id)!, sortOrder: i }))
    })
  }, [])

  const removePlayer = useCallback(async (id: string) => {
    await dbRemovePlayer(id)
    setPlayers(prev => prev.filter(p => p.id !== id))
  }, [])

  const addGame = useCallback(async (
    game: Omit<Game, 'id' | 'isComplete' | 'ourScore' | 'opponentScore'>
  ) => {
    const newGame = await dbAddGame(game)
    if (newGame) setGames(prev => [...prev, newGame])
  }, [])

  const deleteGame = useCallback(async (id: string) => {
    await dbDeleteGame(id)
    setGames(prev => prev.filter(g => g.id !== id))
    setStats(prev => prev.filter(s => s.gameId !== id))
    setGameRosters(prev => prev.filter(r => r.gameId !== id))
  }, [])

  const updateGame = useCallback(async (id: string, updates: Partial<Game>) => {
    const updated = await dbUpdateGame(id, updates)
    if (updated) setGames(prev => prev.map(g => g.id === id ? updated : g))
  }, [])

  const getGameRoster = useCallback((gameId: string): string[] => {
    return gameRosters.find(r => r.gameId === gameId)?.playerIds ?? []
  }, [gameRosters])

  const setGameRoster = useCallback(async (gameId: string, playerIds: string[]) => {
    await dbSetGameRoster(gameId, playerIds)
    setGameRosters(prev => {
      const existing = prev.find(r => r.gameId === gameId)
      if (existing) return prev.map(r => r.gameId === gameId ? { ...r, playerIds } : r)
      return [...prev, { gameId, playerIds }]
    })
  }, [])

  const addPlayerToGameRoster = useCallback(async (gameId: string, playerId: string) => {
    const current = gameRosters.find(r => r.gameId === gameId)
    if (current?.playerIds.includes(playerId)) return
    await dbAddPlayerToGameRoster(gameId, playerId)
    setGameRosters(prev => {
      const existing = prev.find(r => r.gameId === gameId)
      if (existing) {
        return prev.map(r =>
          r.gameId === gameId ? { ...r, playerIds: [...r.playerIds, playerId] } : r
        )
      }
      return [...prev, { gameId, playerIds: [playerId] }]
    })
  }, [gameRosters])

  const addStat = useCallback(async (
    gameId: string,
    type: StatEvent['type'],
    playerId?: string,
    catcherId?: string
  ) => {
    const result = await addStatEvent(gameId, type, playerId)
    if (!result) return
    setStats(prev => [...prev, result.stat])
    setGames(prev => prev.map(g => g.id === gameId ? result.game : g))

    // For completions, also record a reception for the catcher
    if (type === 'completion' && catcherId) {
      const receptionResult = await addStatEvent(gameId, 'reception', catcherId)
      if (receptionResult) setStats(prev => [...prev, receptionResult.stat])
    }
  }, [])

  const undoLastStat = useCallback(async (gameId: string) => {
    const result = await undoLastStatEvent(gameId)
    if (!result) return
    setStats(prev => prev.filter(s => s.id !== result.removedStatId))
    setGames(prev => prev.map(g => g.id === gameId ? result.game : g))
  }, [])

  const getGameStats = useCallback((gameId: string): StatEvent[] => {
    return stats.filter(s => s.gameId === gameId)
  }, [stats])

  return (
    <GameContext.Provider value={{
      players, games, stats, gameRosters, loading,
      activeGameId, setActiveGameId,
      addPlayer, removePlayer, reorderPlayers,
      addGame, updateGame, deleteGame,
      getGameRoster, setGameRoster, addPlayerToGameRoster,
      addStat, undoLastStat, getGameStats,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within a GameProvider')
  return context
}
