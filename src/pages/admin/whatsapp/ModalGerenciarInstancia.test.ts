import { flushPromises, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ModalGerenciarInstancia from './ModalGerenciarInstancia.vue'
import { useAdminWhatsApp } from './useAdminWhatsApp'
import { WhatsAppRepository, type AdminWhatsAppInstance } from '@/repositories/whatsapp-repository'

vi.mock('@/repositories/whatsapp-repository', () => ({
  WhatsAppRepository: { adminInstanceAction: vi.fn(), syncAdminInstance: vi.fn() },
}))
vi.mock('vue-toastification', () => ({
  useToast: () => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}))

const instance = {
  id: 6, nome: 'Instância QA', instanceId: 'instance-qa', status: 'DESCONECTADA',
  ativo: true, tokenConfigurado: true,
  Conta: { id: 3, nome: 'Conta QA', email: 'qa@example.invalid', status: 'ATIVO' },
} as AdminWhatsAppInstance
const warning = 'Os dados do aparelho estão indisponíveis no momento.'
const panel = useAdminWhatsApp()

function open() {
  panel.openManage(instance)
  return shallowMount(ModalGerenciarInstancia, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        ModalView: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
        Button: { template: '<button><slot /></button>' },
      },
    },
  })
}

afterEach(() => {
  panel.closeManage()
  vi.resetAllMocks()
})

describe('feedback da consulta de aparelho no admin', () => {
  it('preserva o aviso após sincronizar e permite consultar o status em seguida', async () => {
    vi.mocked(WhatsAppRepository.adminInstanceAction).mockResolvedValueOnce({
      result: { available: false, reason: 'INSTANCE_NOT_PROVISIONED', message: warning },
      instance,
    })
    vi.mocked(WhatsAppRepository.syncAdminInstance).mockResolvedValue({ ...instance })
    const wrapper = open()
    try {
      const device = wrapper.findAll('button').find(button => button.text() === 'Aparelho')!
      await device.trigger('click')
      await flushPromises()
      await nextTick()
      expect(WhatsAppRepository.syncAdminInstance).toHaveBeenCalledWith(6)
      expect(wrapper.text()).toContain(warning)
      expect(wrapper.find('details').exists()).toBe(true)
      expect(device.attributes('disabled')).toBeUndefined()

      vi.mocked(WhatsAppRepository.adminInstanceAction).mockResolvedValueOnce({
        result: { connected: false }, instance,
      })
      await wrapper.findAll('button').find(button => button.text() === 'Status')!.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Status consultado com sucesso.')
      expect(wrapper.text()).not.toContain(warning)

      panel.closeManage()
      await nextTick()
      panel.openManage(instance)
      await nextTick()
      expect(wrapper.find('details').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })
})
