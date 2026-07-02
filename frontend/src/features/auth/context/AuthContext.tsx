import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AUTH_TOKEN_KEY, AUTH_USUARIO_KEY } from '@/lib/authStorage'

export type Usuario = {
  nombre: string
  rol: 'Admin' | 'Visor'
}

type AuthContextValue = {
  token: string | null
  usuario: Usuario | null
  login: (token: string, usuario: Usuario) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem(AUTH_USUARIO_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  })

  const login = useCallback((newToken: string, newUsuario: Usuario) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    localStorage.setItem(AUTH_USUARIO_KEY, JSON.stringify(newUsuario))
    setToken(newToken)
    setUsuario(newUsuario)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USUARIO_KEY)
    setToken(null)
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({ token, usuario, login, logout }),
    [token, usuario, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
