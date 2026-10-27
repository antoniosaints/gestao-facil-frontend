import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, provide, type Component } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
import { deletionScopeKey } from '../application/deletionScope'
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  page: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('../adapters/domain', () => ({
  api: { read: mocks.read, patch: mocks.patch, remove: mocks.remove, page: mocks.page },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
import PeoplePage from '../pages/PeoplePage.vue'
import PersonDetailPage from '../pages/PersonDetailPage.vue'
import PersonStatusAction from '../components/PersonStatusAction.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
import PersonHistory from '../components/PersonHistory.vue'
import RecordsTable from '../components/RecordsTable.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
const wrappers: ReturnType<typeof mount>[] = []
const fixture = () => ({
  id: 1,
  Uid: 'CLI_001',
  nome: 'Ana Exemplo',
  tipo: 'CLIENTE',
  status: 'ATIVO',
  telefone: '11999990000',
  email: 'ana@exemplo.test',
  whastapp: '11999990000',
  documento: '52998224725',
  endereco: 'Rua Um',
  numero: '12',
  bairro: 'Centro',
  cidade: 'Londrina',
  estado: 'PR',
  cep: '86000000',
  observacaos: 'Atender no período da manhã.',
  ie: 'ISENTO',
  im: '123',
  municipio: '4113700',
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-10-27T10:00:00',
})
let person = fixture()
async function open(component: Component, path = '/modofacil/pessoas/1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/pessoas/:id', component },
      {
        path: '/modofacil/pessoas',
        component: path.includes('/1') ? { template: '<div>Lista de pessoas</div>' } : component,
      },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        provide: { [modalWorkspaceKey as symbol]: workspace },
        stubs: {
          ModalView: {
            props: ['title'],
            template:
              '<div role="dialog"><h2>{{title}}</h2><slot name="header-actions"/><slot/><slot name="footer"/></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, router, workspace }
}
const button = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text().trim() === text)!
const readHistory = (items: any[] = []) => ({ items, meta: { total: items.length, totalPages: 1 } })
beforeEach(() => {
  vi.resetAllMocks()
  person = fixture()
  mocks.ui.usuarioLogged.permissao = 'admin'
  mocks.read.mockImplementation(async (path: string) =>
    path.endsWith('/estatisticas')
      ? { financeiro: { recebido: 100, pago: 50, pendenteReceber: 30, pendentePagar: 10 } }
      : path.endsWith('/historico')
        ? readHistory()
        : structuredClone(person),
  )
  mocks.page.mockImplementation(async (_path: string, params: any) => ({
    rows: params.status && params.status !== person.status ? [] : [structuredClone(person)],
    total: 1,
    pages: 1,
  }))
  mocks.patch.mockImplementation(async (_path: string, body: any) => {
    Object.assign(person, body)
    return person
  })
  mocks.remove.mockResolvedValue(undefined)
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('pessoas no Modo Fácil', () => {
  it.each([
    ['ATIVO', 'Desativar', 'Confirmar desativação', 'INATIVO'],
    ['INATIVO', 'Ativar', 'Confirmar ativação', 'ATIVO'],
  ])(
    'altera %s somente após confirmar, preservando o restante do cadastro',
    async (status, label, confirm, target) => {
      person.status = status
      const { wrapper } = await open({ render: () => h(PersonStatusAction, { record: person }) })
      await button(wrapper, label).trigger('click')
      expect(mocks.patch).not.toHaveBeenCalled()
      await button(wrapper, confirm).trigger('click')
      await flushPromises()
      expect(mocks.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/pessoas/1/basico', {
        status: target,
      })
      expect(wrapper.getComponent(PersonStatusAction).emitted('changed')).toHaveLength(1)
    },
  )
  it('cancelamento da ação rápida conserva o status sem envio', async () => {
    const { wrapper } = await open({ render: () => h(PersonStatusAction, { record: person }) })
    await button(wrapper, 'Desativar').trigger('click')
    await button(wrapper, 'Cancelar').trigger('click')
    expect(person.status).toBe('ATIVO')
    expect(mocks.patch).not.toHaveBeenCalled()
  })
  it('compartilha o bloqueio de resposta incerta entre ativação e exclusão, inclusive após fechar o diálogo', async () => {
    const component = {
      setup() {
        provide(deletionScopeKey, new Map())
        return () =>
          h('div', [
            h(PersonStatusAction, { record: person }),
            h(DeleteRecord, { kind: 'person', record: person }),
          ])
      },
    }
    mocks.patch.mockRejectedValueOnce(new Error('Resposta interrompida'))
    const { wrapper } = await open(component)
    await button(wrapper, 'Desativar').trigger('click')
    await button(wrapper, 'Confirmar desativação').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('resultado pode ter sido registrado')
    expect(button(wrapper, 'Excluir').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Cancelar').trigger('click')
    expect(button(wrapper, 'Desativar').attributes('disabled')).toBeDefined()
    expect(mocks.patch).toHaveBeenCalledTimes(1)
  })
  it('usa linhas compactas e atualiza a tabela após desativar com filtro de ativos', async () => {
    const { wrapper } = await open(PeoplePage, '/modofacil/pessoas?status=ATIVO')
    const table = wrapper.getComponent(RecordsTable)
    expect(table.attributes('class')).toContain('[&_td]:!py-2')
    expect(table.props('rows')).toHaveLength(1)
    await wrapper.findAllComponents(PersonStatusAction)[0].get('button').trigger('click')
    await button(wrapper, 'Confirmar desativação').trigger('click')
    await flushPromises()
    expect(mocks.page).toHaveBeenLastCalledWith(
      '/modofacil/pessoas',
      expect.objectContaining({ status: 'ATIVO' }),
    )
    expect(table.props('rows')).toHaveLength(0)
  })
  it('apresenta os dados completos, resumo financeiro e ações do cadastro', async () => {
    const { wrapper, workspace } = await open(PersonDetailPage)
    for (const value of [
      'Ana Exemplo',
      'Rua Um, 12',
      'Londrina / PR',
      '52998224725',
      'ISENTO',
      'Atender no período da manhã.',
    ])
      expect(wrapper.text()).toContain(value)
    expect(
      wrapper
        .getComponent(DetailMetrics)
        .props('metrics')
        .map((m) => m.value),
    ).toEqual(['R$ 100,00', 'R$ 50,00', 'R$ 30,00', 'R$ 10,00'])
    expect(wrapper.find('a[href="mailto:ana@exemplo.test"]').exists()).toBe(true)
    expect(wrapper.find('a[href="https://wa.me/5511999990000"]').exists()).toBe(true)
    await button(wrapper, 'Editar pessoa').trigger('click')
    expect(workspace.current.value?.target).toEqual({
      form: 'pessoa-editar',
      params: { id: 1 },
      query: {},
    })
  })
  it('oculta valores e histórico financeiro de quem só possui permissão de cadastro', async () => {
    mocks.ui.usuarioLogged.permissao = 'vendedor'
    const { wrapper } = await open(PersonDetailPage)
    expect(wrapper.findComponent(DetailMetrics).exists()).toBe(false)
    expect(wrapper.findComponent(PersonHistory).exists()).toBe(false)
    expect(mocks.read.mock.calls.map((c) => c[0])).toEqual(['/modofacil/pessoas/1'])
  })
  it('recupera pessoa ausente sem mostrar um cadastro vazio', async () => {
    mocks.read.mockResolvedValueOnce(null)
    const { wrapper } = await open(PersonDetailPage)
    expect(wrapper.text()).toContain('Pessoa não encontrada.')
    expect(wrapper.findComponent(PersonStatusAction).exists()).toBe(false)
    await button(wrapper, 'Tentar novamente').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Ana Exemplo')
  })
  it('falha do resumo não oculta os dados e pode ser recuperada separadamente', async () => {
    mocks.read.mockImplementation(async (path: string) => {
      if (path.endsWith('/estatisticas')) throw new Error('Resumo indisponível')
      return path.endsWith('/historico') ? readHistory() : person
    })
    const { wrapper } = await open(PersonDetailPage)
    expect(wrapper.text()).toContain('Ana Exemplo')
    expect(wrapper.text()).toContain('Resumo indisponível')
    mocks.read.mockResolvedValueOnce({
      financeiro: { recebido: 0, pago: 0, pendenteReceber: 0, pendentePagar: 0 },
    })
    await button(wrapper, 'Tentar novamente').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent(DetailMetrics).props('metrics')[0].value).toBe('R$ 0,00')
  })
  it('histórico mostra o valor registrado da venda e o total calculado da OS com desconto', async () => {
    mocks.read.mockImplementation(async (_path: string, params: any) =>
      params.tab === 'ordens'
        ? readHistory([
            {
              id: 2,
              Uid: 'OS_2',
              status: 'ABERTA',
              data: '2026-10-27',
              desconto: 10,
              ItensOrdensServico: [{ quantidade: 2, valor: 60 }],
            },
          ])
        : readHistory([
            {
              id: 1,
              Uid: 'VEN_1',
              status: 'FATURADO',
              valor: 70,
              desconto: 10,
              data: '2026-10-27',
            },
          ]),
    )
    const { wrapper } = await open({ render: () => h(PersonHistory, { personId: 1 }) })
    expect(wrapper.getComponent(RecordsTable).text()).toMatch(/R\$\s*70,00/)
    wrapper.getComponent({ name: 'FormSelect' }).vm.$emit('update:modelValue', 'ordens')
    await flushPromises()
    expect(wrapper.getComponent(RecordsTable).text()).toMatch(/R\$\s*110,00/)
    expect(mocks.read).toHaveBeenLastCalledWith(
      '/modofacil/pessoas/1/historico',
      expect.objectContaining({ tab: 'ordens', page: 1 }),
    )
  })
  it('ignora resposta antiga após trocar a categoria do histórico', async () => {
    let finish!: (value: any) => void
    mocks.read
      .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
      .mockResolvedValueOnce(
        readHistory([{ id: 2, Uid: 'OS_NOVA', status: 'ABERTA', ItensOrdensServico: [] }]),
      )
    const { wrapper } = await open({ render: () => h(PersonHistory, { personId: 1 }) })
    wrapper.getComponent({ name: 'FormSelect' }).vm.$emit('update:modelValue', 'ordens')
    await flushPromises()
    finish(readHistory([{ id: 1, Uid: 'VEN_ANTIGA', valor: 100 }]))
    await flushPromises()
    expect(wrapper.text()).toContain('OS_NOVA')
    expect(wrapper.text()).not.toContain('VEN_ANTIGA')
  })
})
