import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DocumentoResumen } from '../api/obtenerProfesional'

type DocumentoCardProps = {
  documento: DocumentoResumen
  onVer: (documento: DocumentoResumen) => void
}

export function DocumentoCard({ documento, onVer }: DocumentoCardProps) {
  const fecha = new Date(documento.fechaCarga).toLocaleDateString('es-AR')

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onVer(documento)}
      className="cursor-pointer transition-colors hover:bg-muted/50"
    >
      <CardContent className="flex items-center gap-3">
        <FileText className="size-5 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-medium">{documento.tipoDocumento}</span>
          <span className="text-sm text-muted-foreground">{fecha}</span>
        </div>
      </CardContent>
    </Card>
  )
}
