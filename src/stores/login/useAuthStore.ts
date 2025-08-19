import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const useAuthStore = defineStore('authStore', () => {
  const token = ref('')
  const refreshToken = ref('')
  const user = ref('')

  const login = async (email: string, password: string) => {
    const { data } = await http.post('/login', { email, password })
    token.value = data.token
    refreshToken.value = data.refreshToken
    user.value = data.user

    localStorage.setItem('gestao_facil:token', data.token)
    localStorage.setItem('gestao_facil:refreshToken', data.refreshToken)
    localStorage.setItem('gestao_facil:usuario', data.user)
  }

  const logout = () => {
    token.value = ''
    refreshToken.value = ''
    user.value = ''
    localStorage.clear()
  }

  const refresh = async () => {
    const { data } = await http.post('/refresh')
    token.value = data.token
    refreshToken.value = data.refreshToken
    user.value = data.user

    localStorage.setItem('gestao_facil:token', data.token)
    localStorage.setItem('gestao_facil:refreshToken', data.refreshToken)
    localStorage.setItem('gestao_facil:usuario', data.user)
  }

  return { token, refreshToken, user, login, logout, refresh }
})
