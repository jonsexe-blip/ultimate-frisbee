'use client'

import { useState, useMemo } from 'react'
import { 
  Undo2, 
  Check, 
  X, 
  Shield, 
  Target, 
  UserPlus,
  Users,
  ChevronDown,
  Disc
} from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

type ActionMode = null | 'completion' | 'turnover' | 'turnover_caused' | 'score' | 'pull'
type ScoreStep = 'type' | 'scorer' | 'assister'

export function GameTrackerView() {
  const { 
    games, 
    players, 
    activeGameId, 
    setActiveGameId,
    getGameRoster, 
    setGameRoster,
    addPlayerToGameRoster,
    addPlayer,
    addStat, 
    undoLastStat,
    getGameStats
  } = useGame()

  const [actionMode, setActionMode] = useState<ActionMode>(null)
  const [scoreStep, setScoreStep] = useState<ScoreStep>('type')
  const [selectedScorer, setSelectedScorer] = useState<string | null>(null)
  const [showRosterDialog, setShowRosterDialog] = useState(false)
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerNumber, setNewPlayerNumber] = useState('')
  const [pointStartIndex, setPointStartIndex] = useState(0)
  const [pendingScore, setPendingScore] = useState(false)

  const activeGame = games.find(g => g.id === activeGameId)
  const gameRosterIds = activeGameId ? getGameRoster(activeGameId) : []
  const gameRoster = players.filter(p => gameRosterIds.includes(p.id))
  const availablePlayers = players.filter(p => !gameRosterIds.includes(p.id))
  
  const gameStats = activeGameId ? getGameStats(activeGameId) : []
  const currentPointStats = useMemo(() => {
    return gameStats.slice(pointStartIndex)
  }, [gameStats, pointStartIndex])
  
  // Find the last player who completed a pass in the current point
  const lastCompleter = useMemo(() => {
    const completions = currentPointStats.filter(s => s.type === 'completion')
    return completions.length > 0 ? completions[completions.length - 1].playerId : null
  }, [currentPointStats])

  // If no active game, show game selector
  if (!activeGame) {
    const upcomingGames = games.filter(g => !g.isComplete)
    
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Select Game</h2>
        <p className="text-muted-foreground">Choose a game to track</p>
        
        {upcomingGames.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No games available. Add a game from the Schedule tab.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingGames.map((game) => (
              <Card 
                key={game.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setActiveGameId(game.id)}
              >
                <CardContent className="py-4">
                  <p className="font-semibold text-foreground">vs {game.opponent}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(game.date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleAction = (action: ActionMode) => {
    if (actionMode === action) {
      // Toggle off
      setActionMode(null)
      setScoreStep('type')
      setSelectedScorer(null)
    } else {
      setActionMode(action)
      if (action === 'score') {
        setScoreStep('type')
      }
    }
  }

  const handlePlayerSelect = (playerId: string) => {
    if (!activeGameId) return

    if (actionMode === 'completion') {
      addStat(activeGameId, 'completion', playerId)
      setActionMode(null)
    } else if (actionMode === 'turnover') {
      addStat(activeGameId, 'turnover', playerId)
      setActionMode(null)
    } else if (actionMode === 'turnover_caused') {
      addStat(activeGameId, 'turnover_caused', playerId)
      setActionMode(null)
    } else if (actionMode === 'pull') {
      addStat(activeGameId, 'pull', playerId)
      setActionMode(null)
    } else if (actionMode === 'score' && scoreStep === 'scorer') {
      // If we have a last completer, auto-assign assist and finish
      if (lastCompleter) {
        addStat(activeGameId, 'goal', playerId)
        addStat(activeGameId, 'assist', lastCompleter)
        setActionMode(null)
        setScoreStep('type')
        setSelectedScorer(null)
        setPendingScore(true)
      } else {
        // No completions tracked, need to manually select assister
        setSelectedScorer(playerId)
        setScoreStep('assister')
      }
    } else if (actionMode === 'score' && scoreStep === 'assister') {
      // Record goal and assist (manual flow when no completions tracked)
      addStat(activeGameId, 'goal', selectedScorer!)
      addStat(activeGameId, 'assist', playerId)
      setActionMode(null)
      setScoreStep('type')
      setSelectedScorer(null)
      setPendingScore(true)
    }
  }

  const handleScoreType = (type: 'our' | 'opponent' | 'callahan') => {
    if (!activeGameId) return

    if (type === 'opponent') {
      addStat(activeGameId, 'opponent_score')
      setActionMode(null)
      setScoreStep('type')
      setPendingScore(true)
    } else if (type === 'callahan') {
      setScoreStep('scorer')
    } else {
      setScoreStep('scorer')
    }
  }

  const handleCallahanScorer = (playerId: string) => {
    if (!activeGameId) return
    addStat(activeGameId, 'callahan', playerId)
    setActionMode(null)
    setScoreStep('type')
    setSelectedScorer(null)
    setPendingScore(true)
  }

  const handleConfirmPoint = () => {
    setPendingScore(false)
    setPointStartIndex(gameStats.length)
  }

  const handleUndo = () => {
    if (activeGameId) {
      undoLastStat(activeGameId)
    }
  }

  const handleAddPlayerToRoster = (playerId: string) => {
    if (activeGameId) {
      addPlayerToGameRoster(activeGameId, playerId)
    }
  }

  const handleToggleRosterPlayer = (playerId: string) => {
    if (!activeGameId) return
    const currentRoster = getGameRoster(activeGameId)
    if (currentRoster.includes(playerId)) {
      setGameRoster(activeGameId, currentRoster.filter(id => id !== playerId))
    } else {
      setGameRoster(activeGameId, [...currentRoster, playerId])
    }
  }

  const handleAddNewPlayer = () => {
    if (newPlayerName && newPlayerNumber) {
      addPlayer(newPlayerName, parseInt(newPlayerNumber))
      setNewPlayerName('')
      setNewPlayerNumber('')
      setShowAddPlayerDialog(false)
    }
  }

  const getStatLabel = (type: string) => {
    switch (type) {
      case 'completion': return 'Complete'
      case 'turnover': return 'Turn'
      case 'turnover_caused': return 'D-Block'
      case 'goal': return 'Goal'
      case 'assist': return 'Assist'
      case 'callahan': return 'Callahan!'
      case 'opponent_score': return 'Opp Score'
      case 'pull': return 'Pull'
      default: return type
    }
  }

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return ''
    const player = players.find(p => p.id === playerId)
    if (!player) return ''
    const firstName = player.name.split(' ')[0]
    const lastInitial = player.name.split(' ')[1]?.[0] || ''
    return lastInitial ? `${firstName} ${lastInitial}.` : firstName
  }

  return (
    <div className="flex flex-col h-full">
      {/* Score Header */}
      <div className="bg-card border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveGameId(null)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <ChevronDown className="size-3 rotate-90" />
            Change
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">vs {activeGame.opponent}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{activeGame.ourScore}</span>
              <span className="text-sm text-muted-foreground">-</span>
              <span className="text-lg font-bold text-foreground">{activeGame.opponentScore}</span>
            </div>
          </div>
          <button
            onClick={() => setShowRosterDialog(true)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
          >
            <Users className="size-3" />
            ({gameRoster.length})
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-2 border-b border-border bg-card/50">
        {/* Pull Button - only at start of point */}
        {currentPointStats.length === 0 && !pendingScore && (
          <div className="mb-2">
            <Button
              variant={actionMode === 'pull' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'w-full flex items-center justify-center gap-2 py-1.5',
                actionMode === 'pull' && 'bg-orange-600 hover:bg-orange-700 border-orange-600'
              )}
              onClick={() => handleAction('pull')}
            >
              <Disc className="size-4" />
              <span className="text-xs">Pull</span>
            </Button>
          </div>
        )}
        <div className="grid grid-cols-4 gap-1.5">
          <Button
            variant={actionMode === 'completion' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex flex-col h-auto py-1.5 gap-0.5',
              actionMode === 'completion' && 'bg-green-600 hover:bg-green-700 border-green-600'
            )}
            onClick={() => handleAction('completion')}
          >
            <Check className="size-4" />
            <span className="text-[10px]">Complete</span>
          </Button>
          
          <Button
            variant={actionMode === 'turnover' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex flex-col h-auto py-1.5 gap-0.5',
              actionMode === 'turnover' && 'bg-red-600 hover:bg-red-700 border-red-600'
            )}
            onClick={() => handleAction('turnover')}
          >
            <X className="size-4" />
            <span className="text-[10px]">Turnover</span>
          </Button>
          
          <Button
            variant={actionMode === 'turnover_caused' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex flex-col h-auto py-1.5 gap-0.5',
              actionMode === 'turnover_caused' && 'bg-blue-600 hover:bg-blue-700 border-blue-600'
            )}
            onClick={() => handleAction('turnover_caused')}
          >
            <Shield className="size-4" />
            <span className="text-[10px]">D-Block</span>
          </Button>
          
          <Button
            variant={actionMode === 'score' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex flex-col h-auto py-1.5 gap-0.5',
              actionMode === 'score' && 'bg-primary hover:bg-primary/90'
            )}
            onClick={() => handleAction('score')}
          >
            <Target className="size-4" />
            <span className="text-[10px]">Score</span>
          </Button>
        </div>

        {/* Score Type Selection */}
        {actionMode === 'score' && scoreStep === 'type' && (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <Button 
              variant="outline"
              size="sm"
              className="bg-primary/20 border-primary text-primary hover:bg-primary/30 text-xs"
              onClick={() => handleScoreType('our')}
            >
              Our Goal
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleScoreType('opponent')}
            >
              Their Goal
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/30 text-xs"
              onClick={() => handleScoreType('callahan')}
            >
              Callahan
            </Button>
          </div>
        )}

        {/* Instruction Text */}
        {actionMode && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            {actionMode === 'completion' && 'Tap player who completed'}
            {actionMode === 'turnover' && 'Tap player who turned it over'}
            {actionMode === 'turnover_caused' && 'Tap player who got the D'}
            {actionMode === 'pull' && 'Tap player who pulled'}
            {actionMode === 'score' && scoreStep === 'scorer' && (lastCompleter ? `Tap scorer (assist: ${getPlayerName(lastCompleter)})` : 'Tap the scorer')}
            {actionMode === 'score' && scoreStep === 'assister' && 'Tap the assister'}
          </p>
        )}
      </div>

      {/* Player Grid */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {gameRoster.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No players in game roster</p>
            <Button onClick={() => setShowRosterDialog(true)}>
              <Users className="size-4 mr-2" />
              Set Up Roster
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {gameRoster.map((player) => (
              <button
                key={player.id}
                onClick={() => {
                  if (actionMode === 'score' && scoreStep === 'type') return
                  if (actionMode === 'score' && scoreStep === 'scorer' && scoreStep === 'scorer') {
                    // Check if this is a callahan flow
                    handlePlayerSelect(player.id)
                  } else {
                    handlePlayerSelect(player.id)
                  }
                }}
                disabled={!actionMode || (actionMode === 'score' && scoreStep === 'type')}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all',
                  'bg-card border-border',
                  actionMode && !(actionMode === 'score' && scoreStep === 'type')
                    ? 'hover:bg-primary/20 hover:border-primary active:scale-95 cursor-pointer'
                    : 'opacity-60',
                  selectedScorer === player.id && 'ring-2 ring-primary bg-primary/20'
                )}
              >
                <span className="text-sm font-bold text-primary">#{player.number}</span>
                <span className="text-sm font-medium text-foreground truncate max-w-full">
                  {player.name.split(' ')[0]} {player.name.split(' ')[1]?.[0] || ''}.
                </span>
              </button>
            ))}
            
            {/* Quick Add Player Button */}
            <button
              onClick={() => setShowAddPlayerDialog(true)}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-lg border border-dashed border-muted-foreground/50 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <UserPlus className="size-5" />
              <span className="text-xs">Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Current Point Activity & Undo */}
      <div className="border-t border-border bg-card px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo}
            disabled={currentPointStats.length === 0}
            className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
          >
            <Undo2 className="size-3 mr-1" />
            Undo
          </Button>
          <div className="flex gap-1 overflow-x-auto flex-1">
            {currentPointStats.length === 0 ? (
              <span className="text-xs text-muted-foreground">New point</span>
            ) : (
              currentPointStats.map((stat) => (
                <span 
                  key={stat.id}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap',
                    stat.type === 'completion' && 'bg-green-500/20 text-green-600',
                    stat.type === 'turnover' && 'bg-red-500/20 text-red-600',
                    stat.type === 'turnover_caused' && 'bg-blue-500/20 text-blue-600',
                    stat.type === 'goal' && 'bg-primary/20 text-primary',
                    stat.type === 'assist' && 'bg-primary/20 text-primary',
                    stat.type === 'callahan' && 'bg-yellow-500/20 text-yellow-600',
                    stat.type === 'opponent_score' && 'bg-muted text-muted-foreground',
                    stat.type === 'pull' && 'bg-orange-500/20 text-orange-600'
                  )}
                >
                  {getStatLabel(stat.type)} {getPlayerName(stat.playerId)}
                </span>
              ))
            )}
          </div>
          {pendingScore && (
            <Button 
              size="sm" 
              onClick={handleConfirmPoint}
              className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
            >
              <Check className="size-3 mr-1" />
              Confirm
            </Button>
          )}
        </div>
      </div>

      {/* Roster Management Dialog */}
      <Dialog open={showRosterDialog} onOpenChange={setShowRosterDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Game Roster</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Select players available for this game
              </p>
              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleToggleRosterPlayer(player.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      gameRosterIds.includes(player.id)
                        ? 'bg-primary/20 border-primary'
                        : 'bg-card border-border hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'size-6 rounded-full border-2 flex items-center justify-center',
                      gameRosterIds.includes(player.id)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}>
                      {gameRosterIds.includes(player.id) && (
                        <Check className="size-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className="font-bold text-primary">#{player.number}</span>
                    <span className="text-foreground">{player.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setShowRosterDialog(false)
                setShowAddPlayerDialog(true)
              }}
            >
              <UserPlus className="size-4 mr-2" />
              Add New Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Number</FieldLabel>
              <Input
                type="number"
                placeholder="Jersey number"
                value={newPlayerNumber}
                onChange={(e) => setNewPlayerNumber(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewPlayer}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
