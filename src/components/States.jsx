export function LoadingSpinner ({ text = 'Loading…' }) {
  return (
    <div className='state-container'>
      <div className='premium-spinner' />
      <p className='state-text'>{text}</p>
      <style jsx>{`
        .state-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem; text-align: center; min-height: 40vh; }
        .premium-spinner { width: 50px; height: 50px; border: 3px solid rgba(59, 130, 246, 0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .state-text { margin-top: 1.5rem; font-weight: 700; color: #64748b; font-size: 1.1rem; letter-spacing: 0.5px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export function EmptyState ({ icon = '📭', title = 'Nothing here yet', message = 'No resources found matching your criteria.' }) {
  return (
    <div className='state-container glass-effect'>
      <div className='state-icon'>{icon}</div>
      <h3 className='state-title'>{title}</h3>
      <p className='state-message'>{message}</p>
      <style jsx>{`
        .state-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 2rem; margin: 2rem; border: 1px solid rgba(255,255,255,0.05); }
        .state-icon { font-size: 4rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.2)); }
        .state-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff; }
        .state-message { color: #64748b; font-weight: 500; max-width: 400px; }
      `}</style>
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
          : (message || 'Failed to sync with the cloud. Please check your internet connection.')}
      </p>
      {onRetry && <button className='retry-btn' onClick={onRetry}>RETRY CONNECTION</button>}
      <style jsx>{`
        .state-container { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; text-align: center; min-height: 50vh; overflow: hidden; }
        .error-glow { position: absolute; width: 300px; height: 300px; background: rgba(239, 68, 68, 0.1); filter: blur(100px); border-radius: 50%; z-index: 0; }
        .state-icon { font-size: 4rem; margin-bottom: 1.5rem; z-index: 1; }
        .state-title { font-size: 2rem; font-weight: 800; color: #fff; z-index: 1; }
        .state-message { color: #fca5a5; font-weight: 600; margin-bottom: 2rem; max-width: 450px; z-index: 1; }
        .retry-btn { background: #fff; color: #000; border: none; padding: 1rem 2.5rem; border-radius: 1rem; font-weight: 900; cursor: pointer; transition: 0.3s; z-index: 1; letter-spacing: 1px; }
        .retry-btn:hover { transform: scale(1.05); background: #f43f5e; color: #fff; box-shadow: 0 10px 30px rgba(244, 63, 94, 0.4); }
      `}</style>
    </div>
  )
}
