import { readFileSync } from 'fs'
import { resolve } from 'path'

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
  const joe = players.find(p => (p.name as string).toLowerCase() === 'joe sexe')
  if (!joe) throw new Error('Player not found: Joe Sexe')
  console.log(`Joe Sexe: ${joe.id}`)

  // Find OWL game on May 14th
  const owlGames = await sql`
    SELECT id, opponent, our_score, opponent_score, date
    FROM games
    WHERE opponent ILIKE '%owl%' AND date::text LIKE '2026-05-14%'
  `
  if (owlGames.length === 0) {
    // Try without date filter in case date is stored differently
    const all = await sql`SELECT id, opponent, our_score, opponent_score, date FROM games WHERE opponent ILIKE '%owl%'`
    console.log('OWL games found:', JSON.stringify(all))
    throw new Error('OWL game on May 14 not found')
  }
  const game = owlGames[0]
  console.log(`Game: vs ${game.opponent} (${game.our_score}-${game.opponent_score}) on ${game.date}, id=${game.id}`)

  // Replay to find the Joe Sexe goal that brought the score to 7-?
  const events = await sql`
    SELECT id, player_id, type, timestamp FROM stat_events
    WHERE game_id = ${game.id as string}
      AND type IN ('goal', 'assist', 'callahan', 'opponent_score')
    ORDER BY timestamp
  `

  let ourScore = 0
  let theirScore = 0
  let targetGoalId: string | null = null
  let targetGoalTs: number | null = null

  for (const ev of events) {
    if (ev.type === 'goal' || ev.type === 'callahan') ourScore++
    else if (ev.type === 'opponent_score') theirScore++

    // 7th Central goal scored by Joe Sexe
    if (ev.type === 'goal' && ourScore === 7 && (ev.player_id as string) === (joe.id as string)) {
      targetGoalId = ev.id as string
      targetGoalTs = ev.timestamp as number
      console.log(`Found Joe Sexe goal at score ${ourScore}-${theirScore}, id=${targetGoalId}`)
      break
    }
  }

  if (!targetGoalId || targetGoalTs === null) throw new Error('Could not find Joe Sexe goal #7')

  // Find paired assist also by Joe Sexe
  const assists = await sql`
    SELECT id, player_id FROM stat_events
    WHERE game_id = ${game.id as string}
      AND type = 'assist'
      AND player_id = ${joe.id as string}
      AND ABS(timestamp - ${targetGoalTs}) < 5000
    ORDER BY ABS(timestamp - ${targetGoalTs})
    LIMIT 1
  `

  if (assists.length === 0) throw new Error('Could not find Joe Sexe self-assist event')
  const assistId = assists[0].id as string
  console.log(`Found Joe Sexe assist event id=${assistId}`)

  // Delete both and insert callahan
  await sql`DELETE FROM stat_events WHERE id = ${targetGoalId}`
  await sql`DELETE FROM stat_events WHERE id = ${assistId}`
  await sql`
    INSERT INTO stat_events (game_id, player_id, type, timestamp)
    VALUES (${game.id as string}, ${joe.id as string}, 'callahan', ${targetGoalTs})
  `
  console.log('Deleted goal+assist, inserted callahan for Joe Sexe ✓')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
