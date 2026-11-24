import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
import type { Row } from '../adapters/domain'
const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  pdf: vi.fn(),
  settle: vi.fn(),
  reverse: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('../adapters/domain', () => ({
  api: { post: api.post },
  OrdensServicoRepository: {
    getDetalhes: api.get,
    getOsPdf: api.pdf,
    settle: api.settle,
    reverse: api.reverse,
  },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => api.ui }))
import OrderDetailPage from '../pages/OrderDetailPage.vue'
import RecordsTable from '../components/RecordsTable.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
const wrappers: ReturnType<typeof mount>[] = []
const fixture = (): Row => ({
  id: 15,
  Uid: 'OS_TESTE',
  status: 'APROVADA',
  data: '2026-10-27T12:00:00',
  createdAt: '2026-10-27T08:00:00',
  updatedAt: '2026-10-27T11:00:00',
  Cliente: { nome: 'Cliente exemplo' },
  clienteId: 7,
  Operador: { nome: 'Responsável exemplo' },
  garantia: '90',
  desconto: '10',
  descricaoCliente: 'Sem conexão no local',
  descricao: 'Verificar a instalação e o roteador',
  ItensOrdensServico: [
    { id: 1, itemName: 'Roteador', quantidade: 2, valor: '100', produtoId: 9, tipo: 'PRODUTO' },
    { id: 2, itemName: 'Instalação', quantidade: 1, valor: '50', servicoId: 4, tipo: 'SERVICO' },
    { id: 3, itemName: 'Kit suporte', quantidade: 1, valor: '80', tipo: 'SERVICO' },
  ],
  ComboSaidas: [{ id: 9, nomeSnapshot: 'Kit suporte', quantidade: 1, precoUnitarioSnapshot: '80' }],
  CobrancasFinanceiras: [
    {
      id: 21,
      Uid: 'COB_OS_TESTE',
      valor: '320',
      status: 'PENDENTE',
      dataVencimento: '2026-11-01T12:00:00',
    },
  ],
  MensagensInteracoesOrdemServico: [
    {
      id: 1,
      tipo: 'ABERTURA',
      data: '2026-10-27T08:00:00',
      Autor: { nome: 'Ana' },
      mensagem: 'Ordem recebida',
    },
    {
      id: 2,
      tipo: 'MENSAGEM',
      data: '2026-10-27T11:00:00',
      Autor: { nome: 'João' },
      mensagem: 'Conexão revisada',
    },
  ],
})
async function open() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/servicos/ordens/:id', component: OrderDetailPage },
      { path: '/modofacil/pessoas/:id', name: 'modofacil-pessoa', meta: { permissao: 2 }, component: { template: '<div />' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/modofacil/servicos/ordens/15')
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        provide: { [modalWorkspaceKey as symbol]: workspace },
        stubs: {
          ModalView: {
            props: ['title', 'description'],
            template:
              '<div role="dialog"><h2>{{ title }}</h2><p>{{ description }}</p><slot name="header-actions" /><slot /><slot name="footer" /></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, workspace }
}
const button = (w: ReturnType<typeof mount>, name: string) =>
  w.findAll('button').find((b) => b.text().trim() === name)!
const table = (w: ReturnType<typeof mount>, name: string) =>
  w.findAllComponents(RecordsTable).find((t) => t.props('caption') === name)!
beforeEach(() => {
  vi.clearAllMocks()
  api.ui.usuarioLogged.permissao = 'admin'
  api.get.mockResolvedValue(fixture())
  api.post.mockResolvedValue({})
  api.pdf.mockResolvedValue(undefined)
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('detalhes da ordem no padrão do Modo Fácil', () => {
  it('apresenta dados do atendimento e totais sem duplicar o snapshot do combo', async () => {
    const { wrapper } = await open()
    expect(
      wrapper
        .getComponent(DetailMetrics)
        .props('metrics')
        .map((m) => m.value),
    ).toEqual(['R$ 320,00', 'R$ 330,00', 'R$ 10,00', '4'])
    expect(table(wrapper, 'Itens da ordem de serviço').props('rows')).toHaveLength(3)
    expect(wrapper.text()).toContain('Responsável exemplo')
    expect(wrapper.text()).toContain('90 dia(s)')
    expect(wrapper.text()).toContain('Sem conexão no local')
    expect(wrapper.text()).toContain('Verificar a instalação e o roteador')
    expect(wrapper.get('[href="/modofacil/pessoas/7"]').text()).toBe('Cliente exemplo')
    expect(table(wrapper, 'Cobranças da ordem de serviço').text()).toContain('COB_OS_TESTE')
  })
  it('busca e pagina os itens mantendo os totais gerais', async () => {
    const data = fixture()
    data.ItensOrdensServico = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      itemName: `Instalação ${i + 1}`,
      quantidade: 1,
      valor: '10',
    }))
    data.ComboSaidas = []
    api.get.mockResolvedValue(data)
    const { wrapper } = await open()
    expect(table(wrapper, 'Itens da ordem de serviço').props('rows')).toHaveLength(10)
    await wrapper
      .get('[aria-labelledby="order-items-title"] [aria-label="Próxima página"]')
      .trigger('click')
    expect(table(wrapper, 'Itens da ordem de serviço').props('rows')[0].id).toBe(11)
    await wrapper.get('[aria-label="Buscar itens da OS"]').setValue('instalacao 23')
    expect(
      table(wrapper, 'Itens da ordem de serviço')
        .props('rows')
        .map((row) => row.id),
    ).toEqual([23])
    expect(wrapper.getComponent(DetailMetrics).props('metrics')[3].value).toBe('23')
  })
  it('ordena o histórico por data, pesquisa pelo autor e pagina atualizações', async () => {
    const data = fixture()
    data.MensagensInteracoesOrdemServico = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      tipo: 'MENSAGEM',
      data: '2026-10-27T12:00:00',
      Autor: { nome: i === 0 ? 'João' : 'Ana' },
      mensagem: `Atualização ${i + 1}`,
    }))
    api.get.mockResolvedValue(data)
    const { wrapper } = await open()
    expect(wrapper.findAll('ol[aria-label] li')).toHaveLength(10)
    expect(wrapper.findAll('ol[aria-label] li')[0].text()).toContain('Atualização 23')
    await wrapper
      .get('[aria-labelledby="order-history-title"] [aria-label="Próxima página"]')
      .trigger('click')
    expect(wrapper.findAll('ol[aria-label] li')[0].text()).toContain('Atualização 13')
    await wrapper.get('[aria-label="Buscar no histórico da OS"]').setValue('joao')
    expect(wrapper.findAll('ol[aria-label] li')).toHaveLength(1)
    expect(wrapper.findAll('ol[aria-label] li')[0].text()).toContain('Atualização 1')
  })
  it('pagina cobranças e cria o vínculo com a OS correta', async () => {
    const data = fixture()
    data.CobrancasFinanceiras = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      valor: 10,
      status: 'PENDENTE',
    }))
    api.get.mockResolvedValue(data)
    const { wrapper, workspace } = await open()
    expect(table(wrapper, 'Cobranças da ordem de serviço').props('rows')).toHaveLength(10)
    await wrapper
      .get('[aria-labelledby="order-charges-title"] [aria-label="Próxima página"]')
      .trigger('click')
    expect(table(wrapper, 'Cobranças da ordem de serviço').props('rows')[0].id).toBe(11)
    await button(wrapper, 'Criar cobrança vinculada').trigger('click')
    expect(workspace.current.value?.target).toMatchObject({
      form: 'financeiro-cobranca-nova',
      query: { tipo: 'os', origem: 15 },
    })
  })
  it('em OS faturada oferece estorno e preserva a consulta do PDF', async () => {
    api.get.mockResolvedValue({ ...fixture(), status: 'FATURADA' })
    const { wrapper } = await open()
    expect(button(wrapper, 'Editar ordem')).toBeUndefined()
    expect(button(wrapper, 'Criar cobrança vinculada')).toBeUndefined()
    expect(button(wrapper, 'Registrar recebimento e faturar')).toBeUndefined()
    expect(button(wrapper, 'Estornar faturamento')).toBeDefined()
    await button(wrapper, 'Baixar ordem em PDF').trigger('click')
    expect(api.pdf).toHaveBeenCalledExactlyOnceWith(15, 'OS_TESTE', false, true)
  })
  it('mantém a garantia textual e não mostra as operações financeiras sem permissão', async () => {
    api.ui.usuarioLogged.permissao = 'vendedor'
    api.get.mockResolvedValue({ ...fixture(), garantia: 'Conforme o fabricante' })
    const { wrapper } = await open()
    expect(wrapper.text()).toContain('Conforme o fabricante')
    expect(wrapper.find('[aria-labelledby="order-charges-title"]').exists()).toBe(false)
    expect(wrapper.find('[href="/modofacil/financeiro/cobrancas"]').exists()).toBe(false)
  })
  it.each(['   ', 'x'.repeat(192)])(
    'recusa uma nota vazia ou longa antes da revisão: %s',
    async (value) => {
      const { wrapper } = await open()
      await button(wrapper, 'Adicionar nota interna').trigger('click')
      await wrapper.get('textarea').setValue(value)
      await wrapper.get('form').trigger('submit')
      expect(wrapper.get('[role=alert]').text()).toContain('1 a 191 caracteres')
      expect(button(wrapper, 'Confirmar nota interna')).toBeUndefined()
      expect(api.post).not.toHaveBeenCalled()
    },
  )
  it('revisa a nota e envia uma única atualização, removendo os espaços externos', async () => {
    const data = fixture()
    api.get.mockImplementation(async () => structuredClone(data))
    api.post.mockImplementation(async () => {
      data.MensagensInteracoesOrdemServico.push({
        id: 3,
        tipo: 'MENSAGEM',
        data: '2026-10-27T13:00:00',
        mensagem: 'Teste final concluído',
        Autor: { nome: 'Ana' },
      })
      return {}
    })
    const { wrapper } = await open()
    await wrapper.get('[aria-label="Buscar no histórico da OS"]').setValue('João')
    await button(wrapper, 'Adicionar nota interna').trigger('click')
    await wrapper.get('textarea').setValue('  Teste final concluído  ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role=dialog]').text()).toContain('Confira a nota antes de registrar')
    expect(api.post).not.toHaveBeenCalled()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/modofacil/servicos/ordens/15/mensagens', {
      mensagem: 'Teste final concluído',
    })
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(
      (wrapper.get('[aria-label="Buscar no histórico da OS"]').element as HTMLInputElement).value,
    ).toBe('')
    expect(wrapper.findAll('ol[aria-label] li')[0].text()).toContain('Teste final concluído')
  })
  it('nota com resultado incerto mantém o diálogo e bloqueia repetição', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Resposta não confirmada' } },
    })
    const { wrapper } = await open()
    await button(wrapper, 'Adicionar nota interna').trigger('click')
    await wrapper.get('textarea').setValue('Conferir equipamento')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=dialog]').text()).toContain('Resposta não confirmada')
    expect(button(wrapper, 'Confirmar nota interna').element.matches(':disabled')).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledTimes(1)
  })
  it('recupera uma leitura ausente e apresenta estados vazios explícitos', async () => {
    api.get
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 15, status: 'CANCELADA', ItensOrdensServico: [], desconto: 0 })
    const { wrapper } = await open()
    expect(wrapper.text()).toContain('Ordem de serviço não encontrada.')
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Esta ordem não possui itens.')
    expect(wrapper.text()).toContain('Nenhuma atualização registrada nesta ordem.')
    expect(wrapper.text()).toContain('Nenhuma cobrança vinculada a esta ordem.')
    expect(button(wrapper, 'Registrar recebimento e faturar')).toBeUndefined()
  })
})
