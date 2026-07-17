import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const { isSignedIn, isLoaded, signOut } = useClerkAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser()
  const clerk = useClerk()

  React.useEffect(() => {
    import('../api/client').then(({ setGetTokenFn }) => {
      setGetTokenFn(async () => {
        if (clerk.session) {
          return await clerk.session.getToken()
        }
        return null
      })
    })
  }, [clerk.session])

  const [globalStoreId, setGlobalStoreId] = useState<number>(1)
  const navigate = useNavigate()

  const login = () => {
    clerk.openSignIn()
  }

  const logout = () => {
    signOut()
    navigate('/landing')
  }

  const mappedUser: User | null = clerkUser ? {
    username: clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    full_name: clerkUser.fullName || '',
    roles: ['user'],
  } : null

  const isFullyLoaded = isLoaded && isUserLoaded

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        isAuthenticated: !!isSignedIn,
        isLoaded: isFullyLoaded,
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
