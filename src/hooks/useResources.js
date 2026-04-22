import { useState, useEffect, useCallback } from 'react'
import { getResources } from '../services/api'

export function useResources (type, initialFilters = {}) {
  const [data, setData] = useState([])
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ branch: '', semester: '', search: '', page: 1, ...initialFilters })
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    setIsPending(true)
    setError(null)

    try {
      const result = await getResources({ ...filters, type })
      setData(result.data)
      setTotalPages(result.totalPages)
      setCount(result.count)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to fetch resources')
      setData([])
    } finally {
      setIsPending(false)
    }
  }, [type, filters])

  useEffect(() => { fetch() }, [fetch])

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }))
  }

  return { data, isPending, error, filters, totalPages, count, updateFilter, refetch: fetch }
}
