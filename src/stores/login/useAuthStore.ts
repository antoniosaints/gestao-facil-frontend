import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AxiosResponse } from 'axios'
import http from '@/utils/axios'
import { useToast } from 'vue-toastification'
import router from '@/router'
import axios from 'axios'

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
  }

  const login = async (email: string, senha: string) => {
    try {
      const { data } = await http.post<any, ApiResponse<LoginResponse>>('/login', { email, senha })
      saveSession(data.data)
      toast.success('Login efetuado com sucesso!')
      router.push('/')
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Erro ao efetuar login')
    }
  }

  const logout = () => {
    clearSession()
    router.push('/login')
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

  return { token, refreshToken, user, login, logout, refresh }
})
