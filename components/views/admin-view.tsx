'use client'

import { useState, useEffect } from 'react'
import { Trash2, UserPlus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  getAuthorizedUsers,
  authorizeUserByEmail,
  revokeUser,
  type AuthorizedUser,
} from '@/lib/actions'
import { useAuth } from '@/lib/auth-context'

export function AdminView() {
  const { user } = useAuth()
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    getAuthorizedUsers().then(setAuthorizedUsers)
  }, [])

  async function handleAuthorize(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const result = await authorizeUserByEmail(email.trim().toLowerCase())
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`${email} has been granted access.`)
      setEmail('')
      getAuthorizedUsers().then(setAuthorizedUsers)
    }
  }

  async function handleRevoke(u: AuthorizedUser) {
    setRevoking(u.id)
    try {
      await revokeUser(u.id)
      setAuthorizedUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access.')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h2 className="text-xl font-bold">Access Control</h2>
      </div>

      {/* Add user */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Grant Access
        </h3>
        <p className="text-sm text-muted-foreground">
          Enter the email of someone who has already signed in to the app.
        </p>
        <form onSubmit={handleAuthorize} className="flex gap-2">
          <Input
            type="email"
            placeholder="teammate@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="gap-1 shrink-0">
            <UserPlus className="size-4" />
            {loading ? 'Adding…' : 'Add'}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </section>

      {/* Current users */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Authorized Users ({authorizedUsers.length})
        </h3>
        <div className="space-y-2">
          {authorizedUsers.map(u => {
            const isYou = u.clerkUserId === user?.id
            return (
              <Card key={u.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.email}</p>
                    {isYou && (
                      <p className="text-xs text-muted-foreground">You</p>
                    )}
                  </div>
                  {!isYou && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={revoking === u.id}
                      onClick={() => handleRevoke(u)}
                      title="Revoke access"
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
    </div>
  )
}
