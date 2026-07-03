import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProfesionalDetalle } from '../hooks/useProfesionalDetalle'
import { PerfilTopbar } from '../components/PerfilTopbar'
import { DatosProfesional } from '../components/DatosProfesional'
import { GridDocumentos } from '../components/GridDocumentos'
import { VisorDocumentoModal } from '../components/VisorDocumentoModal'
import { SubirDocumentoDropzone } from '../components/SubirDocumentoDropzone'
import type { DocumentoResumen } from '../api/obtenerProfesional'

export function PerfilProfesionalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  const { data: profesional, isLoading, isError, error } = useProfesionalDetalle(id!)
  const [documentoVisor, setDocumentoVisor] = useState<DocumentoResumen | null>(null)
  const esAdmin = usuario?.rol === 'Admin'
  const invalidarProfesional = () => queryClient.invalidateQueries({ queryKey: ['profesional', id] })

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const errorConRespuesta = error as { response?: { status?: number } } | null
  if (isError && errorConRespuesta?.response?.status === 404) {
    return <p className="p-4">Profesional no encontrado</p>
  }

  if (isError || !profesional) {
    return <p className="p-4">No se pudo cargar el profesional</p>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PerfilTopbar
        apellido={profesional.apellido}
        nombre={profesional.nombre}
        nroExpediente={profesional.nroExpediente}
        esAdmin={esAdmin}
        onEditar={() => navigate(`/profesionales/${id}/editar`)}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DatosProfesional profesional={profesional} />
        <div className="flex flex-col gap-4">
          <GridDocumentos documentos={profesional.documentos} onVerDocumento={setDocumentoVisor} />
          {esAdmin ? (
            <SubirDocumentoDropzone profesionalId={id!} onSubido={invalidarProfesional} />
          ) : null}
        </div>
      </div>

      <VisorDocumentoModal
        documento={documentoVisor}
        open={documentoVisor !== null}
        onOpenChange={(open) => {
          if (!open) setDocumentoVisor(null)
        }}
        esAdmin={esAdmin}
        onEliminado={invalidarProfesional}
      />
    </div>
  )
}
