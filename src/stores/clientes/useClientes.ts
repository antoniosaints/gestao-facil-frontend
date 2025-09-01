import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Status, TipoCliente, type ClientesFornecedores } from '@/types/schemas'

export const useClientesStore = defineStore('clientesStore', () => {
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)

  const form = ref<ClientesFornecedores>({
    id: undefined,
    nome: '',
    documento: '',
    tipo: TipoCliente.CLIENTE,
    telefone: '',
    email: '',
    status: Status.ATIVO,
  })

  const reset = () => {
    form.value = {
      id: undefined,
      nome: '',
      documento: '',
      tipo: TipoCliente.CLIENTE,
      telefone: '',
      email: '',
      status: Status.ATIVO,
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
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
    updateTable,
    filters,
    reset,
    form,
  }
})
