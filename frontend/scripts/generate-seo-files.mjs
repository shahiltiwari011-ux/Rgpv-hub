import fs from 'node:fs'
import path from 'node:path'
import { getMergedEnv, resolveSiteUrl } from './site-url.mjs'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const mergedEnv = getMergedEnv(rootDir)
const siteUrl = resolveSiteUrl(mergedEnv) || 'https://rgpvdiploma.vercel.app'
const publicRoutes = ['/', '/notes', '/pyq', '/syllabus', '/leaderboard', '/discussions']

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes.map((route, index) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${index === 0 ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`

fs.mkdirSync(distDir, { recursive: true })
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8')
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8')

const indexPath = path.join(distDir, 'index.html')
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8')
    .replaceAll('https://rgpvdiploma.vercel.app/#website', `${siteUrl}/#website`)
    .replaceAll('https://rgpvdiploma.vercel.app/#organization', `${siteUrl}/#organization`)
    .replaceAll('https://rgpvdiploma.vercel.app/', `${siteUrl}/`)
  fs.writeFileSync(indexPath, indexHtml, 'utf8')
}
