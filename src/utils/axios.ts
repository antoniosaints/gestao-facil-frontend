import { useAuthStore } from '@/stores/login/useAuthStore'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    if (response.data.message) {
      toast.success(response.data.message)
    }
    return response
  },
  async (error) => {
    const auth = useAuthStore()
    const msg = error.response?.data?.message || 'Erro inesperado na requisição'
    toast.error(msg)
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
