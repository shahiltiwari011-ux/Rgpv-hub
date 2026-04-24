export default function Pagination ({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  // Build a smart page number list with ellipsis
  const getPageNumbers = () => {
    const pages = []
    const delta = 2 // pages to show around current page

    // Always include page 1
    pages.push(1)

    const rangeStart = Math.max(2, page - delta)
    const rangeEnd = Math.min(totalPages - 1, page + delta)

    if (rangeStart > 2) pages.push('…')
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
    if (rangeEnd < totalPages - 1) pages.push('…')

    // Always include last page
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '2rem 0', flexWrap: 'wrap' }}>
      <button className='tab-btn' disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
      {getPageNumbers().map((p, i) =>
        p === '…'
          ? (
            <span key={`ellipsis-${i}`} style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>…</span>
            )
          : (
            <button key={p} className={`tab-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>
              {p}
            </button>
            )
      )}
      <button className='tab-btn' disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
    </div>
  )
}
