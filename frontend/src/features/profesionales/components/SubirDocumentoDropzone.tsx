import { useRef, useState, type DragEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Field, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { subirDocumento } from '../api/subirDocumento'
import { ComboboxTipoDocumento } from './ComboboxTipoDocumento'
import { useTiposDocumento } from '../hooks/useTiposDocumento'

type SubirDocumentoDropzoneProps = {
  profesionalId: string
  onSubido: () => void
}

export function SubirDocumentoDropzone({ profesionalId, onSubido }: SubirDocumentoDropzoneProps) {
  const [tipoDocumentoNombre, setTipoDocumentoNombre] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: tipos } = useTiposDocumento()
  const sinTipoElegido = tipoDocumentoNombre.trim() === ''

  const mutation = useMutation({
    mutationFn: (archivo: File) => subirDocumento(api, profesionalId, archivo, tipoDocumentoNombre),
    onSuccess: () => {
      onSubido()
      setTipoDocumentoNombre('')
      if (inputRef.current) inputRef.current.value = ''
      toast.success('Documento subido correctamente')
    },
  })

  const subir = (archivo: File) => {
    if (sinTipoElegido) return
    mutation.mutate(archivo)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    if (sinTipoElegido) return
    const archivo = e.dataTransfer.files[0]
    if (archivo) subir(archivo)
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-accent text-accent-foreground">
          <Upload className="size-[15px]" />
        </span>
        <h2 className="font-heading text-[15px] font-semibold">Subir documento</h2>
      </div>

      <Field>
        <FieldLabel htmlFor="tipoDocumentoNombre">Tipo de documento</FieldLabel>
        <ComboboxTipoDocumento
          id="tipoDocumentoNombre"
          value={tipoDocumentoNombre}
          onChange={setTipoDocumentoNombre}
          tipos={tipos ?? []}
        />
        {sinTipoElegido && (
          <p className="text-[12.5px] text-muted-foreground">
            Elegi o escribi un tipo de documento para habilitar la subida
          </p>
        )}
      </Field>

      <div
        role="button"
        aria-disabled={sinTipoElegido}
        tabIndex={sinTipoElegido ? -1 : 0}
        onDragOver={(e) => {
          if (sinTipoElegido) return
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!sinTipoElegido) inputRef.current?.click()
        }}
        onKeyDown={(e) => {
          if (sinTipoElegido) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        data-active={dragActive}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 p-5 text-center transition-colors data-[active=true]:border-primary data-[active=true]:bg-accent/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        <span className="flex size-[38px] items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Upload className="size-[19px]" />
        </span>
        <span className="text-[13.5px]">
          Arrastra un archivo aca o <span className="font-semibold text-primary">hace click</span> para elegirlo
        </span>
        <span className="text-[11.5px] text-muted-foreground">PDF, JPG o PNG - hasta 10 MB</span>
      </div>
      <label htmlFor="archivo" className="sr-only">
        Seleccionar archivo
      </label>
      <input
        ref={inputRef}
        id="archivo"
        type="file"
        className="sr-only"
        disabled={sinTipoElegido}
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) subir(archivo)
        }}
      />
      <Button type="button" className="w-full" disabled={sinTipoElegido} onClick={() => inputRef.current?.click()}>
        <Upload />
        Subir documento
      </Button>

      {mutation.isError && (
        <p className="text-sm text-destructive">No se pudo subir el documento</p>
      )}
      {mutation.isPending && <p className="text-sm text-muted-foreground">Subiendo...</p>}
    </div>
  )
}
