import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, type Component } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
import { saleItems, promotionalPrice, stockByUnit, stockStatus } from '../application/detailRecords'
const domain = vi.hoisted(() => ({
  read: vi.fn(),
  get: vi.fn(),
  variants: vi.fn(),
  receipt: vi.fn(),
  patch: vi.fn(),
}))
vi.mock('../adapters/domain', () => ({
  api: { read: domain.read, patch: domain.patch },
  products: { get: domain.get, variants: domain.variants },
  resolveFileUrl: (url: string) => url,
  VendaRepository: { getCupomPDF: domain.receipt },
}))
vi.mock('@/stores/ui/uiStore', () => ({
  useUiStore: () => ({ usuarioLogged: { id: 1, permissao: 'admin' } }),
}))
import SaleDetailPage from '../pages/SaleDetailPage.vue'
import ProductDetailPage from '../pages/ProductDetailPage.vue'
import RecordsTable from '../components/RecordsTable.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import { Select } from '@/components/ui/select'
const wrappers: ReturnType<typeof mount>[] = []
const combo = {
  id: 1,
  nomeSnapshot: 'Kit instalação',
  quantidade: 2,
  precoUnitarioSnapshot: '50.00',
}
const sale = () => ({
  id: 12,
  Uid: 'VEN_TESTE',
  status: 'FATURADO',
  faturado: true,
  valor: '190',
  desconto: '10',
  data: '2026-10-27T12:00:00',
  clienteId: 7,
  cliente: { nome: 'Cliente de exemplo' },
  vendedor: { nome: 'Vendedora de exemplo' },
  garantia: 90,
  observacoes: 'Entregar após as 14h.',
  ItensVendas: [{ id: 1, itemName: 'Instalação', quantidade: 1, valor: '100' }],
  ComboSaidas: [combo],
  PagamentoVendas: {
    metodo: 'OUTRO',
    valor: '190',
    status: 'EFETIVADO',
    data: '2026-10-27T12:00:00',
    detalhes: [
      { metodo: 'PIX', valor: 90 },
      { metodo: 'CREDIARIO', valor: 100 },
    ],
  },
  LancamentoFinanceiro: [
    {
      id: 5,
      descricao: 'Venda parcelada',
      valorTotal: '190',
      status: 'PARCIAL',
      parcelas: [
        { id: 1, valor: '90', pago: true },
        { id: 2, valor: '100', pago: false },
        { id: 3, valor: '999', pago: false, ignorado: true },
      ],
    },
  ],
})
const variant = (id: number, overrides = {}) => ({
  id,
  nomeVariante: `Variante ${id}`,
  status: 'ATIVO',
  preco: '40',
  precoCompra: null,
  estoque: '2.5',
  minimo: '3',
  controlaEstoque: true,
  unidade: 'kg',
  codigo: `SKU-${id}`,
  ...overrides,
})
async function open(component: Component, product = false) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: product ? '/modofacil/produtos/:produtoBaseId' : '/modofacil/vendas/:id', component },
      { path: '/modofacil/pessoas/:id', name: 'modofacil-pessoa', meta: { permissao: 2 }, component: { template: '<div />' } },
      { path: '/modofacil/financeiro/lancamentos/:id', name: 'modofacil-lancamento', meta: { permissao: 3 }, component: { template: '<div />' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(product ? '/modofacil/produtos/11' : '/modofacil/vendas/12')
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
            props: ['title', 'description'],
            template:
              '<div role="dialog"><h2>{{ title }}</h2><p>{{ description }}</p><slot /><slot name="footer" /></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, workspace }
}
const table = (wrapper: ReturnType<typeof mount>, caption: string) =>
  wrapper.findAllComponents(RecordsTable).find((t) => t.props('caption') === caption)!
beforeEach(() => {
  vi.clearAllMocks()
  domain.read.mockResolvedValue(sale())
  domain.get.mockResolvedValue({
    id: 11,
    nome: 'Café',
    Uid: 'PB_TESTE',
    status: 'ATIVO',
    Categoria: { nome: 'Alimentos' },
    descricao: 'Café em grãos',
    ncm: '0901',
    createdAt: '2026-10-27T12:00:00',
  })
  domain.variants.mockResolvedValue([
    variant(73, { nomeVariante: 'Tradicional', ncm: '0902' }),
    variant(74, {
      nomeVariante: 'Descafeinado',
      codigo: 'SKU-DECAF',
      estoque: 10,
      precoCompra: '0',
      precoPromocional: '30',
    }),
  ])
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('informações dos detalhes de vendas', () => {
  it('mostra valores, cliente, vendedor, garantia, pagamentos compostos e financeiro em aberto', async () => {
    const { wrapper } = await open(SaleDetailPage)
    expect(
      wrapper
        .getComponent(DetailMetrics)
        .props('metrics')
        .map((m) => m.value),
    ).toEqual(['R$ 190,00', 'R$ 200,00', 'R$ 10,00', '3'])
    expect(wrapper.text()).toContain('Vendedora de exemplo')
    expect(wrapper.text()).toContain('90 dia(s)')
    expect(wrapper.text()).toContain('Entregar após as 14h.')
    expect(wrapper.get('[href="/modofacil/pessoas/7"]').text()).toBe('Cliente de exemplo')
    expect(table(wrapper, 'Formas de pagamento da venda').text()).toContain('A prazo / crediário')
    expect(table(wrapper, 'Lançamentos vinculados à venda').text()).toContain('R$ 100,00')
    expect(wrapper.find('[href="/modofacil/financeiro/lancamentos/5"]').exists()).toBe(true)
    expect(table(wrapper, 'Itens da operação').props('rows')).toHaveLength(2)
  })
  it('busca e pagina os itens sem mudar o resumo geral', async () => {
    const data = sale()
    data.ItensVendas = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      itemName: `Item ${i + 1}`,
      quantidade: 1,
      valor: '10',
    }))
    data.ComboSaidas = []
    domain.read.mockResolvedValue(data)
    const { wrapper } = await open(SaleDetailPage)
    expect(table(wrapper, 'Itens da operação').props('rows')).toHaveLength(10)
    await wrapper.get('[aria-label="Próxima página"]').trigger('click')
    expect(table(wrapper, 'Itens da operação').props('rows')[0].itemName).toBe('Item 11')
    await wrapper.get('input[type=search]').setValue('23')
    expect(
      table(wrapper, 'Itens da operação')
        .props('rows')
        .map((r) => r.itemName),
    ).toEqual(['Item 23'])
    expect(wrapper.getComponent(DetailMetrics).props('metrics')[3].value).toBe('23')
  })
  it('mantém pagamento legado e não libera faturamento novamente para status FATURADO', async () => {
    domain.read.mockResolvedValue({
      ...sale(),
      faturado: false,
      PagamentoVendas: { metodo: 'PIX', valor: 190, status: 'EFETIVADO' },
    })
    const { wrapper } = await open(SaleDetailPage)
    expect(table(wrapper, 'Formas de pagamento da venda').props('rows')[0].valor).toBe(190)
    expect(wrapper.text()).not.toContain('Registrar recebimento e faturar')
    expect(wrapper.text()).toContain('Estornar faturamento')
  })
  it('mostra erro recuperável quando a venda não é encontrada', async () => {
    domain.read.mockResolvedValueOnce(null)
    const { wrapper } = await open(SaleDetailPage)
    expect(wrapper.text()).toContain('Venda não encontrada.')
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('VEN_TESTE')
  })
})
describe('informações dos detalhes de produtos', () => {
  it('ação de situação no detalhe recarrega produto e variantes após confirmar', async () => {
    const { wrapper } = await open(ProductDetailPage, true)
    await wrapper.get('[aria-label="Desativar produto Café"]').trigger('click')
    domain.patch.mockResolvedValueOnce({ id: 11, status: 'INATIVO' })
    domain.get.mockResolvedValueOnce({ id: 11, nome: 'Café', status: 'INATIVO' })
    domain.variants.mockResolvedValueOnce([variant(73, { status: 'INATIVO' })])
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Confirmar desativação')!
      .trigger('click')
    await flushPromises()
    expect(domain.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/produtos/11/status', {
      status: 'INATIVO',
    })
    expect(domain.get).toHaveBeenCalledTimes(2)
    expect(domain.variants).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[aria-label="Ativar produto Café"]').exists()).toBe(true)
    expect(table(wrapper, 'Variantes do produto').props('rows')[0].status).toBe('INATIVO')
  })
  it('busca pelo SKU e filtra variantes com estoque baixo', async () => {
    const { wrapper } = await open(ProductDetailPage, true)
    await wrapper.get('input[type=search]').setValue('sku-decaf')
    expect(
      table(wrapper, 'Variantes do produto')
        .props('rows')
        .map((r) => r.id),
    ).toEqual([74])
    await wrapper.get('input[type=search]').setValue('')
    wrapper
      .getComponent({ name: 'FormSelect' })
      .getComponent(Select)
      .vm.$emit('update:modelValue', JSON.stringify('BAIXO'))
    await flushPromises()
    expect(
      table(wrapper, 'Variantes do produto')
        .props('rows')
        .map((r) => r.id),
    ).toEqual([73])
    expect(wrapper.getComponent(DetailMetrics).props('metrics')[1].value).toBe('2')
  })
  it('separa os dados fiscais comuns dos dados da variante no diálogo', async () => {
    const { wrapper } = await open(ProductDetailPage, true)
    await wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'Ver dados da variante Tradicional')!
      .trigger('click')
    expect(wrapper.get('[role=dialog]').text()).toContain('Variante #73')
    expect(wrapper.get('[role=dialog]').text()).toContain('0902')
    expect(wrapper.get('[role=dialog]').text()).not.toContain('Dados fiscais comuns')
    expect(wrapper.get('[aria-label="Dados fiscais do produto"]').text()).toContain('0901')
  })
  it('preserva custo desconhecido, custo zero e preço promocional', async () => {
    const { wrapper } = await open(ProductDetailPage, true)
    const text = table(wrapper, 'Variantes do produto').text()
    expect(text).toContain('Não informado')
    expect(text).toContain('R$ 0,00')
    expect(text).toContain('R$ 30,00')
    expect(text).toContain('Em promoção')
  })
  it('pagina variantes e permite abrir a criação com o ID do produto', async () => {
    domain.variants.mockResolvedValue(Array.from({ length: 23 }, (_, i) => variant(i + 1)))
    const { wrapper, workspace } = await open(ProductDetailPage, true)
    await wrapper.get('[aria-label="Próxima página"]').trigger('click')
    expect(table(wrapper, 'Variantes do produto').props('rows')[0].id).toBe(11)
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Criar variante')!
      .trigger('click')
    expect(workspace.current.value?.target).toMatchObject({
      form: 'variante-nova',
      params: { produtoBaseId: 11 },
    })
  })
  it('falha de leitura não libera um produto sem as variantes', async () => {
    domain.variants.mockRejectedValueOnce(new Error('Falha ao consultar variantes'))
    const { wrapper } = await open(ProductDetailPage, true)
    expect(wrapper.text()).toContain('Falha ao consultar variantes')
    expect(wrapper.findComponent(DetailMetrics).exists()).toBe(false)
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(table(wrapper, 'Variantes do produto').props('rows')).toHaveLength(2)
  })
})
describe('dados comerciais e estoque', () => {
  it('não duplica o combo já registrado como item em uma venda da loja', () => {
    const existing = { id: 1, itemName: 'Kit instalação', quantidade: 2, valor: '50.00' }
    expect(saleItems({ ItensVendas: [existing], ComboSaidas: [combo] })).toEqual([existing])
    expect(
      saleItems({ ItensVendas: [existing], ComboSaidas: [combo, { ...combo, id: 2 }] }),
    ).toHaveLength(2)
  })
  it('não soma unidades diferentes e exclui estoque sem controle', () => {
    expect(
      stockByUnit([
        variant(1),
        variant(2, { estoque: 3, unidade: 'un' }),
        variant(3, { estoque: 999, controlaEstoque: false }),
      ]),
    ).toEqual([
      { unit: 'kg', value: 2.5 },
      { unit: 'un', value: 3 },
    ])
    expect(stockStatus(variant(1))).toBe('BAIXO')
    expect(stockStatus(variant(2, { controlaEstoque: false }))).toBe('SEM_CONTROLE')
  })
  it('só usa promoção positiva e menor que o preço normal', () => {
    expect(promotionalPrice(variant(1, { precoPromocional: '30' }))).toBe(30)
    for (const value of [null, 0, -1, 40, 50])
      expect(promotionalPrice(variant(1, { precoPromocional: value }))).toBeNull()
  })
})
