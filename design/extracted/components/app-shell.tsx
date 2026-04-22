'use client'

import { useState } from 'react'
import { Calendar, Play, BarChart3, Users, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScheduleView } from './views/schedule-view'
import { GameTrackerView } from './views/game-tracker-view'
import { GameStatsView } from './views/game-stats-view'
import { SeasonStatsView } from './views/season-stats-view'
import { RosterView } from './views/roster-view'

type View = 'schedule' | 'tracker' | 'game-stats' | 'season-stats' | 'roster'

const navItems = [
  { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
  { id: 'tracker' as const, label: 'Live', icon: Play },
  { id: 'game-stats' as const, label: 'Game', icon: BarChart3 },
  { id: 'season-stats' as const, label: 'Season', icon: Trophy },
  { id: 'roster' as const, label: 'Roster', icon: Users },
]

export function AppShell() {
  const [currentView, setCurrentView] = useState<View>('schedule')

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card">
        <img 
          src="/images/team-logo.png" 
          alt="Team Logo" 
          className="size-6 object-contain"
        />
        <h1 className="text-sm font-bold text-foreground">Central Revolution</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'schedule' && <ScheduleView onStartGame={() => setCurrentView('tracker')} />}
        {currentView === 'tracker' && <GameTrackerView />}
        {currentView === 'game-stats' && <GameStatsView />}
        {currentView === 'season-stats' && <SeasonStatsView />}
        {currentView === 'roster' && <RosterView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around border-t border-border bg-card px-1 py-1 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px]',
              currentView === item.id 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <item.icon className="size-4" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
