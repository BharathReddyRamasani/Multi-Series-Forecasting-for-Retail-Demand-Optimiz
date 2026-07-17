import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, getToken, setToken, clearToken } from '../api/client'

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
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  globalStoreId: number
  setGlobalStoreId: (storeId: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [globalStoreId, setGlobalStoreId] = useState<number>(1)
  const navigate = useNavigate()

  // On mount, if we have a token, validate it by fetching the current user.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoaded(true)
      return
    }
    apiClient
      .me()
      .then((u) => setUser(u as User))
      .catch(() => clearToken())
      .finally(() => setIsLoaded(true))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await apiClient.login(username, password)
    setToken(res.access_token)
    const me = await apiClient.me()
    setUser(me as User)
  }

  const logout = () => {
    clearToken()
    setUser(null)
    navigate('/landing')
  }

  const mappedUser: User | null = user
    ? {
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles ?? [],
      }
    : null

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        isAuthenticated: !!mappedUser,
        isLoaded,
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
