import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter, RouterLink } from 'vue-router'
import { useMenuLoading } from '../application/useMenuLoading'
const wrappers: ReturnType<typeof mount>[] = []
const Shell = defineComponent({
  setup() {
    const { pendingPath, onNavigate } = useMenuLoading()
    return () =>
      h('div', { onClickCapture: onNavigate }, [
        h('p', { role: 'status' }, pendingPath.value),
        h(RouterLink, { to: '/modofacil/pessoas' }, { default: () => 'Pessoas' }),
        h(RouterLink, { to: '/modofacil' }, { default: () => 'Início' }),
      ])
  },
})
async function open() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/modofacil/:page?', component: { template: '<div />' } }],
  })
  await router.push('/modofacil')
  const wrapper = mount(Shell, { global: { plugins: [router] } })
  wrappers.push(wrapper)
  return { router, wrapper }
}
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
describe('carregamento ao mudar de menu', () => {
  it('começa no clique antes da guarda assíncrona e termina na conclusão', async () => {
    const { router, wrapper } = await open()
    let release!: () => void
    router.beforeEach(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    await wrapper.get('a').trigger('click', { button: 0 })
    expect(wrapper.get('[role=status]').text()).toBe('/modofacil/pessoas')
    await flushPromises()
    release()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/modofacil/pessoas')
    expect(wrapper.get('[role=status]').text()).toBe('')
  })
  it('encerra o indicador quando o descarte é recusado', async () => {
    const { router, wrapper } = await open()
    router.beforeEach(() => false)
    await wrapper.get('a').trigger('click', { button: 0 })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/modofacil')
    expect(wrapper.get('[role=status]').text()).toBe('')
  })
  it('ignora a página atual e cliques para abrir em outra aba', async () => {
    const { wrapper } = await open()
    await wrapper.findAll('a')[1]!.trigger('click', { button: 0 })
    wrapper
      .get('a')
      .element.addEventListener('click', (event) => event.preventDefault(), { once: true })
    await wrapper.get('a').trigger('click', { button: 0, ctrlKey: true })
    expect(wrapper.get('[role=status]').text()).toBe('')
  })
  it('não deixa o indicador preso em erro de navegação', async () => {
    const { router, wrapper } = await open()
    router.beforeEach(() => {
      throw new Error('Falha simulada')
    })
    await expect(router.push('/modofacil/pessoas')).rejects.toThrow('Falha simulada')
    await flushPromises()
    expect(wrapper.get('[role=status]').text()).toBe('')
  })
})
