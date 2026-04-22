'use client'

import { useMemo } from 'react'
import { Trophy, Target, TrendingUp, Shield, Award, Medal } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { calculatePlayerStats, calculateTeamStats } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function SeasonStatsView() {
  const { games, players, stats } = useGame()

  const seasonTeamStats = useMemo(() => {
    return calculateTeamStats(stats)
  }, [stats])

  const completedGames = games.filter(g => g.isComplete || stats.some(s => s.gameId === g.id))
  const wins = completedGames.filter(g => g.ourScore > g.opponentScore).length
  const losses = completedGames.filter(g => g.ourScore < g.opponentScore).length

  const seasonPlayerStats = useMemo(() => {
    return players.map(player => ({
      player,
      stats: calculatePlayerStats(player.id, stats),
    })).filter(p => 
      p.stats.completions > 0 || 
      p.stats.turnovers > 0 || 
      p.stats.turnoversCaused > 0 ||
      p.stats.goals > 0 ||
      p.stats.assists > 0 ||
      p.stats.callahans > 0
    )
  }, [players, stats])

  // Calculate leaderboards
  const goalLeaders = [...seasonPlayerStats]
    .sort((a, b) => (b.stats.goals + b.stats.callahans) - (a.stats.goals + a.stats.callahans))
    .slice(0, 5)

  const assistLeaders = [...seasonPlayerStats]
    .sort((a, b) => b.stats.assists - a.stats.assists)
    .slice(0, 5)

  const defenseLeaders = [...seasonPlayerStats]
    .sort((a, b) => b.stats.turnoversCaused - a.stats.turnoversCaused)
    .slice(0, 5)

  const completionLeaders = [...seasonPlayerStats]
    .filter(p => p.stats.completions + p.stats.turnovers >= 5) // Min 5 throws
    .map(p => ({
      ...p,
      percentage: Math.round((p.stats.completions / (p.stats.completions + p.stats.turnovers)) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)

  if (completedGames.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Season Stats</h2>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            No games played yet. Stats will appear here after your first game.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-foreground">Season Stats</h2>

      {/* Season Record */}
      <Card className="bg-gradient-to-br from-card to-muted/50">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Season Record</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-500">{wins}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="text-3xl text-muted-foreground">-</div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-500">{losses}</p>
                <p className="text-xs text-muted-foreground">Losses</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {completedGames.length} games played
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team Totals */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Team Totals
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {seasonTeamStats.goals + seasonTeamStats.callahans}
                </p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{seasonTeamStats.completions}</p>
                <p className="text-xs text-muted-foreground">Completions</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{seasonTeamStats.turnoversCaused}</p>
                <p className="text-xs text-muted-foreground">D-Blocks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Award className="size-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{seasonTeamStats.callahans}</p>
                <p className="text-xs text-muted-foreground">Callahans</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leaderboards */}
      <Tabs defaultValue="leaders" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="leaders" className="flex-1">Leaders</TabsTrigger>
          <TabsTrigger value="players" className="flex-1">All Players</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaders" className="mt-4 space-y-6">
          {/* Goal Leaders */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-primary" />
              <h4 className="font-semibold text-foreground">Goal Leaders</h4>
            </div>
            <div className="space-y-2">
              {goalLeaders.map(({ player, stats }, index) => (
                <div 
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    index === 0 ? 'bg-primary/10 border border-primary/30' : 'bg-card border border-border'
                  )}
                >
                  <span className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </span>
                  <span className="font-bold text-primary">#{player.number}</span>
                  <span className="flex-1 text-foreground">{player.name}</span>
                  <span className="font-bold text-foreground">{stats.goals + stats.callahans}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Assist Leaders */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Medal className="size-4 text-green-500" />
              <h4 className="font-semibold text-foreground">Assist Leaders</h4>
            </div>
            <div className="space-y-2">
              {assistLeaders.filter(p => p.stats.assists > 0).map(({ player, stats }, index) => (
                <div 
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    index === 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-card border border-border'
                  )}
                >
                  <span className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </span>
                  <span className="font-bold text-primary">#{player.number}</span>
                  <span className="flex-1 text-foreground">{player.name}</span>
                  <span className="font-bold text-foreground">{stats.assists}</span>
                </div>
              ))}
            </div>
          </section>

          {/* D-Block Leaders */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-4 text-blue-500" />
              <h4 className="font-semibold text-foreground">D-Block Leaders</h4>
            </div>
            <div className="space-y-2">
              {defenseLeaders.filter(p => p.stats.turnoversCaused > 0).map(({ player, stats }, index) => (
                <div 
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    index === 0 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-card border border-border'
                  )}
                >
                  <span className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </span>
                  <span className="font-bold text-primary">#{player.number}</span>
                  <span className="flex-1 text-foreground">{player.name}</span>
                  <span className="font-bold text-foreground">{stats.turnoversCaused}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Completion % Leaders */}
          {completionLeaders.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-4 text-yellow-500" />
                <h4 className="font-semibold text-foreground">Completion % Leaders</h4>
                <span className="text-xs text-muted-foreground">(min. 5 throws)</span>
              </div>
              <div className="space-y-2">
                {completionLeaders.map(({ player, stats, percentage }, index) => (
                  <div 
                    key={player.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-card border border-border'
                    )}
                  >
                    <span className={cn(
                      'size-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-yellow-500 text-black' : 'bg-muted text-muted-foreground'
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-primary">#{player.number}</span>
                    <span className="flex-1 text-foreground">{player.name}</span>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{percentage}%</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({stats.completions}/{stats.completions + stats.turnovers})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </TabsContent>
        
        <TabsContent value="players" className="mt-4 space-y-2">
          {seasonPlayerStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No player stats recorded yet</p>
          ) : (
            seasonPlayerStats
              .sort((a, b) => {
                const aTotal = a.stats.goals + a.stats.assists + a.stats.callahans
                const bTotal = b.stats.goals + b.stats.assists + b.stats.callahans
                return bTotal - aTotal
              })
              .map(({ player, stats }) => {
                const totalThrows = stats.completions + stats.turnovers
                const completionPct = totalThrows > 0 
                  ? Math.round((stats.completions / totalThrows) * 100) 
                  : 0
                  
                return (
                  <Card key={player.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl font-bold text-primary">#{player.number}</span>
                        <span className="text-lg font-semibold text-foreground">{player.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-foreground">
                            {stats.goals + stats.callahans}
                          </p>
                          <p className="text-xs text-muted-foreground">Goals</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{stats.assists}</p>
                          <p className="text-xs text-muted-foreground">Assists</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{stats.turnoversCaused}</p>
                          <p className="text-xs text-muted-foreground">D-Blocks</p>
                        </div>
                      </div>
                      {totalThrows > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completion Rate</span>
                            <span className={cn(
                              'font-bold',
                              completionPct >= 80 ? 'text-green-500' : 
                              completionPct >= 60 ? 'text-yellow-500' : 
                              'text-red-500'
                            )}>
                              {completionPct}% ({stats.completions}/{totalThrows})
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
