import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ContasFinanceiro } from '@/types/schemas'
import { isSupportActive } from '@/utils/supportSession'

export const useContasFinanceirasStore = defineStore('contasFinanceirasStore', () => {
  const openModal = ref(false)
  const somenteCalculos = ref(false)
  const suporteAtivo = isSupportActive()
  const selectedConta = ref<ContasFinanceiro | null>(null)
  const filters = ref<{ update: boolean }>({
    update: false,
  })

  function openSave() {
    somenteCalculos.value = false
    selectedConta.value = null
    openModal.value = true
  }

  function openUpdate(conta: ContasFinanceiro, apenasCalculos = false) {
    somenteCalculos.value = apenasCalculos
    selectedConta.value = {
      id: conta.id,
      Uid: conta.Uid,
      nome: conta.nome,
      icone: conta.icone ?? null,
      corDestaque: conta.corDestaque ?? null,
      saldoInicial: conta.saldoInicial ?? 0,
      ignorarNosCalculos: conta.ignorarNosCalculos,
    }
    openModal.value = true
  }

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    somenteCalculos,
    suporteAtivo,
    selectedConta,
    filters,
    openSave,
    openUpdate,
    updateTable,
  }
})
