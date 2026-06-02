-- ============================================================
-- TripForge Schema
-- Run this in the Supabase SQL editor: Dashboard > SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ============================================================
-- PROFILES
-- Extends auth.users with username, phone, avatar
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- Auto-create a profile row when a new auth user signs up.
-- The app upserts username + phone immediately after sign-up.
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

-- RLS
alter table public.profiles enable row level security;

create policy "Profiles are viewable by all authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ============================================================
-- TRIPS
-- destinations is jsonb to support multi-stage itineraries:
-- [{ "city": "Paris", "country": "FR", "from": "2026-09-01", "to": "2026-09-05" }]
-- ============================================================
create table public.trips (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  destinations jsonb not null default '[]',
  start_date   date,
  end_date     date,
  budget       numeric(10, 2),
  currency     text default 'USD',
  owner_id     uuid not null references auth.users (id) on delete cascade,
  -- Flexible store for richer planning data: per-traveller budgets, an
  -- optional category budget breakdown, preferred airlines, and saved
  -- flights/hotels. Keeps the schema additive as features grow.
  metadata     jsonb default '{}',
  created_at   timestamptz default now() not null
);

alter table public.trips enable row level security;

create policy "Trip owners can do anything"
  on public.trips for all
  using (auth.uid() = owner_id);

create policy "Trip members can view trips"
  on public.trips for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
    )
  );


-- ============================================================
-- TRIP MEMBERS
-- ============================================================
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


-- ============================================================
-- TRIP ITEMS
-- Flights, hotels, Airbnbs, trains, activities saved to a trip
-- ============================================================
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
  metadata   jsonb default '{}',  -- flexible store for API-specific fields
  created_at timestamptz default now() not null
);

alter table public.trip_items enable row level security;

create policy "Trip members can view items"
  on public.trip_items for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trip_items.trip_id
        and trip_members.user_id = auth.uid()
    )
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
      exists (
        select 1 from public.trip_members
        where trip_members.trip_id = trip_items.trip_id
          and trip_members.user_id = auth.uid()
      )
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


-- ============================================================
-- SUGGESTIONS
-- Comments / upvotes on trip items
-- ============================================================
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
      join public.trip_members tm on tm.trip_id = ti.trip_id
      where ti.id = suggestions.trip_item_id
        and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.trip_items ti
      join public.trips t on t.id = ti.trip_id
      where ti.id = suggestions.trip_item_id
        and t.owner_id = auth.uid()
    )
  );

create policy "Trip members can add suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own suggestions"
  on public.suggestions for update
  using (auth.uid() = user_id);


-- ============================================================
-- ITINERARY DAYS
-- Day-by-day notes for a trip
-- ============================================================
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
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = itinerary_days.trip_id
        and trip_members.user_id = auth.uid()
    )
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


-- ============================================================
-- REAL-TIME
-- Enable Supabase real-time for collaborative features
-- ============================================================
alter publication supabase_realtime add table public.trip_items;
alter publication supabase_realtime add table public.suggestions;
alter publication supabase_realtime add table public.itinerary_days;
