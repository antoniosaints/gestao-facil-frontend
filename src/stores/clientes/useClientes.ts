import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type ClientesFornecedores } from '@/types/schemas'
import { ClienteRepository } from '@/repositories/cliente-repository'

export const useClientesStore = defineStore('clientesStore', () => {
  const openModal = ref(false)
  const openModalLink = ref(false)
  const idMutation = ref<number | null>(null)

  // Callback opcional disparado após criar um cliente pelo modal.
  // Usado para auto-selecionar o cliente recém-criado no select que abriu o cadastro.
  const onCreated = ref<((cliente: ClientesFornecedores) => void) | null>(null)

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

  const openSave = (onCreatedCallback?: unknown) => {
    if (form.value.id) reset()
    // Só registra o callback quando um for passado de fato. Vários lugares fazem
    // `@click="openSave"`, o que enviaria o evento do clique como argumento.
    onCreated.value =
      typeof onCreatedCallback === 'function'
        ? (onCreatedCallback as (cliente: ClientesFornecedores) => void)
        : null
    openModal.value = true
  }

  const notifyCreated = (cliente: ClientesFornecedores) => {
    onCreated.value?.(cliente)
    onCreated.value = null
  }
  const openUpdate = async (id: number) => {
    const cliente = await ClienteRepository.get(id)
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
    openModalLink,
    idMutation,
    openSave,
    notifyCreated,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
  }
})
