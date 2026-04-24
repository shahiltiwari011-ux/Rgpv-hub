import { Link } from 'react-router-dom'

const TYPE_META = {
  notes: { icon: '📝', label: 'Notes', gradient: 'notes' },
  pyq: { icon: '📄', label: 'PYQ', gradient: 'pyq' },
  syllabus: { icon: '📋', label: 'Syllabus', gradient: 'syllabus' }
}

function MiniCard ({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.notes
  return (
    <Link to={`/${item.type}`} className={`trending-card trending-${meta.gradient}`}>
      <div className='trending-icon'>{item.icon || meta.icon}</div>
      <div className='trending-info'>
        <div className='trending-title'>{item.title}</div>
        <div className='trending-meta'>
          <span className='trending-type-badge'>{meta.label}</span>
          <span>{item.branch}</span>
          {(item.download_count || 0) > 0 && <span>⬇ {item.download_count}</span>}
        </div>
      </div>
    </Link>
  )
}

export default function TrendingSection ({ title, icon, items, sectionId, loading }) {
  // Always show the section header, even if empty
  return (
    <section className='trending-section' id={sectionId}>
      <div className='trending-header'>
        <span className='trending-header-icon'>{icon}</span>
        <h2 className='trending-header-title'>{title}</h2>
      </div>
      {loading
        ? (
          <div className='trending-scroll'>
            {[1, 2, 3].map(i => (
              <div key={i} className='trending-card' style={{ opacity: 0.4, minHeight: 70 }}>
                <div className='trending-icon'>⏳</div>
                <div className='trending-info'>
                  <div className='trending-title' style={{ background: 'var(--border)', borderRadius: 6, height: 14, width: '80%' }} />
                  <div className='trending-meta' style={{ background: 'var(--border)', borderRadius: 6, height: 10, width: '50%', marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
          )
        : items && items.length > 0
          ? (
            <div className='trending-scroll'>
              {items.map(item => (
                <MiniCard key={item.id} item={item} />
              ))}
            </div>
            )
          : (
            <div style={{ padding: '1rem 0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No resources yet — they'll appear here once uploaded.
            </div>
            )}
    </section>
  )
}
