import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PlanoAssinaturaListItem } from '@/repositories/assinatura-repository'

type StatusPlanoFiltro = 'TODOS' | 'ATIVO' | 'INATIVO'
type StatusAssinaturaFiltro = 'TODOS' | 'ATIVA' | 'SUSPENSA' | 'CANCELADA' | 'ENCERRADA'

export const useAssinaturasStore = defineStore('assinaturasStore', () => {
  const openPlanoModal = ref(false)
  const openAssinaturaModal = ref(false)
  const editingPlano = ref<PlanoAssinaturaListItem | null>(null)
  const editingAssinaturaId = ref<number | null>(null)

  const planosFilters = ref<{ status: StatusPlanoFiltro; update: boolean }>({
    status: 'TODOS',
    update: false,
  })

  const assinaturasFilters = ref<{ status: StatusAssinaturaFiltro; update: boolean }>({
    status: 'TODOS',
    update: false,
  })

  function refreshPlanos() {
    planosFilters.value.update = !planosFilters.value.update
  }

  function refreshAssinaturas() {
    assinaturasFilters.value.update = !assinaturasFilters.value.update
  }

  function openCreatePlano() {
    editingPlano.value = null
    openPlanoModal.value = true
  }

  function openEditPlano(plano: PlanoAssinaturaListItem) {
    editingPlano.value = plano
    openPlanoModal.value = true
  }

  function closePlanoModal() {
    openPlanoModal.value = false
    editingPlano.value = null
  }

  function openCreateAssinatura() {
    editingAssinaturaId.value = null
    openAssinaturaModal.value = true
  }

  function openEditAssinatura(id: number) {
    editingAssinaturaId.value = id
    openAssinaturaModal.value = true
  }

  function closeAssinaturaModal() {
    openAssinaturaModal.value = false
    editingAssinaturaId.value = null
  }

  return {
    openPlanoModal,
    openAssinaturaModal,
    editingPlano,
    editingAssinaturaId,
    planosFilters,
    assinaturasFilters,
    refreshPlanos,
    refreshAssinaturas,
    openCreatePlano,
    openEditPlano,
    closePlanoModal,
    openCreateAssinatura,
    openEditAssinatura,
    closeAssinaturaModal,
  }
})
