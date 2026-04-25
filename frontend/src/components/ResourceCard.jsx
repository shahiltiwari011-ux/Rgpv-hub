import { memo, useState } from 'react'
import { submitRating, trackDownload, getProxiedPdfUrl } from '../services/api'
import { useAuth } from '../context/AuthContext'
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
  const resourceUrl = typeof item.file_url === 'string' ? getProxiedPdfUrl(item.file_url.trim()) : ''
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
