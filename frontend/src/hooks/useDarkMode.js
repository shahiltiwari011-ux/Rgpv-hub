import { useState, useEffect } from 'react'

export function useDarkMode () {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('theme') === 'dark'
  })

  // Sync the data-theme attribute whenever dark state changes
  useEffect(() => {
    const root = window.document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      window.localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      window.localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggle = () => {
    setDark(d => !d)
  }

  return { dark, toggle }
}
