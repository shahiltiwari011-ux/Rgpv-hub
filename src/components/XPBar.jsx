import { useGamification } from '../hooks/useGamification'
import { useAuth } from '../context/AuthContext'

export default function XPBar ({ compact = false }) {
  const { user } = useAuth()
  const { xp, level, xpProgress, xpInLevel, loading } = useGamification()

  if (!user || loading) return null

  if (compact) {
    return (
      <div className='xp-bar-compact' title={`${xp} XP Total`}>
        <span className='xp-level-badge'>Lv.{level}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'Syne, sans-serif' }}>
          {xp} XP
        </span>
        <div className='xp-track-compact desktop-only'>
          <div className='xp-fill' style={{ width: `${xpProgress}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className='xp-bar-container'>
      <div className='xp-header'>
        <div className='xp-level-circle'>
          <span>{level}</span>
        </div>
        <div className='xp-info'>
          <span className='xp-label'>Level {level}</span>
          <span className='xp-count'>{xpInLevel} / 100 XP</span>
        </div>
        <span className='xp-total'>{xp} XP Total</span>
      </div>
      <div className='xp-track'>
        <div className='xp-fill' style={{ width: `${xpProgress}%` }} />
      </div>
    </div>
  )
}
