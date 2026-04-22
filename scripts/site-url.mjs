import fs from 'node:fs'
import path from 'node:path'

export function readEnvFile(rootDir, fileName) {
  const filePath = path.join(rootDir, fileName)
  if (!fs.existsSync(filePath)) return {}

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return acc
      const index = trimmed.indexOf('=')
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
      acc[key] = value
      return acc
    }, {})
}

export function getMergedEnv(rootDir) {
  return {
    ...readEnvFile(rootDir, '.env'),
    ...readEnvFile(rootDir, '.env.local'),
    ...process.env
  }
}

export function resolveSiteUrl(env) {
  const explicit = env.VITE_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercelProduction = env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return `https://${vercelProduction.replace(/^https?:\/\//, '').replace(/\/$/, '')}`

  const vercelPreview = env.VERCEL_URL
  if (vercelPreview) return `https://${vercelPreview.replace(/^https?:\/\//, '').replace(/\/$/, '')}`

  const netlifyUrl = env.URL || env.DEPLOY_PRIME_URL
  if (netlifyUrl) return netlifyUrl.replace(/\/$/, '')

  return ''
}
