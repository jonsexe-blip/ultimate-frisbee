'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Target, Shield, TrendingUp, X } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { calculatePlayerStats, calculateTeamStats } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function GameStatsView() {
  const { games, players, stats } = useGame()
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isSelectOpen, setIsSelectOpen] = useState(false)

  const completedGames = games.filter(g => g.isComplete || stats.some(s => s.gameId === g.id))
  const selectedGame = completedGames.find(g => g.id === selectedGameId) || completedGames[0]

  const teamStats = useMemo(() => {
    if (!selectedGame) return null
    return calculateTeamStats(stats, selectedGame.id)
  }, [selectedGame, stats])

  const playerStatsForGame = useMemo(() => {
    if (!selectedGame) return []
    return players.map(player => ({
      player,
      stats: calculatePlayerStats(player.id, stats, selectedGame.id),
    })).filter(p =>
      p.stats.completions > 0 ||
      p.stats.receptions > 0 ||
      p.stats.turnovers > 0 ||
      p.stats.turnoversCaused > 0 ||
      p.stats.goals > 0 ||
      p.stats.assists > 0 ||
      p.stats.callahans > 0
    ).sort((a, b) => {
      const aTotal = a.stats.goals + a.stats.assists + a.stats.callahans
      const bTotal = b.stats.goals + b.stats.assists + b.stats.callahans
      return bTotal - aTotal
    })
  }, [selectedGame, players, stats])

  if (completedGames.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Game Stats</h2>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            No game data available yet. Start tracking a game to see stats here.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Game Stats</h2>
        
        {/* Game Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm hover:bg-muted transition-colors"
          >
            <span className="text-foreground">
              {selectedGame ? `vs ${selectedGame.opponent}` : 'Select Game'}
            </span>
            <ChevronDown className={cn('size-4 transition-transform', isSelectOpen && 'rotate-180')} />
          </button>
          
          {isSelectOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
              {completedGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => {
                    setSelectedGameId(game.id)
                    setIsSelectOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg',
                    selectedGame?.id === game.id && 'bg-primary/10 text-primary'
                  )}
                >
                  vs {game.opponent}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedGame && teamStats && (
        <>
          {/* Score Summary */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {selectedGame.ourScore || teamStats.goals + teamStats.callahans}
                  </p>
                  <p className="text-xs text-muted-foreground">US</p>
                </div>
                <div className="text-xl text-muted-foreground">vs</div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {selectedGame.opponentScore || teamStats.opponentScores}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedGame.opponent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {teamStats.goals + teamStats.callahans}
                    </p>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="size-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamStats.completions}</p>
                    <p className="text-xs text-muted-foreground">Thrown</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="size-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamStats.receptions}</p>
                    <p className="text-xs text-muted-foreground">Caught</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="size-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamStats.turnovers}</p>
                    <p className="text-xs text-muted-foreground">Turnovers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Shield className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamStats.turnoversCaused}</p>
                    <p className="text-xs text-muted-foreground">D-Blocks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Stats */}
          <Tabs defaultValue="scoring" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="scoring" className="flex-1">Scoring</TabsTrigger>
              <TabsTrigger value="passing" className="flex-1">Passing</TabsTrigger>
              <TabsTrigger value="defense" className="flex-1">Defense</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scoring" className="mt-4 space-y-2">
              {playerStatsForGame.filter(p => p.stats.goals > 0 || p.stats.assists > 0 || p.stats.callahans > 0).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No scoring stats recorded</p>
              ) : (
                playerStatsForGame
                  .filter(p => p.stats.goals > 0 || p.stats.assists > 0 || p.stats.callahans > 0)
                  .map(({ player, stats }) => (
                    <Card key={player.id}>
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary">#{player.number}</span>
                          <span className="text-foreground">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {stats.goals > 0 && (
                            <span className="text-foreground">
                              <span className="font-bold">{stats.goals}</span>
                              <span className="text-muted-foreground ml-1">G</span>
                            </span>
                          )}
                          {stats.assists > 0 && (
                            <span className="text-foreground">
                              <span className="font-bold">{stats.assists}</span>
                              <span className="text-muted-foreground ml-1">A</span>
                            </span>
                          )}
                          {stats.callahans > 0 && (
                            <span className="text-yellow-500">
                              <span className="font-bold">{stats.callahans}</span>
                              <span className="ml-1">C</span>
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
            
            <TabsContent value="passing" className="mt-4 space-y-2">
              {playerStatsForGame.filter(p => p.stats.completions > 0 || p.stats.turnovers > 0 || p.stats.receptions > 0).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No passing stats recorded</p>
              ) : (
                playerStatsForGame
                  .filter(p => p.stats.completions > 0 || p.stats.turnovers > 0 || p.stats.receptions > 0)
                  .sort((a, b) => b.stats.completions - a.stats.completions)
                  .map(({ player, stats }) => {
                    const total = stats.completions + stats.turnovers
                    const percentage = total > 0 ? Math.round((stats.completions / total) * 100) : 0

                    return (
                      <Card key={player.id}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-primary">#{player.number}</span>
                              <span className="text-foreground">{player.name}</span>
                            </div>
                            {total > 0 && (
                              <span className={cn(
                                'text-sm font-bold',
                                percentage >= 80 ? 'text-green-500' :
                                percentage >= 60 ? 'text-yellow-500' :
                                'text-red-500'
                              )}>
                                {percentage}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {stats.completions > 0 && (
                              <span>
                                <span className="text-green-500 font-medium">{stats.completions}</span> thrown
                              </span>
                            )}
                            {stats.receptions > 0 && (
                              <span>
                                <span className="text-green-400 font-medium">{stats.receptions}</span> caught
                              </span>
                            )}
                            {stats.turnovers > 0 && (
                              <span>
                                <span className="text-red-500 font-medium">{stats.turnovers}</span> turn
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </TabsContent>
            
            <TabsContent value="defense" className="mt-4 space-y-2">
              {playerStatsForGame.filter(p => p.stats.turnoversCaused > 0).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No defensive stats recorded</p>
              ) : (
                playerStatsForGame
                  .filter(p => p.stats.turnoversCaused > 0)
                  .sort((a, b) => b.stats.turnoversCaused - a.stats.turnoversCaused)
                  .map(({ player, stats }) => (
                    <Card key={player.id}>
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary">#{player.number}</span>
                          <span className="text-foreground">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-blue-500" />
                          <span className="font-bold text-foreground">{stats.turnoversCaused}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
