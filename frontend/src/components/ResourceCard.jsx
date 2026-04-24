import { memo, useState } from 'react'
import { submitRating, trackDownload } from '../services/api'
import RatingPicker from './RatingPicker'
import { useAuth } from '../context/AuthContext'
import { useContinueLearning } from '../hooks/useContinueLearning'
import ShareButton from './ShareButton'
import HelpfulVote from './HelpfulVote'
import Comments from './Comments'
import { toast } from 'react-hot-toast'

const TYPE_META = {
  notes: { btnClass: 'notes-btn', icon: '📝', label: 'Notes', color: 'var(--accent-blue)' },
  pyq: { btnClass: 'pyq-btn', icon: '📄', label: 'PYQ', color: 'var(--accent-green)' },
  syllabus: { btnClass: 'syllabus-btn', icon: '📋', label: 'Syllabus', color: 'var(--accent-purple)' }
}

function ResourceCard ({
  item,
  type,
  ratingInfo = { average: 0, count: 0 },
  userRating = null,
  onRatingSubmitted
}) {
  const meta = TYPE_META[type] || TYPE_META.notes
  const { user } = useAuth()
  const { trackView } = useContinueLearning({ skipFetch: true })
  const [showComments, setShowComments] = useState(false)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const resourceUrl = typeof item.file_url === 'string' ? item.file_url.trim() : ''
  const hasDownload = Boolean(resourceUrl && resourceUrl !== '#')

  const openResource = (url) => {
    try {
      const resolved = new URL(url).toString()
      const popup = window.open(resolved, '_blank', 'noopener,noreferrer')
      if (!popup) {
        window.location.assign(resolved)
      }
    } catch {
      toast.error('This file link is invalid.')
    }
  }

  const handleRate = async (value) => {
    if (!user) {
      toast.error('Login to rate first.')
      return
    }

    if (isSubmittingRating) return

    setIsSubmittingRating(true)
    try {
      await submitRating(item.id, value)
      if (typeof onRatingSubmitted === 'function') {
        await onRatingSubmitted()
      }
      toast.success('Rating submitted.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const handleDownload = () => {
    if (!hasDownload) return
    trackDownload(item.id).catch(() => {})
    trackView(item.id)
    openResource(resourceUrl)
  }

  const handlePreview = () => {
    if (!hasDownload) return
    openResource(resourceUrl)
  }

  return (
    <div className='resource-card'>
      <div className='resource-type-badge' style={{ background: meta.color }}>
        {meta.icon} {meta.label}
      </div>

      <div className='resource-icon'>{item.icon || meta.icon}</div>
      <div className='resource-title'>{item.title || item.subject || 'Untitled'}</div>
      <div className='resource-meta-row'>
        <span>{item.branch}</span>
        <span>·</span>
        <span>Sem {item.semester}</span>
        {item.year && <><span>·</span><span>{item.year}</span></>}
        {item.file_size && <><span>·</span><span>{item.file_size}</span></>}
        {item.download_count !== undefined && <><span>·</span><span>{item.download_count} DLs</span></>}
      </div>

      {item.topics && item.topics.length > 0 && (
        <div className='resource-topics'>
          {item.topics.slice(0, 3).join(' • ')}
          {item.topics.length > 3 && ` +${item.topics.length - 3}`}
        </div>
      )}

      <div
        className='resource-engagement'
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <HelpfulVote resourceId={item.id} />
          <button
            className={`vote-btn ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid var(--border)',
              padding: '0.4rem 0.6rem',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            💬 {item.comment_count || 0}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(251, 191, 36, 0.05)', padding: '0.4rem 0.6rem', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.1)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24' }}>
            ★ {ratingInfo.average > 0 ? ratingInfo.average : '0.0'}
          </div>
          <RatingPicker value={userRating} onChange={handleRate} size='0.9rem' disabled={isSubmittingRating} />
        </div>

        <div className='share-buttons'>
          <ShareButton title={item.title} url={hasDownload ? resourceUrl : undefined} />
        </div>
      </div>

      {showComments && <Comments resourceId={item.id} />}

      {hasDownload
        ? (
          <div className='card-actions-grid'>
            <button
              type='button'
              onClick={handlePreview}
              className='btn-preview'
              style={{ textDecoration: 'none', border: 'none' }}
            >
              👁 Preview
            </button>
            <button
              type='button'
              className={`btn-download ${meta.btnClass}`}
              onClick={handleDownload}
              style={{ border: 'none' }}
            >
              ⬇ Download
            </button>
          </div>
          )
        : (
          <span className={`btn-download ${meta.btnClass}`} style={{ opacity: 0.5, cursor: 'default' }}>Coming Soon</span>
          )}
    </div>
  )
}

export default memo(ResourceCard)
