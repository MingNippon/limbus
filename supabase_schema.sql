-- =================================================================================
-- LIMBUS COMPANY WEB EDITION — SUPABASE DATABASE SCHEMA
-- Hướng dẫn: Copy toàn bộ nội dung file này -> Dán vào mục "SQL Editor" trên
-- trang quản trị Supabase (https://supabase.com/dashboard) -> Bấm "RUN".
-- =================================================================================

create table if not exists public.lcb_accounts (
  username text primary key,
  uid text not null unique,
  display_name text not null,
  password_hash text not null,
  avatar_sinner_id integer not null default 3,
  last_daily_claim_date text,
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

-- Tạo index tăng tốc độ tải Bảng Xếp Hạng (Leaderboard)
create index if not exists idx_lcb_accounts_last_login
  on public.lcb_accounts (last_login_at desc);

-- Bật Row Level Security (RLS) và cho phép Web Client đọc/ghi thông qua Anon Key
alter table public.lcb_accounts enable row level security;

drop policy if exists "Allow public read lcb_accounts" on public.lcb_accounts;
create policy "Allow public read lcb_accounts"
  on public.lcb_accounts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public insert lcb_accounts" on public.lcb_accounts;
create policy "Allow public insert lcb_accounts"
  on public.lcb_accounts
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow public update lcb_accounts" on public.lcb_accounts;
create policy "Allow public update lcb_accounts"
  on public.lcb_accounts
  for update
  to anon, authenticated
  using (true)
  with check (true);
