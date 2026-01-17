import type React from "react"

import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { CartProvider } from "./contexts/CartContext"

// Pages
import Catalog from "./components/pages/Catalog"
import About from "./components/pages/About"
import Cart from "./components/pages/Cart"
import Checkout from "./components/pages/Checkout"
import Login from "./components/pages/Login"
import OrderHistory from "./components/pages/OrderHistory"

// Components
import Navbar from "./components/Navbar"

// Splash Screen Component
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Depois de 1.5s, começa o fade out
    const showTimer = setTimeout(() => {
      setIsExiting(true)
    }, 1500)

    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (isExiting) {
      // Aguarda a animação de fade-out terminar (400ms) antes de remover
      const exitTimer = setTimeout(() => {
        onFinish()
      }, 400)
      return () => clearTimeout(exitTimer)
    }
  }, [isExiting, onFinish])

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-cream-50 ${isExiting ? 'animate-fade-out' : ''}`}>
      <div className={`text-center ${isExiting ? '' : 'animate-fade-in'}`}>
        <div className="text-7xl mb-6">🍰</div>
        <h1 className="font-serif text-4xl font-bold text-brown-600 mb-2">Dolce Vitta</h1>
        <p className="text-muted-foreground">Doces artesanais com amor</p>
      </div>
    </div>
  )
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brown-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function PublicLoginRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brown-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If logged in, redirect to catalog (admin can edit there)
  if (user) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

function App() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Check if we already showed splash this session
    const hasSeenSplash = sessionStorage.getItem("dolce-vitta-splash")
    if (!hasSeenSplash) {
      setShowSplash(true)
    }
  }, [])

  const handleSplashFinish = () => {
    sessionStorage.setItem("dolce-vitta-splash", "true")
    setShowSplash(false)
  }

  return (
    <CartProvider>
      {/* Splash Screen - only once per session */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      <div className="min-h-screen bg-cream-50">
        <Navbar />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Catalog />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/finalizar" element={<Checkout />} />

          {/* Hidden login route */}
          <Route
            path="/login"
            element={
              <PublicLoginRoute>
                <Login />
              </PublicLoginRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/pedidos"
            element={
              <AdminRoute>
                <OrderHistory />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </CartProvider>
  )
}

export default App
