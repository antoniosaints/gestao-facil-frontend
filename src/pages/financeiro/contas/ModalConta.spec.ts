import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ModalConta from './ModalConta.vue'

const { criarConta, atualizarCalculosContaFinanceira } = vi.hoisted(() => ({
  criarConta: vi.fn().mockResolvedValue({ data: { id: 3 } }),
  atualizarCalculosContaFinanceira: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/repositories/lancamento-repository', () => ({
  LancamentosRepository: { criarConta, atualizarCalculosContaFinanceira },
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

describe('Conta financeira nos cálculos gerais', () => {
  it.each([true, false])('edita somente a preferência %s na ação de suporte', async (ignorarNosCalculos) => {
    criarConta.mockClear()
    atualizarCalculosContaFinanceira.mockClear()
    const wrapper = mount(ModalConta, {
      props: {
        open: true,
        somenteCalculos: true,
        conta: { id: 3, nome: 'Reserva', saldoInicial: -253.17, ignorarNosCalculos: !ignorarNosCalculos },
      },
      global: { stubs: { ModalView: { template: '<div><slot /><slot name="footer" /></div>' } } },
    })

    expect(wrapper.find('#saldoInicialConta').exists()).toBe(false)
    expect(wrapper.find('#nomeConta').exists()).toBe(false)
    expect(wrapper.get('button[type="submit"]').attributes('form')).toBe('edicaoContaFinanceira')
    await wrapper.get('[role="switch"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(atualizarCalculosContaFinanceira).toHaveBeenCalledExactlyOnceWith(3, ignorarNosCalculos)
    expect(criarConta).not.toHaveBeenCalled()
    expect(wrapper.emitted('saved')).toHaveLength(1)
    wrapper.unmount()
  })

  it.each([true, false])('grava a opção %s sem reenviar o saldo negativo', async (ignorarNosCalculos) => {
    criarConta.mockClear()
    const wrapper = mount(ModalConta, {
      props: {
        open: true,
        conta: { id: 3, nome: 'Reserva', saldoInicial: -253.17, ignorarNosCalculos: !ignorarNosCalculos },
      },
      global: { stubs: { ModalView: { template: '<div><slot /><slot name="footer" /></div>' } } },
    })

    const switchControl = wrapper.get('[role="switch"]')
    expect(switchControl.attributes('aria-checked')).toBe(String(!ignorarNosCalculos))
    expect((wrapper.get('#saldoInicialConta').element as HTMLInputElement).value).toBe('-253,17')
    await switchControl.trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(criarConta).toHaveBeenCalledOnce()
    expect(criarConta.mock.calls[0]?.[0]).toMatchObject({ id: 3, ignorarNosCalculos })
    expect(criarConta.mock.calls[0]?.[0]).not.toHaveProperty('saldoInicial')
    wrapper.unmount()
  })
})
