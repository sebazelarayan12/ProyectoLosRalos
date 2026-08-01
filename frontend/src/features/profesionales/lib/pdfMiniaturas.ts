import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const ESCALA_MINIATURA = 0.3

export async function cargarPdf(archivo: File): Promise<PDFDocumentProxy> {
  const buffer = await archivo.arrayBuffer()
  return pdfjsLib.getDocument({ data: buffer }).promise
}

export async function renderizarMiniatura(documento: PDFDocumentProxy, numeroPagina: number): Promise<string> {
  const pagina = await documento.getPage(numeroPagina)
  const viewport = pagina.getViewport({ scale: ESCALA_MINIATURA })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const contexto = canvas.getContext('2d')!
  await pagina.render({ canvas, canvasContext: contexto, viewport }).promise
  return canvas.toDataURL('image/png')
}
