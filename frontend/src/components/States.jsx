export function LoadingSpinner ({ text = 'Loading…' }) {
  return (
    <div className='state-container'>
      <div className='premium-spinner' />
      <p className='state-text'>{text}</p>
    </div>
  )
}

export function EmptyState ({ icon = '📭', title = 'Nothing here yet', message = 'No resources found matching your criteria.' }) {
  return (
    <div className='state-container glass-effect'>
      <div className='state-icon'>{icon}</div>
      <h3 className='state-title'>{title}</h3>
      <p className='state-message'>{message}</p>
    </div>
  )
}

export function ErrorState ({ message, onRetry }) {
  return (
    <div className='state-container error-style'>
      <div className='error-glow'></div>
      <div className='state-icon'>⚠️</div>
      <h3 className='state-title'>{message === 'OFFLINE_MODE' ? 'Database is Asleep' : 'Connection Error'}</h3>
      <p className='state-message'>
        {message === 'OFFLINE_MODE'
          ? 'The database connection is currently down or paused. We have loaded local fallback data for you.'
          : (message?.includes('resolve host')
              ? 'DNS Error: The Supabase URL is incorrect or unreachable. Please check your .env configuration.'
              : (message || 'Failed to sync with the cloud. Please check your internet connection.'))}
      </p>
      {onRetry && <button className='retry-btn' onClick={onRetry}>RETRY CONNECTION</button>}
    </div>
  )
}
