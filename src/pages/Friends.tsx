import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, Search, Check, X, Loader2, Clock, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import {
  getSocialGraph, searchUsers, sendFriendRequest, acceptRequest, removeFriendship,
  type SocialGraph,
} from '@/lib/social'
import type { Profile } from '@/lib/types'

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ocean/10 text-sm font-semibold text-ocean">
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  )
}

export function Friends() {
  const navigate = useNavigate()
  const [myId, setMyId] = useState('')
  const [graph, setGraph] = useState<SocialGraph>({ friends: [], incoming: [], outgoing: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // id currently acting on

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  const refresh = useCallback(async (id: string) => {
    setGraph(await getSocialGraph(id))
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/auth', { replace: true }); return }
      setMyId(user.id)
      try { await refresh(user.id) } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load.') }
      setLoading(false)
    }
    init()
  }, [navigate, refresh])

  // Debounced username search
  useEffect(() => {
    if (!myId) return
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try { setResults(await searchUsers(q, myId)) }
      catch { /* ignore */ }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query, myId])

  // ids already in some relationship — to label search results
  const relatedStatus = (id: string): 'friend' | 'incoming' | 'outgoing' | null => {
    if (graph.friends.some((e) => e.profile.id === id)) return 'friend'
    if (graph.incoming.some((e) => e.profile.id === id)) return 'incoming'
    if (graph.outgoing.some((e) => e.profile.id === id)) return 'outgoing'
    return null
  }

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(label)
    setError(null)
    try { await fn(); await refresh(myId) }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setBusy(null) }
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="animate-rise">
        <span className="eyebrow">Your people</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-1">Friends</h1>
        <p className="text-muted-foreground mt-2">Add friends by username, then plan trips together.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Add a friend */}
      <Card className="shadow-soft animate-rise" style={{ animationDelay: '60ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><UserPlus className="h-5 w-5 text-primary" /> Add a friend</CardTitle>
          <CardDescription>Search for someone by their username.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Username…" className="pl-8" autoComplete="off" />
            {searching && <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>

          {results.map((p) => {
            const status = relatedStatus(p.id)
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <Avatar name={p.username} />
                <span className="flex-1 font-medium">{p.username}</span>
                {status === 'friend' ? (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Friends</span>
                ) : status === 'outgoing' ? (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Requested</span>
                ) : (
                  <Button size="sm" disabled={busy === `add-${p.id}`}
                    onClick={() => act(`add-${p.id}`, () => sendFriendRequest(myId, p.id))}
                    className="gap-1.5">
                    {busy === `add-${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {status === 'incoming' ? 'Accept' : 'Add'}
                  </Button>
                )}
              </div>
            )
          })}
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found for “{query.trim()}”.</p>
          )}
        </CardContent>
      </Card>

      {/* Incoming requests */}
      {graph.incoming.length > 0 && (
        <Card className="shadow-soft animate-rise">
          <CardHeader>
            <CardTitle className="text-lg">Friend requests</CardTitle>
            <CardDescription>{graph.incoming.length} waiting on you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {graph.incoming.map((e) => (
              <div key={e.friendship.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <Avatar name={e.profile.username} />
                <span className="flex-1 font-medium">{e.profile.username}</span>
                <Button size="sm" disabled={busy === `acc-${e.friendship.id}`}
                  onClick={() => act(`acc-${e.friendship.id}`, () => acceptRequest(e.friendship.id))} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Accept
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === `acc-${e.friendship.id}`}
                  onClick={() => act(`acc-${e.friendship.id}`, () => removeFriendship(e.friendship.id))}
                  aria-label="Decline" className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      <Card className="shadow-soft animate-rise">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" /> Your friends</CardTitle>
          <CardDescription>{graph.friends.length} {graph.friends.length === 1 ? 'friend' : 'friends'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {graph.friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No friends yet — search above to add your first.</p>
          ) : graph.friends.map((e) => (
            <div key={e.friendship.id} className="flex items-center gap-3 rounded-lg border p-2.5">
              <Avatar name={e.profile.username} />
              <span className="flex-1 font-medium">{e.profile.username}</span>
              <Button size="sm" variant="ghost" disabled={busy === `rm-${e.friendship.id}`}
                onClick={() => act(`rm-${e.friendship.id}`, () => removeFriendship(e.friendship.id))}
                className="text-muted-foreground hover:text-destructive gap-1.5">
                {busy === `rm-${e.friendship.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Remove
              </Button>
            </div>
          ))}

          {graph.outgoing.length > 0 && (
            <div className="pt-2">
              <p className="eyebrow mb-2">Pending sent</p>
              {graph.outgoing.map((e) => (
                <div key={e.friendship.id} className="flex items-center gap-3 rounded-lg border border-dashed p-2.5 opacity-80">
                  <Avatar name={e.profile.username} />
                  <span className="flex-1 font-medium">{e.profile.username}</span>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Requested</span>
                  <Button size="sm" variant="ghost" disabled={busy === `cx-${e.friendship.id}`}
                    onClick={() => act(`cx-${e.friendship.id}`, () => removeFriendship(e.friendship.id))}
                    aria-label="Cancel request" className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
