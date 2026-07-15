import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from '../App.vue'

const routeMock = vi.hoisted(() => ({
  path: '/',
  meta: { layout: 'default' },
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => routeMock,
  }
})

describe('App', () => {
  it('mounts with the configured layout shell', () => {
    routeMock.path = '/'
    routeMock.meta = { layout: 'default' }

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterView: {
            template: '<div data-testid="router-view-stub" />',
          },
          transition: false,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="router-view-stub"]').exists()).toBe(true)
  })

  it('renderiza rotas publicas da loja sem a transicao global', () => {
    routeMock.path = '/lojas/minha-loja/login'
    routeMock.meta = { layout: 'default' }
    const Page = defineComponent({ template: '<div data-testid="store-page" />' })

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterView: defineComponent({
            setup(_, { slots }) {
              return () => slots.default?.({ Component: Page })
            },
          }),
          Transition: defineComponent({ template: '<div data-testid="transition"><slot /></div>' }),
        },
      },
    })

    expect(wrapper.find('[data-testid="store-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="transition"]').exists()).toBe(false)
  })
})
