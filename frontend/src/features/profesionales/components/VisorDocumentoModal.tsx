import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { api } from '@/lib/api'
import { useArchivoDocumento } from '../hooks/useArchivoDocumento'
import { eliminarDocumento } from '../api/eliminarDocumento'
import type { DocumentoResumen } from '../api/obtenerProfesional'

type VisorDocumentoModalProps = {
  documento: DocumentoResumen | null
  open: boolean
  onOpenChange: (open: boolean) => void
  esAdmin?: boolean
  onEliminado?: () => void
}

export function VisorDocumentoModal({
  documento,
  open,
  onOpenChange,
  esAdmin = false,
  onEliminado,
}: VisorDocumentoModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { data: blob, isLoading, isError } = useArchivoDocumento(documento?.id, open)
  const [url, setUrl] = useState<string | null>(null)

  // Invalidacion de cache delegada al caller via onEliminado — este modal no conoce
  // la query key ['profesional', id] del perfil, solo notifica que se elimino.
  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarDocumento(api, id),
    onSuccess: () => {
      onEliminado?.()
      onOpenChange(false)
    },
  })

  // Efecto requerido (no "ajuste de estado"): URL.createObjectURL crea un recurso del
  // browser que debe revocarse explicitamente en el cleanup cuando cambia el blob.
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
          {esAdmin ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Eliminar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion no se puede deshacer. El archivo se eliminara del legajo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => eliminarMutation.mutate(documento.id)}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
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
