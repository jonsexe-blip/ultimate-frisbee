-- ============================================================
-- Ultimate Frisbee App Schema — Neon (Postgres)
-- Run this in your Neon SQL Editor (console.neon.tech > SQL Editor)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  number     integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- If you already created the players table, run this instead:
-- alter table players add column if not exists sort_order integer not null default 0;

create table if not exists games (
  id             uuid primary key default gen_random_uuid(),
  opponent       text not null,
  date           date not null,
  time           time,
  location       text not null default '',
  is_home        boolean not null default true,
  is_complete    boolean not null default false,
  our_score      integer not null default 0,
  opponent_score integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists stat_events (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references games(id) on delete cascade,
  player_id  uuid references players(id) on delete set null,
  type       text not null check (type in (
               'completion','turnover','turnover_caused',
               'goal','assist','callahan','opponent_score','pull'
             )),
  timestamp  bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists game_rosters (
  game_id   uuid not null references games(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  primary key (game_id, player_id)
);

-- Clerk user IDs (text) instead of Supabase auth.users UUIDs
create table if not exists authorized_users (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email         text not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_stat_events_game_id   on stat_events(game_id);
create index if not exists idx_stat_events_player_id on stat_events(player_id);
create index if not exists idx_game_rosters_game_id  on game_rosters(game_id);
create index if not exists idx_auth_users_clerk_id   on authorized_users(clerk_user_id);

-- ============================================================
-- GRANT YOURSELF ACCESS
-- After signing into the app, find your Clerk user ID in the
-- Clerk Dashboard > Users, then run:
--
--   insert into authorized_users (clerk_user_id, email)
--   values ('user_xxxxxxxxxxxxxxxx', 'your@email.com');
--
-- To grant others scoring access, insert a row for each person.
-- ============================================================
