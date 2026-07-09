import type { TipoLegajo } from '@/features/profesionales/api/buscarProfesionales'

const colores: Record<TipoLegajo, string> = {
  Asistencial: 'bg-success',
  NoAsistencial: 'bg-primary',
  CP: 'bg-warning',
}

export function colorTipoLegajo(tipo: TipoLegajo | string): string {
  return colores[tipo as TipoLegajo] ?? 'bg-primary'
}
