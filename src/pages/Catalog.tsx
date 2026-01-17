"use client"

import { useState, useEffect } from "react"
import { categoriesApi, productsApi } from "../services/api"
import { useAuth } from "../hooks/useAuth"
import CategorySection from "../components/CategorySection"
import FloatingEditButton from "../components/FloatingEditButton"
import EditModal from "../components/EditModal"

interface Product {
  id: string
  p_name: string
  p_description?: string
  p_price: number
  p_image_url?: string
  p_is_available?: boolean
  p_sort_order?: number
  p_category_id?: string
}

interface Category {
  id: string
  c_name: string
  c_description?: string
  c_image_url?: string
  c_sort_order?: number
  c_is_active?: boolean
  products?: Product[]
}

export default function Catalog() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Admin editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, productsResponse] = await Promise.all([categoriesApi.list(), productsApi.list()])

      console.log("Raw categoriesResponse:", categoriesResponse)
      console.log("Raw productsResponse:", productsResponse)

      // Extract arrays from API response
      const categoriesData = categoriesResponse?.categories || []
      const productsData = productsResponse?.products || []

      console.log("categoriesData:", categoriesData)
      console.log("productsData:", productsData)
      console.log("First category ID:", categoriesData[0]?.id)
      console.log("First product category_id:", productsData[0]?.p_category_id)

      // Group products by category
      const categoriesWithProducts = categoriesData
        .sort((a: Category, b: Category) => (a.c_sort_order || 0) - (b.c_sort_order || 0))
        .map((category: Category) => {
          const categoryProducts = productsData.filter((p: Product) => p.p_category_id === category.id)
          console.log(`Category ${category.c_name} (${category.id}): ${categoryProducts.length} products`)
          return {
            ...category,
            products: categoryProducts.sort((a: Product, b: Product) => (a.p_sort_order || 0) - (b.p_sort_order || 0)),
          }
        })

      console.log("categoriesWithProducts:", categoriesWithProducts)
      setCategories(categoriesWithProducts)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Erro ao carregar o cardápio")
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
  }

  const handleSaveCategory = async (data: Partial<Category>) => {
    if (!editingCategory) return

    try {
      await categoriesApi.update(editingCategory.id, {
        name: data.c_name,
        description: data.c_description,
        image_url: data.c_image_url,
      })
      setEditingCategory(null)
      fetchData()
    } catch (err) {
      console.error("Error saving category:", err)
    }
  }

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (!editingProduct) return

    try {
      await productsApi.update(editingProduct.id, {
        name: data.p_name,
        description: data.p_description,
        price: data.p_price,
        image_url: data.p_image_url,
        is_available: data.p_is_available,
      })
      setEditingProduct(null)
      fetchData()
    } catch (err) {
      console.error("Error saving product:", err)
    }
  }


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brown-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-brown-600 text-white rounded-xl hover:bg-brown-700 transition-apple"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section */}
      <header className="text-center mb-12 animate-fade-in">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">Nosso Cardápio</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Delícias artesanais feitas com amor e ingredientes selecionados
        </p>
      </header>

      {/* Categories */}
      <div className="space-y-12">
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              isEditing={isEditing}
              onEditCategory={handleEditCategory}
              onEditProduct={handleEditProduct}
            />
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Nenhum produto disponível no momento</p>
          </div>
        )}
      </div>

      {/* Admin floating button */}
      {user && (
        <FloatingEditButton
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <EditModal
          title="Editar Categoria"
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
          fields={[
            { key: "c_name", label: "Nome", type: "text", value: editingCategory.c_name },
            { key: "c_description", label: "Descrição", type: "textarea", value: editingCategory.c_description || "" },
            { key: "c_image_url", label: "URL da Imagem", type: "text", value: editingCategory.c_image_url || "" },
          ]}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditModal
          title="Editar Produto"
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
          fields={[
            { key: "p_name", label: "Nome", type: "text", value: editingProduct.p_name },
            { key: "p_description", label: "Descrição", type: "textarea", value: editingProduct.p_description || "" },
            { key: "p_price", label: "Preço", type: "number", value: editingProduct.p_price },
            { key: "p_image_url", label: "URL da Imagem", type: "text", value: editingProduct.p_image_url || "" },
            {
              key: "p_is_available",
              label: "Disponível",
              type: "checkbox",
              value: editingProduct.p_is_available ?? true,
            },
          ]}
        />
      )}
    </main>
  )
}
