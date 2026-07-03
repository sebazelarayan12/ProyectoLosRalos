import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type PerfilTopbarProps = {
  apellido: string
  nombre: string
  nroExpediente: string | null
  esAdmin: boolean
  onEditar: () => void
}

export function PerfilTopbar({
  apellido,
  nombre,
  nroExpediente,
  esAdmin,
  onEditar,
}: PerfilTopbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-4">
      <div className="flex flex-col gap-1">
        <Link to="/profesionales" className="text-sm text-muted-foreground hover:underline">
          Busqueda de profesionales
        </Link>
        <h1 className="font-heading text-lg font-medium">
          {apellido}, {nombre}
        </h1>
        <span className="text-sm text-muted-foreground">{nroExpediente ?? '-'}</span>
      </div>
      {esAdmin ? <Button onClick={onEditar}>Editar</Button> : null}
    </div>
  )
}
