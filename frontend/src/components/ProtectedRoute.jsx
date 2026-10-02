import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './States'

export function ProtectedRoute ({ children, adminOnly = false, allowedRoles = [], publicAccessible = false }) {
  const { user, loading, isAdmin, role } = useAuth()

  if (loading) {
    return <LoadingSpinner text='Checking permissions...' />
  }

  // If page is marked as publicly accessible, skip all auth checks
  if (publicAccessible) {
    return children
  }

  if (!user) {
    return <Navigate to='/' replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to='/' replace />
  }

  if (allowedRoles.length > 0) {
    // The existing auth system uses 'user' as the default role.
    // Treat 'user' the same as 'student' for access control purposes.
    const effectiveRole = (role === 'user') ? 'student' : role

    if (!allowedRoles.includes(effectiveRole) && !isAdmin) {
      // Redirect to their respective dashboard
      if (effectiveRole === 'faculty' || effectiveRole === 'teacher') return <Navigate to='/teacher' replace />
      if (effectiveRole === 'tpo') return <Navigate to='/tpo' replace />
      return <Navigate to='/' replace />
    }
  }

  return children
}
