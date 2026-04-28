create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qid text not null,
  topic text not null,
  question text not null,
  marks int not null,
  student_answer text not null,
  feedback jsonb not null,
  weak_topics text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.daily_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  questions_completed int not null default 0,
  avg_score int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, session_date)
);

alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.daily_sessions enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_upsert_own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "attempts_select_own" on public.attempts for select using (auth.uid() = user_id);
create policy "attempts_insert_own" on public.attempts for insert with check (auth.uid() = user_id);
create policy "attempts_update_own" on public.attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attempts_delete_own" on public.attempts for delete using (auth.uid() = user_id);

create policy "daily_sessions_select_own" on public.daily_sessions for select using (auth.uid() = user_id);
create policy "daily_sessions_insert_own" on public.daily_sessions for insert with check (auth.uid() = user_id);
create policy "daily_sessions_update_own" on public.daily_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
