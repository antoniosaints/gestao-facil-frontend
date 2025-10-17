import { ref } from 'vue'
import { defineStore } from 'pinia'
import { StatusOrdemServico, type OrdensServico, type Servicos } from '@/types/schemas'
import { ServicoRepository } from '@/repositories/servico-repository'
import { OrdensServicoRepository } from '@/repositories/os-repository'

export const useOrdemServicoStore = defineStore('ordemServicoStore', () => {
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)

  const form = ref<OrdensServico>({
    status: StatusOrdemServico.ABERTA,
    data: new Date(),
    desconto: 0,
    garantia: '',
    descricao: '',
    descricaoCliente: '',
  })

  const reset = () => {
    form.value = {
      status: StatusOrdemServico.ABERTA,
      data: new Date(),
      desconto: 0,
      garantia: '',
      descricao: '',
      descricaoCliente: '',
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }
  const openUpdate = async (id: number) => {
    const response = await OrdensServicoRepository.get(id)
    form.value = {
      ...response.data,
    }
    openModal.value = true
  }

  const filters = ref<Partial<OrdensServico> & { update: boolean }>({
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
  }
})
