import { GripVertical, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import ProductCard from "@/components/ProductCard"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  p_name: string
  p_description?: string
  p_price: number
  p_image_url?: string
  p_is_available?: boolean
  p_sort_order?: number
}

interface Category {
  id: string
  c_name: string
  c_description?: string
  c_image_url?: string
  c_sort_order?: number
  products?: Product[]
}

interface CategorySectionProps {
  category: Category
  isEditing?: boolean
  onEditCategory?: (category: Category) => void
  onEditProduct?: (product: Product) => void
}

export default function CategorySection({ category, isEditing, onEditCategory, onEditProduct }: CategorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const products = category.products || []

  return (
    <section className="animate-fade-in">
      {/* Category Header */}
      <div
        className={cn(
          "flex items-center gap-3 mb-6",
          isEditing && "p-3 rounded-xl bg-brown-500/5 border border-brown-500/20",
        )}
      >
        {/* Drag handle for admin */}
        {isEditing && (
          <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-brown-500/10 transition-all duration-300">
            <GripVertical className="w-5 h-5 text-brown-500" />
          </div>
        )}

        <div className="flex-1">
          <h2 className="font-serif text-2xl font-bold text-foreground">{category.c_name}</h2>
          {category.c_description && <p className="mt-1 text-sm text-muted-foreground">{category.c_description}</p>}
        </div>

        {/* Edit button for admin */}
        {isEditing && onEditCategory && (
          <button
            onClick={() => onEditCategory(category)}
            className="p-2 rounded-xl hover:bg-brown-500/10 transition-all duration-300"
          >
            <Pencil className="w-5 h-5 text-brown-600" />
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-brown-500/10 transition-all duration-300"
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Products Grid */}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300",
          isCollapsed && "hidden",
        )}
      >
        {products
          .sort((a, b) => (a.p_sort_order || 0) - (b.p_sort_order || 0))
          .map((product) => (
            <ProductCard key={product.id} product={product} isEditing={isEditing} onEdit={onEditProduct} />
          ))}
      </div>

      {products.length === 0 && !isCollapsed && (
        <div className="text-center py-12 text-muted-foreground">Nenhum produto nesta categoria</div>
      )}
    </section>
  )
}
