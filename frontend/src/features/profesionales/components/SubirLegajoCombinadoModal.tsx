import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileStack } from 'lucide-react'
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
      onSubido()
      onOpenChange(false)
      resetear()
      toast.success('Legajo combinado subido correctamente')
    },
    onError: () => {
      toast.error('No se pudo subir el legajo combinado')
    },
  })

  function resetear() {
    setArchivo(null)
    setTotalPaginas(0)
    setMiniaturas([])
    setSeleccionadas([])
    setDescartadas([])
    setSegmentos([])
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleArchivo(file: File) {
    setArchivo(file)
    setSeleccionadas([])
    setDescartadas([])
    setSegmentos([])
    const documento = await cargarPdf(file)
    setTotalPaginas(documento.numPages)
    const renders = await Promise.all(
      rango(1, documento.numPages).map((pagina) => renderizarMiniatura(documento, pagina)),
    )
    setMiniaturas(renders)
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

  function armarSegmento() {
    if (seleccionadas.length === 0) return
    const paginaInicio = seleccionadas[0]
    const paginaFin = seleccionadas[seleccionadas.length - 1]
    setSegmentos((prev) => [...prev, { paginaInicio, paginaFin, tipoDocumentoNombre: '' }])
    setSeleccionadas([])
  }

  function cambiarTipoSegmento(indice: number, tipoDocumentoNombre: string) {
    setSegmentos((prev) => prev.map((s, i) => (i === indice ? { ...s, tipoDocumentoNombre } : s)))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetear()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir legajo combinado (PDF)</DialogTitle>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="pdf-combinado">Seleccionar PDF combinado</FieldLabel>
          <input
            ref={inputRef}
            id="pdf-combinado"
            type="file"
            accept="application/pdf"
            aria-label="Seleccionar PDF combinado"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleArchivo(file)
            }}
          />
        </Field>

        {totalPaginas > 0 && (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-4 gap-2">
              {rango(1, totalPaginas).map((pagina) => {
                const descartada = descartadasSet.has(pagina)
                const enSegmento = segmentos.some((s) => pagina >= s.paginaInicio && pagina <= s.paginaFin)
                return (
                  <div key={pagina} className="flex flex-col items-center gap-1 rounded-lg border p-2">
                    <img
                      src={miniaturas[pagina - 1]}
                      alt={`Pagina ${pagina}`}
                      className="h-20 w-full object-contain"
                    />
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        aria-label={`Pagina ${pagina}`}
                        checked={seleccionadasSet.has(pagina)}
                        disabled={descartada || enSegmento}
                        onChange={() => toggleSeleccionada(pagina)}
                      />
                      Pag. {pagina}
                    </label>
                    {!descartada && !enSegmento && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Descartar pagina ${pagina}`}
                        onClick={() => descartarPagina(pagina)}
                      >
                        Descartar
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            <Button type="button" variant="secondary" disabled={seleccionadas.length === 0} onClick={armarSegmento}>
              Armar segmento con paginas seleccionadas
            </Button>

            {segmentos.map((segmento, indice) => (
              <Field key={`${segmento.paginaInicio}-${segmento.paginaFin}`}>
                <FieldLabel htmlFor={`tipo-segmento-${indice}`}>
                  Paginas {segmento.paginaInicio}-{segmento.paginaFin}
                </FieldLabel>
                <ComboboxTipoDocumento
                  id={`tipo-segmento-${indice}`}
                  value={segmento.tipoDocumentoNombre}
                  onChange={(nombre) => cambiarTipoSegmento(indice, nombre)}
                  tipos={tipos ?? []}
                />
              </Field>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            disabled={!puedeGuardar || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <FileStack />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function rango(desde: number, hasta: number): number[] {
  return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
}
