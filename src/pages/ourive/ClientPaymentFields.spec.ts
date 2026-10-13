import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ClientPaymentFields from './ClientPaymentFields.vue'
import { MetodoPagamento } from '@/types/schemas'
import { formatToNumberValue } from '@/utils/formatters'

enableAutoUnmount(afterEach)

function mountFields(amount = '') {
  return mount(ClientPaymentFields, {
    props: { amount },
    global: {
      stubs: {
        Select: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template:
            '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
        },
        SelectContent: { template: '<slot />' },
        SelectItem: { props: ['value'], template: '<option :value="value"><slot /></option>' },
        SelectTrigger: true,
      },
    },
  })
}

describe('Pagamento do cliente na OS', () => {
  it('aplica a máscara ao valor digitado e conserva os centavos enviados à API', async () => {
    const wrapper = mountFields()
    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('inputmode')).toBe('decimal')
    await input.setValue('1.075,259')
    expect((input.element as HTMLInputElement).value).toBe('1075,25')
    const lastAmount = wrapper.emitted('update:amount')?.at(-1)?.[0] as string
    expect(formatToNumberValue(lastAmount)).toBe(1075.25)
  })

  it('exibe uma antecipação salva com centavos em formato brasileiro', () => {
    const wrapper = mountFields('1075,00')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('1075,00')
  })

  it('reutiliza os métodos padrão e permite selecionar PIX ou cartão', async () => {
    const wrapper = mountFields()
    expect(wrapper.findAll('option').map((option) => option.attributes('value'))).toEqual(
      Object.values(MetodoPagamento),
    )
    expect(wrapper.text()).toContain('Cartão')
    await wrapper.get('select').setValue('PIX')
    expect(wrapper.emitted('update:method')?.at(-1)).toEqual(['PIX'])
    await wrapper.get('select').setValue('CARTAO')
    expect(wrapper.emitted('update:method')?.at(-1)).toEqual(['CARTAO'])
  })
})
