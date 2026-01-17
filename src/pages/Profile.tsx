import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usersApi } from '../services/api'

interface ProfileData {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
}

function Profile() {
  const { user } = useAuth()
  const [_profile, setProfile] = useState<ProfileData | null>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await usersApi.getProfile()
      const profileData = response.profile
      setProfile(profileData)
      setName(profileData?.name || '')
      setAvatarUrl(profileData?.avatar_url || '')
    } catch (err) {
      // Se o perfil não existir ainda, use dados do user
      setName(user?.user_metadata?.name || '')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await usersApi.updateProfile({ 
        name: name || undefined, 
        avatar_url: avatarUrl || undefined 
      })
      setSuccess('Perfil atualizado com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Carregando perfil...</p>
  }

  return (
    <div className="profile-page">
      <h1>👤 Meu Perfil</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={user?.email || ''}
            disabled
            style={{ opacity: 0.7 }}
          />
          <small style={{ color: '#888' }}>O email não pode ser alterado</small>
        </div>

        <div className="form-group">
          <label htmlFor="name">Nome</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        <div className="form-group">
          <label htmlFor="avatarUrl">URL do Avatar</label>
          <input
            type="url"
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://exemplo.com/avatar.jpg"
          />
        </div>

        {avatarUrl && (
          <div className="form-group">
            <label>Preview do Avatar</label>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              style={{ 
                width: 100, 
                height: 100, 
                borderRadius: '50%', 
                objectFit: 'cover' 
              }} 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}

        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #333' }}>
        <h3 style={{ color: '#ff4444', marginBottom: 10 }}>Zona de Perigo</h3>
        <p style={{ marginBottom: 10, fontSize: '0.9rem', color: '#888' }}>
          Ao deletar sua conta, todos os seus dados serão permanentemente removidos.
        </p>
        <button 
          className="danger"
          onClick={async () => {
            if (confirm('Tem certeza? Esta ação não pode ser desfeita!')) {
              try {
                await usersApi.deleteAccount()
                window.location.href = '/login'
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao deletar conta')
              }
            }
          }}
        >
          Deletar Minha Conta
        </button>
      </div>
    </div>
  )
}

export default Profile
