import { describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Select } from '@/components/ui/select'
import FormSelect from '../components/FormSelect.vue'
import FormSwitch from '../components/FormSwitch.vue'

describe('controles compartilhados do Modo Fácil', () => {
  it('preserva IDs numéricos e avisa o formulário sobre a alteração', async () => {
    let inputs = 0
    const wrapper = mount({
      components: { FormSelect },
      template:
        '<form @input="changed"><label>Conta<FormSelect :model-value="null" required :options="[{ value: 7, label: \'Conta principal\' }]" /></label></form>',
      methods: {
        changed() {
          inputs++
        },
      },
    })
    await flushPromises()
    const control = wrapper.getComponent({ name: 'FormSelect' })
    control.getComponent(Select).vm.$emit('update:modelValue', '7')
    await flushPromises()
    expect(control.emitted('update:modelValue')?.[0]).toEqual([7])
    expect(inputs).toBe(1)
    wrapper.unmount()
  })
  it('permite limpar um filtro e escolher o padrão nulo', async () => {
    const wrapper = mount(FormSelect, {
      props: {
        modelValue: 'PAGO',
        options: [
          { value: '', label: 'Todas' },
          { value: null, label: 'Padrão' },
          { value: 'PAGO', label: 'Pago' },
        ],
      },
    })
    await flushPromises()
    wrapper.getComponent(Select).vm.$emit('update:modelValue', '""')
    await flushPromises()
    wrapper.getComponent(Select).vm.$emit('update:modelValue', 'null')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([[''], [null]])
    wrapper.unmount()
  })
  it('o Switch usa semântica acessível e respeita bloqueio durante envio', async () => {
    const wrapper = mount(FormSwitch, { props: { modelValue: false } })
    await wrapper.get('[role=switch]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    await wrapper.setProps({ disabled: true })
    expect(wrapper.get('[role=switch]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

describe('validação e sincronização do Select', () => {
  it('mantém a validação obrigatória e volta ao placeholder ao limpar por fora', async () => {
    const wrapper = mount(
      {
        components: { FormSelect },
        data: () => ({ account: null as number | null }),
        template:
          '<form><label>Conta<FormSelect v-model="account" required placeholder="Escolha a conta" :options="[{value: 7, label: \'Conta principal\'}]" /></label></form>',
      },
      { attachTo: document.body },
    )
    await flushPromises()
    const native = wrapper.get('select').element as HTMLSelectElement
    expect(native.required).toBe(true)
    expect(native.checkValidity()).toBe(false)
    wrapper
      .getComponent({ name: 'FormSelect' })
      .getComponent(Select)
      .vm.$emit('update:modelValue', '7')
    await flushPromises()
    expect(native.checkValidity()).toBe(true)
    expect(wrapper.get('[role=combobox]').text()).toBe('Conta principal')
    await wrapper.setData({ account: null })
    await flushPromises()
    expect(wrapper.get('[role=combobox]').text()).toBe('Escolha a conta')
    expect(native.checkValidity()).toBe(false)
    wrapper.unmount()
  })
})

describe('seleção remota existente', () => {
  it('mantém válido o ID selecionado mesmo fora da página de opções visível', async () => {
    const wrapper = mount(
      {
        components: { FormSelect },
        data: () => ({ category: 95 }),
        methods: {
          async load(query: { id?: number }) {
            return {
              results: query.id
                ? [{ id: 95, label: 'Categoria existente' }]
                : [{ id: 1, label: 'Primeira categoria' }],
              hasMore: !query.id,
            }
          },
        },
        template:
          '<form><label>Categoria<FormSelect v-model="category" :load-options="load" required /></label></form>',
      },
      { attachTo: document.body },
    )
    await flushPromises()
    const native = wrapper.get('select').element as HTMLSelectElement
    expect(native.value).toBe('95')
    expect(native.checkValidity()).toBe(true)
    expect(wrapper.get('[role=combobox]').text()).toBe('Categoria existente')
    wrapper.unmount()
  })
})
