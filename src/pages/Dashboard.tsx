import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { itemsApi } from '../services/api'

interface Stats {
  totalItems: number
  completedItems: number
  pendingItems: number
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalItems: 0, completedItems: 0, pendingItems: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await itemsApi.list()
      const items = response.items || []
      
      setStats({
        totalItems: items.length,
        completedItems: items.filter((item: { completed: boolean }) => item.completed).length,
        pendingItems: items.filter((item: { completed: boolean }) => !item.completed).length,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <h1>👋 Bem-vindo, {user?.user_metadata?.name || user?.email}!</h1>
      <p>Este é o seu painel de controle.</p>

      {loading ? (
        <p>Carregando estatísticas...</p>
      ) : (
        <div className="stats">
          <div className="stat-card">
            <h3>{stats.totalItems}</h3>
            <p>Total de Items</p>
          </div>
          <div className="stat-card">
            <h3>{stats.completedItems}</h3>
            <p>Concluídos</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingItems}</h3>
            <p>Pendentes</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
