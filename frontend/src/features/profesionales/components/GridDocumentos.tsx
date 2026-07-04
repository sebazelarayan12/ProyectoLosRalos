import { Inbox } from 'lucide-react'
import { DocumentoCard } from './DocumentoCard'
import type { DocumentoResumen } from '../api/obtenerProfesional'

type GridDocumentosProps = {
  documentos: DocumentoResumen[]
  onVerDocumento: (documento: DocumentoResumen) => void
}

export function GridDocumentos({ documentos, onVerDocumento }: GridDocumentosProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-[15px] font-semibold">Documentos</h2>
        <span className="text-xs text-muted-foreground">
          {documentos.length} archivo{documentos.length === 1 ? '' : 's'}
        </span>
      </div>
      {documentos.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border py-9 text-center">
          <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-[22px]" />
          </span>
          <h3 className="text-[15px] font-semibold">Sin documentos cargados</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documentos.map((documento) => (
            <DocumentoCard key={documento.id} documento={documento} onVer={onVerDocumento} />
          ))}
        </div>
      )}
    </div>
  )
}
