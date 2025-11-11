import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  type CarrinhoItem,
  type FormularioVenda,
  type ItensVendas,
  type PagamentoVendas,
  type Vendas,
} from '@/@types/schemas'
import { VendaRepository } from '@/repositories/venda-repository'
import { useToast } from 'vue-toastification'
const toast = useToast()
interface filtroVendas {
  periodo: { inicio: string | null; fim: string | null }
  status: string
  update: boolean
}

export const useVendasStore = defineStore('vendasStore', () => {
  const openModal = ref(false)
  const openModalPropor = ref(false)
  const openModalFaturar = ref(false)
  const openModalDetalhes = ref(false)
  const idMutation = ref<number | null>(null)
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
    status: 'FINALIZADO',
    garantia: 0,
    observacoes: '',
  })

  const reset = () => {
    form.value = {
      id: null,
      status: 'FINALIZADO',
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
      const newItem = {
        id: item.produtoId,
        produto: item.produto.nome,
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
    openModalPropor,
    openModalFaturar,
    openModalDetalhes,
    openSave,
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
