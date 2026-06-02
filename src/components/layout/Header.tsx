import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, MapPin, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  username?: string
}

export function Header({ username }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          TripForge
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            My Trips
          </Link>
          <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
            Discover
          </Link>
        </nav>

        {/* Desktop user actions */}
        <div className="hidden md:flex items-center gap-3">
          {username && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {username}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          {username && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {username}
            </p>
          )}
          <Link
            to="/"
            className="block text-sm hover:text-foreground text-muted-foreground"
            onClick={() => setMenuOpen(false)}
          >
            My Trips
          </Link>
          <Link
            to="/discover"
            className="block text-sm hover:text-foreground text-muted-foreground"
            onClick={() => setMenuOpen(false)}
          >
            Discover
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 px-0">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      )}
    </header>
  )
}
