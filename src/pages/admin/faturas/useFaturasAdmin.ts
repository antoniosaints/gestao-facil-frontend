import type { FaturaContaAdmin } from '@/repositories/conta-repository'
import { ref } from 'vue'

const openModal = ref(false)
const selectedFatura = ref<FaturaContaAdmin | null>(null)
// Sinal incrementado para pedir recarregamento das listas (desktop + mobile) após uma ação.
const refreshSignal = ref(0)

export function useFaturasAdmin() {
  function openManage(fatura: FaturaContaAdmin) {
    selectedFatura.value = { ...fatura }
    openModal.value = true
  }

  function closeManage() {
    openModal.value = false
    selectedFatura.value = null
  }

  function triggerRefresh() {
    refreshSignal.value++
  }

  return {
    openModal,
    selectedFatura,
    refreshSignal,
    openManage,
    closeManage,
    triggerRefresh,
  }
}
