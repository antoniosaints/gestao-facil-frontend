import { flushPromises, shallowMount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ConfiguracaoPage from './ConfiguracaoPage.vue'
import NotificationSettings from './NotificationSettings.vue'
import { ContaRepository } from '@/repositories/conta-repository'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'

const state = vi.hoisted(() => ({ active: false }))
vi.mock('@/stores/ui/uiStore', () => ({
  useUiStore: () => ({
    usuarioLogged: { permissao: 'root' },
    isMobile: false,
    appModules: {},
    hasActiveModule: () => state.active,
    loadAppModules: async () => {},
    getDataUsuario: async () => {},
    getStatus: async () => {},
  }),
}))
vi.mock('@/repositories/conta-repository', () => ({
  ContaRepository: {
    getParametros: vi.fn(),
    parametros: vi.fn(),
    listarInstanciasWhatsappNotificacao: vi.fn(),
  },
}))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/hooks/links', () => ({ goBack: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  state.active = false
  vi.mocked(ContaRepository.getParametros).mockResolvedValue({
    data: {
      emailAvisos: 'avisos@example.test',
      pushNotificacoesAtivo: true,
      whatsappNotificacoesAtivo: true,
      whatsappNotificacoesInstanciaId: 2,
    },
  })
  vi.mocked(ContaRepository.listarInstanciasWhatsappNotificacao).mockResolvedValue([])
})

function openChannels() {
  return shallowMount(NotificationSettings, {
    global: { renderStubDefaultSlot: true, stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('configurações de notificação', () => {
  it('abre a aba Notificações pelos links existentes de configuração do WhatsApp', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: {} }],
    })
    await router.push('/?tab=whatsapp')
    const wrapper = shallowMount(ConfiguracaoPage, {
      global: { plugins: [router], renderStubDefaultSlot: true },
    })

    expect(wrapper.find('tabs-trigger-stub[value="whatsapp"]').exists()).toBe(false)
    expect(wrapper.getComponent(Tabs).props('modelValue')).toBe('notificacoes')
    expect(wrapper.getComponent(NotificationSettings).props('focusWhatsApp')).toBe(true)
    wrapper.unmount()
  })

  it('exibe Push, E-mail e a ativação do app quando o WhatsApp está inativo', async () => {
    const wrapper = openChannels()
    await flushPromises()

    expect(wrapper.get('#notificacoes-push').text()).toContain('Salvar Push')
    expect(wrapper.get('#notificacoes-email').text()).toContain('Salvar E-mail')
    expect(wrapper.get('#notificacoes-whatsapp').text()).toContain('Ativar app WhatsApp')
    expect(ContaRepository.listarInstanciasWhatsappNotificacao).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('desativa o push sem reenviar as preferências dos outros canais', async () => {
    const wrapper = openChannels()
    await flushPromises()
    const push = wrapper.getComponent<typeof Switch>('#pushNotificacoesAtivo')
    push.vm.$emit('update:modelValue', false)

    await wrapper.get('#notificacoes-push').trigger('submit')
    expect(ContaRepository.parametros).toHaveBeenCalledWith({
      pushNotificacoesAtivo: false,
      eventoVendaConcluida: true,
      eventoEstoqueBaixo: true,
      eventoProdutoAlterado: true,
      eventoSangria: false,
      pushEventoVencimentoFinanceiro: true,
    })
    wrapper.unmount()
  })

  it('envia o endereço e apenas os eventos do e-mail quando salva esse canal', async () => {
    const wrapper = openChannels()
    await flushPromises()
    const email = wrapper.getComponent<typeof Switch>('#emailNotificacoesAtivo')
    expect(email.props('modelValue')).toBe(false)
    email.vm.$emit('update:modelValue', true)
    wrapper
      .getComponent<typeof Input>('#notificationEmail')
      .vm.$emit('update:modelValue', '  operacao@example.test  ')
    wrapper
      .getComponent<typeof Switch>('#emailEventoEstoqueBaixo')
      .vm.$emit('update:modelValue', false)

    await wrapper.get('#notificacoes-email').trigger('submit')
    expect(ContaRepository.parametros).toHaveBeenCalledWith({
      emailNotificacoesAtivo: true,
      emailEventoEstoqueBaixo: false,
      emailEventoVencimentoFinanceiro: true,
      emailAvisos: 'operacao@example.test',
    })
    wrapper.unmount()
  })

  it('permite desativar o WhatsApp se a instância cadastrada estiver indisponível', async () => {
    state.active = true
    const wrapper = openChannels()
    await flushPromises()
    const whatsapp = wrapper.get('#notificacoes-whatsapp')
    expect(whatsapp.text()).toContain('Nova ordem de serviço')
    expect(whatsapp.text()).not.toContain('Ativar app WhatsApp')
    expect(
      wrapper.getComponent<typeof Switch>('#whatsappNotificacoesAtivo').props('disabled'),
    ).toBe(false)
    await whatsapp.trigger('submit')
    expect(ContaRepository.parametros).not.toHaveBeenCalled()

    wrapper
      .getComponent<typeof Switch>('#whatsappNotificacoesAtivo')
      .vm.$emit('update:modelValue', false)
    await whatsapp.trigger('submit')
    expect(ContaRepository.parametros).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsappNotificacoesAtivo: false,
        whatsappNotificacoesInstanciaId: 2,
      }),
    )
    expect(vi.mocked(ContaRepository.parametros).mock.calls[0]?.[0]).not.toHaveProperty(
      'pushNotificacoesAtivo',
    )
    wrapper.unmount()
  })
})
