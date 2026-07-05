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
import type { AuditLogEntry } from '../api/buscarAuditoria'

type TablaAuditoriaProps = {
  eventos: AuditLogEntry[]
  onVerProfesional: (id: string) => void
}

function formatearFecha(timestamp: string) {
  return new Date(timestamp).toLocaleString()
}

export function TablaAuditoria({ eventos, onVerProfesional }: TablaAuditoriaProps) {
  const esDesktop = useMediaQuery('(min-width: 768px)')

  if (!esDesktop) {
    return (
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
        {eventos.map((evento) => (
          <div key={evento.id} className="flex flex-col gap-2 p-3.5">
            <div className="flex items-start justify-between gap-2.5">
              <span className="font-heading font-semibold">{evento.nombreUsuario ?? '-'}</span>
              <Badge variant="secondary" className="font-normal">{evento.accion}</Badge>
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span>{formatearFecha(evento.timestamp)}</span>
              <span>IP: {evento.ipOrigen ?? '-'}</span>
              {evento.detalleExtra ? <span>{evento.detalleExtra}</span> : null}
            </div>
            {evento.profesionalId ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onVerProfesional(evento.profesionalId!)}
              >
                Ver legajo
              </Button>
            ) : null}
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
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Accion</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>IP</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventos.map((evento) => (
            <TableRow key={evento.id}>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatearFecha(evento.timestamp)}
              </TableCell>
              <TableCell className="font-medium">{evento.nombreUsuario ?? '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">{evento.accion}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{evento.detalleExtra ?? '-'}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{evento.ipOrigen ?? '-'}</TableCell>
              <TableCell className="text-right">
                {evento.profesionalId ? (
                  <Button variant="outline" size="sm" onClick={() => onVerProfesional(evento.profesionalId!)}>
                    Ver legajo
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
