import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import FiscalStatusBadge from './FiscalStatusBadge.vue'

enableAutoUnmount(afterEach)

describe('Status da nota fiscal', () => {
  it('atualiza registrada, emitindo e autorizada conforme o retorno do servidor', async () => {
    const wrapper = mount(FiscalStatusBadge, { props: { status: 'PENDENTE' } })
    expect(wrapper.text()).toBe('Registrada')
    expect(wrapper.find('.lucide-list-checks').exists()).toBe(true)
    expect(wrapper.find('.animate-spin').exists()).toBe(false)

    await wrapper.setProps({ status: 'EMITINDO' })
    expect(wrapper.text()).toBe('Emitindo...')
    expect(wrapper.get('[role="status"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('.lucide-loader-circle').classes()).toContain('animate-spin')

    await wrapper.setProps({ status: 'EM_PROCESSAMENTO' })
    expect(wrapper.text()).toBe('Emitindo...')

    await wrapper.setProps({ status: 'AUTORIZADA' })
    expect(wrapper.text()).toBe('Autorizada')
    expect(wrapper.find('.lucide-circle-check').exists()).toBe(true)
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').attributes('aria-busy')).toBe('false')
  })

  it('mostra o erro completo no tooltip do badge lateral acessível pelo teclado', async () => {
    const error =
      'A conexão falhou antes da confirmação. Consulte o provedor para verificar o resultado da emissão antes de tentar novamente.'
    const wrapper = mount(FiscalStatusBadge, {
      props: { status: 'EMISSAO_INCERTA', error },
      attachTo: document.body,
    })
    expect(wrapper.text()).toBe('Emissão incerta')
    expect(wrapper.find('p').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').classes()).toContain('rounded-r-none')
    const trigger = wrapper.get('button[aria-label="Ver erro da nota fiscal"]')
    expect(trigger.find('.lucide-circle-alert').exists()).toBe(true)
    ;(trigger.element as HTMLButtonElement).focus()
    await flushPromises()
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(error)

    await wrapper.setProps({ status: 'AUTORIZADA', error: null })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').classes()).not.toContain('rounded-r-none')
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })
})
