export function buildResourceListLink ({ type = 'notes', branch = '', semester = '', search = '', page = 1 } = {}) {
  const params = new URLSearchParams()

  if (branch) params.set('branch', branch)
  if (semester) params.set('semester', String(semester))
  if (search) params.set('search', search)
  if (page && page > 1) params.set('page', String(page))

  const query = params.toString()
  return `/${type}${query ? `?${query}` : ''}`
}
