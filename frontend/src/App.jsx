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

// Role-based pages
const PlacementDashboard = lazy(() => import('./pages/PlacementDashboard'))
const StudentPlacementDrives = lazy(() => import('./pages/StudentPlacementDrives'))
const StudentPlacementCompanies = lazy(() => import('./pages/StudentPlacementCompanies'))
const StudentPlacementPackages = lazy(() => import('./pages/StudentPlacementPackages'))
const StudentPlacementExperiences = lazy(() => import('./pages/StudentPlacementExperiences'))
const StudentPlacementNotices = lazy(() => import('./pages/StudentPlacementNotices'))
const StudentPlacementResources = lazy(() => import('./pages/StudentPlacementResources'))
const TPODashboard = lazy(() => import('./pages/TPODashboard'))
const TPOCompanies = lazy(() => import('./pages/TPOCompanies'))
const TPODrives = lazy(() => import('./pages/TPODrives'))
const TPONotices = lazy(() => import('./pages/TPONotices'))
const TPOResources = lazy(() => import('./pages/TPOResources'))
const TPOPackages = lazy(() => import('./pages/TPOPackages'))
const TPOExperiences = lazy(() => import('./pages/TPOExperiences'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const TeacherUpload = lazy(() => import('./pages/TeacherUpload'))
const StudentAcademicProfile = lazy(() => import('./pages/StudentAcademicProfile'))

// Admin pages
const Admin = lazy(() => import('./pages/Admin'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const AdminUpload = lazy(() => import('./pages/admin/AdminUpload'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
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

            {/* Placement Portal (Publicly accessible - anyone can browse) */}
            <Route path='/placement' element={<PlacementDashboard />} />
            <Route path='/placement/drives' element={<StudentPlacementDrives />} />
            <Route path='/placement/companies' element={<StudentPlacementCompanies />} />
            <Route path='/placement/packages' element={<StudentPlacementPackages />} />
            <Route path='/placement/experiences' element={<StudentPlacementExperiences />} />
            <Route path='/placement/notices' element={<StudentPlacementNotices />} />
            <Route path='/placement/resources' element={<StudentPlacementResources />} />

            {/* Faculty Routes */}
            <Route path='/teacher' element={<ProtectedRoute allowedRoles={['faculty', 'teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path='/teacher/upload' element={<ProtectedRoute allowedRoles={['faculty', 'teacher', 'admin']}><TeacherUpload /></ProtectedRoute>} />
            <Route path='/teacher/academic-profile' element={<ProtectedRoute allowedRoles={['faculty', 'teacher', 'tpo', 'admin']}><StudentAcademicProfile /></ProtectedRoute>} />

            {/* TPO Routes */}
            <Route path='/tpo' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPODashboard /></ProtectedRoute>} />
            <Route path='/tpo/companies' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPOCompanies /></ProtectedRoute>} />
            <Route path='/tpo/drives' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPODrives /></ProtectedRoute>} />
            <Route path='/tpo/notices' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPONotices /></ProtectedRoute>} />
            <Route path='/tpo/resources' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPOResources /></ProtectedRoute>} />
            <Route path='/tpo/packages' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPOPackages /></ProtectedRoute>} />
            <Route path='/tpo/experiences' element={<ProtectedRoute allowedRoles={['tpo', 'admin']}><TPOExperiences /></ProtectedRoute>} />

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
            <Route path='/admin/users' element={<AdminUsers />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
