import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ContasFinanceiro } from '@/types/schemas'

export const useContasFinanceirasStore = defineStore('contasFinanceirasStore', () => {
  const openModal = ref(false)
  const selectedConta = ref<ContasFinanceiro | null>(null)
  const filters = ref<{ update: boolean }>({
    update: false,
  })

  function openSave() {
    selectedConta.value = null
    openModal.value = true
  }

  function openUpdate(conta: ContasFinanceiro) {
    selectedConta.value = {
      id: conta.id,
      Uid: conta.Uid,
      nome: conta.nome,
      saldoInicial: conta.saldoInicial ?? 0,
    }
    openModal.value = true
  }

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    selectedConta,
    filters,
    openSave,
    openUpdate,
    updateTable,
  }
})
