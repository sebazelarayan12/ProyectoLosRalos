import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, FileStack, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { api } from '@/lib/api'
import { subirLoteDocumentos, type SegmentoParaEnviar } from '../api/subirLoteDocumentos'
import { cargarPdf, renderizarMiniatura } from '../lib/pdfMiniaturas'
import { ComboboxTipoDocumento } from './ComboboxTipoDocumento'
import { useTiposDocumento } from '../hooks/useTiposDocumento'

type SubirLegajoCombinadoModalProps = {
  profesionalId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubido: () => void
}

type Segmento = {
  paginaInicio: number
  paginaFin: number
  tipoDocumentoNombre: string
}

export function SubirLegajoCombinadoModal({
  profesionalId,
  open,
  onOpenChange,
  onSubido,
}: SubirLegajoCombinadoModalProps) {
  const { data: tipos } = useTiposDocumento()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [miniaturas, setMiniaturas] = useState<string[]>([])
  const [seleccionadas, setSeleccionadas] = useState<number[]>([])
  const [descartadas, setDescartadas] = useState<number[]>([])
  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [cargandoArchivo, setCargandoArchivo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const paginasAsignadas = useMemo(
    () => new Set([...descartadas, ...segmentos.flatMap((s) => rango(s.paginaInicio, s.paginaFin))]),
    [descartadas, segmentos],
  )
  const descartadasSet = useMemo(() => new Set(descartadas), [descartadas])
  const seleccionadasSet = useMemo(() => new Set(seleccionadas), [seleccionadas])
  const todasDecididas = totalPaginas > 0 && paginasAsignadas.size === totalPaginas
  const segmentosSinTipo = segmentos.some((s) => s.tipoDocumentoNombre.trim() === '')
  const puedeGuardar = todasDecididas && segmentos.length > 0 && !segmentosSinTipo

  const mutation = useMutation({
    mutationFn: () =>
      subirLoteDocumentos(
        api,
        profesionalId,
        archivo!,
        segmentos.map((s): SegmentoParaEnviar => ({
          paginaInicio: s.paginaInicio,
          paginaFin: s.paginaFin,
          tipoDocumentoNombre: s.tipoDocumentoNombre,
        })),
      ),
    onSuccess: () => {
      onOpenChange(false)
      resetear()
      toast.success('Legajo combinado subido correctamente')
    },
    onError: () => {
      toast.error(
        'No se pudo completar la subida — algunos documentos pueden haberse creado, revisa el legajo antes de reintentar',
      )
    },
    // El backend no es transaccional entre segmentos: si falla a mitad de camino, los
    // documentos ya creados existen. Se refresca el legajo siempre, no solo en exito.
    onSettled: () => {
      onSubido()
    },
  })

  function resetear() {
    setArchivo(null)
    setTotalPaginas(0)
    setMiniaturas([])
    setSeleccionadas([])
    setDescartadas([])
    setSegmentos([])
    setCargandoArchivo(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleArchivo(file: File) {
    setArchivo(file)
    setSeleccionadas([])
    setDescartadas([])
    setSegmentos([])
    setTotalPaginas(0)
    setMiniaturas([])
    setCargandoArchivo(true)
    try {
      const documento = await cargarPdf(file)
      const renders = await Promise.all(
        rango(1, documento.numPages).map((pagina) => renderizarMiniatura(documento, pagina)),
      )
      setTotalPaginas(documento.numPages)
      setMiniaturas(renders)
    } catch {
      toast.error('No se pudo leer el PDF — verifica que el archivo no este danado')
      if (inputRef.current) inputRef.current.value = ''
      setArchivo(null)
    } finally {
      setCargandoArchivo(false)
    }
  }

  function toggleSeleccionada(pagina: number) {
    setSeleccionadas((prev) =>
      prev.includes(pagina) ? prev.filter((p) => p !== pagina) : [...prev, pagina].sort((a, b) => a - b),
    )
  }

  function descartarPagina(pagina: number) {
    setDescartadas((prev) => [...prev, pagina])
    setSeleccionadas((prev) => prev.filter((p) => p !== pagina))
  }

  function recuperarPagina(pagina: number) {
    setDescartadas((prev) => prev.filter((p) => p !== pagina))
  }

  function armarSegmento() {
    if (seleccionadas.length === 0) return
    // Un segmento es un rango contiguo: si hay huecos en la seleccion (ej. 1 y 4) el
    // rango se ensancharia en silencio y se tragaria paginas ajenas al documento.
    const contigua = seleccionadas.every((pagina, i) => pagina === seleccionadas[0] + i)
    if (!contigua) {
      toast.error('Las paginas seleccionadas deben ser consecutivas')
      return
    }
    const paginaInicio = seleccionadas[0]
    const paginaFin = seleccionadas[seleccionadas.length - 1]
    setSegmentos((prev) => [...prev, { paginaInicio, paginaFin, tipoDocumentoNombre: '' }])
    setSeleccionadas([])
  }

  function quitarSegmento(indice: number) {
    setSegmentos((prev) => prev.filter((_, i) => i !== indice))
  }

  function cambiarTipoSegmento(indice: number, tipoDocumentoNombre: string) {
    setSegmentos((prev) => prev.map((s, i) => (i === indice ? { ...s, tipoDocumentoNombre } : s)))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (cargandoArchivo || mutation.isPending) return
          resetear()
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir legajo combinado (PDF)</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3.5 overflow-x-hidden overflow-y-auto">
          <Field>
            <FieldLabel htmlFor="pdf-combinado">PDF combinado</FieldLabel>
            <input
              ref={inputRef}
              id="pdf-combinado"
              type="file"
              accept="application/pdf"
              aria-label="Seleccionar PDF combinado"
              className="hidden"
              disabled={cargandoArchivo || mutation.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleArchivo(file)
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={cargandoArchivo || mutation.isPending}
                onClick={() => inputRef.current?.click()}
              >
                <Upload />
                Seleccionar PDF combinado
              </Button>
              {archivo && !cargandoArchivo && (
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {archivo.name}
                </span>
              )}
            </div>
            {cargandoArchivo && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Procesando PDF y generando miniaturas...
              </p>
            )}
          </Field>

          {totalPaginas > 0 && (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {rango(1, totalPaginas).map((pagina) => {
                  const descartada = descartadasSet.has(pagina)
                  const segmentoAsignado = segmentos.find(
                    (s) => pagina >= s.paginaInicio && pagina <= s.paginaFin,
                  )
                  const enSegmento = segmentoAsignado !== undefined
                  return (
                    <div
                      key={pagina}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${
                        enSegmento ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="relative w-full">
                        <img
                          src={miniaturas[pagina - 1]}
                          alt={`Pagina ${pagina}`}
                          className={`h-20 w-full object-contain ${enSegmento ? 'opacity-60' : ''}`}
                        />
                        {enSegmento && (
                          <span className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3.5" />
                          </span>
                        )}
                      </div>
                      {descartada ? (
                        <>
                          <span className="text-muted-foreground text-xs">Pag. {pagina} (descartada)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={mutation.isPending}
                            aria-label={`Recuperar pagina ${pagina}`}
                            onClick={() => recuperarPagina(pagina)}
                          >
                            Recuperar
                          </Button>
                        </>
                      ) : enSegmento ? (
                        <span className="text-primary text-xs font-medium">
                          Pag. {pagina} — asignada
                        </span>
                      ) : (
                        <>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              aria-label={`Pagina ${pagina}`}
                              checked={seleccionadasSet.has(pagina)}
                              disabled={mutation.isPending}
                              onChange={() => toggleSeleccionada(pagina)}
                            />
                            Pag. {pagina}
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={mutation.isPending}
                            aria-label={`Descartar pagina ${pagina}`}
                            onClick={() => descartarPagina(pagina)}
                          >
                            Descartar
                          </Button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="secondary"
                disabled={seleccionadas.length === 0 || mutation.isPending}
                onClick={armarSegmento}
              >
                Armar segmento con paginas seleccionadas
              </Button>

              {segmentos.map((segmento, indice) => (
                <Field key={`${segmento.paginaInicio}-${segmento.paginaFin}`}>
                  <FieldLabel htmlFor={`tipo-segmento-${indice}`}>
                    Paginas {segmento.paginaInicio}-{segmento.paginaFin}
                  </FieldLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <ComboboxTipoDocumento
                        id={`tipo-segmento-${indice}`}
                        value={segmento.tipoDocumentoNombre}
                        onChange={(nombre) => cambiarTipoSegmento(indice, nombre)}
                        tipos={tipos ?? []}
                        disabled={mutation.isPending}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={mutation.isPending}
                      aria-label={`Quitar segmento paginas ${segmento.paginaInicio}-${segmento.paginaFin}`}
                      onClick={() => quitarSegmento(indice)}
                    >
                      Quitar segmento
                    </Button>
                  </div>
                </Field>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!puedeGuardar || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <FileStack />}
            {mutation.isPending ? 'Subiendo...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function rango(desde: number, hasta: number): number[] {
  return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
}
