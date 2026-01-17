const API_URL = "/api"

// Helper for public requests (no auth needed)
async function fetchPublic(url: string, options: RequestInit = {}) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    const response = await fetch(url, { ...options, headers })

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return { success: true }
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Request error")
    }

    return data
  } catch (err) {
    console.error("API request failed:", url, err)
    throw err
  }
}

// Helper for authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const authData = typeof window !== "undefined" ? localStorage.getItem("dolce-vitta-auth") : null
    const session = authData ? JSON.parse(authData) : null

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`
    }

    const response = await fetch(url, { ...options, headers })

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return { success: true }
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Request error")
    }

    return data
  } catch (err) {
    console.error("API request failed:", url, err)
    throw err
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchPublic(`${API_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
}

// Products API
export const productsApi = {
  list: () => fetchPublic(`${API_URL}/products`),
  get: (id: string) => fetchPublic(`${API_URL}/products/${id}`),
  create: (product: {
    name: string
    description?: string
    price: number
    category_id?: string
    image_url?: string
  }) =>
    fetchWithAuth(`${API_URL}/products`, {
      method: "POST",
      body: JSON.stringify(product),
    }),
  update: (
    id: string,
    product: {
      name?: string
      description?: string
      price?: number
      is_available?: boolean
      sort_order?: number
      image_url?: string
    },
  ) =>
    fetchWithAuth(`${API_URL}/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  delete: (id: string) =>
    fetchWithAuth(`${API_URL}/products/${id}`, {
      method: "DELETE",
    }),
  reorder: (products: Array<{ id: string; sort_order: number }>) =>
    fetchWithAuth(`${API_URL}/reorder/products`, {
      method: "PUT",
      body: JSON.stringify({ items: products }),
    }),
}

// Categories API
export const categoriesApi = {
  list: () => fetchPublic(`${API_URL}/categories`),
  create: (category: { name: string; description?: string; image_url?: string }) =>
    fetchWithAuth(`${API_URL}/categories`, {
      method: "POST",
      body: JSON.stringify(category),
    }),
  update: (
    id: string,
    category: {
      name?: string
      description?: string
      image_url?: string
      sort_order?: number
      is_active?: boolean
    },
  ) =>
    fetchWithAuth(`${API_URL}/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    }),
  reorder: (categories: Array<{ id: string; sort_order: number }>) =>
    fetchWithAuth(`${API_URL}/reorder/categories`, {
      method: "PUT",
      body: JSON.stringify({ items: categories }),
    }),
  delete: (id: string) =>
    fetchWithAuth(`${API_URL}/categories/${id}`, {
      method: "DELETE",
    }),
}

// Orders API
export const ordersApi = {
  list: () => fetchWithAuth(`${API_URL}/orders`),
  deleteAll: () => fetchWithAuth(`${API_URL}/orders`, { method: "DELETE" }),
}

export const checkoutApi = {
  create: (data: {
    customer_name: string
    items: Array<{
      product_id: string
      quantity: number
    }>
  }) =>
    fetchPublic(`${API_URL}/checkout`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// About API
export const aboutApi = {
  get: () => fetchPublic(`${API_URL}/about`),
  update: (data: {
    name?: string
    photo_url?: string
    title?: string
    story?: string
    specialty?: string
    experience_years?: number
    quote?: string
    instagram?: string
    whatsapp?: string
    email?: string
    city?: string
    accepts_orders?: boolean
    delivery_areas?: string
  }) =>
    fetchWithAuth(`${API_URL}/about`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Users API
export const usersApi = {
  getProfile: () => fetchWithAuth(`${API_URL}/users/profile`),
  updateProfile: (data: { name?: string; phone?: string; avatar_url?: string }) =>
    fetchWithAuth(`${API_URL}/users/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAccount: () =>
    fetchWithAuth(`${API_URL}/users/account`, {
      method: "DELETE",
    }),
}

export const itemsApi = productsApi
