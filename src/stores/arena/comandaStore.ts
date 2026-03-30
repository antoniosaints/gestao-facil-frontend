import { ref } from 'vue'
import { defineStore } from 'pinia'
import { addDays } from 'date-fns'
import { useToast } from 'vue-toastification'
import type { ComandaVenda, TipoItemComanda } from '@/types/schemas'
import { ComandaRepository, type ComandaPayload } from '@/repositories/comanda-repository'

const toast = useToast()

function getDefaultForm(): ComandaPayload {
  return {
    id: null,
    clienteId: undefined,
    clienteNome: '',
    observacao: '',
    reservaId: undefined,
  }
}

function getDefaultItemForm() {
  return {
    tipo: 'PRODUTO' as TipoItemComanda,
    itemId: null as number | null,
    quantidade: 1,
    valor: undefined as number | undefined,
  }
}

function getDefaultCheckoutForm() {
  return {
    itemIds: [] as number[],
    valor: 0,
    gateway: 'interno' as 'interno' | 'mercadopago',
    tipoCobranca: 'PIX' as 'PIX' | 'BOLETO' | 'LINK',
    vencimento: addDays(new Date(), 1),
    observacao: '',
    clienteId: undefined as number | undefined,
    linkPayment: '',
    loading: false,
  }
}

function normalizeItemId(itemId?: number | string | null) {
  const normalizedId = Number(itemId)
  return Number.isFinite(normalizedId) ? normalizedId : null
}

export const useComandaStore = defineStore('comandaStore', () => {
  const openModal = ref(false)
  const openItemModal = ref(false)
  const openCheckoutModal = ref(false)
  const openDetalhesModal = ref(false)
  const loadingDetalhes = ref(false)

  const form = ref<ComandaPayload>(getDefaultForm())
  const itemForm = ref(getDefaultItemForm())
  const checkoutForm = ref(getDefaultCheckoutForm())
  const selectedComanda = ref<ComandaVenda | null>(null)

  const filters = ref<{ status?: string; update: boolean }>({
    status: 'ABERTA,PENDENTE',
    update: false,
  })

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  function reset() {
    form.value = getDefaultForm()
  }

  function resetItem() {
    itemForm.value = getDefaultItemForm()
  }

  function resetCheckout() {
    checkoutForm.value = getDefaultCheckoutForm()
  }

  function hydrateForm(comanda?: Partial<ComandaVenda> | null) {
    form.value = ComandaRepository.mapForm(comanda)
  }

  async function loadDetalhes(id: number) {
    loadingDetalhes.value = true
    try {
      const response = await ComandaRepository.get(id)
      selectedComanda.value = response.data
      return response.data
    } finally {
      loadingDetalhes.value = false
    }
  }

  async function reloadDetalhes() {
    if (!selectedComanda.value?.id) return
    await loadDetalhes(selectedComanda.value.id)
  }

  function openSave() {
    reset()
    openModal.value = true
  }

  async function openUpdate(id: number) {
    try {
      const comanda = await loadDetalhes(id)
      hydrateForm(comanda)
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao carregar a comanda.')
    }
  }

  async function openDetalhes(id: number) {
    try {
      await loadDetalhes(id)
      openDetalhesModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao carregar os detalhes da comanda.')
    }
  }

  async function openAddItem(id?: number) {
    try {
      if (id && selectedComanda.value?.id !== id) {
        await loadDetalhes(id)
      }
      resetItem()
      openItemModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao preparar a inclusão de item.')
    }
  }

  function openCheckout(itemIds: number[]) {
    if (!selectedComanda.value) {
      toast.error('Selecione uma comanda antes de gerar a cobrança.')
      return
    }

    const itensAbertos =
      selectedComanda.value.itens?.filter((item) => item.vendaId === null || item.vendaId === undefined) ?? []
    const normalizedItemIds = itemIds
      .map((itemId) => normalizeItemId(itemId))
      .filter((itemId): itemId is number => itemId !== null)

    const itensSelecionados = itensAbertos.filter((item) => {
      const itemId = normalizeItemId(item.id)
      return itemId !== null && normalizedItemIds.includes(itemId)
    })

    if (!itensSelecionados.length) {
      toast.error('Selecione ao menos um item para cobrar.')
      return
    }

    const total = itensSelecionados.reduce((acc, item) => acc + Number(item.valor || 0) * item.quantidade, 0)

    resetCheckout()
    checkoutForm.value.itemIds = itensSelecionados
      .map((item) => normalizeItemId(item.id))
      .filter((itemId): itemId is number => itemId !== null)
    checkoutForm.value.valor = Number(total.toFixed(2))
    checkoutForm.value.clienteId = selectedComanda.value.clienteId ?? undefined
    openCheckoutModal.value = true
  }

  return {
    openModal,
    openItemModal,
    openCheckoutModal,
    openDetalhesModal,
    loadingDetalhes,
    selectedComanda,
    form,
    itemForm,
    checkoutForm,
    filters,
    updateTable,
    reset,
    resetItem,
    resetCheckout,
    hydrateForm,
    openSave,
    openUpdate,
    openDetalhes,
    openAddItem,
    openCheckout,
    loadDetalhes,
    reloadDetalhes,
  }
})
