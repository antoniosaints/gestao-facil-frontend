import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type FormularioLancamento, type LancamentoFinanceiro } from '@/types/schemas'
import { LancamentosRepository } from '@/repositories/lancamento-repository'

interface filtro {
  periodo?: { inicio: string | null; fim: string | null }
  tipo?: 'TODOS' | 'RECEITA' | 'DESPESA'
  status?: 'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO'
  contaFinanceiraId?: number | null
  categoriaId?: number | null
  clienteId?: number | null
  inicio?: string | null
  fim?: string | null
  update: boolean
}

type EscopoAlteracaoParcela =
  | 'ATUAL'
  | 'TODAS'
  | 'PENDENTES'
  | 'PAGAS'
  | 'ATUAL_EM_DIANTE'
  | 'ATUAL_PARA_TRAS'

function createDefaultForm(
  overrides?: Partial<
    Pick<
      FormularioLancamento,
      | 'clienteId'
      | 'categoriaId'
      | 'contasFinanceiroId'
      | 'formaPagamento'
      | 'tipo'
      | 'dataLancamento'
      | 'periodoParcelamento'
      | 'intervaloDiasPersonalizado'
      | 'modoValorParcelamento'
    >
  >,
): FormularioLancamento {
  return {
    id: null,
    clienteId: overrides?.clienteId ?? null,
    categoriaId: overrides?.categoriaId ?? null,
    contasFinanceiroId: overrides?.contasFinanceiroId ?? null,
    dataLancamento: overrides?.dataLancamento ?? new Date(),
    dataEntrada: null,
    desconto: '',
    descricao: '',
    formaPagamento: overrides?.formaPagamento ?? 'DINHEIRO',
    parcelas: 1,
    tipo: overrides?.tipo ?? 'RECEITA',
    valorEntrada: '',
    valorTotal: '',
    periodoParcelamento: overrides?.periodoParcelamento ?? 'MENSAL',
    intervaloDiasPersonalizado: overrides?.intervaloDiasPersonalizado ?? null,
    modoValorParcelamento: overrides?.modoValorParcelamento ?? 'TOTAL',
  }
}

export const useLancamentosStore = defineStore('lancamentosStore', () => {
  const openModal = ref(false)
  const openModalParcela = ref(false)
  const openModalDelete = ref(false)
  const openModalEfetivar = ref(false)
  const openModalPropor = ref(false)
  const openModalFaturar = ref(false)
  const openModalCobranca = ref(false)
  const openModalDre = ref(false)
  const openModalLote = ref(false)
  const idMutation = ref<number | null>(null)
  const currentMonth = ref(new Date())
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

  const formParcela = ref<{
    vencimento: Date
    valor: number | string | null
    vencimentoOriginal: Date
    numero: number
    pago: boolean
    escopo: EscopoAlteracaoParcela
  }>({
    vencimento: new Date(),
    valor: null,
    vencimentoOriginal: new Date(),
    numero: 1,
    pago: false,
    escopo: 'ATUAL',
  })

  const form = ref<FormularioLancamento>(createDefaultForm())

  const reset = (options?: { preserveBatchFields?: boolean; preserveDate?: boolean }) => {
    const preserved = options?.preserveBatchFields
      ? {
          clienteId: form.value.clienteId,
          categoriaId: form.value.categoriaId,
          contasFinanceiroId: form.value.contasFinanceiroId,
          formaPagamento: form.value.formaPagamento,
          tipo: form.value.tipo,
          periodoParcelamento: form.value.periodoParcelamento,
          intervaloDiasPersonalizado: form.value.intervaloDiasPersonalizado,
          modoValorParcelamento: form.value.modoValorParcelamento,
          dataLancamento: options?.preserveDate ? form.value.dataLancamento : undefined,
        }
      : undefined

    form.value = createDefaultForm(preserved)
  }

  const resetFormParcela = () => {
    formParcela.value = {
      vencimento: new Date(),
      valor: null,
      vencimentoOriginal: new Date(),
      numero: 1,
      pago: false,
      escopo: 'ATUAL',
    }
  }

  const openSave = (options?: { presetDate?: Date | null }) => {
    if (form.value.id) reset({ preserveBatchFields: true })
    if (options?.presetDate) {
      form.value.dataLancamento = options.presetDate
    }
    openModal.value = true
  }

  const filters = ref<Partial<filtro>>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
    resetSelectedIds()
  }

  const openUpdate = async (id: number) => {
    const { data } = (await LancamentosRepository.get(id)) as {
      data: LancamentoFinanceiro
    }
    form.value = createDefaultForm({
      tipo: data.tipo,
      formaPagamento: data.formaPagamento as
        | 'DINHEIRO'
        | 'DEBITO'
        | 'CREDITO'
        | 'BOLETO'
        | 'DEPOSITO'
        | 'TRANSFERENCIA'
        | 'CHEQUE'
        | 'PIX',
      dataLancamento: data.dataLancamento,
    })
    form.value = {
      ...form.value,
      id,
      categoriaId: data.categoriaId,
      contasFinanceiroId: data.contasFinanceiroId!,
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
    openModalEfetivar,
    openModalCobranca,
    openModalParcela,
    openModalLote,
    currentMonth,
    selectedIds,
    addSelectedId,
    resetSelectedIds,
    removeSelectedId,
    openModalDre,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    resetFormParcela,
    form,
    formParcela,
  }
})
