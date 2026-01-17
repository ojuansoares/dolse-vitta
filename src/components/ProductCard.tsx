import { useState } from "react"
import { Plus, Minus, GripVertical, Pencil } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Product {
  id: string
  p_name: string
  p_description?: string
  p_price: number
  p_image_url?: string
  p_is_available?: boolean
}

interface ProductCardProps {
  product: Product
  isEditing?: boolean
  onEdit?: (product: Product) => void
}

export default function ProductCard({ product, isEditing, onEdit }: ProductCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const { user } = useAuth()

  const cartItem = items.find((i) => i.id === product.id)
  const quantity = cartItem?.quantity || 0

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    addItem({
      id: product.id,
      name: product.p_name,
      price: product.p_price,
      image_url: product.p_image_url,
    })
  }

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1)
    } else {
      removeItem(product.id)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const handleCardClick = () => {
    if (!isEditing) {
      setShowDetails(true)
    }
  }

  return (
    <>
      {/* Product Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-cream-50 max-w-md mx-4 p-0 overflow-hidden">
          {/* Image */}
          <div className="relative aspect-video overflow-hidden bg-cream-100">
            {product.p_image_url ? (
              <img
                src={product.p_image_url}
                alt={product.p_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🧁</span>
              </div>
            )}
            {!product.p_is_available && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="px-4 py-2 rounded-full bg-white/90 text-sm font-medium">
                  Indisponível
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-brown-600 text-left">
                {product.p_name}
              </DialogTitle>
            </DialogHeader>

            {product.p_description && (
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {product.p_description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <span className="text-2xl font-bold text-brown-600">
                {formatPrice(product.p_price)}
              </span>

              {/* Add to cart - only for non-admin users */}
              {!user && product.p_is_available !== false && (
                <div className="flex items-center gap-2">
                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 bg-brown-500/10 rounded-full px-1">
                      <button
                        onClick={() => handleRemove()}
                        className="p-2 rounded-full hover:bg-brown-500/20 transition-all duration-300"
                      >
                        <Minus className="w-5 h-5 text-brown-600" />
                      </button>
                      <span className="w-8 text-center text-lg font-semibold text-brown-600">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleAdd()}
                        className="p-2 rounded-full hover:bg-brown-500/20 transition-all duration-300"
                      >
                        <Plus className="w-5 h-5 text-brown-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd()}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-brown-600 text-white hover:bg-brown-700 transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Adicionar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card */}
      <div
        onClick={handleCardClick}
        className={cn(
          "group relative glass-card rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer",
          "hover:shadow-xl hover:shadow-brown-500/10 hover:-translate-y-1",
          isEditing && "ring-2 ring-brown-500/30",
        )}
      >
        {/* Drag handle for admin */}
      {isEditing && (
        <div className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-brown-500" />
        </div>
      )}

      {/* Edit button for admin */}
      {isEditing && onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(product); }}
          className="absolute top-2 right-2 z-10 p-2 rounded-xl bg-white/80 backdrop-blur hover:bg-white transition-all duration-300"
        >
          <Pencil className="w-4 h-4 text-brown-600" />
        </button>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        {product.p_image_url ? (
          <img
            src={product.p_image_url || "/placeholder.svg"}
            alt={product.p_name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-brown-300">🧁</span>
          </div>
        )}

        {/* Unavailable overlay */}
        {!product.p_is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-white/90 text-sm font-medium text-foreground">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-foreground line-clamp-1">{product.p_name}</h3>

        {product.p_description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.p_description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-brown-600">{formatPrice(product.p_price)}</span>

          {/* Add to cart - only for non-admin users */}
          {!user && product.p_is_available !== false && (
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {quantity > 0 ? (
                <div className="flex items-center gap-1 bg-brown-500/10 rounded-full">
                  <button
                    onClick={handleRemove}
                    className="p-1.5 rounded-full hover:bg-brown-500/20 transition-all duration-300"
                  >
                    <Minus className="w-4 h-4 text-brown-600" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-brown-600">{quantity}</span>
                  <button
                    onClick={handleAdd}
                    className="p-1.5 rounded-full hover:bg-brown-500/20 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 text-brown-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="p-2 rounded-full bg-brown-600 text-white hover:bg-brown-700 transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
