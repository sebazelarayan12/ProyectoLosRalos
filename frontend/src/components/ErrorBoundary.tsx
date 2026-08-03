import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = { children: ReactNode }
type State = { tieneError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { tieneError: false }

  static getDerivedStateFromError(): State {
    return { tieneError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary atrapo un error:', error, info.componentStack)
  }

  render() {
    if (this.state.tieneError) {
      return <PantallaError />
    }
    return this.props.children
  }
}

function PantallaError() {
  return (
    <div
      className="flex min-h-svh items-center justify-center p-4"
      style={{
        backgroundColor: 'oklch(0.972 0.008 240)',
        backgroundImage: 'radial-gradient(oklch(0.45 0.09 240 / 0.05) 1px, transparent 1.4px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border bg-card p-7 text-center shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-lg font-semibold">Algo salio mal</h1>
          <p className="text-sm text-muted-foreground">
            Ocurrio un error inesperado y no pudimos mostrar esta pantalla. Recarga la pagina para
            intentar de nuevo.
          </p>
        </div>
        <Button className="w-full" onClick={() => window.location.reload()}>
          <RefreshCw />
          Recargar pagina
        </Button>
        <p className="text-[11.5px] text-muted-foreground">
          Si el problema persiste, contacta al area de sistemas
        </p>
      </div>
    </div>
  )
}
