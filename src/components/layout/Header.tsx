import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Compass, LogOut, User, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, isDemoMode } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface HeaderProps {
  username?: string
}

const navItems = [
  { to: '/', label: 'My Trips', end: true },
  { to: '/plan', label: 'Plan a trip', end: false },
  { to: '/profile', label: 'Profile', end: false },
]

export function Header({ username }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'transition-colors hover:text-foreground',
      isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
    )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Voya</span>
          {isDemoMode && (
            <span className="ml-1 rounded-full border border-honey/50 bg-honey/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-honey">
              Demo
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop user actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/plan"><Plus className="h-4 w-4" /> New trip</Link>
          </Button>
          {username && (
            <Link to="/profile" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <User className="h-4 w-4" />
              {username}
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
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
              <User className="h-4 w-4" /> {username}
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn('block text-sm', isActive ? 'text-foreground font-medium' : 'text-muted-foreground')
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 px-0">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      )}
    </header>
  )
}
