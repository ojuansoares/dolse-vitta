import { GripVertical, Pencil, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
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
  isAdmin?: boolean
  onEditCategory?: (category: Category) => void
  onEditProduct?: (product: Product) => void
  onAddProduct?: (categoryId: string) => void
  onDeleteCategory?: (categoryId: string) => void
}

export default function CategorySection({ category, isEditing, isAdmin, onEditCategory, onEditProduct, onAddProduct, onDeleteCategory }: CategorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  // Filter unavailable products for non-admin users
  const allProducts = category.products || []
  const products = isAdmin ? allProducts : allProducts.filter(p => p.p_is_available !== false)

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

        {/* Delete button for admin */}
        {isEditing && onDeleteCategory && (
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="p-2 rounded-xl hover:bg-red-500/10 transition-all duration-300"
            title="Excluir categoria e todos os produtos"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
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
        {/* Add Product Button (only in edit mode) */}
        {isEditing && onAddProduct && (
          <button
            onClick={() => onAddProduct(category.id)}
            className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brown-300 text-brown-600 hover:bg-brown-50 hover:border-brown-400 transition-all duration-300"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Adicionar Produto</span>
          </button>
        )}

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
