// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

let page = 1
const pages: Record<number, any[]> = {
  1: [
    { id: 1, Uid: 'P1', nome: 'A', categoria: 'x', preco: 10, codigo: 'c1' },
    { id: 2, Uid: 'P2', nome: 'B', categoria: 'x', preco: 20, codigo: 'c2' },
  ],
  2: [
    { id: 3, Uid: 'P3', nome: 'C', categoria: 'x', preco: 30, codigo: 'c3' },
    { id: 4, Uid: 'P4', nome: 'D', categoria: 'x', preco: 40, codigo: 'c4' },
  ],
}

vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(async (_url: string, cfg: any) => {
      page = cfg?.params?.page ?? 1
      return { data: { data: pages[page], totalPages: 2, page } }
    }),
  },
}))

setActivePinia(createPinia())

describe('cabeçalho ao trocar de página', () => {
  it('não fica marcado quando a nova página tem linhas não selecionadas', async () => {
    const DataTable = (await import('@/components/tabela/DataTable.vue')).default
    const { columnsProdutos } = await import('@/pages/produtos/partials/columnDef')
    const { useProdutoStore } = await import('@/stores/produtos/useProduto')
    const store = useProdutoStore()
    store.resetSelectedIds()

    const wrapper = mount(DataTable, {
      props: { columns: columnsProdutos, api: '/produtos', filters: store.filters },
      global: { stubs: { RouterLink: true } },
    })
    await new Promise((r) => setTimeout(r, 50))
    await nextTick()

    // seleciona tudo na página 1
    await wrapper.findAll('[role="checkbox"]')[0].trigger('click')
    await nextTick()
    expect([...store.selectedIds]).toEqual([1, 2])
    expect(wrapper.findAll('[role="checkbox"]')[0].attributes('data-state')).toBe('checked')

    // vai para a página 2 (ids 3 e 4, nenhum selecionado)
    const proximo = wrapper.findAll('button').find((b) => b.text().includes('Próximo'))!
    await proximo.trigger('click')
    await new Promise((r) => setTimeout(r, 50))
    await nextTick()

    expect(wrapper.find('tbody').text()).toContain('c3')
    expect(wrapper.findAll('[role="checkbox"]')[0].attributes('data-state')).toBe('unchecked')
  })
})
