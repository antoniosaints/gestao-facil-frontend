import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WhatsAppInstanceSelect from './WhatsAppInstanceSelect.vue'

const instances = [{ id: 1, nome: 'Comercial', status: 'CONECTADA' }, { id: 2, nome: 'Financeiro', status: 'CONECTADA' }, { id: 3, nome: 'Offline', status: 'DESCONECTADA' }]
describe('instância dos envios ao cliente', () => {
  it('permite selecionar outra instância e mantém as desconectadas indisponíveis', async () => {
    const wrapper = mount(WhatsAppInstanceSelect, { props: { modelValue: null, moduleActive: true, instances } })
    await wrapper.get('select').setValue('2')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
    expect(wrapper.find('option[value="3"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('sem alterar a instância principal')
    wrapper.unmount()
  })
  it('orienta a conectar uma instância quando nenhuma estiver disponível', () => {
    const wrapper = mount(WhatsAppInstanceSelect, { props: { modelValue: null, moduleActive: true, instances: [instances[2]] }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.get('select').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Nenhuma instância conectada disponível')
    expect(wrapper.text()).toContain('Gerenciar instâncias')
    wrapper.unmount()
  })
  it('mostra ativação do app no lugar do seletor quando o módulo estiver inativo', () => {
    const wrapper = mount(WhatsAppInstanceSelect, { props: { modelValue: null, moduleActive: false, instances: [] }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.text()).toContain('Ativar app WhatsApp')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({ name: 'loja-home', query: { app: 'whatsapp' } })
    wrapper.unmount()
  })
})
