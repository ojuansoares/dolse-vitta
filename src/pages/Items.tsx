import { useEffect, useState, FormEvent } from 'react'
import { productsApi } from '../services/api'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
}

function Items() {
  const [products, setProducts] = useState<Product[]>([])
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await productsApi.list()
      setProducts(response.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPrice) return

    try {
      await productsApi.create({ 
        name: newName, 
        description: newDescription || undefined,
        price: parseFloat(newPrice)
      })
      setNewName('')
      setNewDescription('')
      setNewPrice('')
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating product')
    }
  }

  const handleToggleAvailable = async (product: Product) => {
    try {
      await productsApi.update(product.id, { is_available: !product.is_available })
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating product')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await productsApi.delete(id)
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting product')
    }
  }

  return (
    <div className="items-page">
      <h1>🍰 Products</h1>

      {error && <div className="error">{error}</div>}

      <form className="add-item-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Product name..."
          required
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)..."
        />
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="Price"
          step="0.01"
          min="0"
          required
        />
        <button type="submit" className="primary">
          Add Product
        </button>
      </form>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products yet. Create your first product above!</p>
      ) : (
        <div className="items-list">
          {products.map((product) => (
            <div key={product.id} className={`item-card ${!product.is_available ? 'completed' : ''}`}>
              <input
                type="checkbox"
                className="checkbox"
                checked={product.is_available}
                onChange={() => handleToggleAvailable(product)}
                title="Available"
              />
              
              <div className="content">
                <h3 style={{ textDecoration: !product.is_available ? 'line-through' : 'none' }}>
                  {product.name}
                </h3>
                {product.description && <p>{product.description}</p>}
                <p style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  R$ {product.price?.toFixed(2)}
                </p>
              </div>
              <div className="actions">
                <button onClick={() => handleDelete(product.id)} className="danger">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Items
