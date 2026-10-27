import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  pdf: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('../adapters/domain', () => ({
  api: { page: mocks.page },
  OrdensServicoRepository: { getOsPdf: mocks.pdf },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
import OrdersPage from '../pages/OrdersPage.vue'
import RecordsTable from '../components/RecordsTable.vue'
import { Select } from '@/components/ui/select'
const wrappers: ReturnType<typeof mount>[] = []
const fixture = (status = 'ABERTA', id = 15) => ({
  id,
  Uid: `OS-${id}`,
  status,
  data: '2026-10-27T12:00:00',
  Cliente: { nome: 'Cliente exemplo' },
  descricao: 'Descrição longa do atendimento para consultar nos detalhes.',
})
beforeEach(() => {
  vi.resetAllMocks()
  mocks.ui.usuarioLogged.permissao = 'admin'
  mocks.page.mockResolvedValue({ rows: [fixture()], total: 1, pages: 1 })
  mocks.pdf.mockResolvedValue(undefined)
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
async function open(path = '/modofacil/servicos/ordens') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/servicos/ordens', component: OrdersPage },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      attachTo: document.body,
      global: { plugins: [router], provide: { [modalWorkspaceKey as symbol]: workspace } },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, router, workspace }
}
async function menu(wrapper: ReturnType<typeof mount>, code = 'OS-15') {
  await wrapper
    .findAll(`[aria-label="Ações da ordem ${code}"]`)[0]
    .trigger('keydown', { key: 'Enter' })
  await flushPromises()
}
const menuItem = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role=menuitem]')).find((e) =>
    e.textContent?.includes(text),
  )!
describe('lista compacta de ordens de serviço', () => {
  it.each([
    {
      label: 'itens com desconto',
      record: {
        ItensOrdensServico: [
          { id: 1, quantidade: 2, valor: '100.00' },
          { id: 2, quantidade: 1, valor: '50.00' },
        ],
        desconto: '10.00',
      },
      expected: 'R$\u00a0240,00',
    },
    {
      label: 'valores decimais',
      record: { ItensOrdensServico: [{ id: 1, quantidade: 3, valor: '19.99' }], desconto: '0.07' },
      expected: 'R$\u00a059,90',
    },
    {
      label: 'ordem sem itens',
      record: {},
      expected: 'R$\u00a00,00',
    },
    {
      label: 'combos sem duplicar o item espelhado',
      record: {
        ItensOrdensServico: [{ id: 1, itemName: 'Kit', quantidade: 2, valor: '50' }],
        ComboSaidas: [
          { id: 10, nomeSnapshot: 'Kit', quantidade: 2, precoUnitarioSnapshot: '50' },
          { id: 11, nomeSnapshot: 'Outro kit', quantidade: 1, precoUnitarioSnapshot: '30' },
        ],
        desconto: '5',
      },
      expected: 'R$\u00a0125,00',
    },
  ])('exibe o total de $label na tabela e na apresentação móvel', async ({ record, expected }) => {
    mocks.page.mockResolvedValue({ rows: [{ ...fixture(), ...record }], total: 1, pages: 1 })
    const { wrapper } = await open()
    const table = wrapper.getComponent(RecordsTable)
    expect(table.props('columns')).toContainEqual({ key: 'value', label: 'Total', right: true })
    expect(table.get('tbody tr').findAll('td')[4].text()).toBe(expected)
    expect(table.get('ul').text()).toContain(expected)
  })
  it('abre detalhes e edição da ordem correta sem perder filtros da lista', async () => {
    const { wrapper, router, workspace } = await open(
      '/modofacil/servicos/ordens?status=ABERTA&search=rede&page=2',
    )
    await wrapper.findAll('[aria-label="Editar ordem OS-15"]')[0].trigger('click')
    expect(workspace.current.value?.target).toMatchObject({
      form: 'ordem-editar',
      params: { id: 15 },
    })
    expect(workspace.current.value?.origin).toContain('status=ABERTA')
    expect(router.currentRoute.value.path).toBe('/modofacil/servicos/ordens')
    expect(wrapper.findAll('[aria-label="Ver ordem OS-15"]')[0].attributes('href')).toBe(
      '/modofacil/servicos/ordens/15',
    )
    expect(wrapper.getComponent(RecordsTable).props('mobileLayout')).toBe('cards')
  })
  it('busca com filtro pesquisável preservando o contrato e reinicia a paginação', async () => {
    const { wrapper } = await open('/modofacil/servicos/ordens?page=3')
    await wrapper.get('input[type=search]').setValue('roteador')
    wrapper
      .getComponent({ name: 'FormSelect' })
      .getComponent(Select)
      .vm.$emit('update:modelValue', JSON.stringify('ANDAMENTO'))
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.page.mock.lastCall).toEqual([
      '/modofacil/servicos/ordens',
      { status: 'ANDAMENTO', page: 1, search: 'roteador' },
    ])
  })
  it('menu abre cobrança vinculada à OS e conserva o contexto da lista', async () => {
    const { wrapper, workspace } = await open()
    await menu(wrapper)
    menuItem('Criar cobrança vinculada').click()
    await flushPromises()
    expect(workspace.current.value?.target).toMatchObject({
      form: 'financeiro-cobranca-nova',
      query: { tipo: 'os', origem: 15 },
    })
    expect(document.querySelector('[role=menu]')).toBeNull()
  })
  it.each(['FATURADA', 'CANCELADA'])('não oferece cobrança para ordem %s', async (status) => {
    mocks.page.mockResolvedValue({ rows: [fixture(status)], total: 1, pages: 1 })
    const { wrapper } = await open()
    expect(wrapper.find('[aria-label="Editar ordem OS-15"]').exists()).toBe(status !== 'FATURADA')
    await menu(wrapper)
    expect(menuItem('Criar cobrança')).toBeUndefined()
    expect(menuItem('Baixar ordem em PDF')).toBeDefined()
  })
  it.each(['usuario', 'vendedor'])('respeita as permissões de %s', async (role) => {
    mocks.ui.usuarioLogged.permissao = role
    const { wrapper } = await open()
    expect(wrapper.find('[aria-label="Editar ordem OS-15"]').exists()).toBe(role === 'vendedor')
    await menu(wrapper)
    expect(menuItem('Criar cobrança')).toBeUndefined()
  })
  it('baixa o PDF da linha correta, bloqueia repetição e permite tentar novamente após falha', async () => {
    mocks.page.mockResolvedValue({ rows: [fixture('ABERTA', 22)], total: 1, pages: 1 })
    let reject!: (error: Error) => void
    mocks.pdf.mockImplementationOnce(
      () =>
        new Promise((_resolve, onReject) => {
          reject = onReject
        }),
    )
    const { wrapper } = await open()
    await menu(wrapper, 'OS-22')
    menuItem('Baixar ordem em PDF').click()
    await flushPromises()
    expect(mocks.pdf).toHaveBeenCalledExactlyOnceWith(22, 'OS-22', false, true)
    expect(wrapper.get('[role=status]').text()).toContain('OS-22')
    await menu(wrapper, 'OS-22')
    expect(menuItem('Baixar ordem em PDF').getAttribute('aria-disabled')).toBe('true')
    menuItem('Baixar ordem em PDF').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    reject(new Error('PDF indisponível'))
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('PDF indisponível')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Tentar novamente')!
      .trigger('click')
    await flushPromises()
    expect(mocks.pdf).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
  })
})
