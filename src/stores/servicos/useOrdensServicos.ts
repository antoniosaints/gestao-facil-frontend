import { ref } from 'vue'
import { defineStore } from 'pinia'
import { StatusOrdemServico, type CarrinhoItem, type OrdensServico } from '@/types/schemas'
import { OrdensServicoRepository } from '@/repositories/os-repository'
export interface CarrinhoOS extends CarrinhoItem {
  tipoItem: 'PRODUTO' | 'SERVICO'
}
export const useOrdemServicoStore = defineStore('ordemServicoStore', () => {
  const openModal = ref(false)
  const openModalPropor = ref(false)
  const carrinho = ref<CarrinhoOS[]>([])
  const idMutation = ref<number | null>(null)
  const tipoDesconto = ref<'VALOR' | 'PORCENTAGEM'>('VALOR')

  const selectedIds = ref<number[]>([])

  function resetSelectedIds() {
    selectedIds.value = []
  }

  function addSelectedId(id: number) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  }

  function removeSelectedId(id: number) {
    const index = selectedIds.value.indexOf(id)
    if (index !== -1) {
      selectedIds.value.splice(index, 1)
    }
  }

  const form = ref<OrdensServico>({
    status: StatusOrdemServico.ABERTA,
    data: new Date(),
    desconto: 0,
    garantia: '',
    descricao: '',
    descricaoCliente: '',
    clienteId: undefined,
  })

  const reset = () => {
    form.value = {
      status: StatusOrdemServico.ABERTA,
      data: new Date(),
      desconto: 0,
      garantia: '',
      descricao: '',
      descricaoCliente: '',
      clienteId: undefined,
      operadorId: undefined,
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
    openModalPropor,
    idMutation,
    carrinho,
    tipoDesconto,
    selectedIds,
    addSelectedId,
    resetSelectedIds,
    removeSelectedId,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
  }
})
