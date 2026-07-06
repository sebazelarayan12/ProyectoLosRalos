export function extraerMensajeError(error: unknown, fallback: string): string {
  const conRespuesta = error as { response?: { data?: { message?: string } } }
  return conRespuesta?.response?.data?.message ?? fallback
}
