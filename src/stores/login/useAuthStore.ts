import { onMounted, ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import axios from 'axios'
import { useToast } from 'vue-toastification'

type loginResponse = {
  data: {
    email: string
    id: number
    nome: string
    permissao: string
    token: string
    refreshToken: string
  }
  message: string
  status: number
}

type defaultResponse = {
  headers: string
  status: number
}

const toast = useToast()

export const useAuthStore = defineStore('authStore', () => {
  const token = ref('')
  const refreshToken = ref('')
  const user = ref('')
  const timer = ref()

  onMounted(() => {
    token.value = localStorage.getItem('gestao_facil:token') || ''
    refreshToken.value = localStorage.getItem('gestao_facil:refreshToken') || ''
    user.value = localStorage.getItem('gestao_facil:usuario') || ''
  })

  const login = async (email: string, senha: string) => {
    try {
      const { data } = (await http.post('/login', { email, senha })) as defaultResponse & {
        data: loginResponse
      }
      console.log(data)
      token.value = data.data.token
      refreshToken.value = data.data.refreshToken
      user.value = data.data.nome

      localStorage.setItem('gestao_facil:token', data.data.token)
      localStorage.setItem('gestao_facil:refreshToken', data.data.refreshToken)
      localStorage.setItem('gestao_facil:usuario', data.data.nome)

      clearTimeout(timer.value)

      timer.value = setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      console.error(error)
    }
  }

  const logout = () => {
    token.value = ''
    refreshToken.value = ''
    user.value = ''
    localStorage.removeItem('gestao_facil:token')
    localStorage.removeItem('gestao_facil:refreshToken')
    localStorage.removeItem('gestao_facil:usuario')
    toast.info('Logout efetuado com sucesso!')
    window.location.href = '/login'
  }

  const refresh = async () => {
    try {
      const rfToken = localStorage.getItem('gestao_facil:refreshToken')
      if (!rfToken) {
        return false
      }
      const { data } = (await http.get('/auth/renew', {
        headers: { Authorization: `Bearer ${rfToken}` },
      })) as defaultResponse & { data: loginResponse }
      token.value = data.data.token
      refreshToken.value = data.data.refreshToken
      user.value = data.data.nome

      localStorage.setItem('gestao_facil:token', data.data.token)
      localStorage.setItem('gestao_facil:refreshToken', data.data.refreshToken)
      localStorage.setItem('gestao_facil:usuario', data.data.nome)
    } catch (error: any) {
      console.error(error)
    }
  }

  return { token, refreshToken, user, login, logout, refresh }
})
