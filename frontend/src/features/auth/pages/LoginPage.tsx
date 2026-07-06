import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <div
      className="flex min-h-svh items-center justify-center p-4"
      style={{
        backgroundColor: 'oklch(0.972 0.008 240)',
        backgroundImage: 'radial-gradient(oklch(0.45 0.09 240 / 0.05) 1px, transparent 1.4px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border bg-card p-7 shadow-sm">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <img src="/icono.png" alt="" className="size-11" />
          <h1 className="font-heading text-lg font-semibold">Legajos Digitales</h1>
          <p className="text-sm font-medium text-muted-foreground">Hospital Los Ralos</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Ingresa con tu cuenta institucional</p>
        </div>
        <LoginForm />
        <p className="text-center text-[11.5px] text-muted-foreground">Hospital Los Ralos - Tucuman</p>
      </div>
    </div>
  )
}
