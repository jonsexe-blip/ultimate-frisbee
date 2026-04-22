---
name: Ultimate Frisbee App Project
description: Next.js app for Central Revolution ultimate frisbee team — game scoring, schedule, stats, roster with Neon DB + Clerk auth
type: project
---

Next.js 16 app (pnpm) for Central Revolution ultimate frisbee team.

**Stack:** Next.js 16 (Turbopack), Neon (Postgres), Clerk (auth), Tailwind v4, Radix UI, shadcn/ui components.

**Architecture:**
- `lib/db.ts` — Neon SQL client (server-only)
- `lib/actions.ts` — all DB operations as Next.js server actions (require auth for writes)
- `lib/game-context.tsx` — client context that calls server actions; exposes same interface as original prototype
- `lib/auth-context.tsx` — thin hook wrapping Clerk's useUser + authorized_users DB check
- `components/app-shell.tsx` — nav shell with Clerk openSignIn() for auth gates
- `supabase/schema.sql` — Neon-compatible schema (no RLS, uses clerk_user_id text column)
- `proxy.ts` — Clerk middleware for session refresh

**Access model:**
- Public: Schedule (view), Game Stats, Season Stats
- Authorized only: Game Tracker (Live scoring), Roster management, Add Game to schedule
- Authorization = row in `authorized_users` table with `clerk_user_id` field; managed manually via Neon SQL editor

**Why Neon + Clerk:** Supabase free tier hit (2 project limit on personal account, both slots used). Neon has no project count limit on free tier; Clerk has generous free tier for auth.

**Setup needed by user:**
1. Create Neon project at console.neon.tech, copy connection string → DATABASE_URL in .env.local
2. Create Clerk app at dashboard.clerk.com, copy publishable + secret keys → .env.local
3. Run supabase/schema.sql in Neon SQL Editor
4. Sign up in the app, find Clerk user ID in Clerk Dashboard > Users
5. Run: `insert into authorized_users (clerk_user_id, email) values ('user_xxx', 'email');`
