import type { ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { ref } from 'vue'

const openModal = ref(false)
const selectedConta = ref<ContaAssinanteAdmin | null>(null)

export function useAssinantesAdmin() {
  function openManage(conta: ContaAssinanteAdmin) {
    selectedConta.value = { ...conta }
    openModal.value = true
  }

  function closeManage() {
    openModal.value = false
    selectedConta.value = null
  }

  return {
    openModal,
    selectedConta,
    openManage,
    closeManage,
  }
}
