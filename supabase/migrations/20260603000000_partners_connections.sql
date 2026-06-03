-- IRO · 거래처(partners) + 연동 계좌/카드(bank_accounts, bank_txns) 스키마
-- idempotent — JSON-row model (id text pk, data jsonb). 데이터는 비워서 시작(시드 없음).
create extension if not exists "pgcrypto";

create table if not exists partners (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bank_accounts (   -- 연동 계좌/카드
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bank_txns (       -- 거래내역 (mock; 발행 시 issuedInvoiceId 스탬프)
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bank_txns_account_idx on bank_txns ((data->>'accountId'));

-- 서버는 service-role 키 사용(RLS 우회). anon 차단을 위해 RLS 활성화.
alter table partners      enable row level security;
alter table bank_accounts enable row level security;
alter table bank_txns     enable row level security;
