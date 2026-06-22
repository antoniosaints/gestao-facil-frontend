import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import ModalAssinaturaPagar from './ModalAssinaturaPagar.vue'
import { useAssinaturasPagarStore } from '@/stores/lancamentos/useAssinaturasPagar'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}))

vi.mock('@/utils/fileUrl', () => ({
  resolveFileUrl: (value: string) => value,
}))

const passthrough = { template: '<div><slot /></div>' }
const buttonStub = { template: '<button><slot /></button>' }
const inputStub = {
  props: ['modelValue', 'id', 'placeholder', 'type'],
  emits: ['update:modelValue'],
  template: `
    <input
      :id="id"
      :placeholder="placeholder"
      :type="type || 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
}

describe('ModalAssinaturaPagar', () => {
  it('keeps useful link title input mounted while typing', async () => {
    const pinia = createPinia()
    const wrapper = mount(ModalAssinaturaPagar, {
      global: {
        plugins: [pinia],
        stubs: {
          Button: buttonStub,
          Calendarpicker: true,
          Card: passthrough,
          CardContent: passthrough,
          CardDescription: passthrough,
          CardHeader: passthrough,
          CardTitle: passthrough,
          Checkbox: buttonStub,
          Input: inputStub,
          Label: { template: '<label><slot /></label>' },
          ModalView: {
            props: ['open'],
            template: '<section v-if="open"><slot /></section>',
          },
          Select: passthrough,
          Select2Ajax: true,
          SelectContent: passthrough,
          SelectItem: passthrough,
          SelectTrigger: passthrough,
          SelectValue: true,
          Textarea: inputStub,
        },
      },
    })

    const store = useAssinaturasPagarStore()
    store.openCreate()
    await flushPromises()

    const input = wrapper.get('#assinaturaPagarLinkTitulo-0')
    const elementBefore = input.element

    await input.setValue('Portal')

    expect(wrapper.get('#assinaturaPagarLinkTitulo-0').element).toBe(elementBefore)
  })
})
