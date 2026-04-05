import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  type CarrinhoItem,
  type IDetalheOrdemServico,
  type OrdensServico,
  type SaveOrdemServico,
} from '@/types/schemas'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { formatToNumberValue } from '@/utils/formatters'
import { useToast } from 'vue-toastification'
export interface CarrinhoOS extends CarrinhoItem {
  tipoItem: 'PRODUTO' | 'SERVICO'
}
export const useOrdemServicoStore = defineStore('ordemServicoStore', () => {
  const toast = useToast()
  const openModal = ref(false)
  const openModalChecklist = ref(false)
  const openModalPropor = ref(false)
  const openModalDetalheOs = ref(false)
  const loadingDetalhe = ref(false)
  const ordemDetalhe = ref<IDetalheOrdemServico>()
  const detalheId = ref<number | null>(null)
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

  const form = ref<SaveOrdemServico>({
    status: 'ABERTA',
    data: new Date(),
    desconto: null,
    id: null,
    descricao: '',
    clienteId: null,
    vendedorId: null,
    descricaoCliente: '',
    garantia: 0,
    itens: [],
  })

  const reset = () => {
    form.value = {
      status: 'ABERTA',
      data: new Date(),
      id: null,
      desconto: null,
      descricao: '',
      clienteId: null,
      vendedorId: null,
      descricaoCliente: '',
      garantia: 0,
      itens: [],
    }
    carrinho.value = []
    localStorage.setItem('gestao_facil:carrinho_ordem_servico', JSON.stringify(carrinho.value))
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }

  const loadDetalhes = async (id: number) => {
    loadingDetalhe.value = true
    detalheId.value = id

    try {
      const response = await OrdensServicoRepository.getDetalhes(id)
      ordemDetalhe.value = response
      return response
    } finally {
      loadingDetalhe.value = false
    }
  }

  const reloadDetalhes = async () => {
    if (!detalheId.value) return
    return await loadDetalhes(detalheId.value)
  }

  const openDetalhes = async (id: number) => {
    try {
      if (!id) {
        return toast.info('ID da OS não informado!')
      }

      ordemDetalhe.value = undefined
      openModalDetalheOs.value = true
      await loadDetalhes(id)
    } catch (error) {
      ordemDetalhe.value = undefined
      detalheId.value = null
      openModalDetalheOs.value = false
      console.log(error)
      toast.error('Erro ao carregar os detalhes da OS.')
    }
  }
  const openUpdate = async (id: number) => {
    const response = await OrdensServicoRepository.get(id)
    carrinho.value = []
    form.value = {
      id: response.id,
      clienteId: response.clienteId,
      data: response.data,
      itens: response.ItensOrdensServico.map((item) => ({
        id: item.tipo === 'PRODUTO' ? item.produtoId! : item.servicoId!,
        quantidade: item.quantidade,
        valor: item.valor,
        tipo: item.tipo,
        nome: item.itemName,
      })),
      descricao: response.descricao,
      descricaoCliente: response.descricaoCliente,
      garantia: Number(response.garantia),
      status: response.status,
      vendedorId: response.operadorId,
      desconto: response.desconto,
    }

    response.ItensOrdensServico.forEach((item) => {
      const newItem = {
        id: item.tipo === 'PRODUTO' ? item.produtoId! : item.servicoId!,
        produto: item.itemName,
        quantidade: item.quantidade,
        preco: formatToNumberValue(item.valor),
        subtotal: item.quantidade * formatToNumberValue(item.valor),
        tipoItem: item.tipo,
      }
      carrinho.value.push(newItem)
    })
    localStorage.setItem('gestao_facil:carrinho_ordem_servico', JSON.stringify(carrinho.value))
    openModal.value = true
  }

  const filters = ref<Partial<OrdensServico> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
    resetSelectedIds()
  }

  return {
    openModal,
    openModalChecklist,
    openModalPropor,
    openModalDetalheOs,
    loadingDetalhe,
    openDetalhes,
    reloadDetalhes,
    ordemDetalhe,
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
