'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
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
  const { players, addPlayer, removePlayer } = useGame()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null)
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })

  const sortedPlayers = [...players].sort((a, b) => a.number - b.number)

  const handleAddPlayer = () => {
    if (newPlayer.name && newPlayer.number) {
      addPlayer(newPlayer.name, parseInt(newPlayer.number))
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

      {/* Player List */}
      <div className="space-y-2">
        {sortedPlayers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No players added yet. Add your first player to get started.
            </CardContent>
          </Card>
        ) : (
          sortedPlayers.map((player) => (
            <Card key={player.id} className="group">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{player.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{player.name}</p>
                  <p className="text-sm text-muted-foreground">#{player.number}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
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
            <DialogDescription>
              Add a player to your team roster
            </DialogDescription>
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayer}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
