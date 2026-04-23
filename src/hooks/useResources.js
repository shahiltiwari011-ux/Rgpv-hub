import { useState, useEffect, useCallback } from 'react'
import { getResources } from '../services/api'

import { MOCK_RESOURCES } from '../data/mockResources'

export function useResources (type, initialFilters = {}) {
  const [data, setData] = useState([])
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [filters, setFilters] = useState({ branch: '', semester: '', search: '', page: 1, ...initialFilters })
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    setIsPending(true)
    setError(null)
    setIsMock(false)

    try {
      const result = await getResources({ ...filters, type })
      setData(result.data)
      setTotalPages(result.totalPages)
      setCount(result.count)
      setError(null)
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to mock data:', err.message)
      
      // Filter mock data locally
      const filteredMock = MOCK_RESOURCES.filter(item => {
        const matchesType = item.type === type
        const matchesBranch = !filters.branch || item.branch === filters.branch
        const matchesSem = !filters.semester || item.semester === parseInt(filters.semester)
        const matchesSearch = !filters.search || 
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          (item.subject && item.subject.toLowerCase().includes(filters.search.toLowerCase()))
        
        return matchesType && matchesBranch && matchesSem && matchesSearch
      })

      setData(filteredMock)
      setCount(filteredMock.length)
      setTotalPages(1)
      setIsMock(true)
      
      // Still set error if it's a real connection failure so UI can show a warning
      if (err.message.includes('fetch failed') || err.message.includes('timeout')) {
        setError('OFFLINE_MODE')
      } else {
        setError(err.message)
      }
    } finally {
      setIsPending(false)
    }
  }, [type, filters])

  useEffect(() => { fetch() }, [fetch])

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }))
  }

  return { data, isPending, error, filters, totalPages, count, updateFilter, refetch: fetch, isMock }
}
