import { createApiClient } from './client'

const TOKEN_KEY = 'auth_token'
const USUARIO_KEY = 'auth_usuario'

export const api = createApiClient({
  getToken: () => localStorage.getItem(TOKEN_KEY),
  onUnauthorized: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  },
})
