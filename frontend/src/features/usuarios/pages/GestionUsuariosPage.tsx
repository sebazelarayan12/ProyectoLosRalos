import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">Gestion de usuarios</h1>
        <Button onClick={() => navigate('/usuarios/nuevo')}>Nuevo usuario</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data && data.items.length > 0 ? (
        <TablaUsuarios
          usuarios={data.items}
          onEditar={setUsuarioAEditar}
          onResetearPassword={setUsuarioAResetear}
        />
      ) : (
        <p className="text-muted-foreground">No hay usuarios cargados</p>
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
