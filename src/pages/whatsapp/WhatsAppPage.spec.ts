import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WhatsAppPage from './WhatsAppPage.vue'
import { WhatsAppRepository } from '@/repositories/whatsapp-repository'

vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ({
  hasActiveModule: (code: string) => code === 'whatsapp',
  loadAppModules: async () => {}, visibleMenuKeys: ['whatsapp'],
}) }))
vi.mock('@/composables/useSocketEvent', () => ({ useSocketEvent: vi.fn() }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: vi.fn() }) }))
vi.mock('vue-toastification', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))
vi.mock('@/repositories/whatsapp-repository', () => ({ WhatsAppRepository: {
  listInstances: vi.fn(), syncAllInstances: vi.fn(), listInstanceWebhookEvents: vi.fn(), retryInstanceWebhookEvent: vi.fn(),
} }))

const instance = { id: 42, nome: 'Comercial', instanceId: 'qa-instance', status: 'CONECTADA', ativo: true, pagamentos: [] }
let wrapper: ReturnType<typeof shallowMount>
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(WhatsAppRepository.listInstances).mockResolvedValue([instance] as any)
  vi.mocked(WhatsAppRepository.syncAllInstances).mockResolvedValue([instance] as any)
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })

async function openLogs() {
  wrapper = shallowMount(WhatsAppPage, { global: {
    renderStubDefaultSlot: true,
    directives: { tooltip: () => {} },
    stubs: { Button: { template: '<button><slot /></button>' } },
  } })
  await flushPromises()
  await wrapper.findAll('dropdown-menu-item-stub').find(item => item.text() === 'Logs de webhook')!.trigger('click')
  await flushPromises()
}

describe('consulta dos logs de webhook na página de instâncias', () => {
  it('mostra falha de consulta sem confundir com ausência de eventos e permite atualizar', async () => {
    vi.mocked(WhatsAppRepository.listInstanceWebhookEvents)
      .mockRejectedValueOnce({ response: { data: { message: 'Consulta indisponível no momento.' } } })
      .mockResolvedValueOnce([])
    await openLogs()
    expect(wrapper.text()).toContain('Consulta indisponível no momento.')
    expect(wrapper.text()).not.toContain('Nenhum evento de webhook registrado ainda.')
    const dialog = wrapper.findAll('dialog-stub').find(item => item.text().includes('Eventos recebidos da W-API para'))!
    await dialog.findAll('button').find(button => button.text() === 'Atualizar')!.trigger('click')
    await flushPromises()
    expect(WhatsAppRepository.listInstanceWebhookEvents).toHaveBeenLastCalledWith(42, { take: 50, tipo: undefined, status: undefined })
    expect(wrapper.text()).not.toContain('Consulta indisponível no momento.')
    expect(wrapper.text()).toContain('Nenhum evento de webhook registrado ainda.')
  })
  it('exibe os logs sem Atendimento e mantém reprocessamento indisponível', async () => {
    vi.mocked(WhatsAppRepository.listInstanceWebhookEvents).mockResolvedValue([{
      id: 7, tipo: 'received', eventId: 'qa-event', processado: false, status: 'FALHOU', tentativas: 1,
      erro: 'Falha de teste', payload: '{}', createdAt: '2026-11-19T12:00:00Z',
    }])
    await openLogs()
    await wrapper.findAll('button').find(button => button.text().includes('Mensagem recebida'))!.trigger('click')
    expect(wrapper.text()).toContain('Falha de teste')
    expect(wrapper.text()).not.toContain('Reprocessar')
    expect(WhatsAppRepository.retryInstanceWebhookEvent).not.toHaveBeenCalled()
  })
})
