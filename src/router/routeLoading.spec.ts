import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  createMemoryHistory,
  createRouter,
  isNavigationFailure,
  NavigationFailureType,
} from 'vue-router'
import { registerRouteLoading } from './routeLoading'

const page = { template: '<main />' }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}

async function openAccount(usesAnimatedLoading = () => true) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/produtos', component: page },
      { path: '/clientes', component: page },
      { path: '/login', component: page, meta: { isPublic: true } },
    ],
  })
  const loading = registerRouteLoading(router, usesAnimatedLoading)
  await router.push('/')
  return { router, loading }
}

describe('carregamento animado de rotas', () => {
  it('começa antes da guarda da conta e termina após resolver a página de destino', async () => {
    const { router, loading } = await openAccount()
    const guard = deferred<void>()
    const destination = deferred<typeof page>()
    router.addRoute({ path: '/vendas', component: () => destination.promise })
    router.beforeEach(() => {
      expect(loading.value).toBe(true)
      return guard.promise
    })

    const navigation = router.push('/vendas')
    await flushPromises()
    expect(loading.value).toBe(true)
    guard.resolve()
    await flushPromises()
    expect(loading.value).toBe(true)
    expect(router.currentRoute.value.path).toBe('/')
    destination.resolve(page)
    await navigation

    expect(router.currentRoute.value.path).toBe('/vendas')
    expect(loading.value).toBe(false)
  })

  it('preserva o indicador atual e ignora alterações de filtro e páginas públicas', async () => {
    let animated = false
    const { router, loading } = await openAccount(() => animated)
    router.beforeEach(() => {
      expect(loading.value).toBe(false)
    })
    await router.push('/produtos')

    animated = true
    await router.push('/produtos?page=2')
    await router.push('/login')
    await router.push('/')
  })

  it('mantém a indicação da navegação mais recente quando a anterior é cancelada', async () => {
    const { router, loading } = await openAccount()
    const firstGuard = deferred<void>()
    const secondGuard = deferred<void>()
    router.beforeEach((to) => (to.path === '/produtos' ? firstGuard.promise : secondGuard.promise))

    const first = router.push('/produtos')
    await flushPromises()
    const second = router.push('/clientes')
    await flushPromises()
    firstGuard.resolve()
    expect(isNavigationFailure(await first, NavigationFailureType.cancelled)).toBe(true)
    expect(loading.value).toBe(true)

    secondGuard.resolve()
    await second
    expect(loading.value).toBe(false)
  })

  it('encerra após recusa, redirecionamento para a página atual ou erro', async () => {
    const { router, loading } = await openAccount()
    const error = new Error('Falha na navegação')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    router.beforeEach((to) => {
      expect(loading.value).toBe(true)
      switch (to.query.resultado) {
        case 'recusa':
          return false
        case 'redirecionamento':
          return '/'
        default:
          throw error
      }
    })

    try {
      await router.push('/produtos?resultado=recusa')
      expect(loading.value).toBe(false)
      await router.push('/produtos?resultado=redirecionamento')
      expect(loading.value).toBe(false)
      await expect(router.push('/produtos')).rejects.toBe(error)
      expect(loading.value).toBe(false)
    } finally {
      log.mockRestore()
    }
  })
})
