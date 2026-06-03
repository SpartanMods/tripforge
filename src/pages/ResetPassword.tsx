import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, KeyRound, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

// Landing page for the password-recovery email link. Supabase parses the
// recovery token from the URL and establishes a short-lived session, firing
// a PASSWORD_RECOVERY auth event — at which point the user can set a new
// password via updateUser().
export function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { setReady(true); setChecking(false) }
    })
    // Also handle the case where the session is already present on mount
    // (token parsed before the listener attached).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grain relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-ocean/15 via-background to-primary/15">
      <div className="relative w-full max-w-md space-y-6 animate-rise">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift">
              <Compass className="h-7 w-7" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Voya</h1>
          <p className="text-sm text-muted-foreground">Set a new password.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" /> Reset password
            </CardTitle>
            <CardDescription>Choose a new password to finish signing back in.</CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : done ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
                  <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Password updated</p>
                    <p className="text-sm text-muted-foreground">You're all set. Sign in with your new password.</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate('/', { replace: true })}>Continue to Voya</Button>
              </div>
            ) : !ready ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-honey/40 bg-honey/10 p-4">
                  <AlertTriangle className="h-5 w-5 text-honey shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Link expired or invalid</p>
                    <p className="text-sm text-muted-foreground">
                      Open the most recent reset link from your email, or request a new one from the sign-in screen.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth', { replace: true })}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rp-new">New password</Label>
                  <Input id="rp-new" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" minLength={8} autoComplete="new-password" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rp-confirm">Confirm new password</Label>
                  <Input id="rp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password" autoComplete="new-password" required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gap-1.5" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
