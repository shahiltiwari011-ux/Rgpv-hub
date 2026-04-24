import { useState, useEffect } from 'react'
import { getStats } from '../services/api'

export function useStats () {
  const [stats, setStats] = useState(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats({ total_notes: 0, total_pyq: 0, total_syllabus: 0 }))
      .finally(() => setIsPending(false))
  }, [])

  return { stats, isPending }
}
