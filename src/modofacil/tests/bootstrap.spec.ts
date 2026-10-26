import { beforeEach, describe, it, expect, vi } from 'vitest'
const { legacy, refresh, state } = vi.hoisted(() => ({
  legacy: vi.fn(),
  refresh: vi.fn(),
  state: { configuration: { modo: 'FACIL', versao: 1, podeAlterar: true }, error: '' },
}))
vi.mock('@/composables/useRouterControl', () => ({ handleRouteGuard: legacy }))
vi.mock('../application/experience', () => ({ refreshExperience: refresh, experience: state }))
import { registerModoFacilPolicy } from '../bootstrap'
let guard: any
beforeEach(() => {
  vi.clearAllMocks()
  legacy.mockResolvedValue(true)
  state.error = ''
  registerModoFacilPolicy({
    beforeEach: (callback: any) => {
      guard = callback
    },
  } as any)
})
describe('ordem das proteções existentes', () => {
  it.each([
    'login',
    'assinatura-resumo',
    'admin-home',
    'vendas-pdv',
    'restaurante-entregador',
    'loja-home',
  ])('respeita redirecionamento legado %s sem ler preferência', async (name) => {
    legacy.mockResolvedValue({ name })
    expect(await guard({ name: 'home', path: '/', meta: {} }, {})).toEqual({ name })
    expect(refresh).not.toHaveBeenCalled()
  })
  it('respeita navegação negada', async () => {
    legacy.mockResolvedValue(false)
    expect(await guard({ path: '/modofacil', meta: {} }, {})).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
  it('só mapeia após todas as proteções permitirem', async () => {
    expect(await guard({ name: 'home', path: '/', query: {}, meta: {} }, {})).toEqual({
      path: '/modofacil',
      query: {},
      replace: true,
    })
    expect(legacy.mock.invocationCallOrder[0]).toBeLessThan(refresh.mock.invocationCallOrder[0]!)
  })
  it('permite recuperação e expõe erro no shell sem fabricar NORMAL', async () => {
    state.error = 'offline'
    expect(await guard({ path: '/modofacil', meta: {} }, {})).toBe(true)
    expect(await guard({ path: '/configuracoes', meta: {} }, {})).toBe(true)
  })
})
