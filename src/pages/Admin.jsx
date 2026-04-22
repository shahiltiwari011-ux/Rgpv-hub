import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { getResources, deleteResource } from '../services/api'
import { LoadingSpinner, EmptyState } from '../components/States'
import { RESOURCE_TYPES } from '../utils/constants'
import SEO from '../components/SEO'

export default function Admin () {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('notes')
  const [items, setItems] = useState([])
  const [isPending, setIsPending] = useState(false)

  useEffect(() => { fetchItems() }, [activeTab])

  async function fetchItems () {
    setIsPending(true)
    try {
      const result = await getResources({ type: activeTab, limit: 50 })
      setItems(result.data)
    } catch (err) {
      console.error('Admin fetch error:', err)
      setItems([])
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete (id) {
    if (!window.confirm('Are you sure you want to delete this resource?')) return
    try {
      await deleteResource(id)
      fetchItems()
      window.alert('Resource deleted successfully.')
    } catch (err) {
      window.alert('Delete failed: ' + err.message)
    }
  }

  if (authLoading) return <LoadingSpinner text='Verifying access…' />
  if (!user || !isAdmin) return <Navigate to='/' replace />

  return (
    <>
      <SEO
        title='Admin Dashboard'
        description='Manage study hub resources safely via the secure Admin Panel.'
        urlPath='/admin'
      />
      <div className='page-hero'>
        <span className='page-hero-icon'>⚙️</span>
        <h1 className='page-hero-title'>Admin Dashboard</h1>
        <p className='page-hero-sub'>Manage all resources — {user.email}</p>
      </div>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className='tab-group' style={{ marginBottom: 0 }}>
            {RESOURCE_TYPES.map((t) => (
              <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to='/admin/analytics' className='btn-secondary' style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px' }}>
              📊 Analytics
            </Link>
            <Link to='/admin/upload' className='btn-primary' style={{ textDecoration: 'none' }}>
              ➕ Upload New Resource
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif' }}>{items.length} {activeTab} managed</h3>
        </div>

        {isPending && <LoadingSpinner text={`Loading ${activeTab}…`} />}
        {!isPending && items.length === 0 && (
          <EmptyState
            icon='📦'
            title='No resources found'
            message={`You haven't uploaded any ${activeTab} yet.`}
          />
        )}

        {!isPending && items.length > 0 && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {items.map((item) => (
              <div
                key={item.id} className='admin-resource-card' style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}
                    >
                      {activeTab === 'notes' ? '📝' : activeTab === 'pyq' ? '📄' : '📋'}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.15rem', display: 'block' }}>{item.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>🆔 {item.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }}>{item.branch}</span>
                    <span style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }}>Sem {item.semester}</span>
                    {item.subject && <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}># {item.subject}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <a href={item.file_url} target='_blank' rel='noreferrer' className='btn-secondary' style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', textDecoration: 'none', borderRadius: '12px' }}>
                    👁️ View
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)} className='btn-danger' style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '12px',
                      padding: '0.6rem 1.2rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
