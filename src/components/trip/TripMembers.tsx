import { useEffect, useState } from 'react'
import { Users, UserPlus, X, Loader2, Crown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  getTripMembers, getSocialGraph, addTripMember, removeTripMember,
} from '@/lib/social'
import type { TripMember, FriendEdge } from '@/lib/types'

interface TripMembersProps {
  tripId: string
  ownerId: string
  currentUserId: string
  /** Called after the current user leaves the trip. */
  onLeft?: () => void
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ocean/10 text-xs font-semibold text-ocean">
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  )
}

export function TripMembers({ tripId, ownerId, currentUserId, onLeft }: TripMembersProps) {
  const isOwner = currentUserId === ownerId
  const [members, setMembers] = useState<TripMember[]>([])
  const [friends, setFriends] = useState<FriendEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const m = await getTripMembers(tripId)
      setMembers(m)
      if (isOwner) {
        const graph = await getSocialGraph(currentUserId)
        setFriends(graph.friends)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tripId]) // eslint-disable-line react-hooks/exhaustive-deps

  const memberIds = new Set(members.map((m) => m.user_id))
  // Owner is implicitly part of the trip even without a trip_members row.
  const invitable = friends.filter((f) => !memberIds.has(f.profile.id) && f.profile.id !== ownerId)

  async function act(key: string, fn: () => Promise<unknown>) {
    setBusy(key)
    setError(null)
    try { await fn(); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.') }
    finally { setBusy(null) }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Travel party</CardTitle>
        <CardDescription>
          {isOwner ? 'Invite friends to plan this trip together.' : 'People planning this trip together.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Owner row (always shown) */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
          <Avatar name={members.find((m) => m.user_id === ownerId)?.profile?.username ?? 'Owner'} />
          <span className="flex-1 font-medium">
            {ownerId === currentUserId ? 'You' : members.find((m) => m.user_id === ownerId)?.profile?.username ?? 'Owner'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-honey"><Crown className="h-3.5 w-3.5" /> Owner</span>
        </div>

        {/* Collaborators */}
        {members.filter((m) => m.user_id !== ownerId).map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 rounded-lg border p-2.5">
            <Avatar name={m.profile?.username ?? '?'} />
            <span className="flex-1 font-medium">
              {m.user_id === currentUserId ? 'You' : m.profile?.username ?? 'Member'}
            </span>
            {isOwner && (
              <Button size="sm" variant="ghost" disabled={busy === `rm-${m.user_id}`}
                onClick={() => act(`rm-${m.user_id}`, () => removeTripMember(tripId, m.user_id))}
                aria-label="Remove member" className="text-muted-foreground hover:text-destructive">
                {busy === `rm-${m.user_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            )}
          </div>
        ))}

        {/* Owner: invite friends */}
        {isOwner && (
          <div>
            {!inviting ? (
              <Button variant="outline" size="sm" onClick={() => setInviting(true)} className="gap-1.5">
                <UserPlus className="h-4 w-4" /> Invite a friend
              </Button>
            ) : (
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Invite a friend</p>
                {invitable.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No friends to add. Add friends from the Friends tab first.
                  </p>
                ) : invitable.map((f) => (
                  <div key={f.profile.id} className="flex items-center gap-3">
                    <Avatar name={f.profile.username} />
                    <span className="flex-1 text-sm">{f.profile.username}</span>
                    <Button size="sm" disabled={busy === `add-${f.profile.id}`}
                      onClick={() => act(`add-${f.profile.id}`, () => addTripMember(tripId, f.profile.id))}
                      className="gap-1.5">
                      {busy === `add-${f.profile.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                      Add
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setInviting(false)}>Done</Button>
              </div>
            )}
          </div>
        )}

        {/* Member: leave trip */}
        {!isOwner && memberIds.has(currentUserId) && (
          <Button variant="ghost" size="sm" disabled={busy === 'leave'}
            onClick={() => act('leave', async () => { await removeTripMember(tripId, currentUserId); onLeft?.() })}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
            {busy === 'leave' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Leave trip
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
