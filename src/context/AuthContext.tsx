'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAdminRole = useCallback(async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error checking admin role:', error.message)
        setIsAdmin(false)
        return
      }

      setIsAdmin(!!data)
    } catch (error) {
      console.error('Error checking admin role:', error)
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      checkAdminRole(session?.user?.id)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      checkAdminRole(session?.user?.id)
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (user?.id) {
      checkAdminRole(user.id)
    }
  }, [user?.id, checkAdminRole])

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
