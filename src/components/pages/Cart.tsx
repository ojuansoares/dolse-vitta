import { Link } from "react-router-dom"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { cn } from "@/lib/utils"

export default function Cart() {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream-200 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-brown-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">Adicione delícias do nosso cardápio!</p>
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
        <Link to="/" className="p-2 rounded-xl hover:bg-brown-500/10 transition-all duration-300">
          <ArrowLeft className="w-5 h-5 text-brown-600" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Seu Carrinho</h1>
          <p className="text-muted-foreground text-sm">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4 mb-8">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="glass-card rounded-2xl p-4 flex gap-4 animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
              {item.image_url ? (
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🧁</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{item.name}</h3>
              <p className="text-brown-600 font-semibold mt-1">{formatPrice(item.price)}</p>

              {/* Quantity controls */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 bg-cream-100 rounded-full">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 rounded-full hover:bg-cream-200 transition-all duration-300"
                  >
                    <Minus className="w-4 h-4 text-brown-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 rounded-full hover:bg-cream-200 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 text-brown-600" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-medium text-foreground">Total</span>
          <span className="text-2xl font-bold text-brown-600">{formatPrice(total)}</span>
        </div>

        <Link
          to="/finalizar"
          className={cn(
            "flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl",
            "bg-brown-600 text-white font-medium text-lg",
            "hover:bg-brown-700 transition-all duration-300",
          )}
        >
          Continuar para Finalização
        </Link>
      </div>
    </main>
  )
}
