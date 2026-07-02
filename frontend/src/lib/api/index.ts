import { createApiClient } from './client'
import { AUTH_TOKEN_KEY, AUTH_USUARIO_KEY } from '@/lib/authStorage'

export const api = createApiClient({
  getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),
  onUnauthorized: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USUARIO_KEY)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  },
})
