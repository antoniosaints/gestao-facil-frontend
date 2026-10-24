import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/utils/axios'
import Mobile from './Mobile.vue'
import { useClientesStore } from '@/stores/clientes/useClientes'

vi.mock('@/utils/axios', () => ({ default: { get: vi.fn() } }))
vi.mock('@/repositories/cliente-repository', () => ({ ClienteRepository: {} }))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
enableAutoUnmount(afterEach)
beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  vi.mocked(http.get).mockReset()
})
const empty = { data: { data: [], pagination: { page: 1, totalPages: 1 } } }
const mountList = () =>
  mount(Mobile, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        ModalView: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
      },
    },
  })

describe('Clientes no mobile', () => {
  it('distingue falha de lista vazia e recupera na nova tentativa', async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(empty)
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Verifique sua conexão')
    expect(wrapper.text()).not.toContain('Nenhum cadastro ainda')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nenhum cadastro ainda')
  })

  it('busca diretamente na lista e limpa uma busca sem resultados', async () => {
    vi.mocked(http.get).mockResolvedValue(empty)
    const wrapper = mountList()
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Busca')!
      .trigger('click')
    await wrapper.get('input[type="search"]').setValue('Teste')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(http.get).toHaveBeenLastCalledWith('/clientes/mobile', {
      params: { search: 'Teste', limit: 10, page: 1 },
    })
    expect(wrapper.text()).toContain('Nenhum resultado para esta busca')
    const clear = wrapper.findAll('button').find((button) => button.text() === 'Limpar busca')!
    await clear.trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Busca')!
      .trigger('click')
    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.text()).toContain('Nenhum cadastro ainda')
  })

  it('ignora respostas atrasadas de uma consulta anterior', async () => {
    let finish!: (value: any) => void
    vi.mocked(http.get)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          }),
      )
      .mockResolvedValueOnce(empty)
    const wrapper = mountList()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Busca')!
      .trigger('click')
    await wrapper.get('input').setValue('Atual')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    finish({
      data: {
        data: [{ id: 1, nome: 'Resultado antigo', status: 'ATIVO' }],
        pagination: { page: 1, totalPages: 1 },
      },
    })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Resultado antigo')
  })
  it('pagina pela barra inferior, bloqueia limites e cliques durante carregamento', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, totalPages: 2 } },
    })
    const wrapper = mountList()
    await flushPromises()
    const nav = wrapper.get('nav')
    const previous = nav.findAll('button').find((b) => b.text() === 'Anterior')!
    const next = nav
      .findAll('button')
      .find((b) => b.text() === 'Pr\u00f3ximo')!
    expect(previous.attributes('disabled')).toBeDefined()
    let finish!: (value: unknown) => void
    vi.mocked(http.get).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await next.trigger('click')
    expect(http.get).toHaveBeenLastCalledWith('/clientes/mobile', {
      params: { search: '', limit: 10, page: 2 },
    })
    expect(next.attributes('disabled')).toBeDefined()
    await next.trigger('click')
    expect(http.get).toHaveBeenCalledTimes(2)
    finish({ data: { data: [], pagination: { page: 2, totalPages: 2 } } })
    await flushPromises()
    expect(next.attributes('disabled')).toBeDefined()
    expect(previous.attributes('disabled')).toBeUndefined()
    vi.mocked(http.get).mockResolvedValueOnce(empty)
    await previous.trigger('click')
    await flushPromises()
    expect(http.get).toHaveBeenLastCalledWith('/clientes/mobile', {
      params: { search: '', limit: 10, page: 1 },
    })
  })

  it('mantem cadastro, link publico e atualizacao no menu Mais', async () => {
    vi.mocked(http.get).mockResolvedValue(empty)
    const wrapper = mountList()
    await flushPromises()
    const store = useClientesStore()
    const more = () =>
      wrapper
        .get('nav')
        .findAll('button')
        .find((b) => b.text() === 'Mais')!
        .trigger('click')
    await more()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Novo cliente' && b.classes().includes('justify-start'))!
      .trigger('click')
    expect(store.openModal).toBe(true)
    await more()
    await wrapper
      .findAll('button')
      .find((b) => b.text().startsWith('Link'))!
      .trigger('click')
    expect(store.openModalLink).toBe(true)
    await more()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Atualizar')!
      .trigger('click')
    await flushPromises()
    expect(http.get).toHaveBeenCalledTimes(2)
  })
  it('ajusta a lista ate 8px antes da barra ao redimensionar', async () => {
    let barTop = 720
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = this.tagName === 'NAV' ? barTop : this.hasAttribute('aria-busy') ? 140 : 0
      return { top, bottom: top, left: 0, right: 360, width: 360, height: 0, x: 0, y: top, toJSON: () => ({}) }
    })
    try {
      vi.mocked(http.get).mockResolvedValue(empty)
      const wrapper = mountList()
      await flushPromises()
      await vi.waitFor(() => expect(wrapper.get('[aria-busy]').attributes('style')).toContain('max-height: 572px'))
      barTop = 560
      window.dispatchEvent(new Event('resize'))
      await vi.waitFor(() => expect(wrapper.get('[aria-busy]').attributes('style')).toContain('max-height: 412px'))
    } finally {
      rect.mockRestore()
    }
  })

})
