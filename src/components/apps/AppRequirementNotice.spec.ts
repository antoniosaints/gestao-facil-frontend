import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ active: false, loaded: true, permission: 'root' }))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ({ hasActiveModule: () => state.active, get appModulesLoaded() { return state.loaded }, get usuarioLogged() { return { permissao: state.permission } } }) }))
import AppRequirementNotice from './AppRequirementNotice.vue'
beforeEach(() => { state.active = false; state.loaded = true; state.permission = 'root' })
async function open(configured?: boolean) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: {} }, { path: '/loja', name: 'loja-home', component: {} }, { path: '/whatsapp', name: 'whatsapp', component: {} }] })
  await router.push('/')
  return mount(AppRequirementNotice, { props: { app: 'whatsapp', configured, returnTo: '/clientes/101' }, global: { plugins: [router] } })
}
describe('orientação de instalação e configuração', () => {
  it('oferece nova consulta sem pedir instalação quando o acesso não pôde ser verificado', async () => {
    state.loaded = false
    const wrapper = await open()
    expect(wrapper.text()).toContain('Não foi possível verificar')
    expect(wrapper.text()).toContain('Verificar acesso novamente')
    expect(wrapper.find('a').exists()).toBe(false)
    wrapper.unmount()
  })
  it('leva ao app correto na loja e preserva a retomada', async () => {
    const wrapper = await open()
    expect(wrapper.text()).toContain('Instale e ative o app WhatsApp')
    expect(wrapper.get('a').attributes('href')).toBe('/loja?app=whatsapp&retorno=/clientes/101')
    wrapper.unmount()
  })
  it('orienta configurar quando instalado e oculta o aviso depois de configurado', async () => {
    state.active = true
    const wrapper = await open(false)
    expect(wrapper.get('a').attributes('href')).toBe('/whatsapp?retorno=/clientes/101')
    expect(wrapper.text()).toContain('Configure o app WhatsApp')
    await wrapper.setProps({ configured: true })
    expect(wrapper.find('section').exists()).toBe(false)
    wrapper.unmount()
  })
  it('orienta procurar o administrador quando o usuário não pode configurar', async () => {
    state.active = true; state.permission = 'vendedor'
    const wrapper = await open(false)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('Peça ao administrador')
    wrapper.unmount()
  })
})
