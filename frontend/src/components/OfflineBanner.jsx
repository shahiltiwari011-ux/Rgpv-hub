import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RETRY_INTERVAL = 30 // seconds

export default function OfflineBanner ({ isMock, onRetry }) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [countdown, setCountdown] = useState(RETRY_INTERVAL)

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

  // Countdown timer that resets every 30s
  useEffect(() => {
    if (!isMock || isDismissed) return
    setCountdown(RETRY_INTERVAL)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return RETRY_INTERVAL
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isMock, isDismissed])

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
            Cloud database unreachable. Auto-retrying in <strong>{countdown}s</strong>…
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => { onRetry(); setCountdown(RETRY_INTERVAL) }} className='retry-action'>
              <span className='icon'>🔄</span>
              RECONNECT NOW
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
