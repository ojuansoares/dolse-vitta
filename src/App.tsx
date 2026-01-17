import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Profile from './pages/Profile'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Carregando...</div>
  }
  
  if (user) {
    return <Navigate to="/dashboard" />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Rotas privadas */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      {/* Rota 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
