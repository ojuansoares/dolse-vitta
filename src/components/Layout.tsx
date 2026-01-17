import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>📦 MeuApp</h2>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            🏠 Dashboard
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => isActive ? 'active' : ''}>
            📝 Items
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            👤 Perfil
          </NavLink>
        </nav>
        <div className="logout-btn">
          <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#888' }}>
            {user?.email}
          </p>
          <button onClick={handleLogout} className="danger">
            Sair
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
