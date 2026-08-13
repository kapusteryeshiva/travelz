-- Run this entire file in Supabase SQL Editor.
-- Then enable Anonymous Sign-Ins in Authentication > Providers.

create table if not exists public.people (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default now()
);

create table if not exists public.visited_countries (
  user_id uuid not null references public.people(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  visited_at timestamptz not null default now(),
  primary key (user_id, country_code)
);

alter table public.people enable row level security;
alter table public.visited_countries enable row level security;

drop policy if exists "Anyone can read people" on public.people;
create policy "Anyone can read people"
on public.people for select
to anon, authenticated
using (true);

drop policy if exists "Users can create their own profile" on public.people;
create policy "Users can create their own profile"
on public.people for insert
to anon, authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.people;
create policy "Users can update their own profile"
on public.people for update
to anon, authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Anyone can read visits" on public.visited_countries;
create policy "Anyone can read visits"
on public.visited_countries for select
to anon, authenticated
using (true);

drop policy if exists "Users can add their own visits" on public.visited_countries;
create policy "Users can add their own visits"
on public.visited_countries for insert
to anon, authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own visits" on public.visited_countries;
create policy "Users can remove their own visits"
on public.visited_countries for delete
to anon, authenticated
using (auth.uid() = user_id);

-- Enable realtime for collaborative updates.
alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.visited_countries;