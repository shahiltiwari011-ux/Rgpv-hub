import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner, EmptyState, ErrorState } from '../components/States'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

export default function Leaderboard () {
  const { leaderboard, loading, error, refresh } = useLeaderboard()
  const { user, profile } = useAuth()

  if (loading) return <LoadingSpinner text='Fetching ranks...' />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <SEO title="Leaderboard" description="Top performers on the PROJECTX elite academic leaderboard. Track your rank and earn XP through learning." urlPath="/leaderboard" />
      <div className='page-hero'>
        <span className='page-hero-icon'>🏆</span>
        <h1 className='page-hero-title'>Leaderboard</h1>
        <p className='page-hero-sub'>Top learners by weekly XP contribution</p>
      </div>

      <section style={{ maxWidth: 900, margin: '0 auto 6rem', padding: '0 1.5rem' }}>
        
        {user && profile && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '16px',
            padding: '1.25rem 1.75rem',
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Your Stats</p>
              <h3 style={{ margin: '0.2rem 0 0', fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 800 }}>Level {profile.level}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total XP</p>
              <h3 style={{ margin: '0.2rem 0 0', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', color: 'var(--accent-blue)', fontWeight: 800 }}>{profile.xp.toLocaleString()} ✨</h3>
            </div>
          </div>
        )}

        {leaderboard.length === 0 && (
          <EmptyState
            icon='🏅'
            title='The race is on!'
            message='No rankings yet for this week. Be the first to earn XP!'
          />
        )}

        {leaderboard.length > 0 && (
          <div className="leaderboard-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Learner</th>
                  <th style={{ textAlign: 'right' }}>XP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isUser = user?.id === entry.user_id
                  return (
                    <tr
                      key={entry.user_id}
                      style={{
                        background: isUser ? 'rgba(99,102,241,0.05)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          background: entry.rank === 1 ? 'var(--gradient-notes)' : (entry.rank === 2 ? '#94a3b8' : (entry.rank === 3 ? '#b45309' : 'var(--bg-primary)')),
                          color: entry.rank <= 3 ? '#fff' : 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                        >
                          {entry.rank}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/profile/${entry.user_id}`}
                          style={{
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                        >
                          <span style={{ fontSize: isUser ? '1rem' : '0.95rem' }}>
                            {entry.profiles?.name || (entry.email ? entry.email.split('@')[0] : `Student ${entry.user_id.slice(0, 4)}`)}
                          </span>
                          {isUser && <span style={{ fontSize: '0.65rem', background: 'var(--accent-blue)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>YOU</span>}
                        </Link>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'Syne, sans-serif' }}>
                        {entry.xp.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Want to see your name here?</p>
          <Link to='/notes' className='btn-primary' style={{ textDecoration: 'none', display: 'inline-flex' }}>
            🚀 Earn XP by Learning
          </Link>
        </div>
      </section>
    </>
  )
}
