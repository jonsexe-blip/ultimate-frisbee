'use client'

import { useState } from 'react'
import { Calendar, Play, BarChart3, Users, Trophy, LogIn, LogOut, Lock, ShieldCheck } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useGame } from '@/lib/game-context'
import { ScheduleView } from './views/schedule-view'
import { GameTrackerView } from './views/game-tracker-view'
import { GameStatsView } from './views/game-stats-view'
import { SeasonStatsView } from './views/season-stats-view'
import { RosterView } from './views/roster-view'
import { AdminView } from './views/admin-view'

type View = 'schedule' | 'tracker' | 'game-stats' | 'season-stats' | 'roster' | 'admin'

const PROTECTED_VIEWS: View[] = ['tracker', 'roster', 'admin']
const LOCKED_WHILE_SCORING: View[] = ['game-stats', 'season-stats', 'roster']

const navItems = [
  { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
  { id: 'tracker' as const, label: 'Live', icon: Play, protected: true },
  { id: 'game-stats' as const, label: 'Game', icon: BarChart3 },
  { id: 'season-stats' as const, label: 'Season', icon: Trophy },
  { id: 'roster' as const, label: 'Roster', icon: Users, protected: true },
]

export function AppShell() {
  const { user, isAuthorized, signOut } = useAuth()
  const { openSignIn } = useClerk()
  const { activeGameId } = useGame()
  const [currentView, setCurrentView] = useState<View>('schedule')

  function handleNavClick(viewId: View, isProtected?: boolean) {
    if (isProtected && !isAuthorized) {
      openSignIn()
      return
    }
    if (activeGameId && LOCKED_WHILE_SCORING.includes(viewId)) return
    setCurrentView(viewId)
  }

  const showingProtected = PROTECTED_VIEWS.includes(currentView)

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card">
        <img
          src="/images/team-logo.png"
          alt="Team Logo"
          className="size-6 object-contain"
        />
        <h1 className="text-sm font-bold text-foreground flex-1">Central Revolution</h1>

        {isAuthorized && (
          <button
            onClick={() => setCurrentView('admin')}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded',
              currentView === 'admin'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Access control"
          >
            <ShieldCheck className="size-3.5" />
          </button>
        )}
        {user ? (
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        ) : (
          <button
            onClick={() => openSignIn()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
          >
            <LogIn className="size-3.5" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {showingProtected && !isAuthorized ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <Lock className="size-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">Sign in required</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to be authorized to access this section.
              </p>
            </div>
            <button
              onClick={() => openSignIn()}
              className="text-sm text-primary underline underline-offset-2"
            >
              Sign in
            </button>
          </div>
        ) : (
          <>
            {currentView === 'schedule' && (
              <ScheduleView onStartGame={() => handleNavClick('tracker', true)} />
            )}
            {currentView === 'tracker' && <GameTrackerView />}
            {currentView === 'game-stats' && <GameStatsView />}
            {currentView === 'season-stats' && <SeasonStatsView />}
            {currentView === 'roster' && <RosterView />}
            {currentView === 'admin' && <AdminView />}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around border-t border-border bg-card px-1 py-1 pb-safe">
        {navItems.map((item) => {
          const lockedByGame = !!activeGameId && LOCKED_WHILE_SCORING.includes(item.id)
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.protected)}
              disabled={lockedByGame}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px] relative',
                currentView === item.id
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                lockedByGame && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground'
              )}
            >
              <item.icon className="size-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.protected && !isAuthorized && !lockedByGame && (
                <Lock className="absolute top-0.5 right-0.5 size-2.5 text-muted-foreground/60" />
              )}
              {lockedByGame && (
                <Lock className="absolute top-0.5 right-0.5 size-2.5 text-muted-foreground/60" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
