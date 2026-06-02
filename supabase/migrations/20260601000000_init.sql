-- IRO · initial schema (idempotent — safe to run/apply more than once)
-- Applied automatically by the Supabase GitHub integration on push to `main`,
-- and/or paste-and-run once in the SQL Editor for the first setup.
-- JSON-row model: each table stores the full domain object in `data` (jsonb).

create extension if not exists "pgcrypto";

-- ── Dashboard-owned collections ──────────────────────────────────────────────
create table if not exists projects (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (   -- 입출금 ledger
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (        -- 명함
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tax_invoices (    -- 세금계산서 (매출)
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tax_cashbills (   -- 현금영수증
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tax_profile (     -- 내 사업자(공급자) 정보 (single row, id='default')
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Slack ────────────────────────────────────────────────────────────────────
create table if not exists slack_tokens (    -- per-user OAuth tokens (post AS the person)
  id text primary key,                        -- IRO user id
  data jsonb not null,                        -- { slackUserId, accessToken, scope, teamId }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists slack_messages (  -- inbound feed for realtime → dashboard
  id text primary key,                        -- Slack message ts
  channel text not null,
  thread_ts text,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists slack_messages_channel_idx on slack_messages (channel, created_at desc);

-- ── Realtime: dashboard subscribes to new agent/user messages (idempotent add) ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'slack_messages'
  ) then
    alter publication supabase_realtime add table public.slack_messages;
  end if;
end $$;

-- ── RLS: server uses the service-role key (bypasses RLS). Enable RLS so the
--    public anon key can't touch these directly. Add client read policies later
--    (e.g. a SELECT policy on slack_messages) when wiring browser Realtime. ──
alter table projects       enable row level security;
alter table transactions   enable row level security;
alter table contacts       enable row level security;
alter table tax_invoices   enable row level security;
alter table tax_cashbills  enable row level security;
alter table tax_profile    enable row level security;
alter table slack_tokens   enable row level security;
alter table slack_messages enable row level security;
