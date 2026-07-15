import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { useStorefrontLightTheme } from './useStorefrontLightTheme'

const Host = defineComponent({
  setup() {
    useStorefrontLightTheme()
    return () => null
  },
})

afterEach(() => {
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
})

describe('useStorefrontLightTheme', () => {
  it('força o tema claro somente enquanto a loja está montada', async () => {
    const root = document.documentElement
    root.classList.add('dark')
    root.style.setProperty('--background', '222.2 84% 4.9%')

    const wrapper = mount(Host)
    await nextTick()

    expect(root.classList.contains('dark')).toBe(false)
    expect(root.classList.contains('light')).toBe(true)
    expect(root.style.colorScheme).toBe('light')
    expect(root.style.getPropertyValue('--background')).toBe('210 20% 98%')

    wrapper.unmount()

    expect(root.classList.contains('dark')).toBe(true)
    expect(root.classList.contains('light')).toBe(false)
    expect(root.style.getPropertyValue('--background')).toBe('222.2 84% 4.9%')
  })

  it('mantém o tema claro enquanto outra rota da loja ainda está montada', async () => {
    const root = document.documentElement
    root.classList.add('dark')
    const firstRoute = mount(Host)
    const secondRoute = mount(Host)
    await nextTick()

    firstRoute.unmount()
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.classList.contains('light')).toBe(true)

    secondRoute.unmount()
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.classList.contains('light')).toBe(false)
  })
})
