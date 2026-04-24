import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OfflineBanner ({ isMock, onRetry }) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Manage layout shift class
  useEffect(() => {
    if (isMock && !isDismissed) {
      document.body.classList.add('offline-mode-active')
    } else {
      document.body.classList.remove('offline-mode-active')
    }
    return () => document.body.classList.remove('offline-mode-active')
  }, [isMock, isDismissed])

  // Reset dismissal if isMock becomes false (online)
  useEffect(() => {
    if (!isMock) setIsDismissed(false)
  }, [isMock])

  if (!isMock || isDismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className='offline-banner-elite'
      >
        <div className='banner-content'>
          <div className='status-indicator'>
            <span className='dot pulse-red'></span>
            <span className='label'>OFFLINE MODE</span>
          </div>
          <div className='separator'></div>
          <p className='message'>
            Cloud database unreachable. Showing local fallback data.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={onRetry} className='retry-action'>
              <span className='icon'>🔄</span>
              RECONNECT
            </button>
            <button 
              onClick={() => setIsDismissed(true)} 
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                color: 'rgba(255,255,255,0.4)', 
                border: '1px solid rgba(255,255,255,0.1)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                cursor: 'pointer',
                transition: '0.2s'
              }}
              className="dismiss-btn"
              title="Dismiss warning"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
