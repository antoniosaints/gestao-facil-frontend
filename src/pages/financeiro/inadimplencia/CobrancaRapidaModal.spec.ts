import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CobrancaRapidaModal from './CobrancaRapidaModal.vue'

describe('CobrancaRapidaModal', () => {
  it('permite personalizar a mensagem e solicita envio imediato', async () => {
    const wrapper = mount(CobrancaRapidaModal, {
      props: {
        open: true,
        cliente: 'Maria',
        descricao: 'Venda a prazo',
        valor: 150,
        mensagemInicial: 'Olá {cliente}, este é um lembrete de pagamento.',
      },
      global: {
        stubs: {
          ModalView: { template: '<div><slot /></div>' },
        },
      },
    })

    expect((wrapper.get('#mensagem-cobranca-rapida').element as HTMLTextAreaElement).value).toBe(
      'Olá {cliente}, este é um lembrete de pagamento.',
    )

    await wrapper.get('#mensagem-cobranca-rapida').setValue(
      'Olá {cliente}, o valor de {valorParcela} vence em {vencimento}.',
    )
    await wrapper.findAll('button').at(-1)!.trigger('click')

    expect(wrapper.emitted('enviar')?.[0]).toEqual([
      'Olá {cliente}, o valor de {valorParcela} vence em {vencimento}.',
    ])
  })

  it('usa o modelo configurado quando a mensagem fica vazia', async () => {
    const wrapper = mount(CobrancaRapidaModal, {
      props: { open: true },
      global: {
        stubs: {
          ModalView: { template: '<div><slot /></div>' },
        },
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons.at(-1)!.trigger('click')

    expect(wrapper.emitted('enviar')?.[0]).toEqual([undefined])
  })
})
