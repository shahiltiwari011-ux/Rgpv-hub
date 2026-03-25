import { useState, useEffect } from 'react'
import { getUserProfile, getUserBadges } from '../services/api'

export function useProfile (userId) {
  const [profile, setProfile] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true)
        const [profileData, badgesData] = await Promise.all([
          getUserProfile(userId),
          getUserBadges(userId)
        ])
        setProfile(profileData)
        setBadges(badgesData)
        setError(null)
      } catch (err) {
        // Ignore transient lock-related auth errors to prevent UI crash
        if (!err.message?.includes('lock')) {
          console.error('Profile fetch error:', err)
          setError(err.message || 'Failed to load profile')
        } else {
          console.warn('Silent Profile Auth Lock:', err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [userId])

  return { profile, badges, loading, error }
}
