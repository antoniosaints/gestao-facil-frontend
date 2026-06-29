import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import {
  ComandaOperacaoRepository,
  type ComandaConfiguracao,
  type ComandaItemPayload,
  type ComandaOperacao,
  type ComandaOrigemTipo,
  type ComandaPagamentoMetodo,
  type CreateComandaPayload,
  type FaturarComandaPayload,
} from '@/repositories/comanda-operacao-repository'

const toast = useToast()

export type ComandaItemForm = {
  origemTipo: ComandaOrigemTipo
  origemId: number | string | null
  nome: string
  valorUnitario: number | undefined
  quantidade: number
  devolverDiferencaEstoque?: boolean
}

export type ComandaForm = {
  clienteId: number | null
  observacao: string
  itens: ComandaItemForm[]
}

export type FaturarComandaForm = {
  metodo: ComandaPagamentoMetodo
  dataPagamento: string
  itemIds: number[]
  lancarFinanceiro: boolean
  contaFinanceiraId: number | null
  categoriaFinanceiraId: number | null
}

export type ComandaConfiguracaoForm = {
  contaFinanceiraIdPadrao: number | null
  categoriaFinanceiraIdPadrao: number | null
}

function getTodayInputValue() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

export function getDefaultItemForm(overrides?: Partial<ComandaItemForm>): ComandaItemForm {
  return {
    origemTipo: overrides?.origemTipo ?? 'PRODUTO',
    origemId: overrides?.origemId ?? null,
    nome: overrides?.nome ?? '',
    valorUnitario: overrides?.valorUnitario,
    quantidade: overrides?.quantidade ?? 1,
    devolverDiferencaEstoque: overrides?.devolverDiferencaEstoque,
  }
}

export function getDefaultComandaForm(): ComandaForm {
  return {
    clienteId: null,
    observacao: '',
    itens: [getDefaultItemForm()],
  }
}

export function getDefaultFaturarForm(config?: ComandaConfiguracao | null, itemIds: number[] = []): FaturarComandaForm {
  const contaFinanceiraId = config?.contaFinanceiraIdPadrao ?? null
  const categoriaFinanceiraId = config?.categoriaFinanceiraIdPadrao ?? null

  return {
    metodo: 'DINHEIRO',
    dataPagamento: getTodayInputValue(),
    itemIds,
    lancarFinanceiro: Boolean(contaFinanceiraId && categoriaFinanceiraId),
    contaFinanceiraId,
    categoriaFinanceiraId,
  }
}

export function normalizeComandaItemForm(item: ComandaItemForm): ComandaItemPayload {
  if (!item.valorUnitario || Number(item.valorUnitario) <= 0) {
    throw new Error('Informe um valor unitario valido.')
  }

  if (!item.quantidade || Number(item.quantidade) <= 0) {
    throw new Error('Informe uma quantidade valida.')
  }

  if (item.origemTipo !== 'AVULSO' && !item.origemId) {
    throw new Error(item.origemTipo === 'PRODUTO' ? 'Informe o produto.' : 'Informe o servico.')
  }

  if (item.origemTipo === 'AVULSO' && !item.nome.trim()) {
    throw new Error('Informe o nome do item avulso.')
  }

  return {
    origemTipo: item.origemTipo,
    origemId: item.origemTipo === 'AVULSO' ? null : item.origemId,
    nome: item.nome.trim() || null,
    valorUnitario: Number(item.valorUnitario),
    quantidade: Number(item.quantidade),
  }
}

export const useComandasStore = defineStore('comandasStore', () => {
  const openFormModal = ref(false)
  const openItemModal = ref(false)
  const openDetalhesModal = ref(false)
  const openFaturarModal = ref(false)
  const openConfiguracaoModal = ref(false)
  const loadingDetalhes = ref(false)
  const loadingConfiguracao = ref(false)

  const selectedComanda = ref<ComandaOperacao | null>(null)
  const comandaForm = ref<ComandaForm>(getDefaultComandaForm())
  const itemForm = ref<ComandaItemForm>(getDefaultItemForm())
  const faturarForm = ref<FaturarComandaForm>(getDefaultFaturarForm())
  const configuracaoForm = ref<ComandaConfiguracaoForm>({
    contaFinanceiraIdPadrao: null,
    categoriaFinanceiraIdPadrao: null,
  })

  const filters = ref({
    search: '',
    status: 'ABERTA,PENDENTE',
    inicio: null as string | null,
    fim: null as string | null,
    page: 1,
    pageSize: 10,
    update: false,
  })

  const selectedTotal = computed(() => Number(selectedComanda.value?.total || 0))

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  function resetComandaForm() {
    comandaForm.value = getDefaultComandaForm()
  }

  function resetItemForm(overrides?: Partial<ComandaItemForm>) {
    itemForm.value = getDefaultItemForm(overrides)
  }

  function getItensAbertos(comanda?: ComandaOperacao | null) {
    return (comanda?.itens || []).filter((item) => !item.pagamentoId)
  }

  function resetFaturarForm(config?: ComandaConfiguracao | null, itemIds: number[] = []) {
    faturarForm.value = getDefaultFaturarForm(config, itemIds)
  }

  function hydrateConfiguracao(config?: ComandaConfiguracao | null) {
    configuracaoForm.value = {
      contaFinanceiraIdPadrao: config?.contaFinanceiraIdPadrao ?? null,
      categoriaFinanceiraIdPadrao: config?.categoriaFinanceiraIdPadrao ?? null,
    }
  }

  async function loadDetalhes(id: number) {
    loadingDetalhes.value = true
    try {
      const response = await ComandaOperacaoRepository.get(id)
      selectedComanda.value = response.data
      return response.data
    } finally {
      loadingDetalhes.value = false
    }
  }

  async function reloadDetalhes() {
    if (!selectedComanda.value?.id) return null
    return loadDetalhes(selectedComanda.value.id)
  }

  async function loadConfiguracao() {
    loadingConfiguracao.value = true
    try {
      const response = await ComandaOperacaoRepository.getConfiguracao()
      hydrateConfiguracao(response.data)
      return response.data
    } finally {
      loadingConfiguracao.value = false
    }
  }

  function openCreate() {
    resetComandaForm()
    openFormModal.value = true
  }

  async function openDetalhes(id: number) {
    try {
      await loadDetalhes(id)
      openDetalhesModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao carregar a comanda.')
    }
  }

  async function openAddItem(id?: number, overrides?: Partial<ComandaItemForm>) {
    try {
      if (id && selectedComanda.value?.id !== id) {
        await loadDetalhes(id)
      }
      resetItemForm(overrides)
      openItemModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao preparar o item.')
    }
  }

  async function openFaturar(id?: number) {
    try {
      if (id && selectedComanda.value?.id !== id) {
        await loadDetalhes(id)
      }
      const config = await loadConfiguracao()
      resetFaturarForm(
        config,
        getItensAbertos(selectedComanda.value).map((item) => item.id),
      )
      openFaturarModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao preparar o faturamento.')
    }
  }

  async function openConfiguracao() {
    try {
      await loadConfiguracao()
      openConfiguracaoModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao carregar a configuracao.')
    }
  }

  async function createComanda() {
    try {
      const payload: CreateComandaPayload = {
        clienteId: comandaForm.value.clienteId || null,
        observacao: comandaForm.value.observacao || null,
        itens: comandaForm.value.itens.map((item) => normalizeComandaItemForm(item)),
      }
      const response = await ComandaOperacaoRepository.create(payload)
      selectedComanda.value = response.data
      openFormModal.value = false
      updateTable()
      toast.success(response.message || 'Comanda criada.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao criar a comanda.')
      throw error
    }
  }

  async function addItem(comandaId?: number) {
    const targetId = comandaId || selectedComanda.value?.id
    if (!targetId) throw new Error('Selecione uma comanda.')

    try {
      const response = await ComandaOperacaoRepository.addItens(targetId, {
        itens: [normalizeComandaItemForm(itemForm.value)],
      })
      openItemModal.value = false
      updateTable()
      await loadDetalhes(targetId)
      toast.success(response.message || 'Item adicionado.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao adicionar item.')
      throw error
    }
  }

  async function updateItem(itemId: number, devolverDiferencaEstoque?: boolean) {
    if (!selectedComanda.value?.id) throw new Error('Selecione uma comanda.')

    try {
      const payload = {
        ...normalizeComandaItemForm(itemForm.value),
        ...(devolverDiferencaEstoque !== undefined ? { devolverDiferencaEstoque } : {}),
      }
      const response = await ComandaOperacaoRepository.updateItem(selectedComanda.value.id, itemId, payload)
      openItemModal.value = false
      updateTable()
      await reloadDetalhes()
      toast.success(response.message || 'Item atualizado.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao atualizar item.')
      throw error
    }
  }

  async function removeItem(comandaId: number, itemId: number, devolverEstoque?: boolean) {
    try {
      const response = await ComandaOperacaoRepository.removeItem(comandaId, itemId, { devolverEstoque })
      updateTable()
      if (selectedComanda.value?.id === comandaId) {
        await loadDetalhes(comandaId)
      }
      toast.success(response.message || 'Item removido.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao remover item.')
      throw error
    }
  }

  async function fechar(comandaId: number) {
    try {
      const response = await ComandaOperacaoRepository.fechar(comandaId)
      selectedComanda.value = response.data
      updateTable()
      toast.success(response.message || 'Comanda fechada.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao fechar comanda.')
      throw error
    }
  }

  async function faturar() {
    if (!selectedComanda.value?.id) throw new Error('Selecione uma comanda.')

    try {
      const payload: FaturarComandaPayload = {
        ...faturarForm.value,
        itemIds: [...faturarForm.value.itemIds],
      }
      const response = await ComandaOperacaoRepository.faturar(selectedComanda.value.id, payload)
      selectedComanda.value = response.data
      openFaturarModal.value = false
      updateTable()
      toast.success(response.message || 'Comanda faturada.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao faturar comanda.')
      throw error
    }
  }

  async function cancelar(comandaId: number, devolverEstoque?: boolean, observacao?: string | null) {
    try {
      const response = await ComandaOperacaoRepository.cancelar(comandaId, { devolverEstoque, observacao })
      selectedComanda.value = response.data
      updateTable()
      toast.success(response.message || 'Comanda cancelada.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao cancelar comanda.')
      throw error
    }
  }

  async function saveConfiguracao() {
    try {
      const response = await ComandaOperacaoRepository.saveConfiguracao({ ...configuracaoForm.value })
      hydrateConfiguracao(response.data)
      openConfiguracaoModal.value = false
      toast.success(response.message || 'Configuracao salva.')
      return response.data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao salvar configuracao.')
      throw error
    }
  }

  return {
    openFormModal,
    openItemModal,
    openDetalhesModal,
    openFaturarModal,
    openConfiguracaoModal,
    loadingDetalhes,
    loadingConfiguracao,
    selectedComanda,
    selectedTotal,
    comandaForm,
    itemForm,
    faturarForm,
    configuracaoForm,
    filters,
    updateTable,
    resetComandaForm,
    resetItemForm,
    resetFaturarForm,
    getItensAbertos,
    hydrateConfiguracao,
    loadDetalhes,
    reloadDetalhes,
    loadConfiguracao,
    openCreate,
    openDetalhes,
    openAddItem,
    openFaturar,
    openConfiguracao,
    createComanda,
    addItem,
    updateItem,
    removeItem,
    fechar,
    faturar,
    cancelar,
    saveConfiguracao,
  }
})
