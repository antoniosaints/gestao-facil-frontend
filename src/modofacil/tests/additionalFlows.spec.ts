import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { h } from 'vue'
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  saleCreate: vi.fn(),
  finalize: vi.fn(),
  saleReverse: vi.fn(),
  saleSettle: vi.fn(),
  pay: vi.fn(),
  partReverse: vi.fn(),
  orderGet: vi.fn(),
  orderSettle: vi.fn(),
  orderReverse: vi.fn(),
  context: vi.fn(),
  serviceSave: vi.fn(),
  ui: {
    usuarioLogged: { id: 1, permissao: 'admin' },
    vendaLancamentoAutomatico: false,
    osLancamentoAutomatico: false,
  },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
vi.mock('../adapters/domain', () => ({
  api: { read: mocks.read },
  VendaRepository: {
    create: mocks.saleCreate,
    finalizarVendaPdv: mocks.finalize,
    reverse: mocks.saleReverse,
    settle: mocks.saleSettle,
  },
  CaixaRepository: { contexto: mocks.context },
  LancamentosRepository: { pagarParcela: mocks.pay, reverse: mocks.partReverse },
  OrdensServicoRepository: {
    getDetalhes: mocks.orderGet,
    settle: mocks.orderSettle,
    reverse: mocks.orderReverse,
  },
  ServicoRepository: { saveOrUpdate: mocks.serviceSave },
}))
import SaleFormPage from '../pages/SaleFormPage.vue'
import SaleDetailPage from '../pages/SaleDetailPage.vue'
import FinanceDetailPage from '../pages/FinanceDetailPage.vue'
import OrderDetailPage from '../pages/OrderDetailPage.vue'
import ServiceFormPage from '../pages/ServiceFormPage.vue'
const wrappers: any[] = []
async function page(component: any, path: string, pattern: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: pattern, component },
      { path: '/:pathMatch(.*)*', component: { template: '<div>Lista</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const w = mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        stubs: {
          ModalView: {
            props: ['title', 'description'],
            template:
              '<div role="dialog"><h2>{{ title }}</h2><p>{{ description }}</p><slot /><slot name="footer" /></div>',
          },
          ItemComposer: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: `<button type="button" @click="$emit('update:modelValue',[{id:9,nome:'Produto exemplo',tipo:'PRODUTO',quantidade:2,preco:50}])">Incluir item de exemplo</button>`,
          },
          ItemSearch: {
            emits: ['select'],
            template: `<button type="button" @click="$emit('select',{id:4,nome:'Cliente exemplo'})">Escolher cliente exemplo</button>`,
          },
        },
      },
    },
  )
  wrappers.push(w)
  await flushPromises()
  return w
}
const button = (w: any, text: string) => w.findAll('button').find((b: any) => b.text() === text)!
const input = (w: any, label: string) =>
  w
    .findAll('label')
    .find((l: any) => l.text().trim().startsWith(label))!
    .find('input')
const select = (w: any, label: string) =>
  w
    .findAll('label')
    .find((l: any) => l.text().trim().startsWith(label))!
    .find('select')
beforeEach(() => {
  vi.clearAllMocks()
  mocks.context.mockResolvedValue({
    caixaAtivo: { id: 7, codigo: 'CX exemplo' },
    caixasAbertos: [],
    pdvs: [],
  })
  mocks.finalize.mockResolvedValue({ id: 12 })
  mocks.saleCreate.mockResolvedValue({ id: 13 })
  mocks.orderSettle.mockResolvedValue({})
  mocks.orderReverse.mockResolvedValue({})
  mocks.saleReverse.mockResolvedValue({})
  mocks.pay.mockResolvedValue({})
  mocks.partReverse.mockResolvedValue({})
  mocks.serviceSave.mockResolvedValue({})
  mocks.read.mockImplementation(async (path: string) =>
    path.includes('/contas')
      ? [{ id: 2, nome: 'Conta exemplo' }]
      : path.includes('/categorias')
        ? [{ id: 3, nome: 'Categoria exemplo' }]
        : path.includes('/financeiro/lancamentos/')
          ? {
              id: 5,
              descricao: 'Conta de exemplo',
              valorTotal: 100,
              contasFinanceiroId: 2,
              parcelas: [{ id: 8, numero: 1, valor: 100, pago: false }],
            }
          : path.includes('/servicos/')
            ? {
                id: 6,
                nome: 'Serviço existente',
                preco: 50,
                descricao: 'Descrição',
                status: false,
                ncm: 'preservar',
              }
            : {
                id: 12,
                Uid: 'VEN_EX',
                valor: 100,
                faturado: true,
                status: 'FATURADO',
                ItensVendas: [],
              },
  )
  mocks.orderGet.mockResolvedValue({
    id: 15,
    Uid: 'OS_EX',
    status: 'ABERTA',
    ItensOrdensServico: [{ id: 3, quantidade: 1, valor: 100 }],
    desconto: 0,
  })
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('venda própria', () => {
  async function prepare() {
    const w = await page(SaleFormPage, '/modofacil/vendas/nova', '/modofacil/vendas/nova')
    await button(w, 'Incluir item de exemplo').trigger('click')
    await button(w, 'Continuar').trigger('click')
    return w
  }
  it('divide o pagamento e faz uma única mutação de domínio', async () => {
    const w = await prepare()
    await input(w, 'Dividir em mais').setValue(true)
    await input(w, 'Valor 1').setValue('40,00')
    await input(w, 'Valor 2').setValue('60,00')
    await button(w, 'Continuar').trigger('click')
    await button(w, 'Confirmar e concluir venda').trigger('click')
    await flushPromises()
    expect(mocks.finalize).toHaveBeenCalledOnce()
    expect(mocks.finalize).toHaveBeenCalledWith(
      expect.objectContaining({
        caixaId: 7,
        pagamento: 'OUTRO',
        pagamentos: [
          { metodo: 'PIX', valor: 40 },
          { metodo: 'DINHEIRO', valor: 60 },
        ],
      }),
    )
    expect(mocks.saleCreate).not.toHaveBeenCalled()
  })
  it('impede soma divergente sem travar correção do formulário', async () => {
    const w = await prepare()
    await input(w, 'Dividir em mais').setValue(true)
    await input(w, 'Valor 1').setValue('40')
    await input(w, 'Valor 2').setValue('50')
    await button(w, 'Continuar').trigger('click')
    expect(w.text()).toContain('soma das formas')
    expect(mocks.finalize).not.toHaveBeenCalled()
    await input(w, 'Valor 2').setValue('60')
    await button(w, 'Continuar').trigger('click')
    expect(w.text()).toContain('Confira antes de confirmar')
  })
  it('salva orçamento pela operação própria sem concluir venda em caixa', async () => {
    const w = await prepare()
    await button(w, 'Voltar').trigger('click')
    await select(w, 'O que deseja registrar?').setValue('ORCAMENTO')
    await button(w, 'Continuar').trigger('click')
    await button(w, 'Continuar').trigger('click')
    expect(w.text()).toContain('saída dos produtos no estoque')
    await button(w, 'Confirmar orçamento e saída de estoque').trigger('click')
    await flushPromises()
    expect(mocks.saleCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ORCAMENTO', pagamento: 'OUTRO' }),
    )
    expect(mocks.finalize).not.toHaveBeenCalled()
  })
  it('não permite repetir conclusão depois de timeout', async () => {
    mocks.finalize.mockRejectedValueOnce(new Error('timeout'))
    const w = await prepare()
    await button(w, 'Continuar').trigger('click')
    await button(w, 'Confirmar e concluir venda').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('resultado pode ter sido registrado')
    expect(button(w, 'Confirmar e concluir venda').element.closest('fieldset').disabled).toBe(true)
    expect(mocks.finalize).toHaveBeenCalledOnce()
  })
})
describe('pagamento e estornos', () => {
  it('paga parcialmente uma parcela e solicita saldo pendente na mesma operação', async () => {
    const w = await page(
      FinanceDetailPage,
      '/modofacil/financeiro/lancamentos/5',
      '/modofacil/financeiro/lancamentos/:id',
    )
    await button(w, 'Registrar pagamento').trigger('click')
    await input(w, 'Valor recebido / pago').setValue('40,00')
    await input(w, 'Vencimento do saldo pendente').setValue('2026-11-20')
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(mocks.pay).toHaveBeenCalledExactlyOnceWith(
      8,
      expect.objectContaining({
        valorRecebido: 40,
        contaPagamento: 2,
        criarSaldoPendente: true,
        novoVencimento: expect.stringContaining('2026-11-20'),
      }),
    )
  })
  it('recusa pagamento acima da parcela antes da requisição', async () => {
    const w = await page(
      FinanceDetailPage,
      '/modofacil/financeiro/lancamentos/5',
      '/modofacil/financeiro/lancamentos/:id',
    )
    await button(w, 'Registrar pagamento').trigger('click')
    await input(w, 'Valor recebido / pago').setValue('101')
    await w.find('form').trigger('submit')
    expect(mocks.pay).not.toHaveBeenCalled()
    expect(w.get('[role=dialog]').get('[role=alert]').text()).toContain('até o valor da parcela')
  })
  it('estorna venda somente depois da confirmação e uma única vez', async () => {
    const w = await page(SaleDetailPage, '/modofacil/vendas/12', '/modofacil/vendas/:id')
    await button(w, 'Estornar faturamento').trigger('click')
    expect(mocks.saleReverse).not.toHaveBeenCalled()
    await button(w, 'Confirmar estorno do faturamento').trigger('click')
    await flushPromises()
    expect(mocks.saleReverse).toHaveBeenCalledExactlyOnceWith(12)
  })
  it('cancela o diálogo de estorno sem enviar a operação', async () => {
    const w = await page(SaleDetailPage, '/modofacil/vendas/12', '/modofacil/vendas/:id')
    await button(w, 'Estornar faturamento').trigger('click')
    await w
      .get('[role=dialog]')
      .findAll('button')
      .find((b) => b.text() === 'Voltar')!
      .trigger('click')
    await flushPromises()
    expect(mocks.saleReverse).not.toHaveBeenCalled()
    expect(w.find('[role=dialog]').exists()).toBe(false)
  })
  it('mantém o erro do estorno visível no diálogo e impede repetir resultado incerto', async () => {
    mocks.saleReverse.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Falha ao confirmar o estorno' } },
    })
    const w = await page(SaleDetailPage, '/modofacil/vendas/12', '/modofacil/vendas/:id')
    await button(w, 'Estornar faturamento').trigger('click')
    await button(w, 'Confirmar estorno do faturamento').trigger('click')
    await flushPromises()
    expect(w.get('[role=dialog]').get('[role=alert]').text()).toContain(
      'Falha ao confirmar o estorno',
    )
    expect(button(w, 'Confirmar estorno do faturamento').attributes('disabled')).toBeDefined()
    await button(w, 'Confirmar estorno do faturamento').trigger('click')
    expect(mocks.saleReverse).toHaveBeenCalledTimes(1)
  })
  it('fatura OS sem criar outra receita manual no frontend', async () => {
    const w = await page(
      OrderDetailPage,
      '/modofacil/servicos/ordens/15',
      '/modofacil/servicos/ordens/:id',
    )
    await button(w, 'Registrar recebimento e faturar').trigger('click')
    await flushPromises()
    expect(w.get('[role=dialog]').text()).not.toContain('Dividir em mais de uma forma')
    await select(w, 'Categoria financeira').setValue('3')
    await select(w, 'Conta financeira').setValue('2')
    await w.get('[role=dialog]').get('form').trigger('submit')
    await w.get('[role=dialog]').get('form').trigger('submit')
    await flushPromises()
    expect(mocks.orderSettle).toHaveBeenCalledExactlyOnceWith(
      15,
      expect.objectContaining({
        categoria: 3,
        conta: 2,
        pagamento: 'PIX',
        cancelarCobrancaExterna: false,
      }),
    )
  })
  it('estorna OS faturada pelo endpoint de domínio', async () => {
    mocks.orderGet.mockResolvedValue({
      id: 15,
      Uid: 'OS_EX',
      status: 'FATURADA',
      ItensOrdensServico: [],
      desconto: 0,
    })
    const w = await page(
      OrderDetailPage,
      '/modofacil/servicos/ordens/15',
      '/modofacil/servicos/ordens/:id',
    )
    await button(w, 'Estornar faturamento').trigger('click')
    await button(w, 'Confirmar estorno do faturamento').trigger('click')
    await flushPromises()
    expect(mocks.orderReverse).toHaveBeenCalledExactlyOnceWith(15)
  })
  it('edita um serviço com ID explícito pelo formulário próprio', async () => {
    const w = await page(
      ServiceFormPage,
      '/modofacil/servicos/6/editar',
      '/modofacil/servicos/:id/editar',
    )
    await input(w, 'Nome').setValue('Reparo guiado')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(mocks.serviceSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 6, nome: 'Reparo guiado', preco: 50 }),
    )
    expect(w.text()).toContain('Serviço salvo')
  })
})
