import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { checkoutApi } from "@/services/api"
import { cn } from "@/lib/utils"

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const [customerName, setCustomerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      setError("Por favor, informe seu nome")
      return
    }

    if (items.length === 0) {
      setError("Seu carrinho está vazio")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build WhatsApp message (fallback)
      const itemsList = items
        .map((item) => `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`)
        .join("\n")
      const message = `Olá! Gostaria de fazer um pedido:\n\n${itemsList}\n\n*Total: ${formatPrice(total)}*\n\nNome: ${customerName.trim()}`

      try {
        const response = await checkoutApi.create({
          customer_name: customerName.trim(),
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        })

        clearCart()

        // Use response data
        if (response?.whatsapp_number) {
          const encodedMessage = encodeURIComponent(response.whatsapp_message || message)
          window.location.href = `https://wa.me/${response.whatsapp_number}?text=${encodedMessage}`
        } else {
          // Fallback with default number
          const encodedMessage = encodeURIComponent(message)
          window.location.href = `https://wa.me/5511999999999?text=${encodedMessage}`
        }
      } catch {
        // If API fails, still redirect to WhatsApp with mock number
        clearCart()
        const encodedMessage = encodeURIComponent(message)
        window.location.href = `https://wa.me/5511999999999?text=${encodedMessage}`
      }
    } catch (err) {
      console.error("Error creating order:", err)
      setError("Erro ao criar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20 animate-fade-in">
          <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
          <Link
            to="/"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
              "bg-brown-600 text-white font-medium",
              "hover:bg-brown-700 transition-all duration-300",
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Ver Cardápio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link to="/carrinho" className="p-2 rounded-xl hover:bg-brown-500/10 transition-all duration-300">
          <ArrowLeft className="w-5 h-5 text-brown-600" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Finalizar Pedido</h1>
          <p className="text-muted-foreground text-sm">Revise seu pedido e confirme pelo WhatsApp</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up">
        <h2 className="font-medium text-foreground mb-4">Resumo do Pedido</h2>

        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium text-foreground">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="font-medium text-foreground">Total</span>
          <span className="text-xl font-bold text-brown-600">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Customer Info Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-6 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className="font-medium text-foreground mb-4">Seus Dados</h2>

        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Seu Nome
          </label>
          <input
            type="text"
            id="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Como podemos te chamar?"
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-border bg-cream-50",
              "focus:outline-none focus:ring-2 focus:ring-brown-500/30 focus:border-brown-500",
              "transition-all duration-300",
            )}
            required
          />
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl",
            "bg-green-500 text-white font-medium text-lg",
            "hover:bg-green-600 transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              Finalizar pelo WhatsApp
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Ao clicar, você será redirecionado para o WhatsApp para confirmar seu pedido
        </p>
      </form>
    </main>
  )
}
