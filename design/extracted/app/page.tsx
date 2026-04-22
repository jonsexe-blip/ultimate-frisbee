import { GameProvider } from '@/lib/game-context'
import { AppShell } from '@/components/app-shell'

export default function Home() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  )
}
