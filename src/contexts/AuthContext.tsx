import { createContext, useEffect, useState, type ReactNode } from "react"
import { authApi } from "../services/api"

interface User {
  id: string
  email: string
}

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
  adminProfile: AdminProfile | null
  loading: boolean
  isLoggingOut: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginExiting, setLoginExiting] = useState(false)
  const [logoutExiting, setLogoutExiting] = useState(false)

  useEffect(() => {
    // Check for saved session
    const checkSession = async () => {
      try {
        const saved = localStorage.getItem("dolce-vitta-auth")
        if (saved) {
          const data = JSON.parse(saved)
          setUser(data.user)
          setAdminProfile(data.adminProfile)
        }
      } catch (e) {
        console.error("Error checking session:", e)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    const response = await authApi.login(email, password)

    // Backend should return: { token, user, adminProfile }
    const { token, user: userData, admin_profile } = response

    const authUser: User = {
      id: userData.id,
      email: userData.email,
    }

    const profile: AdminProfile | null = admin_profile
      ? {
          id: admin_profile.id,
          a_email: admin_profile.a_email,
          a_name: admin_profile.a_name,
          a_phone: admin_profile.a_phone,
          a_avatar_url: admin_profile.a_avatar_url,
          a_is_active: admin_profile.a_is_active,
        }
      : null

    // Show welcome screen
    setIsLoggingIn(true)
    setLoginExiting(false)
    
    setUser(authUser)
    setAdminProfile(profile)
    localStorage.setItem(
      "dolce-vitta-auth",
      JSON.stringify({
        token,
        user: authUser,
        adminProfile: profile,
      }),
    )
    
    // Wait then start fade-out animation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoginExiting(true)
    
    // Wait for fade-out animation
    await new Promise(resolve => setTimeout(resolve, 400))
    setIsLoggingIn(false)
    setLoginExiting(false)
  }

  const signOut = async () => {
    setIsLoggingOut(true)
    setLogoutExiting(false)
    
    // Wait for animation to show
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Start fade-out
    setLogoutExiting(true)
    
    // Wait for fade-out animation
    await new Promise(resolve => setTimeout(resolve, 400))
    
    setUser(null)
    setAdminProfile(null)
    localStorage.removeItem("dolce-vitta-auth")
    
    // Reload the page
    window.location.reload()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        adminProfile,
        loading,
        isLoggingOut,
        signIn,
        signOut,
      }}
    >
      {/* Login welcome overlay */}
      {isLoggingIn && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-cream-50 ${loginExiting ? 'animate-fade-out' : ''}`}>
          <div className={`text-center ${loginExiting ? '' : 'animate-fade-in'}`}>
            <div className="text-6xl mb-4">🍰</div>
            <h2 className="font-serif text-3xl font-bold text-brown-600 mb-2">Bem-vindo!</h2>
            <p className="text-muted-foreground">Entrando no modo admin...</p>
          </div>
        </div>
      )}
      {/* Logout overlay */}
      {isLoggingOut && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-cream-50 ${logoutExiting ? 'animate-fade-out' : ''}`}>
          <div className={`text-center ${logoutExiting ? '' : 'animate-fade-in'}`}>
            <div className="text-6xl mb-4">👋</div>
            <h2 className="font-serif text-3xl font-bold text-brown-600 mb-2">Até logo!</h2>
            <p className="text-muted-foreground">Volte sempre 🍰</p>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}
