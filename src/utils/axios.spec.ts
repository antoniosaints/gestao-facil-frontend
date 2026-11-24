import { AxiosError, type AxiosAdapter } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appAccessPrompt } from '@/composables/useAppAccessPrompt'
import http from './axios'

vi.mock('@/stores/login/useAuthStore', () => ({ useAuthStore: () => ({}) }))
vi.mock('vue-toastification', () => ({ useToast: () => ({}) }))

function rejectedRequest(code: string): AxiosAdapter {
  return async (config) => {
    throw new AxiosError('App indisponível', undefined, config, undefined, {
      status: 403,
      statusText: 'Forbidden',
      data: { error: { code } },
      headers: {},
      config,
    })
  }
}

beforeEach(() => {
  localStorage.setItem('gestao_facil:token', 'token-test')
  appAccessPrompt.value = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('aviso de acesso a apps', () => {
  it('repassa erros de consultas de fundo sem abrir o aviso, inclusive em consultas POST', async () => {
    vi.stubEnv('VITE_NOTAS_FISCAIS_ENABLED', 'true')
    const fiscal = rejectedRequest('notas_fiscais_module_inactive')
    const whatsapp = rejectedRequest('whatsapp_module_inactive')

    await expect(http.get('/v1/notas-fiscais/configuracao', { adapter: fiscal })).rejects.toThrow()
    await expect(http.post('/consulta', {}, { adapter: whatsapp })).rejects.toThrow()
    expect(appAccessPrompt.value).toBeNull()
  })

  it('oferece configuração quando a ação solicitou o aviso', async () => {
    const adapter = rejectedRequest('whatsapp_notification_instance_required')

    await expect(http.post('/enviar', {}, { adapter, showAppAccessPrompt: true })).rejects.toThrow()
    expect(appAccessPrompt.value).toMatchObject({ app: 'whatsapp', kind: 'configuration' })
  })

  it('oculta o aviso fiscal mesmo quando a ação opta pelo diálogo', async () => {
    vi.stubEnv('VITE_NOTAS_FISCAIS_ENABLED', 'false')
    const adapter = rejectedRequest('notas_fiscais_module_inactive')

    await expect(http.post('/emitir', {}, { adapter, showAppAccessPrompt: true })).rejects.toThrow()
    expect(appAccessPrompt.value).toBeNull()
  })
})
