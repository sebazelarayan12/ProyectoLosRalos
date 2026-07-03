import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from '@/features/auth/components/PrivateRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { BusquedaProfesionalesPage } from '@/features/profesionales/pages/BusquedaProfesionalesPage'
import { PerfilProfesionalPage } from '@/features/profesionales/pages/PerfilProfesionalPage'
import { CrearProfesionalPage } from '@/features/profesionales/pages/CrearProfesionalPage'
import { EditarProfesionalPage } from '@/features/profesionales/pages/EditarProfesionalPage'
import { GestionUsuariosPage } from '@/features/usuarios/pages/GestionUsuariosPage'
import { CrearUsuarioPage } from '@/features/usuarios/pages/CrearUsuarioPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profesionales" element={<BusquedaProfesionalesPage />} />
        <Route path="/profesionales/nuevo" element={<CrearProfesionalPage />} />
        <Route path="/profesionales/:id" element={<PerfilProfesionalPage />} />
        <Route path="/profesionales/:id/editar" element={<EditarProfesionalPage />} />
        <Route path="/usuarios" element={<GestionUsuariosPage />} />
        <Route path="/usuarios/nuevo" element={<CrearUsuarioPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
