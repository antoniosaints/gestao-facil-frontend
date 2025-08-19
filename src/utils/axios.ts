import { useAuthStore } from '@/stores/login/useAuthStore'
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = useAuthStore()
    if (error.response?.status === 401 && auth.refreshToken) {
      try {
        await auth.refresh()
        error.config.headers.Authorization = `Bearer ${auth.token}`
        return axios(error.config) // repete a request
      } catch (err) {
        auth.logout()
      }
    }
    return Promise.reject(error)
  },
)

export default http
