import fs from 'node:fs'
import path from 'node:path'
import { getMergedEnv, resolveSiteUrl } from './site-url.mjs'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const requiredFiles = ['index.html', 'robots.txt', 'sitemap.xml']
const requiredEnvKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const mergedEnv = getMergedEnv(rootDir)

const missingEnv = requiredEnvKeys.filter((key) => !mergedEnv[key])
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`)
}

for (const file of requiredFiles) {
  const filePath = path.join(distDir, file)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing build artifact: dist/${file}`)
  }
}

const sitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8')
if (sitemap.includes('/dashboard')) {
  throw new Error('Private dashboard route should not appear in sitemap.xml')
}

const resolvedSiteUrl = resolveSiteUrl(mergedEnv)
const robots = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8')
if (resolvedSiteUrl) {
  if (!robots.includes(`${resolvedSiteUrl}/sitemap.xml`)) {
    throw new Error('robots.txt does not reference the configured production sitemap URL')
  }
} else if (!robots.includes('https://example.com/sitemap.xml')) {
  throw new Error('robots.txt fallback sitemap URL is missing')
}

console.log('Release check passed.')
