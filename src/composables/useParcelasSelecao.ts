import { computed, ref, watch } from 'vue'

export type ParcelaSelecionavel = {
  id?: number | null
  valor?: number | string | null
  pago?: boolean | null
  CobrancasFinanceiras?: unknown[] | null
}

/**
 * Controla a seleção de parcelas de um lançamento para ações em massa
 * (efetivar, gerar cobrança, estornar e excluir).
 */
export function useParcelasSelecao(getParcelas: () => ParcelaSelecionavel[]) {
  const selecionados = ref<Set<number>>(new Set())

  const parcelas = computed(() => getParcelas().filter((parcela): parcela is ParcelaSelecionavel & { id: number } =>
    typeof parcela.id === 'number',
  ))

  const selecionadas = computed(() => parcelas.value.filter((parcela) => selecionados.value.has(parcela.id)))

  const total = computed(() => selecionadas.value.length)
  const valorSelecionado = computed(() =>
    selecionadas.value.reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0),
  )

  const pendentesSelecionadas = computed(() => selecionadas.value.filter((parcela) => !parcela.pago))
  const pagasSelecionadas = computed(() => selecionadas.value.filter((parcela) => parcela.pago))
  const selecionadasSemCobranca = computed(() =>
    pendentesSelecionadas.value.filter((parcela) => !parcela.CobrancasFinanceiras?.length),
  )

  const todosSelecionados = computed(
    () => parcelas.value.length > 0 && total.value === parcelas.value.length,
  )

  function limpar() {
    selecionados.value = new Set()
  }

  function toggle(id: number) {
    const proximo = new Set(selecionados.value)
    if (proximo.has(id)) proximo.delete(id)
    else proximo.add(id)
    selecionados.value = proximo
  }

  function toggleTodos() {
    if (todosSelecionados.value) {
      limpar()
      return
    }
    selecionados.value = new Set(parcelas.value.map((parcela) => parcela.id))
  }

  function selecionarPendentes() {
    selecionados.value = new Set(
      parcelas.value.filter((parcela) => !parcela.pago).map((parcela) => parcela.id),
    )
  }

  function selecionarPagas() {
    selecionados.value = new Set(
      parcelas.value.filter((parcela) => parcela.pago).map((parcela) => parcela.id),
    )
  }

  function estaSelecionada(id?: number | null) {
    return typeof id === 'number' && selecionados.value.has(id)
  }

  // Descarta ids de parcelas que deixaram de existir após um recarregamento.
  watch(parcelas, (lista) => {
    if (!selecionados.value.size) return
    const existentes = new Set(lista.map((parcela) => parcela.id))
    const restantes = [...selecionados.value].filter((id) => existentes.has(id))
    if (restantes.length !== selecionados.value.size) {
      selecionados.value = new Set(restantes)
    }
  })

  return {
    selecionados,
    selecionadas,
    total,
    valorSelecionado,
    pendentesSelecionadas,
    pagasSelecionadas,
    selecionadasSemCobranca,
    todosSelecionados,
    estaSelecionada,
    toggle,
    toggleTodos,
    selecionarPendentes,
    selecionarPagas,
    limpar,
  }
}
