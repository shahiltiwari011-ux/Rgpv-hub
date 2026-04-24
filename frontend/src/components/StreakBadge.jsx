import { useGamification } from '../hooks/useGamification'

export default function StreakBadge ({ streak: customStreak }) {
  const { streak: authStreak, loading } = useGamification()

  // If a custom streak is passed (ex: on a Profile page), use it.
  // Otherwise, use the auth user's streak.
  const streakCount = customStreak !== undefined ? customStreak : (authStreak || 0)

  if (loading && customStreak === undefined) {
    return <div className='streak-badge loading' style={{ opacity: 0.5 }}>🔥 --</div>
  }

  return (
    <div className='streak-badge' title='Current Daily Streak'>
      <span style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)' }}>🔥</span>
      <span style={{ fontWeight: 800, fontSize: 'clamp(0.9rem, 3vw, 1.1rem)' }}>{streakCount}</span>
      <span className='desktop-only' style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.5px' }}>Day Streak</span>
    </div>
  )
}
