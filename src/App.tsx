import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Layout } from '@/components/layout/Layout'
import { Auth } from '@/pages/Auth'
import { MyTrips } from '@/pages/MyTrips'
import { PlanTrip } from '@/pages/PlanTrip'
import { TripDetail } from '@/pages/TripDetail'
import { Profile } from '@/pages/Profile'

function AuthGuard({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
      })
      .catch(() => {
        // Auth error — proceed unauthenticated
      })
      .finally(() => {
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Prevent flash of the wrong page while session is being read
  if (loading) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          element={
            <AuthGuard session={session}>
              <Layout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<MyTrips />} />
          <Route path="/plan" element={<PlanTrip />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
