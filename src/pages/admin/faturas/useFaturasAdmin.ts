import type { FaturaContaAdmin } from '@/repositories/conta-repository'
import { ref } from 'vue'

const openModal = ref(false)
const selectedFatura = ref<FaturaContaAdmin | null>(null)

export function useFaturasAdmin() {
  function openManage(fatura: FaturaContaAdmin) {
    selectedFatura.value = { ...fatura }
    openModal.value = true
  }

  function closeManage() {
    openModal.value = false
    selectedFatura.value = null
  }

  return {
    openModal,
    selectedFatura,
    openManage,
    closeManage,
  }
}
