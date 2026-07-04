import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, FileText, Trash2 } from 'lucide-react'
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
      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="flex-row items-center gap-2.5 space-y-0 border-b px-4.5 py-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="size-[17px]" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="text-[15.5px]">{documento.tipoDocumento}</DialogTitle>
            <p className="truncate text-xs text-muted-foreground">
              {documento.nombreOriginal} - {new Date(documento.fechaCarga).toLocaleDateString('es-AR')}
            </p>
          </div>
        </DialogHeader>

        <div className="bg-muted/40 p-4.5">
          {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Cargando documento...</p>}
          {isError && <p className="py-8 text-center text-sm text-destructive">No se pudo cargar el documento</p>}

          {url && esImagen ? (
            <img
              src={url}
              alt={documento.tipoDocumento}
              className="max-h-[70vh] w-full rounded-lg border bg-card object-contain"
            />
          ) : null}

          {url && !esImagen ? (
            isMobile ? (
              <a href={url} download={documento.nombreOriginal} className="text-primary underline">
                Abrir PDF
              </a>
            ) : (
              <iframe src={url} title="Documento" className="h-[70vh] w-full rounded-lg border bg-card" />
            )
          ) : null}
        </div>

        <DialogFooter className="border-t px-4.5 py-3.5 sm:justify-between">
          {esAdmin ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 />
                  Eliminar
                </Button>
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
          ) : (
            <span />
          )}
          {url ? (
            <Button asChild>
              <a href={url} download={documento.nombreOriginal}>
                <Download />
                Descargar
              </a>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
