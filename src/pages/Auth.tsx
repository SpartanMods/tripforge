import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { supabase } from '@/lib/supabase'

export function Auth() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  // Redirect if already logged in (the demo backend always returns a session)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true })
      else setChecking(false)
    })
  }, [navigate])

  if (checking) return null

  return (
    <div className="grain relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-ocean/15 via-background to-primary/15">
      <div className="relative w-full max-w-md space-y-6 animate-rise">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift">
              <Compass className="h-7 w-7" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">TripForge</h1>
          <p className="text-sm text-muted-foreground">Forge your next journey — together.</p>
        </div>

        {/* Auth card */}
        <Card>
          <Tabs defaultValue="signin">
            <CardHeader className="pb-0">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="signin" className="mt-0">
                <CardTitle className="text-base mb-1">Welcome back</CardTitle>
                <CardDescription className="mb-4">Sign in to your TripForge account.</CardDescription>
                <LoginForm />
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <CardTitle className="text-base mb-1">Create your account</CardTitle>
                <CardDescription className="mb-4">
                  Join TripForge and start planning trips with friends.
                </CardDescription>
                <SignupForm />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
