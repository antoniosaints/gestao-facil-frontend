import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const toast = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

import { useUiStore } from '@/stores/ui/uiStore'
import { handleRouteGuard } from './useRouterControl'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  toast.info.mockClear()
})

describe('handleRouteGuard', () => {
  it('não carrega a sessão do ERP em rotas públicas da loja', async () => {
    const store = useUiStore()
    const getDataUsuario = vi.spyOn(store, 'getDataUsuario')

    const result = await handleRouteGuard(
      { name: 'loja-publica', path: '/lojas/minha-loja', meta: { isPublic: true } } as any,
      { name: undefined, path: '/', meta: {} } as any,
    )

    expect(result).toBe(true)
    expect(getDataUsuario).not.toHaveBeenCalled()
  })

  it('redireciona rota privada sem consultar whoami quando não há token', async () => {
    const store = useUiStore()
    const getDataUsuario = vi.spyOn(store, 'getDataUsuario')

    const result = await handleRouteGuard(
      { name: 'home', path: '/', meta: {} } as any,
      { name: undefined, path: '/login', meta: { isPublic: true } } as any,
    )

    expect(result).toEqual({ name: 'login' })
    expect(getDataUsuario).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledOnce()
  })

  it('permite ao superadmin abrir o modo CEO mesmo com a conta vencida', async () => {
    localStorage.setItem('gestao_facil:token', 'token-ceo')
    const store = useUiStore()
    vi.spyOn(store, 'getDataUsuario').mockImplementation(async () => {
      store.usuarioLogged = { superAdmin: true, permissao: 'root' } as any
      store.contaInfo = { vencimento: new Date(Date.now() - 60_000) } as any
    })

    const result = await handleRouteGuard(
      { name: 'admin-home', path: '/admin', meta: { permissao: 100 } } as any,
      { name: 'home', path: '/', meta: {} } as any,
    )

    expect(result).toBe(true)
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('mantém o bloqueio por vencimento fora do modo CEO', async () => {
    localStorage.setItem('gestao_facil:token', 'token-assinante')
    const store = useUiStore()
    vi.spyOn(store, 'getDataUsuario').mockImplementation(async () => {
      store.usuarioLogged = { superAdmin: false, permissao: 'root' } as any
      store.contaInfo = { vencimento: new Date(Date.now() - 60_000) } as any
    })

    const result = await handleRouteGuard(
      { name: 'home', path: '/', meta: {} } as any,
      { name: 'login', path: '/login', meta: { isPublic: true } } as any,
    )

    expect(result).toEqual({ name: 'assinatura-resumo' })
    expect(toast.info).toHaveBeenCalledWith(
      'Sua conta está inativa, realize o pagamento para ativá-la.',
    )
  })

  it('leva o entregador exclusivo direto para o Delivery', async () => {
    localStorage.setItem('gestao_facil:token', 'token-entregador')
    const store = useUiStore()
    vi.spyOn(store, 'getDataUsuario').mockImplementation(async () => {
      store.usuarioLogged = { superAdmin: false, permissao: '1' } as any
      store.contaInfo = { vencimento: new Date(Date.now() + 86_400_000) } as any
      store.restaurantAccess = { papeis: ['ENTREGADOR'], capabilities: [], fallbackLegado: false }
    })

    const result = await handleRouteGuard(
      { name: 'home', path: '/', meta: {} } as any,
      { name: 'login', path: '/login', meta: { isPublic: true } } as any,
    )

    expect(result).toEqual({ name: 'restaurante-entregador' })
  })

  it('mantém no sistema o usuário que também é garçom para escolher o modo', async () => {
    localStorage.setItem('gestao_facil:token', 'token-duplo')
    const store = useUiStore()
    vi.spyOn(store, 'getDataUsuario').mockImplementation(async () => {
      store.usuarioLogged = { superAdmin: false, permissao: '1' } as any
      store.contaInfo = { vencimento: new Date(Date.now() + 86_400_000) } as any
      store.restaurantAccess = {
        papeis: ['ENTREGADOR', 'GARCOM'],
        capabilities: ['SALAO_VISUALIZAR'],
        fallbackLegado: false,
      }
    })

    const result = await handleRouteGuard(
      { name: 'home', path: '/', meta: {} } as any,
      { name: 'login', path: '/login', meta: { isPublic: true } } as any,
    )

    expect(result).toBe(true)
  })
})
