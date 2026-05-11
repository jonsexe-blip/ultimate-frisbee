import { readFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// Load .env.local before any DB imports
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
import { exportGameBoxScore, exportSeasonStats } from '../lib/pdf-export'
import type { Player, Game, StatEvent, GameRoster } from '../lib/types'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const outDir = resolve(process.cwd(), 'exports')
  mkdirSync(outDir, { recursive: true })

  // jsPDF saves to cwd — run from exports dir
  process.chdir(outDir)

  console.log('Fetching data from database...')
  const [playerRows, gameRows, statRows, rosterRows] = await Promise.all([
    sql`SELECT id, name, number, sort_order FROM players ORDER BY sort_order, number`,
    sql`SELECT * FROM games ORDER BY date`,
    sql`SELECT * FROM stat_events ORDER BY timestamp`,
    sql`SELECT game_id, player_id FROM game_rosters`,
  ])

  const players: Player[] = playerRows.map(r => ({
    id: r.id as string,
    name: r.name as string,
    number: r.number as number,
    sortOrder: r.sort_order as number,
  }))

  const games: Game[] = gameRows.map(r => ({
    id: r.id as string,
    opponent: r.opponent as string,
    date: r.date as string,
    time: (r.time as string) ?? '',
    location: (r.location as string) ?? '',
    isHome: r.is_home as boolean,
    isComplete: r.is_complete as boolean,
    ourScore: r.our_score as number,
    opponentScore: r.opponent_score as number,
  }))

  const stats: StatEvent[] = statRows.map(r => ({
    id: r.id as string,
    gameId: r.game_id as string,
    playerId: (r.player_id as string) ?? undefined,
    type: r.type as StatEvent['type'],
    timestamp: Number(r.timestamp),
  }))

  const gameRosters: GameRoster[] = Object.entries(
    (rosterRows as Array<{ game_id: string; player_id: string }>)
      .reduce<Record<string, string[]>>((acc, row) => {
        if (!acc[row.game_id]) acc[row.game_id] = []
        acc[row.game_id].push(row.player_id)
        return acc
      }, {})
  ).map(([gameId, playerIds]) => ({ gameId, playerIds }))

  const completedGames = games.filter(g => g.isComplete)
  console.log(`\nExporting ${completedGames.length} game PDFs...`)

  for (const game of completedGames) {
    const opp = game.opponent.replace(/[^a-zA-Z0-9]/g, '-')
    const dateStr = new Date(game.date).toISOString().slice(0, 10)
    const filename = `CR-vs-${opp}-${dateStr}.pdf`
    await exportGameBoxScore(game, players, stats, gameRosters)
    console.log(`  exports/${filename}`)
  }

  console.log('\nExporting season stats PDF...')
  await exportSeasonStats(games, players, stats, gameRosters)
  const year = completedGames.length > 0
    ? new Date(completedGames[0].date).getFullYear()
    : new Date().getFullYear()
  console.log(`  exports/CR-Season-Stats-${year}.pdf`)

  console.log('\nDone.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
