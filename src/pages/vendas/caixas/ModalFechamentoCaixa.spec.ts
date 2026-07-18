import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ModalFechamentoCaixa from './ModalFechamentoCaixa.vue'

describe('ModalFechamentoCaixa', () => {
  it('emite a mesma conferência por método para qualquer tela de fechamento', async () => {
    const wrapper = mount(ModalFechamentoCaixa, {
      props: {
        open: false,
        caixa: {
          id: 7,
          codigo: 'CX-007',
          status: 'ABERTO',
          saldoInicial: 30,
          saldoEsperado: 130,
          abertoEm: new Date().toISOString(),
          abertoPor: { id: 1, nome: 'Operador' },
        },
        saldoEsperado: 130,
        porMetodo: { DINHEIRO: 100, PIX: 50, CARTAO: 20 },
      },
      global: {
        stubs: {
          ModalView: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.setProps({ open: true })
    await wrapper.get('input[aria-label="Valor contado em dinheiro"]').setValue('125')
    await wrapper.get('button[title="Informar valor contado em PIX"]').trigger('click')
    await wrapper.get('input[aria-label="Valor contado em PIX"]').setValue('48')
    await wrapper.get('#fechamento-observacao').setValue('Conferência do turno')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('confirmar')?.[0]?.[0]).toEqual({
      valorFechamento: 125,
      descricao: 'Conferência do turno',
      metodosContados: [
        { metodo: 'DINHEIRO', esperado: 130, contado: 125, diferenca: -5 },
        { metodo: 'PIX', esperado: 50, contado: 48, diferenca: -2 },
        { metodo: 'CARTAO', esperado: 20, contado: 20, diferenca: 0 },
      ],
    })
  })
})
