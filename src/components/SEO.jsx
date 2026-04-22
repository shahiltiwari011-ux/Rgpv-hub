import { useEffect } from 'react'

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')

function getSiteUrl () {
  if (SITE_URL) return SITE_URL
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export default function SEO ({ title, description, keywords, urlPath = '', noIndex = false }) {
  const siteName = 'RGPV Study Hub'
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const fullDescription = description || 'Free Notes, Syllabus & PYQ for all RGPV Diploma branches. CS, Mechanical, Electrical, Civil, and Electronics.'
  const siteUrl = getSiteUrl()
  const fullUrl = siteUrl ? `${siteUrl}${urlPath}` : urlPath || '/'

  useEffect(() => {
    // Update Title
    document.title = fullTitle

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', fullDescription)

    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.name = 'keywords'
      document.head.appendChild(metaKeywords)
    }
    if (keywords) {
      metaKeywords.setAttribute('content', keywords)
    }

    // Update Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', fullUrl)

    // Update OG Tags (Basic)
    const updateOG = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    updateOG('og:title', fullTitle)
    updateOG('og:description', fullDescription)
    updateOG('og:url', fullUrl)
    updateOG('og:type', 'website')

    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow')
  }, [fullTitle, fullDescription, fullUrl, keywords, noIndex])

  return null // SEO component doesn't need to render anything in the body
}
