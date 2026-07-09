import { ArrowDownUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OrdenarPor } from '../api/buscarProfesionales'

type OrdenarProfesionalesProps = {
  ordenarPor: OrdenarPor | undefined
  onOrdenarPorChange: (ordenarPor: OrdenarPor) => void
}

const OPCIONES_ORDEN: { value: OrdenarPor; label: string }[] = [
  { value: 'ApellidoAsc', label: 'Apellido (A-Z)' },
  { value: 'ApellidoDesc', label: 'Apellido (Z-A)' },
  { value: 'DniAsc', label: 'DNI ascendente' },
  { value: 'DniDesc', label: 'DNI descendente' },
]

export function OrdenarProfesionales({ ordenarPor, onOrdenarPorChange }: OrdenarProfesionalesProps) {
  return (
    <Select value={ordenarPor ?? 'ApellidoAsc'} onValueChange={(v) => onOrdenarPorChange(v as OrdenarPor)}>
      <SelectTrigger aria-label="Ordenar por" className="w-auto gap-1.5">
        <ArrowDownUp className="size-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {OPCIONES_ORDEN.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
