import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type ClientesFornecedores } from '@/types/schemas'
import { ClienteRepository } from '@/repositories/cliente-repository'

export const useClientesStore = defineStore('clientesStore', () => {
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)

  const form = ref<ClientesFornecedores>({
    nome: '',
    status: 'ATIVO',
    tipo: 'CLIENTE',
    cep: '',
    cidade: '',
    documento: '',
    email: '',
    endereco: '',
    estado: '',
    observacaos: '',
    telefone: '',
    whastapp: '',
  })

  const reset = () => {
    form.value = {
      id: undefined,
      nome: '',
      documento: '',
      tipo: 'CLIENTE',
      telefone: '',
      email: '',
      status: 'ATIVO',
      cep: '',
      cidade: '',
      endereco: '',
      estado: '',
      observacaos: '',
      whastapp: '',
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }
  const openUpdate = async (id: number) => {
    const cliente = await ClienteRepository.get(id)
    console.log(cliente)
    form.value = {
      ...cliente.data,
    }
    openModal.value = true
  }

  const filters = ref<Partial<ClientesFornecedores> & { update: boolean }>({
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
