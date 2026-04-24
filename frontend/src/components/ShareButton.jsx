import { useState } from 'react'

export default function ShareButton ({ title, url }) {
  const [copied, setCopied] = useState(false)
  const shareText = `🔥 This note helped me in RGPV exams → ${url || window.location.href}`

  const handleWhatsApp = (e) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url || window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = url || window.location.href
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className='share-buttons'>
      <button className='share-btn whatsapp' onClick={handleWhatsApp} title='Share on WhatsApp'>
        💬
      </button>
      <button className='share-btn copy' onClick={handleCopy} title={copied ? 'Copied!' : 'Copy link'}>
        {copied ? '✅' : '🔗'}
      </button>
    </div>
  )
}
