import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { colorTipoLegajo } from '@/lib/tipoLegajoColor'
import type { ProfesionalResumen } from '../api/buscarProfesionales'

type TablaResultadosProps = {
  profesionales: ProfesionalResumen[]
  onVerLegajo: (id: string) => void
}

function TipoBadge({ tipo }: { tipo: ProfesionalResumen['tipo'] }) {
  if (!tipo) return <span className="text-sm text-muted-foreground">-</span>

  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <span className={`size-1.5 rounded-full ${colorTipoLegajo(tipo)}`} />
      {tipo}
    </Badge>
  )
}

export function TablaResultados({ profesionales, onVerLegajo }: TablaResultadosProps) {
  const esDesktop = useMediaQuery('(min-width: 768px)')

  if (!esDesktop) {
    return (
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
        {profesionales.map((profesional) => (
          <div key={profesional.id} className="flex flex-col gap-3 p-3.5">
            <div className="flex items-start justify-between gap-2.5">
              <span className="font-heading font-semibold">
                {profesional.apellido}, {profesional.nombre}
              </span>
              <TipoBadge tipo={profesional.tipo} />
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-baseline gap-2.5">
                <span className="w-[86px] shrink-0 text-xs text-muted-foreground">DNI</span>
                <span className="tabular-nums">{profesional.dni}</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="w-[86px] shrink-0 text-xs text-muted-foreground">CUIL</span>
                <span className="tabular-nums">{profesional.cuil ?? '-'}</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="w-[86px] shrink-0 text-xs text-muted-foreground">Cargo</span>
                <span>{profesional.cargo}</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="w-[86px] shrink-0 text-xs text-muted-foreground">Expediente</span>
                <span className="tabular-nums">{profesional.nroExpediente ?? '-'}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => onVerLegajo(profesional.id)}>
              Ver legajo
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Apellido y Nombre</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>CUIL</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>N. Expediente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {profesionales.map((profesional) => (
            <TableRow key={profesional.id}>
              <TableCell className="font-medium">
                {profesional.apellido}, {profesional.nombre}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{profesional.dni}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{profesional.cuil ?? '-'}</TableCell>
              <TableCell className="text-muted-foreground">{profesional.cargo}</TableCell>
              <TableCell className="tabular-nums">
                {profesional.nroExpediente ? profesional.nroExpediente : '-'}
              </TableCell>
              <TableCell>
                <TipoBadge tipo={profesional.tipo} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onVerLegajo(profesional.id)}>
                  Ver legajo
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
