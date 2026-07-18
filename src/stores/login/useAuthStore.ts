import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AxiosResponse } from 'axios'
import http from '@/utils/axios'
import { useToast } from 'vue-toastification'
import router from '@/router'
import axios from 'axios'
import { clearSupport } from '@/utils/supportSession'

type LoginResponse = {
  email: string
  id: number
  nome: string
  permissao: string
  token: string
  refreshToken: string
}

type ApiResponse<T> = AxiosResponse<{
  data: T
  message: string
  status: number
}>

type LoginResult = {
  ok: boolean
  rateLimited?: boolean
  retryAfter?: number
  message?: string
}

const toast = useToast()

export const useAuthStore = defineStore('authStore', () => {
  const token = ref(localStorage.getItem('gestao_facil:token') || '')
  const refreshToken = ref(localStorage.getItem('gestao_facil:refreshToken') || '')
  const user = ref(localStorage.getItem('gestao_facil:usuario') || '')

  const saveSession = (dados: LoginResponse) => {
    token.value = dados.token
    refreshToken.value = dados.refreshToken
    user.value = dados.nome
    localStorage.setItem('gestao_facil:token', dados.token)
    localStorage.setItem('gestao_facil:refreshToken', dados.refreshToken)
    localStorage.setItem('gestao_facil:usuario', dados.nome)
  }

  const clearSession = () => {
    token.value = ''
    refreshToken.value = ''
    user.value = ''
    localStorage.removeItem('gestao_facil:token')
    localStorage.removeItem('gestao_facil:refreshToken')
    localStorage.removeItem('gestao_facil:usuario')
    // Um logout durante o suporte não pode deixar as chaves de backup para trás.
    clearSupport()
  }

  const login = async (email: string, senha: string): Promise<LoginResult> => {
    try {
      const { data } = await http.post<any, ApiResponse<LoginResponse>>('/login', { email, senha })
      saveSession(data.data)
      toast.success('Login efetuado com sucesso!')
      router.push('/')
      return { ok: true }
    } catch (error: any) {
      console.error(error)
      // 429 = rate limit. A tela de login mostra um aviso visual com contagem
      // regressiva, então aqui só devolvemos os dados (sem toast duplicado).
      if (error.response?.status === 429) {
        const retryAfter = Number(error.response?.data?.retryAfter) || 60
        return {
          ok: false,
          rateLimited: true,
          retryAfter,
          message: error.response?.data?.message,
        }
      }
      toast.error(error.response?.data?.message || 'Erro ao efetuar login')
      return { ok: false }
    }
  }

  const logout = () => {
    clearSession()
    router.push('/login')
  }

  const verificarSenha = async (senha: string): Promise<boolean> => {
    try {
      await http.post('/auth/senha', { senha })
      return true
    } catch {
      return false
    }
  }

  const refresh = async (): Promise<boolean> => {
    const rfToken = localStorage.getItem('gestao_facil:refreshToken')
    if (!rfToken) return false

    try {
      const { data } = await axios.get<any, ApiResponse<LoginResponse>>(
        `${import.meta.env.VITE_API_URL}/auth/renew`,
        {
          headers: { Authorization: `Bearer ${rfToken}` },
        },
      )
      saveSession(data.data)
      return true
    } catch (err) {
      clearSession()
      return false
    }
  }

  return { token, refreshToken, user, login, logout, refresh, verificarSenha }
})
