import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Legajos Digitales - Hospital Los Ralos</h1>
        <LoginForm />
      </div>
    </div>
  )
}
