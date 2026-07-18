import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TermosPolitica from './TermosPolitica.vue'

const scrollIntoView = vi.fn()

beforeEach(() => {
  scrollIntoView.mockClear()
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  })
  window.history.replaceState(null, '', '/site/termos-politica#termos')
})

describe('TermosPolitica', () => {
  it('rola para a seção pelo índice sem navegar para outra rota', async () => {
    const wrapper = mount(TermosPolitica, {
      attachTo: document.body,
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    await wrapper.get('a[href="#termos-conta"]').trigger('click')

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(window.location.pathname).toBe('/site/termos-politica')
    wrapper.unmount()
  })
})
