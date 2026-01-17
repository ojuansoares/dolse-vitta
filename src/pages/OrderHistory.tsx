"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, User, Package } from "lucide-react"
import { Link } from "react-router-dom"
import { ordersApi } from "../services/api"

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

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await ordersApi.list()
      setOrders(data || [])
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
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
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
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link to="/" className="p-2 rounded-xl hover:bg-brown-500/10 transition-apple">
          <ArrowLeft className="w-5 h-5 text-brown-600" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Histórico de Pedidos</h1>
          <p className="text-muted-foreground text-sm">{orders.length} pedidos encontrados</p>
        </div>
      </div>

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
                className="w-full p-4 flex items-center justify-between hover:bg-brown-500/5 transition-apple"
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
