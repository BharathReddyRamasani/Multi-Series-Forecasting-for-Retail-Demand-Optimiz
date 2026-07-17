import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/clerk-react'

interface User {
  username: string
  email?: string | null
  full_name?: string | null
  roles: string[]
  disabled?: boolean
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user: clerkUser } = useClerkUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const [globalStoreId, setGlobalStoreId] = useState<number>(1)

  useEffect(() => {
    import('../api/client').then(({ setGetTokenFn }) => {
      setGetTokenFn(async () => {
        if (!isSignedIn) return null;
        try {
          return await getToken();
        } catch (e) {
          return null;
        }
      })
    })
  }, [isSignedIn, getToken])

  const login = () => {
    navigate('/login')
  }

  const logout = () => {
    signOut(() => navigate('/landing'))
  }

  const mappedUser: User | null = clerkUser ? {
    username: clerkUser.username || clerkUser.firstName || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    roles: ['user'],
  } : null

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        isAuthenticated: !!isSignedIn,
        isLoaded: isAuthLoaded,
        login,
        logout,
        globalStoreId,
        setGlobalStoreId,
      }}
    >
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
