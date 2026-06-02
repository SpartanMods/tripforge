import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function clearError() { setError(null) }

  async function signInWithGoogle() {
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    })
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
      // Look up the email for this username
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

      // Get the email from auth.users via a Supabase RPC or the session —
      // we can't query auth.users directly from the client. Instead we store
      // a copy of the email in profiles when the user signs up, or use
      // a fallback: ask the user to enter their email if username lookup fails.
      // For now: fetch email via the admin API exposed as an Edge Function.
      // Temporary workaround — sign in with username is implemented as:
      // 1. User enters username + password
      // 2. We look up the profile id, then call a Supabase Edge Function
      //    POST /functions/v1/username-signin that returns the session.
      // Until that Edge Function is deployed, show an informative error.
      setError(
        'Username sign-in requires a Supabase Edge Function to be deployed. ' +
        'Please use email sign-in for now, or contact your admin.'
      )
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
        setError('Phone sign-in requires Twilio to be configured in your Supabase project. Enable it under Authentication > Providers > Phone.')
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
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button variant="outline" className="w-full gap-2" onClick={signInWithGoogle} type="button">
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or sign in with</span>
        </div>
      </div>

      {/* Email / Username / Phone tabs */}
      <Tabs defaultValue="email" onValueChange={clearError}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="username">Username</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>

        {/* Email tab */}
        <TabsContent value="email">
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
              <Label htmlFor="login-password">Password</Label>
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
    </div>
  )
}
