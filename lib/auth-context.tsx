'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { checkIsAuthorized } from './actions'

// Thin provider — ClerkProvider in layout handles the session
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useAuth() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      checkIsAuthorized().then(setIsAuthorized)
    } else if (isLoaded && !user) {
      setIsAuthorized(false)
    }
  }, [isLoaded, user])

  return {
    user,
    isAuthorized,
    loading: !isLoaded,
    signOut: () => signOut(),
  }
}
