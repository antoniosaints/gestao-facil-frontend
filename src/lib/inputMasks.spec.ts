import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, reactive } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { vMaska } from '@/lib/maska'
import type { MaskInputOptions } from 'maska'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { Input } from '@/components/ui/input'
import PersonFields from '@/modofacil/components/PersonFields.vue'
import { emptyPerson, personPayload } from '@/modofacil/application/personForm'
import CartDrawer from '@/pages/loja/publico/components/CartDrawer.vue'
import type { CheckoutPayload } from '@/repositories/loja-repository'
import {
  cepMaskOptions,
  cpfCnpjMaskOptions,
  cnpjMaskOptions,
  phoneMaskOptions,
  preciseMoneyMaskOptions,
  moneyMaskOptions,
} from './imaska'
import { resolveInputMode } from './inputMode'
import { store, product } from '../../qa/input-masks/fixtures'

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
})
function field(options: MaskInputOptions | string) {
  const Host = defineComponent({
    components: { Input },
    directives: { maska: vMaska },
    setup: () => ({ state: reactive({ value: '' }), options }),
    template: '<Input v-model="state.value" v-maska="options" placeholder="Teste" />',
  })
  const wrapper = mount(Host, { attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

// These use the real directive and Input, so display and the emitted model must agree.
describe('input masks', () => {
  it.each([
    [cepMaskOptions, '01001000', '01001-000'],
    [cepMaskOptions, 'CEP: 01001-000999', '01001-000'],
    [cpfCnpjMaskOptions, '11144477735', '111.444.777-35'],
    [cpfCnpjMaskOptions, '1114447773', '111.444.777-3'],
    [cpfCnpjMaskOptions, '11.222.333/0001-81', '11.222.333/0001-81'],
    [phoneMaskOptions, '1133334444', '(11) 3333-4444'],
    [phoneMaskOptions, '11987654321', '(11) 98765-4321'],
    [phoneMaskOptions, '5511987654321', '+55 (11) 98765-4321'],
    [phoneMaskOptions, '+55 (11) 98765-4321', '+55 (11) 98765-4321'],
    [phoneMaskOptions, '+351912345678', '+351912345678'],
    [phoneMaskOptions, '+14155552671', '+14155552671'],
    [cnpjMaskOptions, '00000000e08g12', '00.000.000/E08G-12'],
    ['########', '01.23.45.67', '01234567'],
    [preciseMoneyMaskOptions, '1.234,1234567', '1234,123456'],
  ] as const)(
    'formats pasted %s / %s without changing the payload',
    async (options, input, expected) => {
      const wrapper = field(options)
      await flushPromises()
      await wrapper.get('input').setValue(input)
      await flushPromises()
      expect(wrapper.get('input').element.value).toBe(expected)
      expect(wrapper.vm.state.value).toBe(expected)
    },
  )

  it.each(['1.234,56', '1234,56', '1234.56', '12.345.678,90'])(
    'preserves decimal intent while typing %s one character at a time',
    async (typed) => {
      const wrapper = field(moneyMaskOptions)
      await flushPromises()
      const input = wrapper.get('input')
      input.element.focus()
      for (const character of typed) {
        await input.setValue(input.element.value + character)
        await flushPromises()
      }
      await input.trigger('blur')
      await flushPromises()
      const expected = typed === '12.345.678,90' ? '12345678,90' : '1234,56'
      expect(input.element.value).toBe(expected)
      expect(wrapper.vm.state.value).toBe(expected)
    },
  )
  it('normalizes a decimal point on Enter before form submission', async () => {
    const wrapper = field(moneyMaskOptions)
    await flushPromises()
    const input = wrapper.get('input')
    input.element.focus()
    await input.setValue('1234.56')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.vm.state.value).toBe('1234,56')
  })

  it('keeps a leading zero and permits clearing, replacing and deleting a masked value', async () => {
    const wrapper = field(cepMaskOptions)
    await flushPromises()
    const input = wrapper.get('input')
    for (const [value, expected] of [
      ['01001000', '01001-000'],
      ['0100100', '01001-00'],
      ['', ''],
      ['02222222', '02222-222'],
    ]) {
      await input.setValue(value)
      await flushPromises()
      expect(input.element.value).toBe(expected)
      expect(wrapper.vm.state.value).toBe(expected)
    }
  })

  it('masks person documents and contacts while keeping address numbers free', async () => {
    const form = reactive(emptyPerson())
    form.nome = 'Cliente de teste'
    const wrapper = mount(PersonFields, { props: { form }, attachTo: document.body })
    wrappers.push(wrapper)
    await flushPromises()
    const fields = wrapper.findAllComponents(Input)
    const byPlaceholder = (placeholder: string) =>
      fields.find((f) => f.attributes('placeholder') === placeholder)!.get('input')
    await byPlaceholder('CPF ou CNPJ').setValue('11144477735')
    await byPlaceholder('00000-000').setValue('01001000')
    await byPlaceholder('Ex.: 120 ou S/N').setValue('S/N')
    await wrapper.get('input[type="tel"]').setValue('5511987654321')
    await flushPromises()
    expect(personPayload(form)).toMatchObject({
      documento: '111.444.777-35',
      cep: '01001-000',
      numero: 'S/N',
      telefone: '5511987654321',
    })
    for (const input of wrapper.findAll('input, textarea'))
      expect(input.attributes('placeholder')).toBeTruthy()
  })

  it('does not mark existing person data as edited just because masks format it', () => {
    const original = {
      ...emptyPerson(),
      nome: 'Cliente teste',
      telefone: '11987654321',
      whastapp: '5511987654321',
      documento: '11144477735',
      cep: '01001000',
    }
    const form = {
      ...original,
      telefone: '(11) 98765-4321',
      whastapp: '+55 (11) 98765-4321',
      documento: '111.444.777-35',
      cep: '01001-000',
    }
    expect(personPayload(form, { ...original, id: 1 })).toEqual({})
    form.cep = '02222-222'
    expect(personPayload(form, { ...original, id: 1 })).toEqual({ cep: '02222-222' })
  })

  it('masks checkout contacts/address and leaves the finish action usable', async () => {
    const checkout = reactive<CheckoutPayload>({
      items: [],
      channel: 'WHATSAPP',
      deliveryType: 'ENTREGA_LOCAL',
      customer: { name: '', phone: '', postalCode: '', number: '' },
    })
    const wrapper = mount(CartDrawer, {
      props: {
        open: true,
        store,
        items: [{ product, quantity: 1 }],
        subtotal: 10,
        checkout,
        checkingOut: false,
      },
      global: { stubs: { teleport: true } },
    })
    wrappers.push(wrapper)
    await flushPromises()
    await wrapper.get('input[placeholder="Seu nome completo"]').setValue('Cliente teste')
    await wrapper.get('input[type="tel"]').setValue('11987654321')
    await wrapper.get('input[placeholder="00000-000"]').setValue('01001000')
    await wrapper.get('input[placeholder="Ex.: 120 ou S/N"]').setValue('12A')
    await flushPromises()
    expect(checkout.customer).toMatchObject({
      phone: '(11) 98765-4321',
      postalCode: '01001-000',
      number: '12A',
    })
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Continuar'))!
      .trigger('click')
    await nextTick()
    const finish = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Finalizar no WhatsApp'))!
    expect(finish.attributes('disabled')).toBeUndefined()
    await finish.trigger('click')
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })
})

describe('numeric input compatibility', () => {
  it.each([
    [{ type: 'number', min: 0 }, 'numeric'],
    [{ type: 'number', min: 0, step: '0.000001' }, 'decimal'],
    [{ type: 'number', step: 'any' }, 'decimal'],
    [{ type: 'number', min: -10 }, 'decimal'],
    [{ type: 'number', inputmode: 'numeric' }, 'numeric'],
    [{ type: 'tel' }, 'tel'],
    [{ type: 'email' }, 'email'],
  ])('chooses a keyboard without applying a text mask: %j', (attrs, expected) =>
    expect(resolveInputMode(attrs)).toBe(expected),
  )

  it('preserves the numeric model, six decimals, negative values and explicit inputmode on both Input variants', async () => {
    const Host = defineComponent({
      components: { Input },
      setup: () => ({ state: reactive({ amount: 0, icon: false }) }),
      template:
        '<Input v-model.number="state.amount" type="number" min="-100" step="0.000001" :icon-label="state.icon ? \'R$\' : undefined" placeholder="0,000000" />',
    })
    const wrapper = mount(Host)
    wrappers.push(wrapper)
    for (const icon of [false, true]) {
      wrapper.vm.state.icon = icon
      await nextTick()
      const input = wrapper.get('input')
      expect(input.attributes('inputmode')).toBe('decimal')
      await input.setValue('-12.123456')
      await flushPromises()
      expect(wrapper.vm.state.amount).toBe(-12.123456)
      expect(typeof wrapper.vm.state.amount).toBe('number')
      expect(input.attributes('step')).toBe('0.000001')
    }
    const explicit = mount(
      defineComponent({
        components: { Input },
        setup: () => ({ state: reactive({ mode: 'numeric' }) }),
        template: '<Input type="number" :inputmode="state.mode" />',
      }),
    )
    wrappers.push(explicit)
    expect(explicit.get('input').attributes('inputmode')).toBe('numeric')
    explicit.vm.state.mode = 'decimal'
    await nextTick()
    expect(explicit.get('input').attributes('inputmode')).toBe('decimal')
  })
})

describe('supported legacy forms', () => {
  it('applies masks to dynamically inserted inputs, preserves DDI and edits, and does not change numeric fields', () => {
    const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' })
    dom.window.eval(readFileSync('../api/public/js/functions/input-masks.js', 'utf8'))
    const input = dom.window.document.createElement('input')
    input.dataset.inputMask = 'phone'
    dom.window.document.body.append(input)
    const set = (value: string) => {
      input.value = value
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
      return input.value
    }
    expect(set('5511987654321')).toBe('+55 (11) 98765-4321')
    expect(set('+351912345678')).toBe('+351912345678')
    input.dataset.inputMask = 'cep'
    expect(set('01001000')).toBe('01001-000')
    expect(set('')).toBe('')
    input.dataset.inputMask = 'cpf-cnpj'
    expect(set('11144477735')).toBe('111.444.777-35')
    expect(set('11222333000181')).toBe('11.222.333/0001-81')
    input.removeAttribute('data-input-mask')
    input.type = 'number'
    expect(set('0.123456')).toBe('0.123456')
    dom.window.close()
  })
})
