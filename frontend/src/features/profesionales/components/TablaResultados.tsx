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
import type { ProfesionalResumen } from '../api/buscarProfesionales'

type TablaResultadosProps = {
  profesionales: ProfesionalResumen[]
  onVerLegajo: (id: string) => void
}

export function TablaResultados({ profesionales, onVerLegajo }: TablaResultadosProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Apellido y Nombre</TableHead>
          <TableHead>Funcion / Servicio</TableHead>
          <TableHead>N. Expediente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {profesionales.map((profesional) => (
          <TableRow key={profesional.id}>
            <TableCell>{profesional.apellido}, {profesional.nombre}</TableCell>
            <TableCell>
              {profesional.servicio
                ? `${profesional.funcion} / ${profesional.servicio}`
                : profesional.funcion}
            </TableCell>
            <TableCell>{profesional.nroExpediente ? profesional.nroExpediente : '-'}</TableCell>
            <TableCell>
              <Badge variant="secondary">{profesional.tipo}</Badge>
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onVerLegajo(profesional.id)}>
                Ver legajo
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
