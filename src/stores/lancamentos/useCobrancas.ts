import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type CobrancaFinanceira } from '@/types/schemas'
import { ServicoRepository } from '@/repositories/servico-repository'

export const useCobrancasFinanceirasStore = defineStore('cobrancasFinanceirasStore', () => {
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)
  const vinculoCobranca = ref<{ id: number; tipo: 'parcela' | 'venda' | 'os' } | undefined>(
    undefined,
  )

  const form = ref<CobrancaFinanceira>({
    gateway: 'mercadopago',
    idCobranca: '',
    status: 'PENDENTE',
    valor: 0,
  })

  const reset = () => {
    form.value = {
      gateway: 'mercadopago',
      idCobranca: '',
      status: 'PENDENTE',
      valor: 0,
      id: undefined,
    }
    vinculoCobranca.value = undefined
  }

  const openSave = (vinculo?: { id: number; tipo: 'parcela' | 'venda' | 'os' }) => {
    vinculoCobranca.value = vinculo
    openModal.value = true
  }
  const openUpdate = async (id: number) => {
    const response = await ServicoRepository.get(id)
    form.value = {
      ...response.data,
    }
    openModal.value = true
  }

  const filters = ref<Partial<CobrancaFinanceira> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    idMutation,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
    vinculoCobranca,
  }
})
