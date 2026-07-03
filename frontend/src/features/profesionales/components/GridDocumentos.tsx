import { DocumentoCard } from './DocumentoCard'
import type { DocumentoResumen } from '../api/obtenerProfesional'

type GridDocumentosProps = {
  documentos: DocumentoResumen[]
  onVerDocumento: (documento: DocumentoResumen) => void
}

export function GridDocumentos({ documentos, onVerDocumento }: GridDocumentosProps) {
  if (documentos.length === 0) {
    return <p className="text-muted-foreground">Sin documentos cargados</p>
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {documentos.map((documento) => (
        <DocumentoCard key={documento.id} documento={documento} onVer={onVerDocumento} />
      ))}
    </div>
  )
}
