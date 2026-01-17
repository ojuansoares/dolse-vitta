"use client"

import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { cn } from "../lib/utils"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Dolce Vitta</h1>
          <p className="text-muted-foreground mt-2">Área Administrativa</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-sm text-center">{error}</div>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={cn(
                "w-full px-4 py-3 rounded-xl border border-border bg-cream-50",
                "focus:outline-none focus:ring-2 focus:ring-brown-500/30 focus:border-brown-500",
                "transition-apple",
              )}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full px-4 py-3 pr-12 rounded-xl border border-border bg-cream-50",
                  "focus:outline-none focus:ring-2 focus:ring-brown-500/30 focus:border-brown-500",
                  "transition-apple",
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-apple"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "bg-brown-600 text-white font-medium",
              "hover:bg-brown-700 transition-apple",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">Acesso restrito aos administradores</p>
      </div>
    </div>
  )
}
