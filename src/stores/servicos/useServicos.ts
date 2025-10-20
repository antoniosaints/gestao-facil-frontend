import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type Servicos } from '@/types/schemas'
import { ServicoRepository } from '@/repositories/servico-repository'

export const useServicoStore = defineStore('servicoStore', () => {
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)

  const form = ref<Servicos>({
    nome: '',
    status: true,
    preco: '',
    descricao: '',
    id: undefined,
  })

  const reset = () => {
    form.value = {
      nome: '',
      status: true,
      preco: '',
      descricao: '',
      id: undefined,
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }
  const openUpdate = async (id: number) => {
    const response = await ServicoRepository.get(id)
    form.value = {
      ...response.data,
    }
    openModal.value = true
  }

  const filters = ref<Partial<Servicos> & { update: boolean }>({
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
