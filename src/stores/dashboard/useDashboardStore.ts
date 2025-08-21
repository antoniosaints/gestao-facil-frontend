import http from '@/utils/axios'
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboardStore', () => {
  const getResumo = async () => {
    try {
      const { data } = await http.get('/dashboard/resumo')
      return data
    } catch (error: any) {
      console.error(error)
    }
  }

  return {
    getResumo,
  }
})
