-- Run once in Supabase: SQL Editor > New query > paste > Run.
create table profiles (id uuid primary key references auth.users on delete cascade, email text not null, name text);
create table friendships (user_id uuid references profiles on delete cascade, friend_id uuid references profiles on delete cascade, primary key (user_id, friend_id));
create table comics (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles,
  title text,
  players int not null check (players between 3 and 10),
  loops int not null default 0 check (loops between 0 and 2),
  total int not null,
  status text not null default 'active' check (status in ('active','done','canceled','expired')),
  current_idx int not null default 0,
  turn_started_at timestamptz not null default now(),
  last_reminder_at timestamptz,
  name_token_hash text,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  finished_at timestamptz);
create table slots (
  comic_id uuid references comics on delete cascade, idx int, player_index int not null,
  user_id uuid references profiles, token_hash text unique, panel_path text,
  skipped boolean not null default false, primary key (comic_id, idx));
create table participants (comic_id uuid references comics on delete cascade, user_id uuid references profiles on delete cascade, primary key (comic_id, user_id));
create index on comics (status, turn_started_at);
-- All access goes through our server using the service-role key, so RLS is on with no public policies.
alter table profiles enable row level security; alter table friendships enable row level security;
alter table comics enable row level security; alter table slots enable row level security; alter table participants enable row level security;
insert into storage.buckets (id, name, public) values ('panels', 'panels', false) on conflict do nothing;
