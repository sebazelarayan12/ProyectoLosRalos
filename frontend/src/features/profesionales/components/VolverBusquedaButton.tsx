import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type VolverBusquedaButtonProps = {
  to?: string
  label?: string
}

export function VolverBusquedaButton({ to = '/profesionales', label = 'Volver a busqueda' }: VolverBusquedaButtonProps) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground">
      <Link to={to}>
        <ArrowLeft data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  )
}
