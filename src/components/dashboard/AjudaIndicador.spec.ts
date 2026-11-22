import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import AjudaIndicador from './AjudaIndicador.vue'

const texto = 'Considera receitas e despesas de todo o histórico.'

function montar() {
  return mount(AjudaIndicador, {
    attachTo: document.body,
    props: { titulo: 'Saldo financeiro', texto },
  })
}

function ponteiro(el: Element, evento: string, pointerType: 'mouse' | 'touch') {
  el.dispatchEvent(Object.assign(new Event(evento), { pointerType }))
}

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Ajuda do indicador', () => {
  it('abre ao clicar e fecha com Esc', async () => {
    const wrapper = montar()
    const botao = wrapper.get('button[aria-label="Entenda Saldo financeiro"]')
    await botao.trigger('click')
    await flushPromises()

    expect(botao.attributes('aria-expanded')).toBe('true')
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(texto)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(botao.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('mantém o mouse do ícone para o popover e fecha ao sair', async () => {
    const wrapper = montar()
    const botao = wrapper.get('button')
    ponteiro(botao.element, 'pointerenter', 'mouse')
    await aguardar(170)
    expect(botao.attributes('aria-expanded')).toBe('true')

    const content = document.querySelector('[role="dialog"]')!
    ponteiro(botao.element, 'pointerleave', 'mouse')
    ponteiro(content, 'pointerenter', 'mouse')
    await aguardar(220)
    expect(botao.attributes('aria-expanded')).toBe('true')
    ponteiro(content, 'pointerleave', 'mouse')
    await aguardar(220)
    expect(botao.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('usa o clique para abrir e fechar em telas de toque', async () => {
    const wrapper = montar()
    const botao = wrapper.get('button')
    ponteiro(botao.element, 'pointerenter', 'touch')
    await aguardar(170)
    expect(botao.attributes('aria-expanded')).toBe('false')
    await botao.trigger('click')
    expect(botao.attributes('aria-expanded')).toBe('true')
    await botao.trigger('click')
    expect(botao.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })
})
