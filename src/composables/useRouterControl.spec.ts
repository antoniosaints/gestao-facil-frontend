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
})
