import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('sin token en localStorage, arranca sin usuario autenticado', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.token).toBeNull()
    expect(result.current.usuario).toBeNull()
  })

  test('login guarda token y usuario en el estado y en localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login('fake-jwt-token', { nombre: 'Ana', rol: 'Admin' })
    })

    expect(result.current.token).toBe('fake-jwt-token')
    expect(result.current.usuario).toEqual({ nombre: 'Ana', rol: 'Admin' })
    expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token')
  })

  test('logout limpia token, usuario y localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login('fake-jwt-token', { nombre: 'Ana', rol: 'Admin' })
    })
    act(() => {
      result.current.logout()
    })

    expect(result.current.token).toBeNull()
    expect(result.current.usuario).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  test('restaura token y usuario desde localStorage al montar', () => {
    localStorage.setItem('auth_token', 'existing-token')
    localStorage.setItem('auth_usuario', JSON.stringify({ nombre: 'Beto', rol: 'Administrativo' }))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.token).toBe('existing-token')
    expect(result.current.usuario).toEqual({ nombre: 'Beto', rol: 'Administrativo' })
  })
})
