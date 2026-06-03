// ============================================================
// Social graph & trip sharing — data helpers over Supabase.
//
// Kept to simple, portable queries (no PostgREST embedding) so the same
// calls work against the localStorage demo client. Profiles are fetched in
// a second pass and stitched in by id.
// ============================================================
import { supabase } from './supabase'
import type { Profile, Friendship, FriendEdge, TripMember } from './types'

export async function getMyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Find people to add by username (excludes yourself).
export async function searchUsers(query: string, excludeId: string): Promise<Profile[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .ilike('username', `%${q}%`)
    .neq('id', excludeId)
    .limit(8)
  if (error) throw error
  return (data ?? []) as Profile[]
}

async function profilesByIds(ids: string[]): Promise<Map<string, Profile>> {
  const map = new Map<string, Profile>()
  const unique = Array.from(new Set(ids))
  if (unique.length === 0) return map
  const { data } = await supabase.from('profiles').select('id, username, avatar_url').in('id', unique)
  for (const p of (data ?? []) as Profile[]) map.set(p.id, p)
  return map
}

export interface SocialGraph {
  friends: FriendEdge[]
  incoming: FriendEdge[] // pending requests awaiting my response
  outgoing: FriendEdge[] // pending requests I sent
}

export async function getSocialGraph(myId: string): Promise<SocialGraph> {
  const [asRequester, asAddressee] = await Promise.all([
    supabase.from('friendships').select('*').eq('requester_id', myId),
    supabase.from('friendships').select('*').eq('addressee_id', myId),
  ])
  const rows = [...(asRequester.data ?? []), ...(asAddressee.data ?? [])] as Friendship[]
  const uniq = Array.from(new Map(rows.map((r) => [r.id, r])).values())

  const otherIds = uniq.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id))
  const profiles = await profilesByIds(otherIds)

  const edges: FriendEdge[] = uniq.map((f) => {
    const otherId = f.requester_id === myId ? f.addressee_id : f.requester_id
    return {
      friendship: f,
      profile: profiles.get(otherId) ?? { id: otherId, username: 'unknown' },
      direction: f.addressee_id === myId ? 'incoming' : 'outgoing',
    }
  })

  return {
    friends: edges.filter((e) => e.friendship.status === 'accepted'),
    incoming: edges.filter((e) => e.friendship.status === 'pending' && e.direction === 'incoming'),
    outgoing: edges.filter((e) => e.friendship.status === 'pending' && e.direction === 'outgoing'),
  }
}

async function existingFriendship(myId: string, otherId: string): Promise<Friendship | null> {
  const [a, b] = await Promise.all([
    supabase.from('friendships').select('*').eq('requester_id', myId).eq('addressee_id', otherId),
    supabase.from('friendships').select('*').eq('requester_id', otherId).eq('addressee_id', myId),
  ])
  const rows = [...(a.data ?? []), ...(b.data ?? [])] as Friendship[]
  return rows[0] ?? null
}

// Send a request — or, if they already invited you, accept it instead.
export async function sendFriendRequest(myId: string, addresseeId: string): Promise<'sent' | 'accepted'> {
  const existing = await existingFriendship(myId, addresseeId)
  if (existing) {
    if (existing.status === 'pending' && existing.addressee_id === myId) {
      await acceptRequest(existing.id)
      return 'accepted'
    }
    throw new Error('You’re already connected or have a pending request with this person.')
  }
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: myId, addressee_id: addresseeId, status: 'pending' })
  if (error) throw error
  return 'sent'
}

export async function acceptRequest(friendshipId: string) {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
  if (error) throw error
}

export async function removeFriendship(friendshipId: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}

// ---- Trip members ----------------------------------------------------------

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase.from('trip_members').select('*').eq('trip_id', tripId)
  if (error) throw error
  const members = (data ?? []) as TripMember[]
  const profiles = await profilesByIds(members.map((m) => m.user_id))
  return members.map((m) => ({ ...m, profile: profiles.get(m.user_id) }))
}

export async function addTripMember(tripId: string, userId: string) {
  const { error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: userId, role: 'collaborator' })
  if (error) throw error
}

export async function removeTripMember(tripId: string, userId: string) {
  const { error } = await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', userId)
  if (error) throw error
}
