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
    <div className="analytics-view">
      <SEO title="Admin Analytics" />
      <OfflineBanner isMock={isMock} onRetry={loadStats} />
      
      <div className="view-header">
        <h1 className="view-title">Platform <span>Analytics</span></h1>
        <p className="view-subtitle">Real-time performance insights for PROJECTX ecosystem.</p>
      </div>

      <div className="analytics-content">
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={loadStats} /> : (
          stats && (
          <>
            <div className="stats-grid">
              <StatCard title="Resources" value={stats.totalResources} icon="📚" color="#3b82f6" />
              <StatCard title="Downloads" value={stats.totalDownloads} icon="📥" color="#10b981" />

              <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="#8b5cf6" />
            </div>

            <div className="glass-panel branch-stats-card">
              <h2 className="card-title">Distribution by Branch</h2>
              <div className="branch-list">
                {Object.entries(stats.branches).map(([branch, count]) => (
                  <div key={branch} className="branch-item">
                    <div className="branch-info">
                      <span className="branch-name">{branch}</span>
                      <span className="branch-count">{count} items</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill"
                        style={{ width: `${stats.totalResources > 0 ? (count / stats.totalResources) * 100 : 0}%` }} 
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

      <style>{`
        .analytics-view { max-width: 1200px; margin: 0 auto; }
        .view-header { margin-bottom: 2.5rem; }
        .view-title { font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 800; margin: 0; }
        .view-title span { color: var(--accent-blue); }
        .view-subtitle { color: var(--text-muted); margin-top: 0.5rem; font-weight: 500; font-size: 0.9rem; }

        .analytics-content { padding-bottom: 4rem; }
        
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 1.5rem; 
          margin-bottom: 3rem; 
        }

        .stat-card-premium { 
          padding: 2rem; border-radius: 2rem; display: flex; align-items: center; gap: 1.5rem; 
          background: var(--bg-card); border: 1px solid var(--border); transition: 0.3s;
        }
        .stat-card-premium:hover { border-color: var(--accent-blue); transform: translateY(-5px); }
        
        .stat-icon-box { 
          font-size: 2rem; width: 64px; height: 64px; display: flex; 
          align-items: center; justify-content: center; border-radius: 1.25rem; flex-shrink: 0;
        }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { color: var(--text-muted); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem; }
        .stat-value { font-size: 1.75rem; font-weight: 900; margin: 0; color: var(--text-primary); }

        .branch-stats-card { padding: 2.5rem; border-radius: 2rem; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; margin-bottom: 2.5rem; color: var(--text-primary); }
        
        .branch-list { display: flex; flexDirection: column; gap: 1.75rem; }
        .branch-item { display: flex; flex-direction: column; gap: 0.75rem; }
        .branch-info { display: flex; justify-content: space-between; align-items: center; }
        .branch-name { font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
        .branch-count { color: var(--accent-blue); font-size: 0.8rem; font-weight: 800; }
        
        .progress-track { width: 100%; height: 10px; background: var(--bg-secondary); border-radius: 5px; overflow: hidden; border: 1px solid var(--border); }
        .progress-fill { 
          height: 100%; border-radius: 5px;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .stat-card-premium { padding: 1.25rem; flex-direction: column; align-items: flex-start; gap: 1rem; text-align: left; }
          .stat-icon-box { width: 48px; height: 48px; font-size: 1.5rem; border-radius: 1rem; }
          .stat-value { font-size: 1.4rem; }
          .branch-stats-card { padding: 1.5rem; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

function StatCard ({ title, value, icon, color }) {
  return (
    <div className="stat-card-premium">
      <div className="stat-icon-box" style={{ background: `${color}15` }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <h3 className="stat-value">{value.toLocaleString()}</h3>
      </div>
    </div>
  )
}
