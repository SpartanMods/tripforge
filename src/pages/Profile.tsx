import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, KeyRound, Check, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'

export function Profile() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)

  // Profile save state
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  // Password reset state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordDone, setPasswordDone] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/auth', { replace: true }); return }
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('username, phone').eq('id', user.id).single()
      if (data) { setUsername(data.username ?? ''); setPhone(data.phone ?? '') }
      setLoading(false)
    }
    load()
  }, [navigate])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    setSavingProfile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), phone: phone.trim() || null })
        .eq('id', user.id)
      if (error) throw error
      setProfileMsg('Profile updated.')
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Could not update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordDone(false)

    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }

    setSavingPassword(true)
    try {
      // The user is already authenticated, so updateUser changes the password directly.
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordDone(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="animate-rise">
        <span className="eyebrow">Account</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-1">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your details and security.</p>
      </div>

      {/* Account details */}
      <Card className="shadow-soft animate-rise" style={{ animationDelay: '60ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><User className="h-5 w-5 text-primary" /> Your details</CardTitle>
          <CardDescription>Your email is used to sign in and can’t be changed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-username" className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Username</Label>
              <Input id="pf-username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-phone" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            {profileMsg && <p className="text-sm text-muted-foreground">{profileMsg}</p>}
            <Button type="submit" disabled={savingProfile} className="gap-1.5">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password reset */}
      <Card className="shadow-soft animate-rise" style={{ animationDelay: '120ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><KeyRound className="h-5 w-5 text-primary" /> Reset password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordDone ? (
            <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
              <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Password updated</p>
                <p className="text-sm text-muted-foreground">Your new password is active. Use it next time you sign in.</p>
                <Button variant="link" className="h-auto p-0 mt-1" onClick={() => setPasswordDone(false)}>Change it again</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pf-new">New password</Label>
                <Input id="pf-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} autoComplete="new-password" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-confirm">Confirm new password</Label>
                <Input id="pf-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" autoComplete="new-password" required />
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <Button type="submit" disabled={savingPassword} className="gap-1.5">
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-center text-xs text-muted-foreground">Voya · your next voyage</p>
    </div>
  )
}
