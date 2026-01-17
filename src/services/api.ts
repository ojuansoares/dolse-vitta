import { supabase } from './supabase'

const API_URL = '/api'

// Helper for authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    } else {
      console.warn('No access token available for request:', url)
    }
    
    const response = await fetch(url, { ...options, headers })
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return { success: true }
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Request error')
    }
    
    return data
  } catch (err) {
    console.error('API request failed:', url, err)
    throw err
  }
}

// Products API (items for sale)
export const productsApi = {
  list: () => fetchWithAuth(`${API_URL}/products`),
  
  get: (id: string) => fetchWithAuth(`${API_URL}/products/${id}`),
  
  create: (product: { name: string; description?: string; price: number; category_id?: string; image_url?: string }) => 
    fetchWithAuth(`${API_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  
  update: (id: string, product: { name?: string; description?: string; price?: number; is_available?: boolean }) =>
    fetchWithAuth(`${API_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    }),
}

// Categories API
export const categoriesApi = {
  list: () => fetchWithAuth(`${API_URL}/categories`),
  
  create: (category: { name: string; description?: string }) => 
    fetchWithAuth(`${API_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(category),
    }),
}

// Orders API
export const ordersApi = {
  list: () => fetchWithAuth(`${API_URL}/orders`),
  
  create: (order: { 
    customer_name: string; 
    customer_order?: string;
    items: Array<{ product_id: string; product_name: string; product_price: number; quantity: number }>;
    total: number;
  }) => 
    fetchWithAuth(`${API_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(order),
    }),
}

// Users API
export const usersApi = {
  getProfile: () => fetchWithAuth(`${API_URL}/users/profile`),
  
  updateProfile: (data: { name?: string; phone?: string; avatar_url?: string }) =>
    fetchWithAuth(`${API_URL}/users/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteAccount: () =>
    fetchWithAuth(`${API_URL}/users/account`, {
      method: 'DELETE',
    }),
}

// Keep itemsApi as alias for backwards compatibility
export const itemsApi = productsApi
