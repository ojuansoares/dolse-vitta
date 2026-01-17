import { useState, useEffect } from "react"
import { categoriesApi, productsApi } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import CategorySection from "@/components/CategorySection"
import FloatingEditButton from "@/components/FloatingEditButton"
import EditModal from "@/components/EditModal"

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
  const [hasChanges, setHasChanges] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Mock data for demo
      const mockCategories: Category[] = [
        {
          id: "1",
          c_name: "Bolos",
          c_description: "Bolos artesanais para todas as ocasiões",
          c_sort_order: 1,
          products: [
            {
              id: "1",
              p_name: "Bolo de Chocolate",
              p_description: "Delicioso bolo de chocolate com cobertura",
              p_price: 89.9,
              p_is_available: true,
              p_category_id: "1",
            },
            {
              id: "2",
              p_name: "Bolo Red Velvet",
              p_description: "Clássico bolo red velvet com cream cheese",
              p_price: 99.9,
              p_is_available: true,
              p_category_id: "1",
            },
            {
              id: "3",
              p_name: "Bolo de Cenoura",
              p_description: "Tradicional bolo de cenoura com cobertura de chocolate",
              p_price: 79.9,
              p_is_available: true,
              p_category_id: "1",
            },
          ],
        },
        {
          id: "2",
          c_name: "Docinhos",
          c_description: "Docinhos finos para festas",
          c_sort_order: 2,
          products: [
            {
              id: "4",
              p_name: "Brigadeiro Gourmet",
              p_description: "Brigadeiro tradicional (unidade)",
              p_price: 4.5,
              p_is_available: true,
              p_category_id: "2",
            },
            {
              id: "5",
              p_name: "Beijinho",
              p_description: "Beijinho de coco (unidade)",
              p_price: 4.5,
              p_is_available: true,
              p_category_id: "2",
            },
            {
              id: "6",
              p_name: "Cajuzinho",
              p_description: "Cajuzinho tradicional (unidade)",
              p_price: 4.5,
              p_is_available: true,
              p_category_id: "2",
            },
            {
              id: "7",
              p_name: "Trufa de Maracujá",
              p_description: "Trufa recheada com maracujá",
              p_price: 6.0,
              p_is_available: true,
              p_category_id: "2",
            },
          ],
        },
        {
          id: "3",
          c_name: "Tortas",
          c_description: "Tortas doces e salgadas",
          c_sort_order: 3,
          products: [
            {
              id: "8",
              p_name: "Torta de Limão",
              p_description: "Torta de limão siciliano com merengue",
              p_price: 75.0,
              p_is_available: true,
              p_category_id: "3",
            },
            {
              id: "9",
              p_name: "Torta Holandesa",
              p_description: "Clássica torta holandesa",
              p_price: 85.0,
              p_is_available: true,
              p_category_id: "3",
            },
          ],
        },
      ]

      try {
        const [categoriesResponse, productsResponse] = await Promise.all([categoriesApi.list(), productsApi.list()])

        console.log("API Response - Categories:", categoriesResponse)
        console.log("API Response - Products:", productsResponse)

        // Backend returns { success: true, categories: [...] } and { success: true, products: [...] }
        const categoriesRaw = categoriesResponse?.categories || categoriesResponse || []
        const productsRaw = productsResponse?.products || productsResponse || []

        console.log("Raw Categories:", categoriesRaw)
        console.log("Raw Products:", productsRaw)

        // Backend already returns prefixed fields (c_name, p_name, etc.)
        // Just use them directly
        const categoriesData: Category[] = categoriesRaw.map((c: any) => ({
          id: c.id,
          c_name: c.c_name,
          c_description: c.c_description,
          c_image_url: c.c_image_url,
          c_sort_order: c.c_sort_order || 0,
          c_is_active: c.c_is_active ?? true,
        }))

        const productsData: Product[] = productsRaw.map((p: any) => ({
          id: p.id,
          p_name: p.p_name,
          p_description: p.p_description,
          p_price: p.p_price,
          p_image_url: p.p_image_url,
          p_is_available: p.p_is_available ?? true,
          p_sort_order: p.p_sort_order || 0,
          p_category_id: p.p_category_id,
        }))

        console.log("Transformed Categories:", categoriesData)
        console.log("Transformed Products:", productsData)

        const categoriesWithProducts = categoriesData
          .sort((a: Category, b: Category) => (a.c_sort_order || 0) - (b.c_sort_order || 0))
          .map((category: Category) => ({
            ...category,
            products: productsData
              .filter((p: Product) => p.p_category_id === category.id)
              .sort((a: Product, b: Product) => (a.p_sort_order || 0) - (b.p_sort_order || 0)),
          }))

        console.log("Final Categories with Products:", categoriesWithProducts)

        // Only use mock if NO categories returned at all
        if (categoriesData.length > 0) {
          setCategories(categoriesWithProducts)
        } else {
          setCategories(mockCategories)
        }
      } catch (error) {
        console.error("API Error:", error)
        // Use mock data if API fails
        setCategories(mockCategories)
      }
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
      setHasChanges(true)
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
      setHasChanges(true)
      fetchData()
    } catch (err) {
      console.error("Error saving product:", err)
    }
  }

  const handleFinishEditing = () => {
    setIsEditing(false)
    setHasChanges(false)
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
            className="px-4 py-2 bg-brown-600 text-white rounded-xl hover:bg-brown-700 transition-all duration-300"
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
          hasChanges={hasChanges}
          onSave={handleFinishEditing}
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
