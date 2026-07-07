import type { ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { ref } from 'vue'

const openModal = ref(false)
const openCreateModal = ref(false)
const selectedConta = ref<ContaAssinanteAdmin | null>(null)
const refreshKey = ref(0)

export function useAssinantesAdmin() {
  function openManage(conta: ContaAssinanteAdmin) {
    selectedConta.value = { ...conta }
    openModal.value = true
  }

  function closeManage() {
    openModal.value = false
    selectedConta.value = null
  }

  function openCreate() {
    openCreateModal.value = true
  }

  function triggerRefresh() {
    refreshKey.value = Date.now()
  }

  return {
    openModal,
    openCreateModal,
    selectedConta,
    refreshKey,
    openManage,
    closeManage,
    openCreate,
    triggerRefresh,
  }
}
