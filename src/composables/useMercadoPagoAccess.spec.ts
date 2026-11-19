import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ active: false, loaded: true, mode: 'NENHUM', status: vi.fn(), load: vi.fn() }))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ({ get appModulesLoaded() { return mocks.loaded }, hasActiveModule: () => mocks.active, loadAppModules: mocks.load }) }))
vi.mock('@/repositories/conta-repository', () => ({ ContaRepository: { statusMercadoPago: mocks.status } }))
import { useMercadoPagoAccess } from './useMercadoPagoAccess'
beforeEach(() => { vi.clearAllMocks(); mocks.active = false; mocks.loaded = true; mocks.load.mockResolvedValue({}); mocks.status.mockResolvedValue({ modo: 'NENHUM' }) })
describe('pré-requisitos do Mercado Pago', () => {
  it('não consulta credenciais nem libera cobranças sem o app instalado', async () => {
    const access = useMercadoPagoAccess(); await access.refresh()
    expect(access.ready.value).toBe(false); expect(access.failed.value).toBe(false)
    expect(mocks.status).not.toHaveBeenCalled()
  })
  it('exige configuração mesmo depois de instalar o app', async () => {
    mocks.active = true
    const access = useMercadoPagoAccess(); await access.refresh()
    expect(access.ready.value).toBe(false)
    mocks.status.mockResolvedValue({ modo: 'OAUTH' }); await access.refresh()
    expect(access.ready.value).toBe(true)
    mocks.status.mockResolvedValue({ modo: 'API_KEY' }); await access.refresh()
    expect(access.ready.value).toBe(true)
  })
  it('trata falha de consulta como erro recuperável sem sugerir app desinstalado', async () => {
    mocks.loaded = false
    const access = useMercadoPagoAccess(); await access.refresh()
    expect(access.failed.value).toBe(true); expect(access.ready.value).toBe(false)
    expect(mocks.status).not.toHaveBeenCalled()
  })
})
