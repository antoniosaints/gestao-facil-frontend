import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/login/useAuthStore'
import { useToast } from 'vue-toastification'
import { exitSupport, isSupportActive } from '@/utils/supportSession'

const toast = useToast()

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Controle de concorrência do refresh
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('gestao_facil:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const auth = useAuthStore()
    const originalRequest = error.config as any

    const msg = (error.response?.data as any)?.message || 'Erro inesperado na requisição'
    console.error(msg)

    // Sessão de suporte: não tem refresh (de propósito), então um 401 aqui significa
    // expiração ou revogação. Devolve o CEO para o painel em vez de deixar a tela
    // morta — sem este bloco o 401 nem entraria no fluxo de refresh abaixo.
    if (error.response?.status === 401 && isSupportActive()) {
      exitSupport()
      toast.info('Sessão de suporte encerrada. Você voltou para o painel CEO.')
      // window.location e não router.push: a store está hidratada com a conta do
      // assinante e precisa ser reconstruída do zero como CEO.
      window.location.href = '/admin/assinantes'
      return Promise.reject(error)
    }

    // Só tenta renovar se for 401 e não for a rota de refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('gestao_facil:refreshToken')
    ) {
      const refreshToken = localStorage.getItem('gestao_facil:refreshToken')
      if (!refreshToken) {
        auth.logout()
        toast.error('Voce precisa efetuar login!')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Se já está renovando, espera a nova resposta
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(http(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const success = await auth.refresh()
        if (success) {
          const newToken = localStorage.getItem('gestao_facil:token') || ''
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          onRefreshed(newToken)
          toast.success('Sessão renovada!')
          return http(originalRequest)
        } else {
          auth.logout()
        }
      } catch (err) {
        auth.logout()
        toast.error('Voce precisa efetuar login!')
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default http
