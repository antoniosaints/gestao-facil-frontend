import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { h } from 'vue'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const api = vi.hoisted(() => ({
  page: vi.fn(),
  summary: vi.fn(),
  remove: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('@/stores/ui/uiStore', () => ({
  useUiStore: () => api.ui,
}))
vi.mock('../adapters/domain', () => ({
  api: { page: api.page, remove: api.remove },
  LancamentosRepository: { getDashboardVisaoGeral: api.summary },
}))
import FinancePage from '../pages/FinancePage.vue'
import { Select } from '@/components/ui/select'
const wrappers: ReturnType<typeof mount>[] = []
const menuItem = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role=menuitem]')).find((e) =>
    e.textContent?.includes(text),
  )!
async function openRecordMenu(wrapper: ReturnType<typeof mount>) {
  await wrapper
    .findAll('[aria-label="Ações do lançamento Compra de equipamentos"]')[0]
    .trigger('keydown', { key: 'Enter' })
  await flushPromises()
}
async function open(query = '') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/financeiro', component: FinancePage },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/modofacil/financeiro' + query)
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
beforeEach(() => {
  vi.clearAllMocks()
  api.ui.usuarioLogged.permissao = 'admin'
  api.remove.mockResolvedValue(undefined)
  api.page.mockResolvedValue({
    rows: [
      { id: 1, descricao: 'Lançamento anterior ao mês atual', tipo: 'RECEITA', valorTotal: 50 },
    ],
    total: 25,
    pages: 3,
  })
  api.summary.mockResolvedValue({ data: { cards: {} } })
})
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
describe('consulta financeira', () => {
  it('abre com todas as datas e preserva a página solicitada', async () => {
    const { wrapper } = await open('?page=2')
    expect(api.page).toHaveBeenCalledWith(
      '/modofacil/financeiro/lancamentos',
      expect.objectContaining({ inicio: undefined, fim: undefined, page: 2 }),
    )
    expect(wrapper.text()).toContain('Lançamento anterior ao mês atual')
    expect(wrapper.text()).toContain('Todas as datas')
  })
  it('honra período explícito e limpa todos os filtros', async () => {
    const { wrapper, router } = await open(
      '?inicio=2026-09-01&fim=2026-09-30&tipo=RECEITA&status=PAGO&search=teste&page=2',
    )
    expect(api.page).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        inicio: '2026-09-01',
        fim: '2026-09-30',
        tipo: 'RECEITA',
        status: 'PAGO',
        search: 'teste',
        page: 2,
      }),
    )
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Limpar filtros')!
      .trigger('click')
    await flushPromises()
    expect(api.page).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        inicio: undefined,
        fim: undefined,
        tipo: undefined,
        status: undefined,
        search: '',
        page: 1,
      }),
    )
    expect(router.currentRoute.value.query).toEqual({ page: '1' })
  })
  it('mantém registros visíveis quando o resumo falha ou é incompatível', async () => {
    api.summary.mockResolvedValue({ data: {} })
    const { wrapper } = await open()
    expect(wrapper.text()).toContain('Lançamento anterior ao mês atual')
    expect(wrapper.text()).toContain('Não foi possível carregar o resumo financeiro.')
  })
  it('recusa período invertido sem enviar nova consulta', async () => {
    const { wrapper } = await open()
    const dates = wrapper.findAll('input[type=date]')
    await dates[0]!.setValue('2026-10-31')
    await dates[1]!.setValue('2026-10-01')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.page).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('A data inicial deve ser anterior ou igual à data final.')
  })
})

const period = { inicio: '2026-10-01T03:00:00.000Z', fim: '2026-11-01T02:59:59.999Z' }
const metricButton = (wrapper: any, label: string) =>
  wrapper
    .findAll('button')
    .find((button: any) => button.attributes('aria-label')?.startsWith(`${label}:`))!
describe('ações compactas dos lançamentos', () => {
  beforeEach(() => {
    api.page.mockResolvedValue({
      rows: [
        {
          id: 5,
          descricao: 'Compra de equipamentos',
          tipo: 'DESPESA',
          status: 'PENDENTE',
          valorTotal: 420,
          categoria: { nome: 'Equipamentos' },
          vendaId: 12,
          ordemServicoId: 15,
        },
      ],
      total: 1,
      pages: 1,
    })
  })
  it('abre a edição correta sem perder o contexto da lista', async () => {
    const { wrapper, router, workspace } = await open('?search=compra&tipo=DESPESA&page=2')
    await wrapper
      .findAll('[aria-label="Editar lançamento Compra de equipamentos"]')[0]
      .trigger('click')
    expect(workspace.current.value?.target).toMatchObject({
      form: 'lancamento-editar',
      params: { id: 5 },
    })
    expect(workspace.current.value?.origin).toContain('search=compra')
    expect(router.currentRoute.value.path).toBe('/modofacil/financeiro')
    expect(
      wrapper.findAll('[aria-label="Ver lançamento Compra de equipamentos"]')[0].attributes('href'),
    ).toBe('/modofacil/financeiro/lancamentos/5')
  })
  it.each([
    ['Adicionar parcela', 'financeiro-parcela'],
    ['Organizar recorrência', 'financeiro-recorrencia'],
  ])('%s usa o lançamento selecionado', async (label, form) => {
    const { wrapper, workspace } = await open()
    await openRecordMenu(wrapper)
    menuItem(label).click()
    await flushPromises()
    expect(workspace.current.value?.target).toMatchObject({ form, params: { id: 5 } })
    expect(document.querySelector('[role=menu]')).toBeNull()
  })
  it('menu aponta para as operações de origem corretas', async () => {
    const { wrapper } = await open()
    await openRecordMenu(wrapper)
    expect(menuItem('Ver venda vinculada').getAttribute('href')).toBe('/modofacil/vendas/12')
    expect(menuItem('Ver OS vinculada').getAttribute('href')).toBe('/modofacil/servicos/ordens/15')
  })
  it('oculta mutações financeiras sem a permissão exigida', async () => {
    api.ui.usuarioLogged.permissao = 'vendedor'
    const { wrapper } = await open()
    expect(wrapper.find('[aria-label="Editar lançamento Compra de equipamentos"]').exists()).toBe(
      false,
    )
    expect(wrapper.find('[aria-label="Excluir lançamento Compra de equipamentos"]').exists()).toBe(
      false,
    )
    await openRecordMenu(wrapper)
    expect(menuItem('Adicionar parcela')).toBeUndefined()
    expect(menuItem('Organizar recorrência')).toBeUndefined()
    expect(menuItem('Ver venda vinculada')).toBeDefined()
  })
  it('exclusão pelo ícone exige confirmação e atualiza tabela e resumo preservando o filtro', async () => {
    api.summary.mockResolvedValue({ data: { periodo: period, cards: { aPagarPendente: 420 } } })
    const { wrapper } = await open('?resumo=A_PAGAR')
    await wrapper
      .findAll('[aria-label="Excluir lançamento Compra de equipamentos"]')[0]
      .trigger('click')
    expect(api.remove).not.toHaveBeenCalled()
    api.page.mockResolvedValueOnce({ rows: [], total: 0, pages: 1 })
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Confirmar exclusão')!
      .trigger('click')
    await flushPromises()
    expect(api.remove).toHaveBeenCalledExactlyOnceWith('/modofacil/financeiro/lancamentos/5')
    expect(api.page.mock.lastCall?.[1]).toMatchObject({
      resumo: 'A_PAGAR',
      tipo: 'DESPESA',
      status: 'PENDENTE',
    })
    expect(api.summary).toHaveBeenCalledTimes(2)
    expect(metricButton(wrapper, 'A pagar').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('Nenhum lançamento encontrado.')
  })
})
describe('cards como filtros da tabela', () => {
  beforeEach(() => {
    api.summary.mockResolvedValue({
      data: {
        periodo: period,
        cards: {
          receitasRealizadas: 50,
          despesasRealizadas: 20,
          aReceberPendente: 30,
          aPagarPendente: 10,
        },
      },
    })
    api.page.mockResolvedValue({
      rows: [
        {
          id: 1,
          descricao: 'Lançamento parcial',
          status: 'PARCIAL',
          valorTotal: 100,
          valorResumo: 50,
          parcelasResumo: 1,
        },
      ],
      total: 1,
      pages: 1,
    })
  })
  it.each([
    ['Recebido', 'RECEBIDO', 'RECEITA', 'PAGO'],
    ['Pago', 'PAGO', 'DESPESA', 'PAGO'],
    ['A receber', 'A_RECEBER', 'RECEITA', 'PENDENTE'],
    ['A pagar', 'A_PAGAR', 'DESPESA', 'PENDENTE'],
  ])(
    '%s filtra tipo e parcelas no período exato do resumo',
    async (label, resumo, tipo, status) => {
      const { wrapper, router } = await open('?search=antigo&page=2')
      await metricButton(wrapper, label).trigger('click')
      await flushPromises()
      expect(api.page).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ resumo, tipo, status, ...period, page: 1, search: '' }),
      )
      expect(api.summary).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.query).toMatchObject({ resumo, ...period, page: '1' })
      expect(metricButton(wrapper, label).attributes('aria-pressed')).toBe('true')
      expect(wrapper.text()).toContain('Valor no período')
      expect(wrapper.find('table').text()).toContain('R$ 50,00')
      expect(wrapper.find('table').text()).not.toContain('R$ 100,00')
    },
  )
  it('restaura o card ativo pelo endereço e mantém o filtro ao paginar', async () => {
    api.page.mockResolvedValue({ rows: [], total: 25, pages: 3 })
    const { wrapper } = await open(
      `?resumo=RECEBIDO&inicio=${encodeURIComponent(period.inicio)}&fim=${encodeURIComponent(period.fim)}&page=2`,
    )
    expect(metricButton(wrapper, 'Recebido').attributes('aria-pressed')).toBe('true')
    await wrapper.get('[aria-label="Próxima página"]').trigger('click')
    await flushPromises()
    expect(api.page).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        resumo: 'RECEBIDO',
        tipo: 'RECEITA',
        status: 'PAGO',
        page: 3,
        ...period,
      }),
    )
  })
  it('clicar novamente no card remove o filtro e volta para todas as datas', async () => {
    const { wrapper, router } = await open()
    await metricButton(wrapper, 'Recebido').trigger('click')
    await flushPromises()
    await metricButton(wrapper, 'Recebido').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ page: '1' })
    expect(wrapper.text()).toContain('Todas as datas')
    expect(metricButton(wrapper, 'Recebido').attributes('aria-pressed')).toBe('false')
  })
  it('alterar o tipo manualmente volta ao filtro normal de lançamentos', async () => {
    const { wrapper } = await open()
    await metricButton(wrapper, 'Recebido').trigger('click')
    await flushPromises()
    wrapper
      .findAllComponents({ name: 'FormSelect' })[0]!
      .getComponent(Select)
      .vm.$emit('update:modelValue', JSON.stringify('DESPESA'))
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.page).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ resumo: undefined, tipo: 'DESPESA' }),
    )
    expect(wrapper.find('table').text()).toContain('R$ 100,00')
  })
  it('cards indisponíveis não mudam a consulta existente', async () => {
    api.summary.mockResolvedValue({ data: { cards: {} } })
    const { wrapper } = await open()
    expect(metricButton(wrapper, 'Recebido').attributes('disabled')).toBeDefined()
    await metricButton(wrapper, 'Recebido').trigger('click')
    expect(api.page).toHaveBeenCalledTimes(1)
  })
  it('aceita o mesmo dia ao editar uma data após selecionar o resumo', async () => {
    const { wrapper } = await open()
    await metricButton(wrapper, 'Recebido').trigger('click')
    await flushPromises()
    await wrapper.findAll('input[type=date]')[1]!.setValue('2026-10-01')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.page).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ resumo: undefined, inicio: period.inicio, fim: '2026-10-01' }),
    )
    expect(wrapper.text()).not.toContain('A data inicial deve ser anterior')
  })
})
