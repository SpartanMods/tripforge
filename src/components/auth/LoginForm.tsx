import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'

export function LoginForm() {
  const navigate = useNavigate()

  // Email sign-in
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  // Username sign-in
  const [usernameInput, setUsernameInput] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')

  // Phone OTP
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Forgot-password (reset request) flow
  const [forgot, setForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function clearError() { setError(null) }

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: emailPassword })
      if (error) throw error
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUsernameSignIn(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      // Look up the profile to confirm the username exists
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameInput.trim())
        .maybeSingle()

      if (lookupError) throw lookupError
      if (!profile) {
        setError('No account found with that username.')
        return
      }

      // Username → email lookup requires a Supabase Edge Function not yet deployed.
      // Prompt the user to sign in with their email in the meantime.
      setError('Username sign-in is coming soon. Please use the Email tab for now.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) throw error
      setOtpSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP.'
      if (msg.toLowerCase().includes('twilio') || msg.toLowerCase().includes('sms')) {
        setError('Phone sign-in requires Twilio to be enabled in your Supabase project (Authentication → Sign In Methods → Phone).')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otpCode, type: 'sms' })
      if (error) throw error
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="email" onValueChange={clearError}>
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="username">Username</TabsTrigger>
        <TabsTrigger value="phone">Phone</TabsTrigger>
      </TabsList>

      {/* Email tab */}
      <TabsContent value="email">
        {forgot ? (
          resetSent ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
                <p className="font-medium">Check your inbox</p>
                <p className="text-muted-foreground mt-1">
                  If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-muted-foreground underline"
                onClick={() => { setForgot(false); setResetSent(false); clearError() }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground underline"
                onClick={() => { setForgot(false); clearError() }}
              >
                Back to sign in
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailSignIn} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => { setForgot(true); clearError() }}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="Your password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        )}
      </TabsContent>

      {/* Username tab */}
      <TabsContent value="username">
        <form onSubmit={handleUsernameSignIn} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              type="text"
              placeholder="Your username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-username-password">Password</Label>
            <Input
              id="login-username-password"
              type="password"
              placeholder="Your password"
              value={usernamePassword}
              onChange={(e) => setUsernamePassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </TabsContent>

      {/* Phone OTP tab */}
      <TabsContent value="phone">
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="login-phone">Phone number</Label>
              <Input
                id="login-phone"
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending code…' : 'Send verification code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <strong>{phone}</strong>.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="login-otp">Verification code</Label>
              <Input
                id="login-otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                maxLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify code'}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => { setOtpSent(false); clearError() }}
            >
              Use a different number
            </button>
          </form>
        )}
      </TabsContent>
    </Tabs>
  )
}
