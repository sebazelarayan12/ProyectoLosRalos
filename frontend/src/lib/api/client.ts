import axios, { type AxiosInstance } from 'axios'

type CreateApiClientOptions = {
  getToken: () => string | null
  onUnauthorized: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export function createApiClient({ getToken, onUnauthorized }: CreateApiClientOptions): AxiosInstance {
  const client = axios.create({ baseURL: API_BASE_URL })

  client.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        onUnauthorized()
      }
      return Promise.reject(error)
    },
  )

  return client
}
