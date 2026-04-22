'use client'

import { useMemo } from 'react'
import { Trophy, Target, TrendingUp, Shield, Award, Medal, HandMetal } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { calculatePlayerStats, calculateTeamStats } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function SeasonStatsView() {
  const { games, players, stats } = useGame()

  const completedGames = games.filter(g => g.isComplete)
  const completedGameIds = useMemo(() => new Set(completedGames.map(g => g.id)), [completedGames])
  const completedStats = useMemo(() => stats.filter(s => completedGameIds.has(s.gameId)), [stats, completedGameIds])

  const wins = completedGames.filter(g => g.ourScore > g.opponentScore).length
  const losses = completedGames.filter(g => g.ourScore < g.opponentScore).length

  const seasonTeamStats = useMemo(() => {
    return calculateTeamStats(completedStats)
  }, [completedStats])

  const seasonPlayerStats = useMemo(() => {
    return players.map(player => ({
      player,
      stats: calculatePlayerStats(player.id, completedStats),
    })).filter(p =>
      p.stats.completions > 0 ||
      p.stats.receptions > 0 ||
      p.stats.turnovers > 0 ||
      p.stats.turnoversCaused > 0 ||
      p.stats.goals > 0 ||
      p.stats.assists > 0 ||
      p.stats.callahans > 0
    )
  }, [players, completedStats])

  // Calculate leaderboards
  const goalLeaders = useMemo(() => [...seasonPlayerStats]
    .sort((a, b) => (b.stats.goals + b.stats.callahans) - (a.stats.goals + a.stats.callahans))
    .slice(0, 5), [seasonPlayerStats])

  const assistLeaders = useMemo(() => [...seasonPlayerStats]
    .sort((a, b) => b.stats.assists - a.stats.assists)
    .slice(0, 5), [seasonPlayerStats])

  const defenseLeaders = useMemo(() => [...seasonPlayerStats]
    .sort((a, b) => b.stats.turnoversCaused - a.stats.turnoversCaused)
    .slice(0, 5), [seasonPlayerStats])

  const completionCountLeaders = useMemo(() => [...seasonPlayerStats]
    .sort((a, b) => b.stats.completions - a.stats.completions)
    .filter(p => p.stats.completions > 0)
    .slice(0, 5), [seasonPlayerStats])

  const receptionLeaders = useMemo(() => [...seasonPlayerStats]
    .sort((a, b) => b.stats.receptions - a.stats.receptions)
    .filter(p => p.stats.receptions > 0)
    .slice(0, 5), [seasonPlayerStats])

  const completionLeaders = useMemo(() => [...seasonPlayerStats]
    .filter(p => p.stats.completions + p.stats.turnovers >= 5)
    .map(p => ({
      ...p,
      percentage: Math.round((p.stats.completions / (p.stats.completions + p.stats.turnovers)) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5), [seasonPlayerStats])

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
              <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <HandMetal className="size-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{seasonTeamStats.receptions}</p>
                <p className="text-xs text-muted-foreground">Receptions</p>
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

          {/* Completion Leaders */}
          {completionCountLeaders.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-4 text-green-500" />
                <h4 className="font-semibold text-foreground">Completion Leaders</h4>
              </div>
              <div className="space-y-2">
                {completionCountLeaders.map(({ player, stats }, index) => (
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
                    <span className="font-bold text-foreground">{stats.completions}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reception Leaders */}
          {receptionLeaders.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <HandMetal className="size-4 text-purple-500" />
                <h4 className="font-semibold text-foreground">Reception Leaders</h4>
              </div>
              <div className="space-y-2">
                {receptionLeaders.map(({ player, stats }, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      index === 0 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-card border border-border'
                    )}
                  >
                    <span className={cn(
                      'size-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-primary">#{player.number}</span>
                    <span className="flex-1 text-foreground">{player.name}</span>
                    <span className="font-bold text-foreground">{stats.receptions}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                        <span className="text-base font-bold text-primary">#{player.number}</span>
                        <span className="text-base font-semibold text-foreground">{player.name}</span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Goals', value: stats.goals + stats.callahans },
                          { label: 'Assists', value: stats.assists },
                          { label: 'D-Blocks', value: stats.turnoversCaused },
                          { label: 'Completions', value: stats.completions },
                          { label: 'Receptions', value: stats.receptions },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold text-foreground">{value}</span>
                          </div>
                        ))}
                        {totalThrows > 0 && (
                          <div className="flex items-center justify-between text-sm pt-1 border-t border-border mt-1">
                            <span className="text-muted-foreground">Completion Rate</span>
                            <span className={cn(
                              'font-semibold',
                              completionPct >= 80 ? 'text-green-500' :
                              completionPct >= 60 ? 'text-yellow-500' :
                              'text-red-500'
                            )}>
                              {completionPct}% ({stats.completions}/{totalThrows})
                            </span>
                          </div>
                        )}
                      </div>
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
