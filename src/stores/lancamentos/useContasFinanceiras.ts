import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ContasFinanceiro } from '@/types/schemas'

export const useContasFinanceirasStore = defineStore('contasFinanceirasStore', () => {
  const openModal = ref(false)
  const openDetailsModal = ref(false)
  const selectedConta = ref<ContasFinanceiro | null>(null)
  const selectedContaDetalhes = ref<ContasFinanceiro | null>(null)
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
      icone: conta.icone ?? null,
      corDestaque: conta.corDestaque ?? null,
      saldoInicial: conta.saldoInicial ?? 0,
    }
    openModal.value = true
  }

  function openDetails(conta: ContasFinanceiro) {
    selectedContaDetalhes.value = {
      id: conta.id,
      Uid: conta.Uid,
      nome: conta.nome,
      icone: conta.icone ?? null,
      corDestaque: conta.corDestaque ?? null,
      saldoInicial: conta.saldoInicial ?? 0,
    }
    openDetailsModal.value = true
  }

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    openDetailsModal,
    selectedConta,
    selectedContaDetalhes,
    filters,
    openSave,
    openUpdate,
    openDetails,
    updateTable,
  }
})
