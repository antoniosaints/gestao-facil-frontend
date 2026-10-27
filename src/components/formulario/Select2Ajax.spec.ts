import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Select2Ajax from './Select2Ajax.vue'
import type { SelectAjaxResult } from './select-ajax'
const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/axios', () => ({ default: http }))
const wrappers: ReturnType<typeof mount>[] = []
function render(props: Record<string, unknown>) {
  const wrapper = mount(Select2Ajax, {
    props,
    global: {
      stubs: {
        Select: {
          name: 'Select',
          props: ['modelValue', 'open'],
          emits: ['update:modelValue', 'update:open'],
          template: '<div><slot /></div>',
        },
        SelectTrigger: { template: '<button type="button"><slot /></button>' },
        SelectValue: { template: '<span><slot /></span>' },
        SelectContent: { template: '<div><slot /></div>' },
        SelectGroup: { template: '<div><slot /></div>' },
        SelectItem: {
          props: ['disabled'],
          template: '<button type="button" :disabled="disabled"><slot /></button>',
        },
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
  vi.clearAllMocks()
})
describe('Select2Ajax compartilhado', () => {
  it('preserva URLs e parâmetros legados, inclusive quando a URL já tem query', async () => {
    http.get.mockResolvedValue({ data: { results: [{ id: 7, label: 'Cliente existente' }] } })
    const wrapper = render({
      url: '/pessoas/select?tipo=CLIENTE',
      modelValue: 7,
      params: [{ key: 'loja', value: 'A & B' }],
    })
    await flushPromises()
    const urls = http.get.mock.calls.map(([url]) => String(url))
    expect(urls).toContain('/pessoas/select?tipo=CLIENTE&id=7&loja=A+%26+B')
    expect(urls).toContain('/pessoas/select?tipo=CLIENTE&search=&page=1&loja=A+%26+B')
    expect(wrapper.text()).toContain('Cliente existente')
  })
  it('carrega mais opções e emite o registro completo sem uma segunda busca de domínio', async () => {
    const record = { id: 2, nome: 'Produto', preco: 12, estoque: 5 }
    const loadOptions = vi.fn(async ({ page }) => ({
      results: [{ id: page, label: `Opção ${page}`, record }],
      hasMore: page === 1,
    }))
    const wrapper = render({ loadOptions })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Carregar mais opções')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Opção 1')
    expect(wrapper.text()).toContain('Opção 2')
    wrapper.findComponent({ name: 'Select' }).vm.$emit('update:modelValue', 2)
    await flushPromises()
    expect(wrapper.emitted('select')).toEqual([[{ id: 2, label: 'Opção 2', record }]])
    expect(wrapper.emitted('update:modelValue')).toContainEqual([2])
    expect(loadOptions).toHaveBeenCalledTimes(2)
  })
  it('ignora respostas atrasadas após uma nova busca e permite repetir falhas de leitura', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let resolveOld!: (result: SelectAjaxResult) => void
    const loadOptions = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<SelectAjaxResult>((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValueOnce({ results: [{ id: 2, label: 'Resultado atual' }] })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ results: [{ id: 3, label: 'Recuperado' }] })
    const wrapper = render({ loadOptions })
    await wrapper.get('input').setValue('Atual')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    resolveOld({ results: [{ id: 1, label: 'Resultado antigo' }] })
    await flushPromises()
    expect(wrapper.text()).toContain('Resultado atual')
    expect(wrapper.text()).not.toContain('Resultado antigo')
    await wrapper.get('input').setValue('Outra busca')
    expect(wrapper.text()).not.toContain('Resultado atual')
    expect(wrapper.text()).toContain('Carregando…')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).toContain('Não foi possível carregar')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tentar novamente')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Recuperado')
  })
  it('preserva a falha da seleção quando a lista carrega e recupera o rótulo no retry', async () => {
    let failed = true
    const loadOptions = vi.fn(async ({ id }) => {
      if (id && failed) throw new Error('offline')
      return { results: [{ id: id || 1, label: id ? 'Seleção recuperada' : 'Outra opção' }] }
    })
    const wrapper = render({ modelValue: 95, loadOptions })
    await flushPromises()
    expect(wrapper.text()).toContain('Não foi possível carregar a seleção.')
    failed = false
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Tentar novamente')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Seleção recuperada')
    expect(wrapper.text()).not.toContain('Não foi possível')
  })
  it('não usa o primeiro registro retornado como se fosse a seleção por ID', async () => {
    const wrapper = render({
      modelValue: 95,
      loadOptions: async () => ({ results: [{ id: 1, label: 'Outro registro' }] }),
    })
    await flushPromises()
    expect(wrapper.text()).toContain('A opção selecionada não está disponível.')
    expect(wrapper.findAll('[data-sa-index]')).toHaveLength(1)
    expect(wrapper.get('button').text()).not.toContain('Outro registro')
  })
  it('não injeta uma seleção recuperada por ID nos resultados de outra busca', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let resolveSelection!: (result: SelectAjaxResult) => void
    const wrapper = render({
      modelValue: 95,
      loadOptions: async ({ id, search }: any) =>
        id
          ? new Promise<SelectAjaxResult>((resolve) => {
              resolveSelection = resolve
            })
          : { results: [{ id: 2, label: search || 'Primeira página' }] },
    })
    await flushPromises()
    await wrapper.get('input').setValue('Busca atual')
    await vi.advanceTimersByTimeAsync(300)
    resolveSelection({ results: [{ id: 95, label: 'Seleção existente' }] })
    await flushPromises()
    expect(wrapper.get('button').text()).toContain('Seleção existente')
    expect(wrapper.findAll('[data-sa-index]').map((item) => item.text())).toEqual(['Busca atual'])
  })
  it('mantém paginação em URL e recarrega ao trocar os parâmetros', async () => {
    http.get.mockImplementation(async (url: string) => ({
      data: {
        results: [
          {
            id: url.includes('page=2') ? 2 : 1,
            label: url.includes('loja=B') ? 'Loja B' : 'Loja A',
          },
        ],
        hasMore: !url.includes('page=2'),
      },
    }))
    const wrapper = render({ url: '/opcoes', params: [{ key: 'loja', value: 'A' }] })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Carregar mais opções')!
      .trigger('click')
    await flushPromises()
    expect(http.get).toHaveBeenLastCalledWith('/opcoes?search=&page=2&loja=A')
    await wrapper.setProps({ params: [{ key: 'loja', value: 'B' }] })
    await flushPromises()
    expect(wrapper.text()).toContain('Loja B')
    expect(wrapper.text()).not.toContain('Loja A')
  })
  it('mostra erro em contrato inválido em vez de uma lista vazia', async () => {
    const wrapper = render({ loadOptions: async () => ({ data: [] }) })
    await flushPromises()
    expect(wrapper.text()).toContain('Não foi possível carregar as opções.')
    expect(wrapper.text()).not.toContain('Nenhum resultado')
  })
})
