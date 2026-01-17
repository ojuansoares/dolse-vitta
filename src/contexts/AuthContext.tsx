import { createContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface AdminProfile {
  id: string
  a_email: string
  a_name: string | null
  a_phone: string | null
  a_avatar_url: string | null
  a_is_active: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  adminProfile: AdminProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch admin profile from our table
  const fetchAdminProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching admin profile:', error)
        return null
      }
      return data as AdminProfile
    } catch (err) {
      console.error('Error fetching admin profile:', err)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true
    
    // Check current session with timeout
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profile = await fetchAdminProfile(session.user.id)
          if (isMounted) setAdminProfile(profile)
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth check timeout - forcing loading to false')
        setLoading(false)
      }
    }, 5000)
    
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profile = await fetchAdminProfile(session.user.id)
          if (isMounted) setAdminProfile(profile)
        } else {
          setAdminProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // Check if user is an active admin
    if (data.user) {
      const profile = await fetchAdminProfile(data.user.id)
      if (!profile || !profile.a_is_active) {
        await supabase.auth.signOut()
        throw new Error('Access denied. You are not an admin.')
      }
      setAdminProfile(profile)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    // 1. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw error
    
    // 2. Create admin profile in our table
    if (data.user) {
      const { error: insertError } = await supabase
        .from('admin')
        .insert({
          id: data.user.id,
          a_email: email,
          a_name: name || null,
          a_is_active: true,
        })
      
      if (insertError) {
        console.error('Error creating admin profile:', insertError)
        // Note: User was created in auth but admin profile failed
        // This should be handled by backend as fallback
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setAdminProfile(null)
  }

  const value = {
    user,
    session,
    adminProfile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
