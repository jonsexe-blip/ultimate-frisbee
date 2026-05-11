import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const eq = line.indexOf('=')
  if (eq > 0 && !line.startsWith('#')) {
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
})

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const players = await sql`SELECT id, name FROM players`
  const find = (name: string) => players.find(p => (p.name as string).toLowerCase() === name.toLowerCase())

  const joe = find('Joe Sexe')
  const adam = find('Adam Greenseid')

  if (!joe) throw new Error('Player not found: Joe Sexe')
  if (!adam) throw new Error('Player not found: Adam Greenseid')

  // ── Fix 1: already applied (Squall Mateo→Mateo → Callahan) ──

  // ── Fix 2: Edina 9-15 — Unknown→Joe Sexe at 4-6 → Adam Greenseid ──
  console.log('── Fix 2: Edina (9-15) Unknown→Joe Sexe at 4-6 → Adam Greenseid ──')

  const edinaGames = await sql`
    SELECT id, opponent, our_score, opponent_score
    FROM games
    WHERE opponent ILIKE '%edina%' AND our_score = 9 AND opponent_score = 15
  `
  if (edinaGames.length === 0) throw new Error('Edina 9-15 game not found')
  const edinaGame = edinaGames[0]
  console.log(`Game: vs ${edinaGame.opponent} (${edinaGame.our_score}-${edinaGame.opponent_score}) id=${edinaGame.id}`)

  // Replay to find the goal event that brought the score to 4-6
  const edinaEvents = await sql`
    SELECT id, player_id, type, timestamp FROM stat_events
    WHERE game_id = ${edinaGame.id as string}
      AND type IN ('goal', 'assist', 'callahan', 'opponent_score')
    ORDER BY timestamp
  `

  let ourScore = 0
  let theirScore = 0
  let targetGoalId: string | null = null
  let targetGoalTs: number | null = null

  for (const ev of edinaEvents) {
    if (ev.type === 'goal' || ev.type === 'callahan') ourScore++
    else if (ev.type === 'opponent_score') theirScore++

    if (ev.type === 'goal' && ourScore === 4 && (ev.player_id as string) === (joe.id as string)) {
      targetGoalId = ev.id as string
      targetGoalTs = ev.timestamp as number
      console.log(`  Found Joe Sexe goal at score ${ourScore}-${theirScore}, event id=${targetGoalId}`)
      break
    }
  }

  if (!targetGoalId || targetGoalTs === null) {
    throw new Error('Could not find Joe Sexe goal at score 4-? in Edina game')
  }

  // No assist event exists for this goal — insert one for Adam Greenseid
  const assistTs = targetGoalTs + 1
  await sql`
    INSERT INTO stat_events (game_id, player_id, type, timestamp)
    VALUES (${edinaGame.id as string}, ${adam.id as string}, 'assist', ${assistTs})
  `
  console.log(`  Inserted assist event for Adam Greenseid at timestamp ${assistTs} ✓`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
