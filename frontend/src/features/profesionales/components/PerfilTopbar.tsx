import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VolverBusquedaButton } from './VolverBusquedaButton'

type PerfilTopbarProps = {
  apellido: string
  nombre: string
  nroExpediente: string | null
  puedeEscribir: boolean
  onEditar: () => void
  tipo?: string
  activo?: boolean
}

export function PerfilTopbar({
  apellido,
  nombre,
  nroExpediente,
  puedeEscribir,
  onEditar,
  tipo,
  activo,
}: PerfilTopbarProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
      <div className="flex min-w-0 flex-col gap-2">
        <VolverBusquedaButton />
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">
            {apellido}, {nombre}
          </h1>
          {activo !== undefined ? (
            <Badge className="gap-1.5 border-success/30 bg-success/10 font-normal text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {activo ? 'Activo' : 'Inactivo'}
            </Badge>
          ) : null}
        </div>
        {nroExpediente || tipo ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {nroExpediente ? (
              <span className="font-medium tabular-nums text-foreground">{nroExpediente}</span>
            ) : null}
            {nroExpediente && tipo ? <span className="size-[3px] rounded-full bg-border" /> : null}
            {tipo ? (
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <span className={`size-1.5 rounded-full ${tipo === 'Asistencial' ? 'bg-success' : 'bg-primary'}`} />
                {tipo}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      {puedeEscribir ? (
        <Button onClick={onEditar}>
          <Pencil />
          Editar
        </Button>
      ) : null}
    </div>
  )
}
