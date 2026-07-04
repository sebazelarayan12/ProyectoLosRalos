import { useRef, useState, type DragEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { subirDocumento } from '../api/subirDocumento'

type SubirDocumentoDropzoneProps = {
  profesionalId: string
  onSubido: () => void
}

export function SubirDocumentoDropzone({ profesionalId, onSubido }: SubirDocumentoDropzoneProps) {
  const [tipoDocumentoNombre, setTipoDocumentoNombre] = useState('')
  const [errorTipo, setErrorTipo] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: (archivo: File) => subirDocumento(api, profesionalId, archivo, tipoDocumentoNombre),
    onSuccess: () => {
      onSubido()
      if (inputRef.current) inputRef.current.value = ''
    },
  })

  const subir = (archivo: File) => {
    if (tipoDocumentoNombre.trim() === '') {
      setErrorTipo(true)
      return
    }
    setErrorTipo(false)
    mutation.mutate(archivo)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
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
        <Input
          id="tipoDocumentoNombre"
          value={tipoDocumentoNombre}
          onChange={(e) => setTipoDocumentoNombre(e.target.value)}
          placeholder="Ej: DNI, Titulo, Certificado"
        />
      </Field>

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        data-active={dragActive}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 p-5 text-center transition-colors data-[active=true]:border-primary data-[active=true]:bg-accent/40"
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
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) subir(archivo)
        }}
      />
      <Button type="button" className="w-full" onClick={() => inputRef.current?.click()}>
        <Upload />
        Subir documento
      </Button>

      {errorTipo && <p className="text-sm text-destructive">Indica el tipo de documento antes de subir</p>}
      {mutation.isError && (
        <p className="text-sm text-destructive">No se pudo subir el documento</p>
      )}
      {mutation.isPending && <p className="text-sm text-muted-foreground">Subiendo...</p>}
    </div>
  )
}
