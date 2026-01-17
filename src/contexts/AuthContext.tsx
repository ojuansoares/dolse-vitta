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
    
    console.log('AuthProvider mounting...')
    
    // Set up auth state listener FIRST - this is the reliable way
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        if (!isMounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(async () => {
            if (!isMounted) return
            const profile = await fetchAdminProfile(session.user.id)
            if (isMounted) setAdminProfile(profile)
            setLoading(false)
          }, 0)
        } else {
          setAdminProfile(null)
          setLoading(false)
        }
      }
    )
    
    // Then check for existing session (but don't block on it)
    const checkSession = async () => {
      try {
        console.log('Checking initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Initial session error:', error)
          if (isMounted) setLoading(false)
          return
        }
        
        console.log('Initial session:', session ? session.user?.email : 'None')
        
        // Only set if we haven't received an auth state change yet
        if (isMounted && loading) {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            const profile = await fetchAdminProfile(session.user.id)
            if (isMounted) setAdminProfile(profile)
          }
          
          setLoading(false)
        }
      } catch (err) {
        console.error('Error checking initial session:', err)
        if (isMounted) setLoading(false)
      }
    }
    
    // Small delay before checking session to let onAuthStateChange fire first
    const sessionTimeout = setTimeout(checkSession, 100)
    
    // Fallback timeout in case everything fails
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth fallback timeout - forcing loading to false')
        setLoading(false)
      }
    }, 3000)

    return () => {
      isMounted = false
      clearTimeout(sessionTimeout)
      clearTimeout(fallbackTimeout)
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
      }
    }
  }

  const signOut = async () => {
    try {
      // Try normal signout first
      await supabase.auth.signOut()
    } catch (err) {
      console.error('SignOut error (continuing anyway):', err)
    }
    
    // Force clear all auth data
    setUser(null)
    setSession(null)
    setAdminProfile(null)
    
    // Clear all Supabase related storage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('dolce-vitta') || key.includes('sb-'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Clear sessionStorage too
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('dolce-vitta') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    console.log('Logout complete - all auth data cleared')
    
    // Force reload to clean state
    window.location.href = '/login'
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
