'use client'

import { useState } from 'react'
import { Plus, MapPin, Clock, Check, X, Play, Trash2 } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

interface ScheduleViewProps {
  onStartGame: () => void
}

export function ScheduleView({ onStartGame }: ScheduleViewProps) {
  const { games, addGame, deleteGame, setActiveGameId } = useGame()
  const { isAuthorized } = useAuth()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [newGame, setNewGame] = useState({
    opponent: '',
    date: '',
    time: '',
    location: '',
    isHome: true,
  })

  const upcomingGames = games
    .filter(g => !g.isComplete)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastGames = games
    .filter(g => g.isComplete)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleAddGame = () => {
    if (newGame.opponent && newGame.date) {
      addGame(newGame)
      setNewGame({ opponent: '', date: '', time: '', location: '', isHome: true })
      setIsAddDialogOpen(false)
    }
  }

  const handleStartGame = (gameId: string) => {
    setActiveGameId(gameId)
    onStartGame()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Schedule</h2>
        {isAuthorized && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="size-4" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Game</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Opponent</FieldLabel>
                <Input
                  placeholder="Team name"
                  value={newGame.opponent}
                  onChange={(e) => setNewGame({ ...newGame, opponent: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={newGame.date}
                  onChange={(e) => setNewGame({ ...newGame, date: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Time</FieldLabel>
                <Input
                  type="time"
                  value={newGame.time}
                  onChange={(e) => setNewGame({ ...newGame, time: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Location</FieldLabel>
                <Input
                  placeholder="Field or venue"
                  value={newGame.location}
                  onChange={(e) => setNewGame({ ...newGame, location: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Game Type</FieldLabel>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gameType"
                      checked={newGame.isHome}
                      onChange={() => setNewGame({ ...newGame, isHome: true })}
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm">Home</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gameType"
                      checked={!newGame.isHome}
                      onChange={() => setNewGame({ ...newGame, isHome: false })}
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm">Away</span>
                  </label>
                </div>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGame}>Add Game</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Upcoming Games */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Upcoming
        </h3>
        <div className="space-y-3">
          {upcomingGames.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming games scheduled
              </CardContent>
            </Card>
          ) : (
            upcomingGames.map((game) => (
              <Card key={game.id} className="transition-colors">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      vs {game.opponent}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span>{formatDate(game.date)}</span>
                      {game.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTime(game.time)}
                        </span>
                      )}
                      {game.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {game.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAuthorized && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleStartGame(game.id)}
                      >
                        <Play className="size-3" />
                        Score
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive px-2"
                        onClick={() => setDeleteConfirmId(game.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Past Games */}
      {pastGames.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Recent Results
          </h3>
          <div className="space-y-3">
            {pastGames.map((game) => {
              const isWin = game.ourScore > game.opponentScore
              const isDraw = game.ourScore === game.opponentScore
              
              return (
                <Card key={game.id} className="opacity-80">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center ${
                      isWin ? 'bg-green-500/20 text-green-500' : 
                      isDraw ? 'bg-yellow-500/20 text-yellow-500' : 
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {isWin ? <Check className="size-5" /> : 
                       isDraw ? <span className="text-sm font-bold">T</span> : 
                       <X className="size-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          vs {game.opponent}
                        </p>
                        <span className={`text-sm font-bold ${
                          isWin ? 'text-green-500' :
                          isDraw ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {game.ourScore} - {game.opponentScore}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(game.date)}
                      </p>
                    </div>
                    {isAuthorized && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive px-2 shrink-0"
                        onClick={() => setDeleteConfirmId(game.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={open => { if (!open) setDeleteConfirmId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the game and all its stats. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) deleteGame(deleteConfirmId)
                setDeleteConfirmId(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
