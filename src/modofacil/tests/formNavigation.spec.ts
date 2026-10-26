import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, provide, ref } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { confirmationKey } from '../application/confirmation'
import { useFlow } from '../application/useFlow'
const wrappers: ReturnType<typeof mount>[] = []
async function prepare() {
  const confirm = vi.fn().mockResolvedValue(false)
  const busy = ref(false)
  const Form = defineComponent({
    setup() {
      const dirty = ref(false),
        value = ref('')
      useFlow(dirty, busy)
      return () =>
        h('input', {
          value: value.value,
          onInput: (event: Event) => {
            value.value = (event.target as HTMLInputElement).value
            dirty.value = true
          },
        })
    },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/form/:operation', component: Form },
      { path: '/list', component: { template: '<p>Lista</p>' } },
    ],
  })
  await router.push('/form/reposicao')
  await router.isReady()
  const wrapper = mount(
    defineComponent({
      setup() {
        provide(confirmationKey, confirm)
        return () =>
          h(
            RouterView,
            {},
            { default: ({ Component, route }: any) => h(Component, { key: route.path }) },
          )
      },
    }),
    { global: { plugins: [router] } },
  )
  wrappers.push(wrapper)
  await wrapper.get('input').setValue('Dados em andamento')
  return { wrapper, router, confirm, busy }
}
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
describe('proteção dos formulários em modal', () => {
  it('preserva o preenchimento ao cancelar troca de operação na mesma rota', async () => {
    const { wrapper, router, confirm } = await prepare()
    await router.push('/form/descarte')
    await flushPromises()
    expect(confirm).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/form/reposicao')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('Dados em andamento')
    confirm.mockResolvedValue(true)
    await router.push('/form/descarte')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/form/descarte')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
  })
  it('impede fechamento durante envio e permite sair após a resposta', async () => {
    const { router, confirm, busy } = await prepare()
    busy.value = true
    await router.push('/list')
    expect(router.currentRoute.value.path).toBe('/form/reposicao')
    expect(confirm).not.toHaveBeenCalled()
    busy.value = false
    confirm.mockResolvedValue(true)
    await router.push('/list')
    expect(router.currentRoute.value.path).toBe('/list')
  })
})
