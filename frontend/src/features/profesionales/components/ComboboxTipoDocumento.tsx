import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
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
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const busquedaTrim = busqueda.trim()
  const tiposFiltrados = tipos.filter((tipo) =>
    tipo.nombre.toLowerCase().includes(busquedaTrim.toLowerCase()),
  )
  const hayMatchExacto = tipos.some(
    (tipo) => tipo.nombre.toLowerCase() === busquedaTrim.toLowerCase(),
  )

  const elegir = (nombre: string) => {
    onChange(nombre)
    setBusqueda('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>{value || placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={busqueda}
            onValueChange={setBusqueda}
            placeholder="Buscar o crear tipo..."
          />
          <CommandList>
            {tiposFiltrados.length === 0 && busquedaTrim === '' && (
              <CommandEmpty>No hay tipos de documento cargados</CommandEmpty>
            )}
            <CommandGroup>
              {tiposFiltrados.map((tipo) => (
                <CommandItem key={tipo.id} value={tipo.nombre} onSelect={() => elegir(tipo.nombre)}>
                  <Check className={cn(value === tipo.nombre ? 'opacity-100' : 'opacity-0')} />
                  {tipo.nombre}
                </CommandItem>
              ))}
              {busquedaTrim !== '' && !hayMatchExacto && (
                <CommandItem value={`crear-${busquedaTrim}`} onSelect={() => elegir(busquedaTrim)}>
                  Crear tipo: {busquedaTrim}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
