import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

export function PrivateRoute() {
  const { token } = useAuth()

  if (!token) return <Navigate to="/login" replace />

  return <Outlet />
}
