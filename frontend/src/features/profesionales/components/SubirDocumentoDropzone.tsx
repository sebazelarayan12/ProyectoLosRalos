import { useRef, useState, type DragEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
    <div className="flex flex-col gap-3">
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
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        data-active={dragActive}
        className="cursor-pointer rounded-lg border-2 border-dashed border-input p-6 text-center text-sm text-muted-foreground data-[active=true]:border-primary"
      >
        Arrastra un archivo aca o hace click para elegirlo
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

      {errorTipo && <p className="text-sm text-destructive">Indica el tipo de documento antes de subir</p>}
      {mutation.isError && (
        <p className="text-sm text-destructive">No se pudo subir el documento</p>
      )}
      {mutation.isPending && <p className="text-sm text-muted-foreground">Subiendo...</p>}
    </div>
  )
}
