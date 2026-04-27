import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/States'
import { Toaster } from 'react-hot-toast'

import { ProtectedRoute } from './components/ProtectedRoute'

// Core pages (Lazy-loaded for maximum split chunks)
const Home = lazy(() => import('./pages/Home'))
const ResourcePage = lazy(() => import('./pages/ResourcePage'))
const Profile = lazy(() => import('./pages/Profile'))

const Result = lazy(() => import('./pages/Result'))

// Admin pages
const Admin = lazy(() => import('./pages/Admin'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const AdminUpload = lazy(() => import('./pages/admin/AdminUpload'))
import AdminLayout from './components/AdminLayout'

export default function App () {
  return (
    <ErrorBoundary>
      <Toaster position='bottom-right' toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' } }} />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/notes' element={<ResourcePage type='notes' />} />
            <Route path='/syllabus' element={<ResourcePage type='syllabus' />} />
            <Route path='/pyq' element={<ResourcePage type='pyq' />} />
            <Route path='/profile/:id' element={<Profile />} />

            <Route path='/result' element={<Result />} />

            <Route path='/login' element={<Navigate to='/' replace />} />
            <Route path='/auth' element={<Navigate to='/' replace />} />
            <Route path='/leaderboard' element={<Navigate to='/' replace />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>

          {/* Admin routes with their own layout, moved outside of main Layout */}
          <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route path='/admin' element={<Admin />} />
            <Route path='/admin/analytics' element={<AdminAnalytics />} />
            <Route path='/admin/upload' element={<AdminUpload />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
