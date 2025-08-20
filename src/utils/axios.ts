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
  const token = localStorage.getItem('gestao_facil:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const auth = useAuthStore()
    const refreshToken = localStorage.getItem('gestao_facil:refreshToken')
    const msg = error.response?.data?.message || 'Erro inesperado na requisição'
    console.error(msg)
    if (error.response?.status === 401 && refreshToken) {
      try {
        await auth.refresh()
        error.config.headers.Authorization = `Bearer ${auth.token}`
        toast.success('Token de sessão renovado!')
        return axios(error.config) // repete a request
      } catch (err) {
        auth.logout()
      }
    }
    return Promise.reject(error)
  },
)

export default http
