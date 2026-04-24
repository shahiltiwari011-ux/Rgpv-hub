import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { getResources, deleteResource } from '../services/api'
import { LoadingSpinner, EmptyState } from '../components/States'
import { RESOURCE_TYPES } from '../utils/constants'
import SEO from '../components/SEO'

export default function Admin () {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('notes')
  const [items, setItems] = useState([])
  const [isPending, setIsPending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchItems() }, [activeTab])

  async function fetchItems () {
    setIsPending(true)
    try {
      const result = await getResources({ type: activeTab, limit: 100 })
      setItems(result.data)
    } catch (err) {
      console.error('Admin fetch error:', err)
      setItems([])
    } finally {
      setIsPending(false)
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const s = searchTerm.toLowerCase().trim()
    return items.filter(item => 
      item.title?.toLowerCase().includes(s) || 
      item.subject?.toLowerCase().includes(s) ||
      item.branch?.toLowerCase().includes(s)
    )
  }, [items, searchTerm])

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
        <span className='page-hero-icon'>🛡️</span>
        <h1 className='page-hero-title'>Admin Panel</h1>
        <p className='page-hero-sub'>Infrastructure Control & Management</p>
      </div>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
             <div className='tab-group' style={{ marginBottom: 0 }}>
               {RESOURCE_TYPES.map((t) => (
                 <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                   {t.charAt(0).toUpperCase() + t.slice(1)}
                 </button>
               ))}
             </div>
             <div style={{ position: 'relative', width: '280px' }}>
                <input 
                  type="text"
                  placeholder="Quick search..."
                  className="form-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ height: '42px', paddingLeft: '2.5rem', borderRadius: '10px' }}
                />
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to='/admin/analytics' className='btn-secondary' style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', padding: '0.75rem 1.25rem' }}>
              📊 Stats
            </Link>
            <Link to='/admin/upload' className='btn-primary' style={{ textDecoration: 'none', borderRadius: '12px', padding: '0.75rem 1.25rem' }}>
              ➕ New Resource
            </Link>
          </div>
        </div>

        {isPending && <LoadingSpinner text={`Fetching ${activeTab}…`} />}
        
        {!isPending && items.length === 0 && (
          <EmptyState
            icon='📦'
            title='No resources found'
            message={`You haven't uploaded any ${activeTab} yet.`}
          />
        )}

        {!isPending && items.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
             <div style={{ padding: '0 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 150px', gap: '1rem' }} className="desktop-only">
                <span>RESOURCE INFO</span>
                <span>BRANCH / SEM</span>
                <span>CREATED ON</span>
                <span>ACTIONS</span>
             </div>
            {filteredItems.map((item) => (
              <div
                key={item.id} className='admin-resource-card' style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  gap: '1.5rem',
                  transition: '0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}
                  >
                    {activeTab === 'notes' ? '📝' : activeTab === 'pyq' ? '📄' : '📋'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <strong style={{ fontSize: '1rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>{item.subject || 'Generic Subject'}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{item.branch}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Semester {item.semester}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <a href={item.file_url} target='_blank' rel='noreferrer' className='btn-secondary' style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.8rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && items.length > 0 && (
               <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                 <span style={{ fontSize: '2rem' }}>🔍</span>
                 <p>No matches for "{searchTerm}"</p>
               </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}

