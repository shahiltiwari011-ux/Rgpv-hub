import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getResourceRatingsBatch } from '../services/api'
import { useResources } from '../hooks/useResources'
import FilterBar from '../components/FilterBar'
import Pagination from '../components/Pagination'
import { LoadingSpinner, EmptyState, ErrorState } from '../components/States'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import ResourceCard from '../components/ResourceCard'
import { buildResourceListLink } from '../utils/resourceLinks'

const PAGE_CONFIG = {
  notes: {
    icon: '📝',
    title: 'Lecture Notes',
    subtitle: 'Download detailed, exam-focused notes for every subject',
    seoTitle: 'Lecture Notes - RGPV Study Hub',
    seoDescription: 'Browse latest RGPV Diploma notes for all branches. Download free RGPV Diploma lecture notes for Computer Science, Mechanical, Civil, Electrical, and Electronics.',
    emptyTitle: 'No notes found',
    emptyMessage: 'Try selecting a different branch or semester.',
    loadingText: 'Loading notes...',
    countLabel: 'resources'
  },
  syllabus: {
    icon: '📋',
    title: 'Syllabus',
    subtitle: 'Official RGPV Diploma syllabus with topic-wise breakdowns',
    seoTitle: 'Official Syllabus',
    seoDescription: 'Official RGPV Diploma syllabus with topic-wise breakdowns for CS, ME, CE, EE, and EX.',
    emptyTitle: 'No syllabus found',
    emptyMessage: 'Try a different filter.',
    loadingText: 'Loading syllabus...',
    countLabel: 'entries'
  },
  pyq: {
    icon: '📄',
    title: 'Previous Year Papers',
    subtitle: 'Practice with real exam papers from 2021-2024',
    seoTitle: 'Previous Year Question Papers (PYQ)',
    seoDescription: 'Practice with real RGPV Diploma exam papers from 2021-2024 for all engineering branches.',
    emptyTitle: 'No papers found',
    emptyMessage: 'Try a different filter.',
    loadingText: 'Loading papers...',
    countLabel: 'papers'
  }
}

export default function ResourcePage ({ type }) {
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.notes
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialBranch = searchParams.get('branch') || ''
  const { data, isPending, error, filters, totalPages, count, updateFilter, refetch } = useResources(type, { branch: initialBranch })
  const { user, isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState(filters.search)
  const [ratingsByResource, setRatingsByResource] = useState({})
  const [userRatingsByResource, setUserRatingsByResource] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        updateFilter('search', searchTerm)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchTerm, updateFilter, filters.search])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (filters.branch) nextParams.set('branch', filters.branch)
    const current = searchParams.toString()
    const next = nextParams.toString()

    if (current !== next) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [filters.branch, searchParams, setSearchParams])

  const refreshRatings = useCallback(async () => {
    if (!data.length) {
      setRatingsByResource({})
      setUserRatingsByResource({})
      return
    }

    const { ratingsByResource: nextRatings, userRatingsByResource: nextUserRatings } = await getResourceRatingsBatch(
      data.map(item => item.id),
      user?.id || null
    )

    setRatingsByResource(nextRatings)
    setUserRatingsByResource(nextUserRatings)
  }, [data, user?.id])

  useEffect(() => {
    refreshRatings()
  }, [refreshRatings])

  const handleTypeChange = (newType) => {
    navigate(
      buildResourceListLink({
        type: newType === 'pyq' ? 'pyq' : newType,
        branch: filters.branch
      })
    )
  }

  return (
    <>
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        urlPath={`/${type === 'pyq' ? 'pyq' : type}`}
      />
      <div className='page-hero'>
        <span className='page-hero-icon'>{config.icon}</span>
        <h1 className='page-hero-title'>{config.title}</h1>
        <p className='page-hero-sub'>{config.subtitle}</p>

        {isAdmin && (
          <Link
            to={`/admin/upload?type=${type}`}
            className='btn-primary'
            style={{
              marginTop: '1.5rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            + Upload {type === 'pyq' ? 'Paper' : type.charAt(0).toUpperCase() + type.slice(1, -1)}
          </Link>
        )}

        {count > 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>{count} {config.countLabel} found</p>}
      </div>

      <FilterBar
        branch={filters.branch}
        semester={filters.semester}
        search={searchTerm}
        type={type}
        onBranchChange={(value) => updateFilter('branch', value)}
        onSemesterChange={(value) => updateFilter('semester', value)}
        onSearchChange={setSearchTerm}
        onTypeChange={handleTypeChange}
      />

      {isPending && <LoadingSpinner text={config.loadingText} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!isPending && !error && data.length === 0 && <EmptyState icon={config.icon} title={config.emptyTitle} message={config.emptyMessage} />}

      {!isPending && !error && data.length > 0 && (
        <>
          <div className='subjects-grid'>
            {data.map((item) => (
              <ResourceCard
                key={item.id}
                item={item}
                type={type}
                ratingInfo={ratingsByResource[item.id] || { average: 0, count: 0 }}
                userRating={userRatingsByResource[item.id] ?? null}
                onRatingSubmitted={refreshRatings}
              />
            ))}
          </div>
          <Pagination page={filters.page} totalPages={totalPages} onPageChange={(page) => updateFilter('page', page)} />
        </>
      )}
    </>
  )
}
