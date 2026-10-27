import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ItemSearch from '../components/ItemSearch.vue'
import CategoryPicker from '../components/CategoryPicker.vue'
const api = vi.hoisted(() => ({ page: vi.fn(), read: vi.fn() }))
vi.mock('../adapters/domain', () => ({ api }))
const wrappers: ReturnType<typeof mount>[] = []
const Select2Ajax = {
  name: 'Select2Ajax',
  props: ['loadOptions', 'modelValue'],
  template: '<div />',
}
beforeEach(() => vi.resetAllMocks())
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('seletores de pessoas, produtos e serviços', () => {
  it.each([
    ['PRODUTO', '/produtos', { listingMode: 'variante' }],
    ['SERVICO', '/modofacil/servicos', {}],
    ['PESSOA', '/modofacil/pessoas', { tipo: undefined }],
  ] as const)(
    'busca e pagina %s preservando os dados do item escolhido',
    async (kind, path, filters) => {
      const record = {
        id: 95,
        nome: 'Item encontrado',
        nomeVariante: 'Azul',
        preco: 12,
        estoque: 3,
      }
      api.page.mockResolvedValue({ rows: [record], pages: 3, total: 30 })
      const wrapper = mount(ItemSearch, { props: { kind }, global: { stubs: { Select2Ajax } } })
      wrappers.push(wrapper)
      const select = wrapper.getComponent(Select2Ajax)
      const result = await select.props('loadOptions')({ search: 'Item', page: 2 })
      expect(api.page).toHaveBeenCalledWith(path, { search: 'Item', page: 2, ...filters })
      expect(result.hasMore).toBe(true)
      expect(result.results[0].record).toEqual(record)
      select.vm.$emit('select', result.results[0])
      await flushPromises()
      expect(wrapper.emitted('select')).toEqual([[record]])
    },
  )
  it('envia o tipo do fornecedor para filtrar antes da paginação e mantém a proteção em API antiga', async () => {
    api.page.mockResolvedValue({
      rows: [
        { id: 1, nome: 'Fornecedor', tipo: 'FORNECEDOR' },
        { id: 2, nome: 'Cliente', tipo: 'CLIENTE' },
      ],
      pages: 1,
    })
    const wrapper = mount(ItemSearch, {
      props: { kind: 'PESSOA', personType: 'FORNECEDOR' },
      global: { stubs: { Select2Ajax } },
    })
    wrappers.push(wrapper)
    const result = await wrapper.getComponent(Select2Ajax).props('loadOptions')({
      search: '',
      page: 1,
    })
    expect(api.page).toHaveBeenCalledWith('/modofacil/pessoas', {
      search: '',
      page: 1,
      tipo: 'FORNECEDOR',
    })
    expect(result.results.map((row: any) => row.disabled)).toEqual([false, true])
    expect(result.hasMore).toBe(false)
  })
})

describe('categoria do produto', () => {
  it('recupera o nome pelo ID solicitado sem reutilizar o nome de outra categoria', async () => {
    api.read.mockResolvedValue({
      results: [{ id: 120, label: 'Categoria correta' }],
      hasMore: false,
    })
    const wrapper = mount(CategoryPicker, {
      props: { modelValue: 95, initialLabel: 'Categoria anterior' },
      global: { stubs: { Select2Ajax } },
    })
    wrappers.push(wrapper)
    const result = await wrapper.getComponent(Select2Ajax).props('loadOptions')({
      search: '',
      page: 1,
      id: 120,
    })
    expect(api.read).toHaveBeenCalledWith('/modofacil/produtos/categorias/opcoes', {
      search: '',
      page: 1,
      id: 120,
    })
    expect(result.results).toEqual([{ id: 120, label: 'Categoria correta' }])
  })
})
