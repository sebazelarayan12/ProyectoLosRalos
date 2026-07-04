import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PaginacionResultados } from '@/components/PaginacionResultados'
import { useUsuarios } from '../hooks/useUsuarios'
import { TablaUsuarios } from '../components/TablaUsuarios'
import { EditarUsuarioDialog } from '../components/EditarUsuarioDialog'
import { ResetPasswordDialog } from '../components/ResetPasswordDialog'
import type { Usuario } from '../api/buscarUsuarios'

export function GestionUsuariosPage() {
  const navigate = useNavigate()
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [historial, setHistorial] = useState<(string | undefined)[]>([])
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null)
  const [usuarioAResetear, setUsuarioAResetear] = useState<Usuario | null>(null)

  const { data, isLoading } = useUsuarios({ cursor, porPagina: 20 })

  const handleNext = () => {
    if (!data?.cursor) return
    setHistorial((h) => [...h, cursor])
    setCursor(data.cursor ?? undefined)
  }

  const handlePrev = () => {
    if (historial.length === 0) return
    setCursor(historial[historial.length - 1])
    setHistorial((h) => h.slice(0, -1))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">Gestion de usuarios</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Cuentas con acceso al sistema de legajos</p>
        </div>
        <Button onClick={() => navigate('/usuarios/nuevo')}>
          <Plus />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex flex-col divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : data && data.items.length > 0 ? (
        <TablaUsuarios
          usuarios={data.items}
          onEditar={setUsuarioAEditar}
          onResetearPassword={setUsuarioAResetear}
        />
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border py-11 text-center">
          <div className="mb-2 flex size-13 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">No hay usuarios cargados</p>
        </div>
      )}

      <PaginacionResultados
        canGoPrev={historial.length > 0}
        canGoNext={!!data?.hasNextPage}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <EditarUsuarioDialog
        usuario={usuarioAEditar}
        open={usuarioAEditar !== null}
        onOpenChange={(open) => !open && setUsuarioAEditar(null)}
      />
      <ResetPasswordDialog
        usuario={usuarioAResetear}
        open={usuarioAResetear !== null}
        onOpenChange={(open) => !open && setUsuarioAResetear(null)}
      />
    </div>
  )
}
