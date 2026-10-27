import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  receipt: vi.fn(),
  remove: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('../adapters/domain', () => ({
  api: { page: mocks.page, remove: mocks.remove },
  VendaRepository: { getCupomPDF: mocks.receipt },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
import SalesPage from '../pages/SalesPage.vue'
import RecordsTable from '../components/RecordsTable.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
import { Select } from '@/components/ui/select'
const wrappers: ReturnType<typeof mount>[] = []
const fixture = (overrides = {}) => ({
  id: 12,
  Uid: 'VEN-0012',
  status: 'PENDENTE',
  faturado: false,
  data: '2026-10-27T12:00:00',
  cliente: { nome: 'Cliente exemplo' },
  valor: 420,
  ...overrides,
})
beforeEach(() => {
  vi.resetAllMocks()
  mocks.ui.usuarioLogged.permissao = 'admin'
  mocks.page.mockResolvedValue({ rows: [fixture()], total: 1, pages: 1 })
  mocks.receipt.mockResolvedValue(undefined)
  mocks.remove.mockResolvedValue(undefined)
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
async function open(path = '/modofacil/vendas') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/vendas', component: SalesPage },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      attachTo: document.body,
      global: {
        plugins: [router],
        provide: { [modalWorkspaceKey as symbol]: workspace },
        stubs: {
          ModalView: {
            props: ['title'],
            template: '<div role="dialog"><h2>{{title}}</h2><slot/><slot name="footer"/></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, router, workspace }
}
async function menu(wrapper: ReturnType<typeof mount>, label = 'Ações da venda VEN-0012') {
  await wrapper.findAll(`[aria-label="${label}"]`)[0].trigger('keydown', { key: 'Enter' })
  await flushPromises()
}
const menuItem = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role=menuitem]')).find((e) =>
    e.textContent?.includes(text),
  )!
describe('lista compacta de vendas', () => {
  it('abre edição da venda correta mantendo o contexto e os filtros da lista', async () => {
    const { wrapper, router, workspace } = await open(
      '/modofacil/vendas?status=PENDENTE&search=cliente&page=2',
    )
    await wrapper.findAll('[aria-label="Editar venda VEN-0012"]')[0].trigger('click')
    expect(workspace.current.value?.target).toMatchObject({
      form: 'venda-editar',
      params: { id: 12 },
    })
    expect(workspace.current.value?.origin).toContain('search=cliente')
    expect(router.currentRoute.value.path).toBe('/modofacil/vendas')
    expect(wrapper.findAll('[aria-label="Ver venda VEN-0012"]')[0].attributes('href')).toBe(
      '/modofacil/vendas/12',
    )
    expect(wrapper.getComponent(RecordsTable).props('mobileLayout')).toBe('cards')
  })
  it('mantém o período ao buscar com situação e reinicia a paginação', async () => {
    const { wrapper } = await open('/modofacil/vendas?page=3&inicio=2026-10-01&fim=2026-10-31')
    await wrapper.get('input[type=search]').setValue('cliente')
    wrapper
      .getComponent({ name: 'FormSelect' })
      .getComponent(Select)
      .vm.$emit('update:modelValue', JSON.stringify('ORCAMENTO'))
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.page.mock.lastCall).toEqual([
      '/modofacil/vendas',
      { status: 'ORCAMENTO', page: 1, search: 'cliente', inicio: '2026-10-01', fim: '2026-10-31' },
    ])
  })
  it('menu do cabeçalho mantém caixa e abre orçamento com a opção correta', async () => {
    const { wrapper, workspace } = await open()
    await menu(wrapper, 'Operações de vendas')
    expect(menuItem('Abrir, movimentar ou fechar caixa').getAttribute('href')).toBe(
      '/modofacil/caixa',
    )
    menuItem('Preparar orçamento').click()
    await flushPromises()
    expect(workspace.current.value?.target).toMatchObject({
      form: 'venda-nova',
      query: { orcamento: '1' },
    })
  })
  it('abre cobrança vinculada à venda da linha', async () => {
    const { wrapper, workspace } = await open()
    await menu(wrapper)
    menuItem('Criar cobrança vinculada').click()
    await flushPromises()
    expect(workspace.current.value?.target).toMatchObject({
      form: 'financeiro-cobranca-nova',
      query: { tipo: 'venda', origem: 12 },
    })
  })
  it.each([
    { status: 'FATURADO', faturado: false },
    { status: 'PENDENTE', faturado: true },
    { status: 'CANCELADA' },
    { status: 'CANCELADO' },
  ])('respeita a situação financeira %j', async (state) => {
    mocks.page.mockResolvedValue({ rows: [fixture(state)], total: 1, pages: 1 })
    const { wrapper } = await open()
    const billed = state.status === 'FATURADO' || state.faturado === true
    expect(wrapper.find('[aria-label="Editar venda VEN-0012"]').exists()).toBe(!billed)
    await menu(wrapper)
    expect(menuItem('Criar cobrança')).toBeUndefined()
    expect(menuItem('Baixar comprovante')).toBeDefined()
  })
  it('vendedor pode editar e consultar, com ações financeiras restritas', async () => {
    mocks.ui.usuarioLogged.permissao = 'vendedor'
    const { wrapper } = await open()
    expect(wrapper.find('[aria-label="Editar venda VEN-0012"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Excluir venda VEN-0012"]').exists()).toBe(false)
    await menu(wrapper)
    expect(menuItem('Criar cobrança')).toBeUndefined()
  })
  it('preserva confirmação e atualização da lista na exclusão pelo ícone', async () => {
    const { wrapper } = await open()
    expect(wrapper.findAllComponents(DeleteRecord)[0].props('iconOnly')).toBe(true)
    await wrapper.findAll('[aria-label="Excluir venda VEN-0012"]')[0].trigger('click')
    expect(mocks.remove).not.toHaveBeenCalled()
    mocks.page.mockResolvedValueOnce({ rows: [], total: 0, pages: 1 })
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Confirmar exclusão')!
      .trigger('click')
    await flushPromises()
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith('/modofacil/vendas/12')
    expect(wrapper.text()).toContain('Nenhuma venda encontrada.')
  })
  it('comprovante usa a venda correta e bloqueia duplicação, com nova tentativa após falha', async () => {
    let reject!: (error: Error) => void
    mocks.receipt.mockImplementationOnce(
      () =>
        new Promise((_resolve, onReject) => {
          reject = onReject
        }),
    )
    const { wrapper } = await open()
    await menu(wrapper)
    menuItem('Baixar comprovante').click()
    await flushPromises()
    expect(mocks.receipt).toHaveBeenCalledExactlyOnceWith(12)
    expect(wrapper.get('[role=status]').text()).toContain('VEN-0012')
    await menu(wrapper)
    expect(menuItem('Baixar comprovante').getAttribute('aria-disabled')).toBe('true')
    menuItem('Baixar comprovante').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    reject(new Error('Comprovante indisponível'))
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('Comprovante indisponível')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Tentar novamente')!
      .trigger('click')
    await flushPromises()
    expect(mocks.receipt).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
  })
})
