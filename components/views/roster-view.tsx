'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
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

export function RosterView() {
  const { players, addPlayer, removePlayer, reorderPlayers } = useGame()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null)
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })

  // Players are already sorted by sort_order from the context/DB
  const sortedPlayers = [...players]

  const handleAddPlayer = async () => {
    if (newPlayer.name && newPlayer.number) {
      await addPlayer(newPlayer.name, parseInt(newPlayer.number))
      setNewPlayer({ name: '', number: '' })
      setIsAddDialogOpen(false)
    }
  }

  const handleDeletePlayer = () => {
    if (playerToDelete) {
      removePlayer(playerToDelete)
      setPlayerToDelete(null)
    }
  }

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sortedPlayers]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]]
    reorderPlayers(newOrder.map(p => p.id))
  }

  const playerToDeleteData = players.find(p => p.id === playerToDelete)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Team Roster</h2>
          <p className="text-sm text-muted-foreground">{players.length} players</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-1">
          <Plus className="size-4" />
          Add Player
        </Button>
      </div>

      {sortedPlayers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Use the arrows to order players by playing time — top of list appears first in the game tracker.
        </p>
      )}

      {/* Player List */}
      <div className="space-y-2">
        {sortedPlayers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No players added yet. Add your first player to get started.
            </CardContent>
          </Card>
        ) : (
          sortedPlayers.map((player, index) => (
            <Card key={player.id} className="group">
              <CardContent className="py-3 flex items-center gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => movePlayer(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => movePlayer(index, 'down')}
                    disabled={index === sortedPlayers.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>

                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{player.number}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{player.name}</p>
                  <p className="text-sm text-muted-foreground">#{player.number}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setPlayerToDelete(player.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Player Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>Add a player to your team roster</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="Player name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Jersey Number</FieldLabel>
              <Input
                type="number"
                placeholder="Number"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlayer}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!playerToDelete} onOpenChange={() => setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {playerToDeleteData?.name} (#{playerToDeleteData?.number}) from the roster?
              This will not delete their historical stats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
