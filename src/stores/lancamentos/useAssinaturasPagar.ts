import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AssinaturaPagarListItem } from '@/repositories/assinatura-pagar-repository'

export const useAssinaturasPagarStore = defineStore('assinaturasPagarStore', () => {
  const openModal = ref(false)
  const filters = ref<{
    status?: 'TODOS' | 'ATIVA' | 'INATIVA' | 'CANCELADA'
    update: boolean
  }>({
    status: 'TODOS',
    update: false,
  })
  const editingId = ref<number | null>(null)
  const selected = ref<AssinaturaPagarListItem | null>(null)

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  function openCreate() {
    editingId.value = null
    selected.value = null
    openModal.value = true
  }

  function openEdit(item: AssinaturaPagarListItem) {
    editingId.value = item.id
    selected.value = item
    openModal.value = true
  }

  function closeModal() {
    openModal.value = false
    editingId.value = null
    selected.value = null
  }

  return {
    openModal,
    editingId,
    selected,
    filters,
    updateTable,
    openCreate,
    openEdit,
    closeModal,
  }
})
