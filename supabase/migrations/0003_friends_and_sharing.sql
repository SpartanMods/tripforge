-- ============================================================
-- Voya — Friends & trip collaboration  (additive, safe to re-run)
-- Run in the Supabase SQL editor: Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- FRIENDSHIPS
-- A single row per relationship: the requester invites the
-- addressee; status flips to 'accepted' when they confirm.
-- "My friends" = accepted rows where I'm either side.
-- ------------------------------------------------------------
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users (id) on delete cascade,
  addressee_id  uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz default now() not null,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table public.friendships enable row level security;

drop policy if exists "View own friendships" on public.friendships;
create policy "View own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Send friend request" on public.friendships;
create policy "Send friend request"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

drop policy if exists "Respond to friend request" on public.friendships;
create policy "Respond to friend request"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Remove friendship" on public.friendships;
create policy "Remove friendship"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);


-- ------------------------------------------------------------
-- TRIP MEMBERS — collaboration policies
-- (table + owner/self policies already exist from the base schema)
-- ------------------------------------------------------------

-- Any member can see the other members of trips they belong to.
-- Uses the SECURITY DEFINER helper to avoid RLS recursion.
drop policy if exists "Members can view co-members" on public.trip_members;
create policy "Members can view co-members"
  on public.trip_members for select
  using (public.is_trip_member(trip_id));

-- A member can remove themselves from a trip (leave).
drop policy if exists "Members can leave a trip" on public.trip_members;
create policy "Members can leave a trip"
  on public.trip_members for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- TRIPS — let collaborators edit, not just the owner
-- ------------------------------------------------------------
drop policy if exists "Members can update trips" on public.trips;
create policy "Members can update trips"
  on public.trips for update
  using (public.is_trip_member(id));
