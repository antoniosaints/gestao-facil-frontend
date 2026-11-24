import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotasFiscaisRepository, type FiscalConfig } from '@/repositories/notas-fiscais-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import type { PermissaoUsuario } from '@/types/schemas'
import ModalVendas from './ModalVendas.vue'

vi.mock('@/repositories/notas-fiscais-repository', () => ({
  NotasFiscaisRepository: { getConfig: vi.fn() },
}))

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllEnvs())

const getConfig = vi.mocked(NotasFiscaisRepository.getConfig)

beforeEach(() => {
  getConfig.mockReset()
  getConfig.mockResolvedValue({ nfeHabilitado: true, nfceHabilitado: false } as FiscalConfig)
})

function mountSaleModal(permission: PermissaoUsuario = 'admin', active = true) {
  const pinia = createPinia()
  const ui = useUiStore(pinia)
  ui.usuarioLogged.permissao = permission
  ui.appModules = { 'notas-fiscais': active }
  const sales = useVendasStore(pinia)
  const wrapper = shallowMount(ModalVendas, {
    global: {
      plugins: [pinia],
      stubs: { ModalView: { props: ['open'], template: '<div v-if="open"><slot /></div>' } },
    },
  })
  return { wrapper, sales }
}

describe('configuração fiscal em Vendas', () => {
  it('ignora a configuração fiscal desativada inclusive ao criar uma venda', async () => {
    vi.stubEnv('VITE_NOTAS_FISCAIS_ENABLED', 'false')
    const { wrapper, sales } = mountSaleModal()

    sales.openSave()
    await flushPromises()

    expect(getConfig).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Documento fiscal')
  })

  it('consulta a configuração de homologação somente ao abrir uma nova venda', async () => {
    vi.stubEnv('VITE_NOTAS_FISCAIS_ENABLED', 'true')
    const { wrapper, sales } = mountSaleModal()
    expect(getConfig).not.toHaveBeenCalled()

    sales.openSave()
    await flushPromises()

    expect(getConfig).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Documento fiscal')
  })

  it('mantém o formulário disponível se a consulta fiscal falhar', async () => {
    vi.stubEnv('VITE_NOTAS_FISCAIS_ENABLED', 'true')
    getConfig.mockRejectedValueOnce(new Error('Configuração indisponível'))
    const { wrapper, sales } = mountSaleModal()

    sales.openSave()
    await flushPromises()

    expect(getConfig).toHaveBeenCalledOnce()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Documento fiscal')
  })

  it.each<[PermissaoUsuario, boolean]>([
    ['vendedor', true],
    ['admin', false],
  ])('omite a configuração para permissão %s e app ativo %s', async (permission, active) => {
    vi.stubEnv('VITE_NOTAS_FISCAIS_ENABLED', 'true')
    const { wrapper, sales } = mountSaleModal(permission, active)

    sales.openSave()
    await flushPromises()

    expect(getConfig).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Documento fiscal')
  })
})
