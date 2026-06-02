-- ============================================================
-- TripForge — FULL DATABASE RESET  (DESTRUCTIVE)
-- Run this in the Supabase SQL editor: Dashboard > SQL Editor
--
-- ⚠️  THIS DELETES ALL APP DATA in the public schema (trips,
--     members, items, suggestions, itinerary, profiles) and
--     rebuilds everything cleanly from scratch.
--
--     It does NOT delete your auth users (logins are preserved),
--     and it backfills a profile row for every existing user at
--     the end, so you can keep using the same account.
--
-- This script mirrors schema.sql but is safely re-runnable: it
-- drops first, so it never collides with existing objects or
-- leaves behind the duplicate / recursive policies that caused
-- the "infinite recursion in policy" errors.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- TEARDOWN — remove everything this app owns, including every
-- policy attached to these tables (dropping a table drops its
-- policies). cascade clears FK dependencies between them.
-- ------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_trip_member(uuid) cascade;

drop table if exists public.suggestions     cascade;
drop table if exists public.itinerary_days  cascade;
drop table if exists public.trip_items      cascade;
drop table if exists public.trip_members    cascade;
drop table if exists public.trips           cascade;
drop table if exists public.profiles        cascade;


-- ============================================================
-- REBUILD
-- ============================================================
create extension if not exists "pgcrypto";


-- ---------- PROFILES ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles are viewable by all authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ---------- TRIPS ----------
create table public.trips (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  destinations jsonb not null default '[]',
  start_date   date,
  end_date     date,
  budget       numeric(10, 2),
  currency     text default 'USD',
  owner_id     uuid not null references auth.users (id) on delete cascade,
  metadata     jsonb default '{}',
  created_at   timestamptz default now() not null
);

alter table public.trips enable row level security;

create policy "Trip owners can do anything"
  on public.trips for all
  using (auth.uid() = owner_id);
-- collaborator read policy added after trip_members + helper exist


-- ---------- TRIP MEMBERS ----------
create table public.trip_members (
  trip_id    uuid not null references public.trips (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'collaborator' check (role in ('owner', 'collaborator')),
  joined_at  timestamptz default now() not null,
  primary key (trip_id, user_id)
);

alter table public.trip_members enable row level security;

create policy "Users can view their own membership"
  on public.trip_members for select
  using (auth.uid() = user_id);

create policy "Trip owners can view and manage members"
  on public.trip_members for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_members.trip_id
        and trips.owner_id = auth.uid()
    )
  );

-- SECURITY DEFINER membership check — bypasses RLS on trip_members so
-- the trips policy below can call it without re-triggering trip_members'
-- policies (which would otherwise recurse back into trips).
create or replace function public.is_trip_member(_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = _trip_id
      and user_id = auth.uid()
  );
$$;

create policy "Trip members can view trips"
  on public.trips for select
  using (public.is_trip_member(id));


-- ---------- TRIP ITEMS ----------
create table public.trip_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  category   text not null check (category in ('flight', 'hotel', 'airbnb', 'train', 'activity')),
  title      text not null,
  price      numeric(10, 2),
  currency   text default 'USD',
  url        text,
  status     text not null default 'suggested' check (status in ('saved', 'suggested', 'confirmed')),
  added_by   uuid not null references auth.users (id),
  metadata   jsonb default '{}',
  created_at timestamptz default now() not null
);

alter table public.trip_items enable row level security;

create policy "Trip members can view items"
  on public.trip_items for select
  using (
    public.is_trip_member(trip_id)
    or exists (
      select 1 from public.trips
      where trips.id = trip_items.trip_id
        and trips.owner_id = auth.uid()
    )
  );

create policy "Trip members can add items"
  on public.trip_items for insert
  with check (
    auth.uid() = added_by
    and (
      public.is_trip_member(trip_id)
      or exists (
        select 1 from public.trips
        where trips.id = trip_items.trip_id
          and trips.owner_id = auth.uid()
      )
    )
  );

create policy "Item owner can update or delete"
  on public.trip_items for all
  using (auth.uid() = added_by);


-- ---------- SUGGESTIONS ----------
create table public.suggestions (
  id           uuid primary key default gen_random_uuid(),
  trip_item_id uuid not null references public.trip_items (id) on delete cascade,
  user_id      uuid not null references auth.users (id),
  comment      text,
  upvotes      int default 0,
  created_at   timestamptz default now() not null
);

alter table public.suggestions enable row level security;

create policy "Trip members can view suggestions"
  on public.suggestions for select
  using (
    exists (
      select 1 from public.trip_items ti
      where ti.id = suggestions.trip_item_id
        and (
          public.is_trip_member(ti.trip_id)
          or exists (
            select 1 from public.trips t
            where t.id = ti.trip_id and t.owner_id = auth.uid()
          )
        )
    )
  );

create policy "Trip members can add suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own suggestions"
  on public.suggestions for update
  using (auth.uid() = user_id);


-- ---------- ITINERARY DAYS ----------
create table public.itinerary_days (
  id       uuid primary key default gen_random_uuid(),
  trip_id  uuid not null references public.trips (id) on delete cascade,
  date     date not null,
  notes    text,
  unique (trip_id, date)
);

alter table public.itinerary_days enable row level security;

create policy "Trip members can view itinerary days"
  on public.itinerary_days for select
  using (
    public.is_trip_member(trip_id)
    or exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
        and trips.owner_id = auth.uid()
    )
  );

create policy "Trip members can manage itinerary days"
  on public.itinerary_days for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
        and trips.owner_id = auth.uid()
    )
  );


-- ---------- BACKFILL PROFILES ----------
-- The on_auth_user_created trigger only fires for NEW signups, so create
-- a profile for every user that already exists (e.g. your account).
insert into public.profiles (id, username)
select u.id,
       coalesce(u.raw_user_meta_data->>'username', 'user_' || substr(u.id::text, 1, 8))
from auth.users u
on conflict (id) do nothing;

commit;


-- ------------------------------------------------------------
-- REAL-TIME (run separately, AFTER the transaction above commits;
-- publication changes are best kept out of the main transaction).
-- Safe to re-run: a table is silently re-added if already present.
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.trip_items;
alter publication supabase_realtime add table public.suggestions;
alter publication supabase_realtime add table public.itinerary_days;
