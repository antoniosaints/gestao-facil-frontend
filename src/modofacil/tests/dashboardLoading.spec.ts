import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
const api = vi.hoisted(() => ({
  sales: vi.fn(),
  finance: vi.fn(),
  stock: vi.fn(),
  orders: vi.fn(),
  allowed: [2, 3, 4],
}))
vi.mock('../adapters/domain', () => ({
  api: { page: api.stock },
  VendaRepository: { painel: api.sales },
  LancamentosRepository: { getDashboardVisaoGeral: api.finance },
  OrdensServicoRepository: { getPainel: api.orders },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ({ usuarioLogged: { nome: 'Ana' } }) }))
vi.mock('@/hooks/authorize', () => ({
  hasPermission: (_user: unknown, level: number) => api.allowed.includes(level),
}))
import DashboardPage from '../pages/DashboardPage.vue'
import * as demo from './previewFixtures'
const wrappers: ReturnType<typeof mount>[] = []
function deferred() {
  let resolve!: (value: any) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
async function open() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil', component: DashboardPage },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/modofacil')
  const wrapper = mount(DashboardPage, { global: { plugins: [router] } })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
beforeEach(() => {
  vi.clearAllMocks()
  api.allowed = [2, 3, 4]
  api.sales.mockResolvedValue(demo.dashboard)
  api.finance.mockResolvedValue({ data: demo.financeSummary })
  api.stock.mockResolvedValue({ rows: [], total: 0 })
  api.orders.mockResolvedValue(demo.orderDashboard)
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('carregamento dos dados do dashboard', () => {
  it('mostra apenas o carregamento até a última consulta autorizada concluir', async () => {
    const sales = deferred(),
      stock = deferred()
    api.sales.mockReturnValue(sales.promise)
    api.stock.mockReturnValue(stock.promise)
    const wrapper = await open()
    expect(wrapper.get('[aria-label="Dashboard"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('[role=status]').text()).toContain('Preparando seu dashboard')
    expect(wrapper.find('[role=status] img').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
    sales.resolve(demo.dashboard)
    await flushPromises()
    expect(wrapper.find('h1').exists()).toBe(false)
    stock.resolve({ rows: [], total: 0 })
    await flushPromises()
    expect(wrapper.get('[aria-label="Dashboard"]').attributes('aria-busy')).toBe('false')
    expect(wrapper.find('[role=status]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Dashboard')
    expect(wrapper.text()).toContain('Vendas no período')
  })
  it('oculta os indicadores anteriores durante a atualização do período', async () => {
    const wrapper = await open()
    const pending = deferred()
    api.sales.mockReturnValueOnce(pending.promise)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.find('[role=status]').exists()).toBe(true)
    pending.resolve(demo.dashboard)
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Atualizado em')
  })
  it('encerra o carregamento em falha parcial, mostra o erro e permite tentar novamente', async () => {
    api.sales.mockRejectedValueOnce(new Error('Falha ao consultar vendas'))
    const wrapper = await open()
    expect(wrapper.find('[role=status]').exists()).toBe(false)
    expect(wrapper.get('[role=alert]').text()).toContain('Falha ao consultar vendas')
    expect(wrapper.text()).toContain('Ordens de serviço')
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Vendas no período')
  })
  it('não fica aguardando indicadores que o usuário não tem permissão para consultar', async () => {
    api.allowed = []
    const wrapper = await open()
    expect(api.sales).not.toHaveBeenCalled()
    expect(api.finance).not.toHaveBeenCalled()
    expect(api.stock).not.toHaveBeenCalled()
    expect(api.orders).not.toHaveBeenCalled()
    expect(wrapper.find('[role=status]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Dashboard')
  })
})
