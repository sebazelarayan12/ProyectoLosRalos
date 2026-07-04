import { Briefcase, Phone, User } from 'lucide-react'
import type { ProfesionalDetalle } from '../api/obtenerProfesional'

type DatosProfesionalProps = {
  profesional: ProfesionalDetalle
}

function Campo({ label, valor, mono }: { label: string; valor: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? 'text-sm tabular-nums' : 'text-sm'}>{valor ?? '-'}</span>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof User
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-accent text-accent-foreground">
          <Icon className="size-[15px]" />
        </span>
        <h2 className="font-heading text-[15px] font-semibold">{titulo}</h2>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

export function DatosProfesional({ profesional }: DatosProfesionalProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard icon={User} titulo="Datos personales">
        <Campo label="DNI" valor={profesional.dni} mono />
        <Campo label="CUIL" valor={profesional.cuil} mono />
        <Campo label="Fecha de nacimiento" valor={profesional.fechaNacimiento} />
        <Campo label="Sexo" valor={profesional.sexo} />
        <Campo label="Estado civil" valor={profesional.estadoCivil} />
      </SectionCard>

      <SectionCard icon={Phone} titulo="Contacto">
        <Campo label="Telefono" valor={profesional.telefono} mono />
        <Campo label="Domicilio" valor={profesional.domicilio} />
        <Campo label="Barrio" valor={profesional.barrio} />
        <Campo label="Localidad" valor={profesional.localidad} />
        <Campo label="Provincia" valor={profesional.provincia} />
        <Campo label="Codigo postal" valor={profesional.codigoPostal} />
        <Campo label="Email" valor={profesional.email} />
      </SectionCard>

      <SectionCard icon={Briefcase} titulo="Cargo">
        <Campo label="Funcion" valor={profesional.funcion} />
        <Campo label="Servicio" valor={profesional.servicio} />
        <Campo label="Nivel" valor={profesional.nivel} />
        <Campo label="Planta" valor={profesional.planta} />
      </SectionCard>
    </div>
  )
}
