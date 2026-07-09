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

type ItemCatalogo = {
  id: string
  nombre: string
}

type ComboboxCatalogoProps = {
  id: string
  value: string
  onChange: (nombre: string) => void
  items: ItemCatalogo[]
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
  searchPlaceholder?: string
  createLabel?: string
}

export function ComboboxCatalogo({
  id,
  value,
  onChange,
  items,
  disabled,
  placeholder = 'Buscar o crear...',
  emptyMessage = 'No hay opciones cargadas',
  searchPlaceholder = 'Buscar o crear...',
  createLabel = 'Crear: ',
}: ComboboxCatalogoProps) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const busquedaTrim = busqueda.trim()
  const itemsFiltrados = items.filter((item) =>
    item.nombre.toLowerCase().includes(busquedaTrim.toLowerCase()),
  )
  const hayMatchExacto = items.some(
    (item) => item.nombre.toLowerCase() === busquedaTrim.toLowerCase(),
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
            placeholder={searchPlaceholder}
          />
          <CommandList>
            {itemsFiltrados.length === 0 && busquedaTrim === '' && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {itemsFiltrados.map((item) => (
                <CommandItem key={item.id} value={item.nombre} onSelect={() => elegir(item.nombre)}>
                  <Check className={cn(value === item.nombre ? 'opacity-100' : 'opacity-0')} />
                  {item.nombre}
                </CommandItem>
              ))}
              {busquedaTrim !== '' && !hayMatchExacto && (
                <CommandItem value={`crear-${busquedaTrim}`} onSelect={() => elegir(busquedaTrim)}>
                  {createLabel}{busquedaTrim}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
