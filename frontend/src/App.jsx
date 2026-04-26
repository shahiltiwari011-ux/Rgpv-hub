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
const DiscussionPage = lazy(() => import('./pages/DiscussionPage'))
const ThreadPage = lazy(() => import('./pages/ThreadPage'))
const Result = lazy(() => import('./pages/Result'))

// Admin pages
const Admin = lazy(() => import('./pages/Admin'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const AdminUpload = lazy(() => import('./pages/admin/AdminUpload'))

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
            <Route path='/discussions' element={<DiscussionPage />} />
            <Route path='/discussion/:id' element={<ThreadPage />} />
            <Route path='/result' element={<Result />} />

            {/* Admin routes protected by adminOnly flag */}
            <Route
              path='/admin' element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
            }
            />
            <Route
              path='/admin/analytics' element={
                <ProtectedRoute adminOnly>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path='/admin/upload' element={
                <ProtectedRoute adminOnly>
                  <AdminUpload />
                </ProtectedRoute>
              }
            />

            <Route path='/login' element={<Navigate to='/' replace />} />
            <Route path='/auth' element={<Navigate to='/' replace />} />
            <Route path='/leaderboard' element={<Navigate to='/' replace />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
