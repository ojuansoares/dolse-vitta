import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd"
import { Plus } from "lucide-react"
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
    // Função para reordenar array
    function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    }

    // Handler de drag para categorias e produtos
    const onDragEnd = async (result: DropResult) => {
      const { destination, source, type } = result;

      if (!destination) return;

      // Se nada mudou de lugar, ignora
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) return;

      if (type === "CATEGORY") {
        const newCategories = reorder(categories, source.index, destination.index);
        setCategories(newCategories);
        try {
          await categoriesApi.reorder(newCategories.map((cat, idx) => ({ id: cat.id, sort_order: idx + 1 })));
        } catch (err) {
          console.error("Erro ao reordenar categorias:", err);
        }
      } 
      
      // Agora usamos apenas "PRODUCT"
      else if (type === "PRODUCT") {
        const catId = source.droppableId; // No CategorySection o droppableId é o ID da categoria
        const catIdx = categories.findIndex(c => c.id === catId);
        
        if (catIdx === -1) return;
        
        const category = categories[catIdx];
        const productsInCat = [...(category.products || [])];
        
        // Reordena os produtos daquela categoria específica
        const newProducts = reorder(productsInCat, source.index, destination.index);
        
        // Atualiza o estado das categorias localmente
        const newCategories = [...categories];
        newCategories[catIdx] = { ...category, products: newProducts };
        setCategories(newCategories);

        // Atualiza no backend
        try {
          await productsApi.reorder(newProducts.map((prod, idx) => ({ 
            id: prod.id, 
            sort_order: idx + 1 
          })));
        } catch (err) {
          console.error("Erro ao reordenar produtos:", err);
          // Opcional: recarregar dados se falhar
        }
      }
    };
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    try {
      await productsApi.delete(editingProduct.id);
      setShowDeleteProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Admin editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingProductForCategory, setCreatingProductForCategory] = useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

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


  const handleCreateCategory = async (data: Record<string, any>) => {
    try {
      await categoriesApi.create({
        name: data.c_name,
        description: data.c_description,
        image_url: data.c_image_url,
      })
      setCreatingCategory(false)
      fetchData()
    } catch (err) {
      console.error("Error creating category:", err)
    }
  }

  const handleCreateProduct = async (data: Record<string, any>) => {
    if (!creatingProductForCategory) return

    try {
      await productsApi.create({
        name: data.p_name,
        description: data.p_description,
        price: Number(data.p_price),
        image_url: data.p_image_url,
        category_id: creatingProductForCategory,
        is_available: data.p_is_available,
      })
      setCreatingProductForCategory(null)
      fetchData()
    } catch (err) {
      console.error("Error creating product:", err)
    }
  }

  const handleAddProduct = (categoryId: string) => {
    setCreatingProductForCategory(categoryId)
  }

  const handleDeleteCategory = (categoryId: string) => {
    setDeletingCategoryId(categoryId)
  }

  const confirmDeleteCategory = async () => {
    if (!deletingCategoryId) return

    try {
      await categoriesApi.delete(deletingCategoryId)
      setDeletingCategoryId(null)
      fetchData()
    } catch (err) {
      console.error("Error deleting category:", err)
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
          Tortas que fazem a vida valer cada mordida.
        </p>
      </header>

      {/* Add Category Button (only in edit mode) */}
      {isEditing && (
        <div className="mb-8">
          <button
            onClick={() => setCreatingCategory(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-brown-300 text-brown-600 hover:bg-brown-50 hover:border-brown-400 transition-all duration-300 w-full justify-center"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Adicionar Categoria</span>
          </button>
        </div>
      )}

      {/* Categories - Drag and Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories-droppable" type="CATEGORY">
          {(provided) => (
            <div className="space-y-12" ref={provided.innerRef} {...provided.droppableProps}>
              {categories.length > 0 ? (
                categories.map((category, idx) => (
                  <Draggable key={category.id} draggableId={category.id} index={idx} isDragDisabled={!isEditing}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <CategorySection
                          category={category}
                          isEditing={isEditing}
                          isAdmin={!!user}
                          onEditCategory={handleEditCategory}
                          onEditProduct={handleEditProduct}
                          onAddProduct={handleAddProduct}
                          onDeleteCategory={handleDeleteCategory}
                          dragHandleProps={dragProvided.dragHandleProps}
                          enableProductDnD={true}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">Nenhum produto disponível no momento</p>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
            // campo de URL removido da edição de categoria
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
          extraActions={
            <button
              className="w-full mt-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all duration-300"
              onClick={() => setShowDeleteProductModal(true)}
              type="button"
            >
              Remover Produto
            </button>
          }
        />
      )}

      {/* Modal de confirmação de remoção de produto */}
      {showDeleteProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteProductModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-scale-in">
            <h2 className="text-xl font-bold mb-4 text-foreground">Remover Produto</h2>
            <p className="mb-6 text-muted-foreground">Tem certeza que deseja remover <strong>{editingProduct.p_name}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteProductModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-foreground font-medium hover:bg-cream-100 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all duration-300"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {creatingCategory && (
        <EditModal
          title="Nova Categoria"
          onClose={() => setCreatingCategory(false)}
          onSave={handleCreateCategory}
          fields={[
            { key: "c_name", label: "Nome", type: "text", value: "" },
            { key: "c_description", label: "Descrição", type: "textarea", value: "" },
            // ...campo de URL removido...
          ]}
        />
      )}

      {/* Create Product Modal */}
      {creatingProductForCategory && (
        <EditModal
          title="Novo Produto"
          onClose={() => setCreatingProductForCategory(null)}
          onSave={handleCreateProduct}
          fields={[
            { key: "p_name", label: "Nome", type: "text", value: "" },
            { key: "p_description", label: "Descrição", type: "textarea", value: "" },
            { key: "p_price", label: "Preço", type: "currency", value: "", required: true, placeholder: "0,00" },
            { key: "p_image_url", label: "URL da Imagem", type: "text", value: "" },
            { key: "p_is_available", label: "Disponível", type: "checkbox", value: true },
          ]}
        />
      )}

      {/* Delete Category Confirmation Modal */}
      {deletingCategoryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">Excluir Categoria</h2>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir esta categoria? <strong className="text-red-600">Todos os produtos desta categoria serão excluídos permanentemente.</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingCategoryId(null)}
                className="px-4 py-2 rounded-xl border border-brown-300 text-brown-600 hover:bg-brown-50 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all duration-300"
              >
                Excluir Categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
