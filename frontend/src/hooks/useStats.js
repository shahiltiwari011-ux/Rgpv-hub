import { useState, useEffect } from 'react'
import { getStats } from '../services/api'
import { MOCK_STATS } from '../data/mockResources'

export function useStats () {
  const [stats, setStats] = useState(null)
  const [isPending, setIsPending] = useState(true)
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    getStats()
      .then(data => {
        setStats(data)
        setIsMock(false)
      })
      .catch(() => {
        setStats(MOCK_STATS)
        setIsMock(true)
      })
      .finally(() => setIsPending(false))
  }, [])

  return { stats, isPending, isMock }
}
