import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VolverBusquedaButton() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground">
      <Link to="/profesionales">
        <ArrowLeft data-icon="inline-start" />
        Volver a busqueda
      </Link>
    </Button>
  )
}
