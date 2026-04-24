import { useState, useEffect } from 'react'
import { getBookmarkIds } from '../services/api'
import { useAuth } from '../context/AuthContext'

export function useBookmarks () {
  const { user } = useAuth()
  const [bookmarkIds, setBookmarkIds] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setBookmarkIds([])
      return
    }

    setLoading(true)
    getBookmarkIds()
      .then(setBookmarkIds)
      .catch(err => console.error('Error fetching bookmark IDs:', err))
      .finally(() => setLoading(false))
  }, [user])

  return { bookmarkIds, loading }
}
