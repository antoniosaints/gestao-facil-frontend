import http from '@/utils/axios'
import { defineStore } from 'pinia'

export const useLancamentosStore = defineStore('lancamentosStore', () => {
  const getSaldoMensal = async () => {
    try {
      const { data } = await http.get('/lancamentos/graficos/saldo-mensal')
      return data
    } catch (error: any) {
      console.error(error)
    }
  }

  return {
    getSaldoMensal,
  }
})
