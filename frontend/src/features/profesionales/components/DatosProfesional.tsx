import type { ProfesionalDetalle } from '../api/obtenerProfesional'

type DatosProfesionalProps = {
  profesional: ProfesionalDetalle
}

function Campo({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span>{valor ?? '-'}</span>
    </div>
  )
}

export function DatosProfesional({ profesional }: DatosProfesionalProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Identificacion</h2>
        <Campo label="DNI" valor={profesional.dni} />
        <Campo label="CUIL" valor={profesional.cuil} />
        <Campo label="Fecha de nacimiento" valor={profesional.fechaNacimiento} />
        <Campo label="Sexo" valor={profesional.sexo} />
        <Campo label="Estado civil" valor={profesional.estadoCivil} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Contacto</h2>
        <Campo label="Domicilio" valor={profesional.domicilio} />
        <Campo label="Barrio" valor={profesional.barrio} />
        <Campo label="Localidad" valor={profesional.localidad} />
        <Campo label="Provincia" valor={profesional.provincia} />
        <Campo label="Codigo postal" valor={profesional.codigoPostal} />
        <Campo label="Telefono" valor={profesional.telefono} />
        <Campo label="Email" valor={profesional.email} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Cargo</h2>
        <Campo label="Funcion" valor={profesional.funcion} />
        <Campo label="Servicio" valor={profesional.servicio} />
        <Campo label="Nivel" valor={profesional.nivel} />
        <Campo label="Planta" valor={profesional.planta} />
      </section>
    </div>
  )
}
