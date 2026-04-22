export function LoadingSpinner ({ text = 'Loading…' }) {
  return (
    <div className='loading-state'>
      <div className='spinner' />
      <p>{text}</p>
    </div>
  )
}

export function EmptyState ({ icon = '📭', title = 'Nothing here yet', message = 'No resources found matching your criteria.' }) {
  return (
    <div className='empty-state'>
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}

export function ErrorState ({ message, onRetry }) {
  return (
    <div className='error-state'>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <h3>Error loading data</h3>
      <p>{message}</p>
      {onRetry && <button className='btn-primary' onClick={onRetry}>Try Again</button>}
    </div>
  )
}
