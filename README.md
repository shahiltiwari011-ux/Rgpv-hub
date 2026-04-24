# 🎓 RGPV Study Hub (Production Version)

A full-stack, production-ready platform for RGPV diploma students to access notes, syllabus, PYQs, and results.

## 🚀 Deployment Guide

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** and run the migrations in this order (found in `backend/db/migrations/`):
   - `001_init.sql`
   - `002_rls.sql`
   - `003_unified_resources.sql`
3. Ensure the `study-materials` bucket is created in **Storage** (Migration 003 should handle this).

### 2. Backend Deployment (Railway)
1. Create a new project on [Railway](https://railway.app/).
2. Connect your GitHub repository or use the Railway CLI to deploy the `backend/` directory.
3. Set the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_KEY`: Your Supabase Service Role Key (or Anon Key)
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://rgpv-hub.vercel.app`)
   - `PORT`: `5000` (Railway usually provides this automatically)

### 3. Frontend Deployment (Vercel)
1. Create a new project on [Vercel](https://vercel.com/).
2. Import the repository and set the **Root Directory** to `frontend/`.
3. Set the following **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `VITE_API_URL`: Your Railway backend URL (e.g., `https://rgpv-hub-production.up.railway.app`)
4. Vercel will automatically use the `vercel.json` and `vite.config.js` for optimization and security headers.

## 🛡️ Production Hardening Features

- **Security**:
  - `helmet` middleware for HTTP header security.
  - Restricted CORS origin to the frontend domain.
  - Rate limiting on API routes to prevent abuse.
  - Robust Content Security Policy (CSP) in `vercel.json`.
- **Performance**:
  - Gzip/Brotli compression enabled on the backend.
  - Code-splitting and chunk optimization in Vite.
  - In-memory caching for Supabase resources and stats.
- **Resilience**:
  - 60-second fetch timeout for cold-starting Supabase projects.
  - Automatic retries for transient database connections.
  - Graceful "Offline Mode" fallbacks.

## 🛠️ Local Development

1. Run `npm install` in the root.
2. Run `npm run install:all` to install frontend and backend dependencies.
3. Start both with `npm run dev`.
