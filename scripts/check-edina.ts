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
const rows = await sql`SELECT id, opponent, our_score, opponent_score FROM games WHERE opponent ILIKE '%edina%'`
console.log(JSON.stringify(rows, null, 2))
