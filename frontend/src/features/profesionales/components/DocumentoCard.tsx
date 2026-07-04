import { FileText, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DocumentoResumen } from '../api/obtenerProfesional'

type DocumentoCardProps = {
  documento: DocumentoResumen
  onVer: (documento: DocumentoResumen) => void
}

function extension(nombreOriginal: string) {
  const partes = nombreOriginal.split('.')
  return partes.length > 1 ? partes[partes.length - 1].toUpperCase() : ''
}

function formatearTamanio(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentoCard({ documento, onVer }: DocumentoCardProps) {
  const fecha = new Date(documento.fechaCarga).toLocaleDateString('es-AR')
  const esImagen = documento.contentType.startsWith('image/')
  const ext = extension(documento.nombreOriginal)

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onVer(documento)}
      className="cursor-pointer gap-0 rounded-xl transition-colors hover:bg-muted/50"
    >
      <CardContent className="flex items-center gap-3 px-3 py-0">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground">
          {esImagen ? <ImageIcon className="size-[19px]" /> : <FileText className="size-[19px]" />}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13.5px] font-semibold">{documento.tipoDocumento}</span>
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            {ext ? (
              <span
                className={`inline-flex h-[15px] items-center rounded px-1 text-[10px] font-bold tracking-wide ${
                  esImagen ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {ext}
              </span>
            ) : null}
            {fecha} - {formatearTamanio(documento.tamanioBytes)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
