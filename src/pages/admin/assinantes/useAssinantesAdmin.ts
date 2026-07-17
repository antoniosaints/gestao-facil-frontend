import type { ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { ref } from 'vue'

const openModal = ref(false)
const openCreateModal = ref(false)
const openAcessarModal = ref(false)
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

  function openAcessar(conta: ContaAssinanteAdmin) {
    selectedConta.value = { ...conta }
    openAcessarModal.value = true
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
    openAcessarModal,
    selectedConta,
    refreshKey,
    openManage,
    closeManage,
    openAcessar,
    openCreate,
    triggerRefresh,
  }
}
