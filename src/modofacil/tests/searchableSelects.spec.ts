import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import FormSelect from '../components/FormSelect.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
const wrappers: ReturnType<typeof mount>[] = []
const stubs = {
  Select: {
    name: 'Select',
    props: ['modelValue', 'open'],
    emits: ['update:modelValue', 'update:open'],
    template: '<div><slot /></div>',
  },
  SelectTrigger: { template: '<button type="button"><slot /></button>' },
  SelectValue: { template: '<span><slot /></span>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectGroup: { template: '<div><slot /></div>' },
  SelectItem: {
    props: ['disabled', 'value'],
    template: '<button type="button" :disabled="disabled"><slot /></button>',
  },
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
})
function render(props: any) {
  const wrapper = mount(FormSelect, { props, global: { stubs } })
  wrappers.push(wrapper)
  return wrapper
}
describe('busca em todos os selects', () => {
  it('filtra opções locais ignorando acentos e preserva filtros vazios', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = render({
      modelValue: '',
      options: [
        { value: '', label: 'Todas' },
        { value: 'ORCAMENTO', label: 'Orçamento' },
        { value: 'VENDA', label: 'Venda' },
      ],
    })
    await flushPromises()
    await wrapper.get('input').setValue('orcamento')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).toContain('Orçamento')
    expect(wrapper.text()).not.toContain('Venda')
    wrapper.getComponent({ name: 'Select' }).vm.$emit('update:modelValue', '"ORCAMENTO"')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toContainEqual(['ORCAMENTO'])
    await wrapper.get('input').setValue('inexistente')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum resultado')
  })
  it('pagina e busca no servidor mantendo IDs numéricos e rótulo da seleção distante', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const loadOptions = vi.fn(async ({ page, id, search }) => ({
      results: [
        {
          id: id || (search ? 95 : page),
          label: id ? 'Categoria existente' : search ? 'Categoria encontrada' : `Categoria ${page}`,
        },
      ],
      hasMore: !id && !search && page === 1,
    }))
    const wrapper = render({ modelValue: 80, loadOptions, required: true })
    await flushPromises()
    expect(loadOptions).toHaveBeenCalledWith(expect.objectContaining({ id: 80 }))
    expect(wrapper.text()).toContain('Categoria existente')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Carregar mais opções')!
      .trigger('click')
    await flushPromises()
    expect(loadOptions).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
    await wrapper.get('input').setValue('aluguel')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'aluguel', page: 1 }),
    )
    wrapper.getComponent({ name: 'Select' }).vm.$emit('update:modelValue', '95')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toContainEqual([95])
  })
  it('não repete consulta remota quando o pai recria as mesmas opções padrão', async () => {
    const loadOptions = vi.fn(async () => ({ results: [], hasMore: false }))
    const wrapper = render({
      modelValue: null,
      options: [{ value: null, label: 'Usar padrão' }],
      loadOptions,
    })
    await flushPromises()
    expect(loadOptions).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ options: [{ value: null, label: 'Usar padrão' }] })
    await flushPromises()
    expect(loadOptions).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(Select2Ajax).exists()).toBe(true)
  })
  it('sincroniza o rótulo selecionado quando opções locais mudam e sinaliza opção removida', async () => {
    const wrapper = render({ modelValue: 7, options: [{ value: 7, label: 'Nome antigo' }] })
    await flushPromises()
    await wrapper.setProps({ options: [{ value: 7, label: 'Nome atualizado' }] })
    await flushPromises()
    expect(wrapper.get('button').text()).toContain('Nome atualizado')
    await wrapper.setProps({ options: [{ value: 8, label: 'Outra opção' }] })
    await flushPromises()
    expect(wrapper.get('button').text()).not.toContain('Nome atualizado')
    expect(wrapper.text()).toContain('A opção selecionada não está disponível.')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
