import { flushPromises, shallowMount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ConfiguracaoPage from './ConfiguracaoPage.vue'
import { ContaRepository } from '@/repositories/conta-repository'

const state = vi.hoisted(() => ({ active: false }))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ({
  usuarioLogged: { permissao: 'root' }, isMobile: false, appModules: {},
  hasActiveModule: () => state.active, loadAppModules: async () => {}, getDataUsuario: async () => {}, getStatus: async () => {},
}) }))
vi.mock('@/repositories/conta-repository', () => ({ ContaRepository: { getParametros: vi.fn(), parametros: vi.fn(), listarInstanciasWhatsappNotificacao: vi.fn() } }))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/hooks/links', () => ({ goBack: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  state.active = false
  vi.mocked(ContaRepository.getParametros).mockResolvedValue({ data: { whatsappNotificacoesAtivo: true, whatsappNotificacoesInstanciaId: 2 } } as any)
  vi.mocked(ContaRepository.listarInstanciasWhatsappNotificacao).mockResolvedValue([])
})
function open() {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: {} }] })
  return shallowMount(ConfiguracaoPage, { global: { plugins: [router], renderStubDefaultSlot: true, stubs: { RouterLink: RouterLinkStub } } })
}
describe('configurações de notificações WhatsApp', () => {
  it('oculta o menu e apresenta o botão de ativação com o app inativo', async () => {
    const wrapper = open()
    await flushPromises()
    expect(wrapper.find('tabs-trigger-stub[value="whatsapp"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Ativar app WhatsApp')
    expect(ContaRepository.listarInstanciasWhatsappNotificacao).not.toHaveBeenCalled()
    // Salvar preferências gerais não reenvia flags de um módulo desativado.
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    const payload = vi.mocked(ContaRepository.parametros).mock.calls[0][0]
    expect(Object.keys(payload).some(key => key.startsWith('whatsapp'))).toBe(false)
    wrapper.unmount()
  })
  it('exibe o menu e todos os eventos operacionais com o app ativo', async () => {
    state.active = true
    const wrapper = open()
    await flushPromises()
    expect(wrapper.find('tabs-trigger-stub[value="whatsapp"]').exists()).toBe(true)
    for (const label of ['Nova venda', 'Venda concluída no PDV', 'Estoque baixo', 'Alterações de produtos', 'Sangria de caixa', 'Vencimentos financeiros', 'Nova OS', 'Novo lançamento', 'Novo cliente', 'Comanda faturada', 'Caixa aberto', 'Caixa fechado']) expect(wrapper.text()).toContain(label)
    expect(wrapper.text()).not.toContain('Ativar app WhatsApp')
    wrapper.unmount()
  })
})
