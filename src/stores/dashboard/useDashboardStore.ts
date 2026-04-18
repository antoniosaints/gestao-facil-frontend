import http from '@/utils/axios'
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboardStore', () => {
  const getResumo = async (inicio?: string, fim?: string) => {
    try {
      const { data } = await http.get('/dashboard/resumo', {
        params: {
          inicio,
          fim,
        },
      })
      return data
    } catch (error: any) {
      console.error(error)
    }
  }

  return {
    getResumo,
  }
})
