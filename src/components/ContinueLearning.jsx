import { Link } from 'react-router-dom'
import { useContinueLearning } from '../hooks/useContinueLearning'
import { useAuth } from '../context/AuthContext'

export default function ContinueLearning () {
  const { user } = useAuth()
  const { recentViews, loading } = useContinueLearning()

  if (!user || loading || recentViews.length === 0) return null

  return (
    <section className='continue-section'>
      <div className='trending-header'>
        <span className='trending-header-icon'>📖</span>
        <h2 className='trending-header-title'>Continue Where You Left Off</h2>
      </div>
      <div className='trending-scroll'>
        {recentViews.map(view => {
          const r = view.resource
          if (!r) return null
          return (
            <Link key={view.id} to={`/${r.type}`} className='continue-card'>
              <div className='continue-icon'>{r.icon || '📄'}</div>
              <div className='continue-info'>
                <div className='continue-title'>{r.title}</div>
                <div className='continue-meta'>{r.branch} · Sem {r.semester}</div>
              </div>
              <div className='continue-arrow'>→</div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
