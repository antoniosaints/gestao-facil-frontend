import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type FormularioLancamento, type LancamentoFinanceiro } from '@/types/schemas'
import { LancamentosRepository } from '@/repositories/lancamento-repository'

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

  const form = ref<FormularioLancamento>({
    id: null,
    clienteId: null,
    categoriaId: null,
    contaFinanceiroId: null,
    dataLancamento: new Date(),
    dataEntrada: null,
    desconto: 0,
    descricao: '',
    formaPagamento: 'DINHEIRO',
    parcelas: 1,
    tipo: 'RECEITA',
    valorEntrada: 0,
    valorTotal: 0,
  })

  const reset = () => {
    form.value = {
      id: null,
      clienteId: null,
      categoriaId: null,
      contaFinanceiroId: null,
      dataLancamento: new Date(),
      dataEntrada: null,
      desconto: 0,
      descricao: '',
      formaPagamento: 'DINHEIRO',
      parcelas: 1,
      tipo: 'RECEITA',
      valorEntrada: 0,
      valorTotal: 0,
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
    const { data } = (await LancamentosRepository.get(id)) as {
      data: LancamentoFinanceiro
    }
    form.value = {
      id: id,
      categoriaId: data.categoriaId,
      contaFinanceiroId: data.contasFinanceiroId!,
      clienteId: data.clienteId ? data.clienteId : null,
      dataEntrada: data.dataEntrada ? data.dataEntrada : null,
      dataLancamento: data.dataLancamento,
      desconto: data.desconto,
      descricao: data.descricao,
      parcelas: 1,
      formaPagamento: data.formaPagamento as
        | 'DINHEIRO'
        | 'DEBITO'
        | 'CREDITO'
        | 'BOLETO'
        | 'DEPOSITO'
        | 'TRANSFERENCIA'
        | 'CHEQUE'
        | 'PIX',
      tipo: data.tipo,
      valorEntrada: data.valorEntrada,
      valorTotal: data.valorTotal,
    }
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
