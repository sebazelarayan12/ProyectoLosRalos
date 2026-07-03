import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useArchivoDocumento } from '../hooks/useArchivoDocumento'
import type { DocumentoResumen } from '../api/obtenerProfesional'

type VisorDocumentoModalProps = {
  documento: DocumentoResumen | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VisorDocumentoModal({ documento, open, onOpenChange }: VisorDocumentoModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { data: blob, isLoading, isError } = useArchivoDocumento(documento?.id, open)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  if (!documento) return null

  const esImagen = documento.contentType.startsWith('image/')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{documento.tipoDocumento}</DialogTitle>
        </DialogHeader>

        {isLoading && <p>Cargando documento...</p>}
        {isError && <p>No se pudo cargar el documento</p>}

        {url && esImagen ? (
          <img src={url} alt={documento.tipoDocumento} className="max-h-[70vh] w-full object-contain" />
        ) : null}

        {url && !esImagen ? (
          isMobile ? (
            <a href={url} download={documento.nombreOriginal}>
              Abrir PDF
            </a>
          ) : (
            <iframe src={url} title="Documento" className="h-[70vh] w-full" />
          )
        ) : null}

        <DialogFooter>
          {url ? (
            <Button asChild>
              <a href={url} download={documento.nombreOriginal}>
                Descargar
              </a>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
