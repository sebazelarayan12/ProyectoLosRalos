import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

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

const TOKEN_KEY = 'auth_token'
const USUARIO_KEY = 'auth_usuario'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem(USUARIO_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  })

  const login = useCallback((newToken: string, newUsuario: Usuario) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(newUsuario))
    setToken(newToken)
    setUsuario(newUsuario)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
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
