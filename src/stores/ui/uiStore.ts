import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ContaRepository } from '@/repositories/conta-repository'

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)
  const isMobile = ref(false)
  const status = ref(localStorage.getItem('gestao_facil:status') || 'INATIVO')
  const diasParaVencer = ref<number>(
    Number(localStorage.getItem('gestao_facil:diasParaVencer')) || 0,
  )

  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      isMobile.value = true
    } else {
      isMobile.value = false
    }
  })

  function toggleSidebar() {
    openSidebar.value = !openSidebar.value
  }

  async function getStatus() {
    try {
      const { data } = await ContaRepository.status()
      status.value = data.status
      diasParaVencer.value = data.diasParaVencer
      localStorage.setItem('gestao_facil:status', data.status)
      localStorage.setItem('gestao_facil:diasParaVencer', String(data.diasParaVencer))
    } catch (error) {
      status.value = 'INATIVO'
      localStorage.setItem('gestao_facil:status', 'INATIVO')
      localStorage.setItem('gestao_facil:diasParaVencer', '0')
    }
  }

  return {
    openSidebar,
    status,
    diasParaVencer,
    getStatus,
    toggleSidebar,
    isMobile,
  }
})
