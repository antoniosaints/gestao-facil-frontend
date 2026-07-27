import type { AdminWhatsAppInstance } from '@/repositories/whatsapp-repository'
import { ref } from 'vue'

const modalOpen = ref(false)
const selectedInstance = ref<AdminWhatsAppInstance | null>(null)
const refreshKey = ref(0)

export function useAdminWhatsApp() {
  function openManage(instance: AdminWhatsAppInstance) {
    selectedInstance.value = { ...instance, Conta: { ...instance.Conta } }
    modalOpen.value = true
  }

  function closeManage() {
    modalOpen.value = false
    selectedInstance.value = null
  }

  function triggerRefresh() {
    refreshKey.value = Date.now()
  }

  return {
    modalOpen,
    selectedInstance,
    refreshKey,
    openManage,
    closeManage,
    triggerRefresh,
  }
}
