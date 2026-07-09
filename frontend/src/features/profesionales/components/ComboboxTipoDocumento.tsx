import { ComboboxCatalogo } from '@/components/ComboboxCatalogo'
import type { TipoDocumento } from '../api/listarTiposDocumento'

type ComboboxTipoDocumentoProps = {
  id: string
  value: string
  onChange: (nombre: string) => void
  tipos: TipoDocumento[]
  disabled?: boolean
  placeholder?: string
}

export function ComboboxTipoDocumento({
  id,
  value,
  onChange,
  tipos,
  disabled,
  placeholder = 'Ej: DNI, Titulo, Certificado',
}: ComboboxTipoDocumentoProps) {
  return (
    <ComboboxCatalogo
      id={id}
      value={value}
      onChange={onChange}
      items={tipos}
      disabled={disabled}
      placeholder={placeholder}
      emptyMessage="No hay tipos de documento cargados"
      searchPlaceholder="Buscar o crear tipo..."
      createLabel="Crear tipo: "
    />
  )
}
