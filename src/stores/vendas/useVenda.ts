import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  type CarrinhoItem,
  type FormularioVenda,
  type ItensVendas,
  type PagamentoVendas,
  type Vendas,
} from '@/types/schemas'
import { VendaRepository } from '@/repositories/venda-repository'
import { useToast } from 'vue-toastification'
const toast = useToast()
interface filtroVendas {
  periodo: { inicio: string | null; fim: string | null }
  status: string
  clienteId: number | null
  produtoId: number | null
  servicoId: number | null
  vendedorId: number | null
  caixaId: number | null
  desconto: string
  update: boolean
}

export const useVendasStore = defineStore('vendasStore', () => {
  const openModal = ref(false)
  const openModalPropor = ref(false)
  const openModalFaturar = ref(false)
  const openModalDetalhes = ref(false)
  const openModalComprovante = ref(false)
  const vendaComprovante = ref<{
    id: number
    uid: string | null
    total: number
    clienteId: number | null
  } | null>(null)
  const idMutation = ref<number | null>(null)
  // Ids das vendas a serem faturadas em massa (mesmo modal/dados de pagamento).
  const idsFaturarMassa = ref<number[]>([])
  const tipoDesconto = ref<'VALOR' | 'PORCENTAGEM'>('VALOR')
  const venda = ref<Vendas & { ItensVendas: ItensVendas[]; PagamentoVendas: PagamentoVendas }>()

  const carrinho = ref<CarrinhoItem[]>(
    localStorage.getItem('gestao_facil:cartVendas')
      ? JSON.parse(localStorage.getItem('gestao_facil:cartVendas') as string)
      : [],
  )

  const form = ref<FormularioVenda>({
    id: null,
    vendedorId: null,
    clienteId: null,
    data: new Date(),
    desconto: null,
    status: 'PENDENTE',
    garantia: 0,
    observacoes: '',
  })

  const reset = () => {
    form.value = {
      id: null,
      status: 'PENDENTE',
      data: new Date(),
      desconto: null,
      clienteId: null,
      garantia: 0,
      observacoes: '',
      vendedorId: null,
    }
    carrinho.value = []
    localStorage.removeItem('gestao_facil:cartVendas')
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }
  const openComprovante = (venda: Vendas) => {
    if (!venda?.id) {
      toast.info('ID nao informado!')
      return
    }
    vendaComprovante.value = {
      id: venda.id,
      uid: venda.Uid ?? null,
      total: Number(venda.valor ?? 0),
      clienteId: venda.clienteId ?? null,
    }
    openModalComprovante.value = true
  }
  const openDetalhes = async (id: number) => {
    try {
      if (!id) {
        return toast.info('ID nao informado!')
      }
      const data = await VendaRepository.get(id)
      venda.value = data.data
      idMutation.value = id
      openModalDetalhes.value = true
    } catch (error) {
      toast.error('Erro ao buscar venda, tente novamente')
      idMutation.value = null
      console.log(error)
    }
  }

  const filters = ref<Partial<filtroVendas>>({
    periodo: { inicio: null, fim: null },
    status: '',
    clienteId: null,
    produtoId: null,
    servicoId: null,
    vendedorId: null,
    caixaId: null,
    desconto: '',
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    const { data } = (await VendaRepository.get(id)) as {
      data: Vendas & { ItensVendas: ItensVendas[] }
    }
    carrinho.value = []
    form.value = {
      id: id,
      status: data?.status,
      data: data?.data,
      desconto: data?.desconto,
      clienteId: data?.clienteId ? data?.clienteId : null,
      garantia: data?.garantia ? data?.garantia : 0,
      observacoes: data?.observacoes ? data?.observacoes : '',
      vendedorId: data?.vendedorId ? data?.vendedorId : null,
    }
    data.ItensVendas.forEach((item) => {
      const itemId = item.produtoId ?? item.servicoId
      if (!itemId) return

      const newItem = {
        id: itemId,
        produto: item.itemName || item.produto?.label || item.produto?.nome || item.servico?.nome || 'Item',
        quantidade: item.quantidade,
        preco: parseFloat(String(item.valor).replace(',', '.')),
        subtotal: parseFloat(String(item.valor).replace(',', '.')) * item.quantidade,
      }
      carrinho.value.push(newItem)
    })
    localStorage.setItem('gestao_facil:cartVendas', JSON.stringify(carrinho.value))
    openModal.value = true
  }

  return {
    carrinho,
    openModal,
    idMutation,
    idsFaturarMassa,
    openModalPropor,
    openModalFaturar,
    openModalDetalhes,
    openModalComprovante,
    vendaComprovante,
    openSave,
    openComprovante,
    openDetalhes,
    venda,
    tipoDesconto,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
  }
})
