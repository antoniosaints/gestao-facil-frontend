import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from '../App.vue'

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({ meta: { layout: 'default' } }),
  }
})

describe('App', () => {
  it('mounts with the configured layout shell', () => {
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
})
