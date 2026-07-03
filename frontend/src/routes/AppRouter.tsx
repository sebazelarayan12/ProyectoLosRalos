import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from '@/features/auth/components/PrivateRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { BusquedaProfesionalesPage } from '@/features/profesionales/pages/BusquedaProfesionalesPage'
import { PerfilProfesionalPage } from '@/features/profesionales/pages/PerfilProfesionalPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profesionales" element={<BusquedaProfesionalesPage />} />
        <Route path="/profesionales/:id" element={<PerfilProfesionalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
