'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { sql } from './db'
import type { Player, Game, StatEvent } from './types'

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AuthorizedUser {
  id: string
  clerkUserId: string
  email: string
}

export async function getAuthorizedUsers(): Promise<AuthorizedUser[]> {
  await requireAuth()
  const rows = await sql`SELECT id, clerk_user_id, email FROM authorized_users ORDER BY created_at`
  return rows.map(r => ({ id: r.id as string, clerkUserId: r.clerk_user_id as string, email: r.email as string }))
}

export async function authorizeUserByEmail(email: string): Promise<{ error?: string }> {
  await requireAuth()

  const clerk = await clerkClient()
  const result = await clerk.users.getUserList({ emailAddress: [email] })
  const clerkUser = result.data[0]

  if (!clerkUser) {
    return { error: 'No account found for that email. They must sign in to the app first.' }
  }

  const existing = await sql`SELECT id FROM authorized_users WHERE clerk_user_id = ${clerkUser.id}`
  if (existing.length > 0) return { error: 'That user is already authorized.' }

  await sql`INSERT INTO authorized_users (clerk_user_id, email) VALUES (${clerkUser.id}, ${email})`
  return {}
}

export async function revokeUser(id: string): Promise<void> {
  await requireAuth()
  const { userId } = await auth()
  // Prevent revoking yourself
  const target = await sql`SELECT clerk_user_id FROM authorized_users WHERE id = ${id}`
  if (target[0]?.clerk_user_id === userId) throw new Error('Cannot revoke your own access.')
  await sql`DELETE FROM authorized_users WHERE id = ${id}`
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function checkIsAuthorized(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const rows = await sql`
    SELECT id FROM authorized_users WHERE clerk_user_id = ${userId}
  `
  return rows.length > 0
}

async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')
  const rows = await sql`
    SELECT id FROM authorized_users WHERE clerk_user_id = ${userId}
  `
  if (rows.length === 0) throw new Error('Not authorized')
}

// ── Players ───────────────────────────────────────────────────────────────────

function mapPlayer(r: Record<string, unknown>): Player {
  return { id: r.id as string, name: r.name as string, number: r.number as number, sortOrder: (r.sort_order as number) ?? 0 }
}

export async function getPlayers(): Promise<Player[]> {
  const rows = await sql`SELECT id, name, number, sort_order FROM players ORDER BY sort_order, number`
  return rows.map(mapPlayer)
}

export async function addPlayer(name: string, number: number): Promise<Player | null> {
  await requireAuth()
  const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), -1) as max FROM players`
  const rows = await sql`
    INSERT INTO players (name, number, sort_order) VALUES (${name}, ${number}, ${(max as number) + 1})
    RETURNING id, name, number, sort_order
  `
  if (!rows[0]) return null
  return mapPlayer(rows[0])
}

export async function reorderPlayers(orderedIds: string[]): Promise<void> {
  await requireAuth()
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`UPDATE players SET sort_order = ${i} WHERE id = ${orderedIds[i]}`
  }
}

export async function removePlayer(id: string): Promise<boolean> {
  await requireAuth()
  await sql`DELETE FROM players WHERE id = ${id}`
  return true
}

// ── Games ─────────────────────────────────────────────────────────────────────

function mapGame(r: Record<string, unknown>): Game {
  return {
    id: r.id as string,
    opponent: r.opponent as string,
    date: r.date as string,
    time: (r.time as string) ?? '',
    location: (r.location as string) ?? '',
    isHome: r.is_home as boolean,
    isComplete: r.is_complete as boolean,
    ourScore: r.our_score as number,
    opponentScore: r.opponent_score as number,
  }
}

export async function getGames(): Promise<Game[]> {
  const rows = await sql`SELECT * FROM games ORDER BY date`
  return rows.map(mapGame)
}

export async function addGame(
  game: Omit<Game, 'id' | 'isComplete' | 'ourScore' | 'opponentScore'>
): Promise<Game | null> {
  await requireAuth()
  const rows = await sql`
    INSERT INTO games (opponent, date, time, location, is_home, is_complete, our_score, opponent_score)
    VALUES (
      ${game.opponent}, ${game.date}, ${game.time || null},
      ${game.location}, ${game.isHome}, false, 0, 0
    )
    RETURNING *
  `
  if (!rows[0]) return null
  return mapGame(rows[0])
}

export async function deleteGame(id: string): Promise<void> {
  await requireAuth()
  // stat_events and game_rosters cascade delete via FK
  await sql`DELETE FROM games WHERE id = ${id}`
}

export async function updateGame(id: string, updates: Partial<Game>): Promise<Game | null> {
  await requireAuth()
  const rows = await sql`
    UPDATE games SET
      opponent       = COALESCE(${updates.opponent ?? null}, opponent),
      date           = COALESCE(${updates.date ?? null}::date, date),
      time           = COALESCE(${updates.time ?? null}::time, time),
      location       = COALESCE(${updates.location ?? null}, location),
      is_home        = COALESCE(${updates.isHome ?? null}, is_home),
      is_complete    = COALESCE(${updates.isComplete ?? null}, is_complete),
      our_score      = COALESCE(${updates.ourScore ?? null}, our_score),
      opponent_score = COALESCE(${updates.opponentScore ?? null}, opponent_score)
    WHERE id = ${id}
    RETURNING *
  `
  if (!rows[0]) return null
  return mapGame(rows[0])
}

// ── Stat events ───────────────────────────────────────────────────────────────

function mapStat(r: Record<string, unknown>): StatEvent {
  return {
    id: r.id as string,
    gameId: r.game_id as string,
    playerId: (r.player_id as string) ?? undefined,
    type: r.type as StatEvent['type'],
    timestamp: Number(r.timestamp),
  }
}

export async function getStatEvents(): Promise<StatEvent[]> {
  const rows = await sql`SELECT * FROM stat_events ORDER BY timestamp`
  return rows.map(mapStat)
}

export async function addStatEvent(
  gameId: string,
  type: StatEvent['type'],
  playerId?: string
): Promise<{ stat: StatEvent; game: Game } | null> {
  await requireAuth()

  const ts = Date.now()
  const statRows = await sql`
    INSERT INTO stat_events (game_id, player_id, type, timestamp)
    VALUES (${gameId}, ${playerId ?? null}, ${type}, ${ts})
    RETURNING *
  `
  if (!statRows[0]) return null

  // Update score in DB
  let gameRows: Record<string, unknown>[] = []
  if (type === 'goal' || type === 'callahan') {
    gameRows = await sql`
      UPDATE games SET our_score = our_score + 1 WHERE id = ${gameId} RETURNING *
    `
  } else if (type === 'opponent_score') {
    gameRows = await sql`
      UPDATE games SET opponent_score = opponent_score + 1 WHERE id = ${gameId} RETURNING *
    `
  } else {
    gameRows = await sql`SELECT * FROM games WHERE id = ${gameId}`
  }

  if (!gameRows[0]) return null
  return { stat: mapStat(statRows[0]), game: mapGame(gameRows[0]) }
}

export async function undoLastStatEvent(
  gameId: string
): Promise<{ removedStatId: string; game: Game } | null> {
  await requireAuth()

  const lastRows = await sql`
    SELECT * FROM stat_events
    WHERE game_id = ${gameId}
    ORDER BY timestamp DESC
    LIMIT 1
  `
  if (!lastRows[0]) return null

  const last = mapStat(lastRows[0])
  await sql`DELETE FROM stat_events WHERE id = ${last.id}`

  let gameRows: Record<string, unknown>[]
  if (last.type === 'goal' || last.type === 'callahan') {
    gameRows = await sql`
      UPDATE games SET our_score = GREATEST(0, our_score - 1)
      WHERE id = ${gameId} RETURNING *
    `
  } else if (last.type === 'opponent_score') {
    gameRows = await sql`
      UPDATE games SET opponent_score = GREATEST(0, opponent_score - 1)
      WHERE id = ${gameId} RETURNING *
    `
  } else {
    gameRows = await sql`SELECT * FROM games WHERE id = ${gameId}`
  }

  if (!gameRows[0]) return null
  return { removedStatId: last.id, game: mapGame(gameRows[0]) }
}

// ── Game rosters ──────────────────────────────────────────────────────────────

export async function getGameRosters(): Promise<Array<{ game_id: string; player_id: string }>> {
  const rows = await sql`SELECT game_id, player_id FROM game_rosters`
  return rows.map(r => ({ game_id: r.game_id as string, player_id: r.player_id as string }))
}

export async function setGameRoster(gameId: string, playerIds: string[]): Promise<boolean> {
  await requireAuth()
  await sql`DELETE FROM game_rosters WHERE game_id = ${gameId}`
  if (playerIds.length > 0) {
    for (const playerId of playerIds) {
      await sql`
        INSERT INTO game_rosters (game_id, player_id) VALUES (${gameId}, ${playerId})
        ON CONFLICT DO NOTHING
      `
    }
  }
  return true
}

export async function addPlayerToGameRoster(gameId: string, playerId: string): Promise<boolean> {
  await requireAuth()
  await sql`
    INSERT INTO game_rosters (game_id, player_id) VALUES (${gameId}, ${playerId})
    ON CONFLICT DO NOTHING
  `
  return true
}
