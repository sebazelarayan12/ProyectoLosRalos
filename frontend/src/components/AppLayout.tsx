import { Outlet } from 'react-router-dom'
import { FileText, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/context/AuthContext'

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

export function AppLayout() {
  const { usuario, logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-[17px]" />
          </div>
          <div className="flex min-w-0 flex-col leading-[1.05]">
            <span className="font-heading text-sm font-semibold">Legajos Digitales</span>
            <span className="text-[11px] font-medium whitespace-nowrap text-muted-foreground">
              Hospital Los Ralos
            </span>
          </div>
        </div>
        {usuario ? (
          <div className="flex items-center gap-2.5">
            <div className="hidden flex-col text-right leading-[1.1] sm:flex">
              <span className="text-[12.5px] font-semibold">{usuario.nombre}</span>
              <span className="text-[11px] text-muted-foreground">
                {usuario.rol === 'Admin' ? 'Administrador' : 'Visor'}
              </span>
            </div>
            <div className="flex size-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
              {iniciales(usuario.nombre)}
            </div>
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Cerrar sesion">
              <LogOut />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        ) : null}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
