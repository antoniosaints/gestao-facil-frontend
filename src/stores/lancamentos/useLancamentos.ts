import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type FormularioVenda, type ItensVendas, type Vendas } from '@/types/schemas'
import { VendaRepository } from '@/repositories/venda-repository'

interface filtro {
  periodo: { inicio: string | null; fim: string | null }
  status: string
  update: boolean
}

export const useLancamentosStore = defineStore('lancamentosStore', () => {
  const openModal = ref(false)
  const openModalDelete = ref(false)
  const openModalPropor = ref(false)
  const openModalFaturar = ref(false)
  const idMutation = ref<number | null>(null)

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
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }

  const filters = ref<Partial<filtro>>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    const { data } = (await VendaRepository.get(id)) as {
      data: Vendas & { ItensVendas: ItensVendas[] }
    }
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
    })
    openModal.value = true
  }

  return {
    openModal,
    idMutation,
    openModalPropor,
    openModalFaturar,
    openModalDelete,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
  }
})
