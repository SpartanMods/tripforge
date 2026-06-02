import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { supabase } from '@/lib/supabase'

export function Auth() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  // Redirect if already logged in
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setChecking(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true })
      else setChecking(false)
    })
  }, [navigate])

  if (checking) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary p-3">
              <MapPin className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TripForge</h1>
          <p className="text-sm text-muted-foreground">Plan your next adventure, together.</p>
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
