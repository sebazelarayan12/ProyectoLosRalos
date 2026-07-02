import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold">Bienvenido, {usuario?.nombre}</h1>
      <Button onClick={() => navigate('/profesionales')}>Buscar profesionales</Button>
      <Button variant="outline" onClick={handleLogout}>Cerrar sesion</Button>
    </div>
  )
}
