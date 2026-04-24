import { useState, useEffect } from 'react'
import { getAnalytics } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { LoadingSpinner, ErrorState } from '../components/States'
import SEO from '../components/SEO'
import OfflineBanner from '../components/OfflineBanner'
import { MOCK_STATS } from '../data/mockResources'

export default function AdminAnalytics () {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadStats()
    }
  }, [isAdmin])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getAnalytics()
      setStats(data)
      setIsMock(false)
      setError(null)
    } catch (err) {
      console.warn('Analytics fetch failed, using mock data')
      setStats({
        totalResources: MOCK_STATS.total_notes + MOCK_STATS.total_pyq + MOCK_STATS.total_syllabus,
        totalDownloads: 1250, // Mock value
        totalForumPosts: 42,   // Mock value
        totalUsers: 156,       // Mock value
        branches: {
          'Computer Science': MOCK_STATS.total_notes,
          'Mechanical': 5,
          'Electrical': 4,
          'Civil': 3,
          'Electronics': 2
        }
      })
      setIsMock(true)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <LoadingSpinner text='Checking permissions…' />
  if (!user || !isAdmin) return <Navigate to='/' replace />

  return (
    <>
      <SEO title="Admin Analytics" />
      <OfflineBanner isMock={isMock} onRetry={loadStats} />
      <div className='page-hero'>
        <span className='page-hero-icon'>📊</span>
        <h1 className='page-hero-title'>Platform Analytics</h1>
        <p className='page-hero-sub'>Real-time insights for PROJECTX</p>
        <Link to='/admin' style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginTop: '1rem', fontSize: '0.9rem' }}>← Back to Resources</Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 4rem' }}>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={loadStats} /> : (
          stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
              <StatCard title="Resources" value={stats.totalResources} icon="📚" color="#3b82f6" />
              <StatCard title="Downloads" value={stats.totalDownloads} icon="📥" color="#10b981" />
              <StatCard title="Discussions" value={stats.totalForumPosts} icon="💬" color="#f59e0b" />
              <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="#8b5cf6" />
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 24, border: '1px solid var(--border)' }}>
              <h2 style={{ marginBottom: '2rem', fontFamily: 'Syne, sans-serif' }}>Resources by Branch</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(stats.branches).map(([branch, count]) => (
                  <div key={branch}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600 }}>{branch}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} items</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${stats.totalResources > 0 ? (count / stats.totalResources) * 100 : 0}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                          borderRadius: '6px',
                          transition: 'width 1s ease-out'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
          )
        )}
      </div>
    </>
  )
}

function StatCard ({ title, value, icon, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 24, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ fontSize: '2.5rem', background: `${color}20`, width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '18px' }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</p>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{value.toLocaleString()}</h3>
      </div>
    </div>
  )
}
