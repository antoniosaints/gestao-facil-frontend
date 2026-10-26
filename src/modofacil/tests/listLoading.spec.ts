import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordsTable from '../components/RecordsTable.vue'
import ListLoading from '../components/ListLoading.vue'
const columns = [{ key: 'nome', label: 'Nome' }]
describe('carregamento das listagens', () => {
  it('mostra skeleton inicial sem anunciar uma lista vazia', () => {
    const wrapper = mount(RecordsTable, {
      props: { rows: [], columns, caption: 'Pessoas', loading: true },
    })
    expect(wrapper.findComponent(ListLoading).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Nenhum registro encontrado')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    wrapper.unmount()
  })
  it('mantém as linhas existentes durante atualização e exibe um indicador discreto', async () => {
    const wrapper = mount(RecordsTable, {
      props: { rows: [{ id: 1, nome: 'Pessoa existente' }], columns, caption: 'Pessoas' },
    })
    const cell = wrapper.get('td').element
    await wrapper.setProps({ loading: true })
    expect(wrapper.get('td').element).toBe(cell)
    expect(wrapper.findComponent(ListLoading).exists()).toBe(false)
    expect(wrapper.get('[role=status]').attributes('aria-label')).toBe('Atualizando registros…')
    expect(wrapper.text()).toContain('Pessoa existente')
    wrapper.unmount()
  })
  it('distingue falha de carregamento de lista realmente vazia', async () => {
    const wrapper = mount(RecordsTable, {
      props: { rows: [], columns, caption: 'Pessoas', failed: true },
    })
    expect(wrapper.text()).not.toContain('Nenhum registro encontrado')
    await wrapper.setProps({ failed: false })
    expect(wrapper.text()).toContain('Nenhum registro encontrado')
    wrapper.unmount()
  })
})
