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
  login: (email: string) => void
  logout: () => void
  globalStoreId: number
  setGlobalStoreId: (storeId: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [globalStoreId, setGlobalStoreId] = useState<number>(1)
  const navigate = useNavigate()

  const login = (email: string) => {
    // Mock login
    const newUser = {
      name: email.split('@')[0],
      email,
      role: 'Store Manager',
    }
    setUser(newUser)
    navigate('/')
  }

  const logout = () => {
    setUser(null)
    navigate('/landing')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, globalStoreId, setGlobalStoreId }}>
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
