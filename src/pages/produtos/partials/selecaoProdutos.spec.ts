// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(async () => ({
      data: {
        data: [
          {
            id: 1,
            Uid: 'P1',
            nome: 'A',
            categoria: 'x',
            preco: 10,
            codigo: 'c1',
            produtoBaseId: 9,
          },
          {
            id: 2,
            Uid: 'P2',
            nome: 'B',
            categoria: 'x',
            preco: 20,
            codigo: 'c2',
            produtoBaseId: 9,
          },
        ],
        totalPages: 1,
        page: 1,
      },
    })),
  },
}))

// Um único pinia para o arquivo todo: `columnDef.ts` resolve a store no escopo do módulo
// (uma vez), então trocar de pinia por teste faria a store da coluna e a do teste divergirem.
setActivePinia(createPinia())

async function mountTable(which: 'produtos' | 'variantes') {
  const DataTable = (await import('@/components/tabela/DataTable.vue')).default
  const defs = await import('@/pages/produtos/partials/columnDef')
  const { useProdutoStore } = await import('@/stores/produtos/useProduto')
  const store = useProdutoStore()
  const columns = which === 'produtos' ? defs.columnsProdutos : defs.columnsVariantes

  const wrapper = mount(DataTable, {
    props: { columns, api: '/produtos', filters: store.filters },
    global: { stubs: { RouterLink: true } },
  })
  await new Promise((r) => setTimeout(r, 50))
  await nextTick()
  return { wrapper, store }
}

const headerBox = (w: any) => w.findAll('[role="checkbox"]')[0]
const rowBoxes = (w: any) => w.findAll('[role="checkbox"]').slice(1)

describe.each(['produtos', 'variantes'] as const)('tabela de %s', (which) => {
  beforeEach(async () => {
    const { useProdutoStore } = await import('@/stores/produtos/useProduto')
    useProdutoStore().resetSelectedIds()
  })

  it('cabeçalho seleciona todas as linhas da página', async () => {
    const { wrapper, store } = await mountTable(which)
    expect(rowBoxes(wrapper)).toHaveLength(2)

    await headerBox(wrapper).trigger('click')
    await nextTick()

    expect([...store.selectedIds]).toEqual([1, 2])
    expect(headerBox(wrapper).attributes('data-state')).toBe('checked')
    expect(rowBoxes(wrapper).map((b: any) => b.attributes('data-state'))).toEqual([
      'checked',
      'checked',
    ])
  })

  it('cabeçalho desmarca todas as linhas da página', async () => {
    const { wrapper, store } = await mountTable(which)
    await headerBox(wrapper).trigger('click')
    await nextTick()
    await headerBox(wrapper).trigger('click')
    await nextTick()

    expect([...store.selectedIds]).toEqual([])
    expect(headerBox(wrapper).attributes('data-state')).toBe('unchecked')
  })

  it('cabeçalho fica indeterminado com seleção parcial e marcado ao selecionar tudo na mão', async () => {
    const { wrapper, store } = await mountTable(which)

    await rowBoxes(wrapper)[0].trigger('click')
    await nextTick()
    expect([...store.selectedIds]).toEqual([1])
    expect(headerBox(wrapper).attributes('data-state')).toBe('indeterminate')

    await rowBoxes(wrapper)[1].trigger('click')
    await nextTick()
    expect([...store.selectedIds]).toEqual([1, 2])
    expect(headerBox(wrapper).attributes('data-state')).toBe('checked')
  })
})
