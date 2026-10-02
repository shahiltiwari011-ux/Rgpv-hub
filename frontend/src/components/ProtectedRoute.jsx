import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './States'

export function ProtectedRoute ({ children, adminOnly = false, allowedRoles = [], publicAccessible = false }) {
  const { user, loading, isAdmin, role } = useAuth()

  // 1. Wait for Supabase session and authoritative profile to finish loading
  if (loading) {
    return <LoadingSpinner text='Checking permissions...' />
  }

  // 2. If page is marked as publicly accessible, allow access
  if (publicAccessible) {
    return children
  }

  // 3. No authenticated user -> redirect to home/login
  if (!user) {
    return <Navigate to='/' replace />
  }

  // 4. Admin-only route guard
  if (adminOnly && !isAdmin) {
    return <Navigate to='/' replace />
  }

  // 5. Allowed roles guard
  if (allowedRoles.length > 0) {
    const effectiveRole = (role === 'user') ? 'student' : (role === 'teacher' ? 'faculty' : role)

    if (!allowedRoles.includes(effectiveRole) && !isAdmin) {
      // Redirect unauthorized user to their respective role portal
      if (effectiveRole === 'faculty') return <Navigate to='/teacher' replace />
      if (effectiveRole === 'tpo') return <Navigate to='/tpo' replace />
      if (effectiveRole === 'admin') return <Navigate to='/admin' replace />
      return <Navigate to='/' replace />
    }
  }

  return children
}

