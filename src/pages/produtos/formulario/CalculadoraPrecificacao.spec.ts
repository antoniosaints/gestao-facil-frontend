// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import CalculadoraPrecificacao from './CalculadoraPrecificacao.vue'

const ModalViewStub = defineComponent({
  props: ['open'],
  emits: ['update:open'],
  template: '<div v-if="open"><slot /></div>',
})

describe('CalculadoraPrecificacao', () => {
  it('calcula e envia os custos base junto do preco sugerido', async () => {
    const wrapper = mount(CalculadoraPrecificacao, {
      props: {
        open: false,
        precoCompra: 100,
        custoProducao: 20,
      },
      global: {
        stubs: { ModalView: ModalViewStub },
      },
    })

    await wrapper.setProps({ open: true })
    await nextTick()

    expect((wrapper.get('[data-testid="custo-compra"]').element as HTMLInputElement).value).toBe(
      '100,00',
    )
    expect((wrapper.get('[data-testid="custo-producao"]').element as HTMLInputElement).value).toBe(
      '20,00',
    )

    await wrapper.get('[data-testid="lucro-percentual"]').setValue('50')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('aplicar')?.[0]).toEqual([
      {
        custoCompra: 100,
        custoProducao: 20,
        precoVenda: 180,
      },
    ])
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})
