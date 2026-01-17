import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar, User, Package, Trash2 } from "lucide-react"
import { ordersApi } from "@/services/api"

interface OrderItem {
  id: string
  oi_product_name: string
  oi_product_price: number
  oi_quantity: number
  oi_subtotal: number
}

interface Order {
  id: string
  o_customer_name: string
  o_total: number
  o_created_at: string
  items?: OrderItem[]
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      const response = await ordersApi.list()
      // Backend returns { success: true, orders: [...] }
      const ordersData = response?.orders || []
      
      // Map order_item to items for frontend
      const mappedOrders = ordersData.map((order: any) => ({
        ...order,
        items: order.order_item || []
      }))
      
      setOrders(mappedOrders)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Erro ao carregar pedidos")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não disponível"
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return "Data inválida"
    }
  }

  const handleDeleteAll = async () => {
    try {
      setDeleting(true)
      await ordersApi.deleteAll()
      setOrders([])
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error("Error deleting orders:", err)
      setError("Erro ao apagar histórico")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brown-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-xl hover:bg-brown-500/10 transition-all duration-300">
            <ArrowLeft className="w-5 h-5 text-brown-600" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Histórico de Pedidos</h1>
            <p className="text-muted-foreground text-sm">{orders.length} pedidos encontrados</p>
          </div>
        </div>
        {orders.length > 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all duration-300"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Limpar Histórico</span>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl animate-scale-in">
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Limpar Histórico?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Todos os {orders.length} pedidos serão apagados permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-cream-100 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-300 disabled:opacity-50"
              >
                {deleting ? "Apagando..." : "Apagar Tudo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-600">{error}</div>}

      {orders.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream-200 flex items-center justify-center">
            <Package className="w-10 h-10 text-brown-500" />
          </div>
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className="glass-card rounded-2xl overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Order Header */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-brown-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-brown-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">{order.o_customer_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(order.o_created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brown-600">{formatPrice(order.o_total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.items?.length || 0} {order.items?.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </button>

              {/* Order Items (Expanded) */}
              {expandedOrder === order.id && order.items && order.items.length > 0 && (
                <div className="px-4 pb-4 pt-2 border-t border-border">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm py-2">
                        <span className="text-muted-foreground">
                          {item.oi_quantity}x {item.oi_product_name}
                        </span>
                        <span className="font-medium text-foreground">{formatPrice(item.oi_subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
