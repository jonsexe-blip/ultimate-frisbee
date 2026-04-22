export const dynamic = 'force-dynamic'

import { AuthProvider } from '@/lib/auth-context'
import { GameProvider } from '@/lib/game-context'
import { AppShell } from '@/components/app-shell'

export default function Home() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </AuthProvider>
  )
}
