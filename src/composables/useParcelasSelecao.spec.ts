import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { useParcelasSelecao, type ParcelaSelecionavel } from './useParcelasSelecao'

function criarParcelas(): ParcelaSelecionavel[] {
  return [
    { id: 1, valor: 100, pago: true },
    { id: 2, valor: 200, pago: false },
    { id: 3, valor: 300, pago: false, CobrancasFinanceiras: [{ id: 9 }] },
  ]
}

describe('useParcelasSelecao', () => {
  it('alterna a seleção de uma parcela e soma o valor selecionado', () => {
    const selecao = useParcelasSelecao(criarParcelas)

    selecao.toggle(2)
    selecao.toggle(3)

    expect(selecao.total.value).toBe(2)
    expect(selecao.valorSelecionado.value).toBe(500)

    selecao.toggle(3)
    expect(selecao.total.value).toBe(1)
    expect(selecao.estaSelecionada(3)).toBe(false)
  })

  it('separa pendentes, pagas e pendentes sem cobrança', () => {
    const selecao = useParcelasSelecao(criarParcelas)

    selecao.toggleTodos()

    expect(selecao.todosSelecionados.value).toBe(true)
    expect(selecao.pagasSelecionadas.value.map((item) => item.id)).toEqual([1])
    expect(selecao.pendentesSelecionadas.value.map((item) => item.id)).toEqual([2, 3])
    expect(selecao.selecionadasSemCobranca.value.map((item) => item.id)).toEqual([2])
  })

  it('seleciona apenas pendentes ou apenas pagas', () => {
    const selecao = useParcelasSelecao(criarParcelas)

    selecao.selecionarPendentes()
    expect([...selecao.selecionados.value]).toEqual([2, 3])

    selecao.selecionarPagas()
    expect([...selecao.selecionados.value]).toEqual([1])

    selecao.limpar()
    expect(selecao.total.value).toBe(0)
  })

  it('descarta parcelas que sumiram após um recarregamento', async () => {
    const lista = ref<ParcelaSelecionavel[]>(criarParcelas())
    const selecao = useParcelasSelecao(() => lista.value)

    selecao.toggleTodos()
    expect(selecao.total.value).toBe(3)

    lista.value = [{ id: 1, valor: 100, pago: true }]
    await nextTick()

    expect([...selecao.selecionados.value]).toEqual([1])
  })

  it('ignora parcelas ainda sem id', () => {
    const selecao = useParcelasSelecao(() => [{ id: null, valor: 50, pago: false }])

    selecao.toggleTodos()

    expect(selecao.total.value).toBe(0)
    expect(selecao.todosSelecionados.value).toBe(false)
  })
})
