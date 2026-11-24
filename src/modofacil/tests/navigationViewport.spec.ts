import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import NavigationViewport from '../components/NavigationViewport.vue'
import spinner from '../assets/infinite-spinner.svg'

// A refused route must restore the original page and its draft, not mount a copy.
const Draft = defineComponent({
  setup() {
    const value = ref('')
    return () =>
      h('input', {
        value: value.value,
        onInput: (event: Event) => {
          value.value = (event.target as HTMLInputElement).value
        },
      })
  },
})
describe('área de carregamento de navegação', () => {
  it('oculta e bloqueia o conteúdo durante a navegação e restaura o mesmo rascunho ao cancelar', async () => {
    const wrapper = mount(NavigationViewport, {
      props: { loading: false },
      slots: { default: () => h(Draft) },
    })
    const input = wrapper.get('input')
    await input.setValue('Rascunho preservado')
    expect(wrapper.find('[role=status]').exists()).toBe(false)
    await wrapper.setProps({ loading: true, label: 'Carregando Financeiro…' })
    expect(wrapper.get('[role=status]').attributes('aria-label')).toBe('Carregando Financeiro…')
    expect(wrapper.get('[role=status] img').attributes('src')).toBe(spinner)
    expect(wrapper.get('[inert]').classes()).toContain('invisible')
    expect(wrapper.get('[inert]').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('input').element).toBe(input.element)
    await wrapper.setProps({ loading: false })
    expect(wrapper.find('[role=status]').exists()).toBe(false)
    expect(wrapper.find('[inert]').exists()).toBe(false)
    expect(wrapper.get('input').element).toBe(input.element)
    expect((input.element as HTMLInputElement).value).toBe('Rascunho preservado')
    wrapper.unmount()
  })
  it('ajusta o centro para a largura do menu recolhido', async () => {
    const wrapper = mount(NavigationViewport, { props: { loading: true } })
    expect(wrapper.get('[role=status]').classes()).toContain('lg:left-[288px]')
    await wrapper.setProps({ collapsed: true })
    expect(wrapper.get('[role=status]').classes()).toContain('lg:left-[80px]')
    wrapper.unmount()
  })
  it('mostra o SVG animado dentro do conteúdo e preserva a página montada', async () => {
    const wrapper = mount(NavigationViewport, {
      props: { loading: false },
      slots: { default: () => h(Draft) },
    })
    const input = wrapper.get('input')
    await input.setValue('Rascunho preservado')

    await wrapper.setProps({ animatedLoading: true })
    const status = wrapper.get('[role=status]')
    expect(status.classes()).toContain('absolute')
    expect(status.get('svg').attributes('viewBox')).toBe('0 0 80 80')
    expect(wrapper.get('[inert]').element.contains(input.element)).toBe(true)

    await wrapper.setProps({ animatedLoading: false })
    expect(wrapper.find('[role=status]').exists()).toBe(false)
    expect(wrapper.find('[inert]').exists()).toBe(false)
    expect(wrapper.get('input').element).toBe(input.element)
    expect((input.element as HTMLInputElement).value).toBe('Rascunho preservado')
    wrapper.unmount()
  })
})
