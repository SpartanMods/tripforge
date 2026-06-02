import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { supabase } from '@/lib/supabase'

export function Layout() {
  const [username, setUsername] = useState<string | undefined>()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      if (data) setUsername(data.username)
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header username={username} />
      <main className="flex-1 container py-8">
        <Outlet />
      </main>
    </div>
  )
}
