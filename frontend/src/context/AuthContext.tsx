import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoaded: boolean
  login: () => void
  logout: () => void
  globalStoreId: number
  setGlobalStoreId: (storeId: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/clerk-react'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser()
  const clerk = useClerk()
  
  const [globalStoreId, setGlobalStoreId] = useState<number>(1)
  const navigate = useNavigate()

  const login = () => {
    clerk.openSignIn()
  }

  const logout = () => {
    signOut()
    navigate('/landing')
  }

  const mappedUser = clerkUser ? {
    name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    role: 'Store Manager',
  } : null

  const isFullyLoaded = isLoaded && isUserLoaded
  const isAuthenticated = isFullyLoaded && isSignedIn

  return (
    <AuthContext.Provider value={{ user: mappedUser, isAuthenticated: !!isAuthenticated, isLoaded: isFullyLoaded, login, logout, globalStoreId, setGlobalStoreId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
