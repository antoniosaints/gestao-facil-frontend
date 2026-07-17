// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// Cada repositório vira um espião: além de checar o que a dashboard mostra, queremos provar
// que ela NÃO busca dados de módulo inativo (antes eram 11 requisições fixas).
const chamadas: string[] = []
const espiao = (nome: string, retorno: any) =>
  vi.fn(async () => {
    chamadas.push(nome)
    return retorno
  })

const serie = { labels: [], datasets: [] }

vi.mock('@/repositories/venda-repository', () => ({
  VendaRepository: {
    resumo: espiao('vendas.resumo', { data: { totalFaturado: 3, ticketMedio: 100, totalVendas: 5, totalAberto: 1 } }),
    getResumoMensal: espiao('vendas.mensal', { data: serie }),
    getTopProdutos: espiao('vendas.topProdutos', serie),
  },
}))
vi.mock('@/repositories/lancamento-repository', () => ({
  LancamentosRepository: {
    getSaldoMensal: espiao('financeiro.saldoMensal', serie),
    resumoTotal: espiao('financeiro.resumoTotal', { saldo: 'R$ 10,00', receitas: 'R$ 1', despesas: 'R$ 1' }),
    resumoStatusTotal: espiao('financeiro.status', { pendente: 0, pago: 0 }),
  },
}))
vi.mock('@/repositories/produto-repository', () => ({
  ProdutoRepository: {
    getTicketMedioMensal: espiao('produtos.ticketMedio', serie),
    getResumoGeral: espiao('produtos.resumoGeral', { totalProdutosBase: 2, totalVariantes: 4, estoqueBaixo: 0 }),
  },
}))
vi.mock('@/repositories/os-repository', () => ({
  OrdensServicoRepository: { getResumo: espiao('servicos.resumo', { data: { qtdAberta: 1, qtdAndamento: 0 } }) },
}))
vi.mock('@/repositories/metas-repository', () => ({
  MetasRepository: { resumo: espiao('metas.resumo', { data: [] }) },
}))
vi.mock('@/repositories/caixa-repository', () => ({
  CaixaRepository: { getResumo: espiao('caixas.resumo', { caixasAbertos: 2, saldoEsperado: 500, abertoHaMaisTempoMs: 7200000, vendasNoTurno: 0, totalVendasNoTurno: 0, caixas: [] }) },
}))
vi.mock('@/repositories/whatsapp-repository', () => ({
  WhatsAppRepository: { getPainel: espiao('atendimento.painel', { agora: { naFila: 4, emAtendimento: 1, esperaMaiorMs: 60000, finalizadas: 0, naoLidas: 0 } }) },
}))
vi.mock('@/repositories/assinatura-repository', () => ({
  AssinaturaRepository: { dashboard: espiao('assinaturas.dashboard', { data: { kpis: { assinaturasAtivas: 7, mrrEstimado: 900 } } }) },
}))
vi.mock('@/repositories/loja-repository', () => ({
  LojaRepository: { getResumo: espiao('loja.resumo', { pedidos: 9, emAberto: 3, faturamento: 1000, ticketMedio: 111, pedidosFaturados: 9, cancelados: 0, periodo: { inicio: '', fim: '' } }) },
}))
vi.mock('@/stores/dashboard/useDashboardStore', () => ({
  useDashboardStore: () => ({ getResumo: espiao('dashboard.resumo', { data: { vendasCount: 'R$ 500,00', clientes: 12, percentageByLastMonth: 5 } }) }),
}))

const permissaoCheia = { editar: true, visualizar: true, criar: true, excluir: true, painel: true }

function montarUiStore(over: { visibleMenuKeys?: string[] | null; appModules?: Record<string, boolean> } = {}) {
  const store = {
    isMobile: false,
    openSidebar: false,
    appModules: over.appModules ?? { assinaturas: true, atendimento: true, 'loja-virtual': true },
    visibleMenuKeys: 'visibleMenuKeys' in over ? over.visibleMenuKeys : null,
    hiddenSubmenuKeys: [] as string[],
    loadAppModules: vi.fn(async () => ({})),
    permissoes: {
      superadmin: false,
      admin: true,
      produtos: { ...permissaoCheia },
      clientes: { ...permissaoCheia },
      servicos: { ...permissaoCheia },
      vendas: { ...permissaoCheia },
      financeiro: { ...permissaoCheia },
      relatorios: { ...permissaoCheia },
      configuracoes: { ...permissaoCheia },
      usuarios: { ...permissaoCheia },
    },
  }

  return {
    ...store,
    hasActiveModule: vi.fn((modulo: string) => Boolean(store.appModules[modulo])),
  }
}

let uiStoreMock = montarUiStore()
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => uiStoreMock }))
vi.mock('vue-toastification', () => ({ useToast: () => ({ info: vi.fn(), warning: vi.fn() }) }))

async function montarDashboard() {
  const Dashboard = (await import('./Dashboard.vue')).default
  const wrapper = mount(Dashboard, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, Badge: true, BarChart: true, LineChart: true, Calendarpicker: true, MobileBottomBar: true, ModalView: { template: '<div><slot /></div>' } } },
  })
  await new Promise((r) => setTimeout(r, 30))
  await nextTick()
  return wrapper
}

describe('Dashboard — módulos ativos', () => {
  beforeEach(() => {
    chamadas.length = 0
    setActivePinia(createPinia())
    uiStoreMock = montarUiStore()
  })

  it('mostra os KPIs dos módulos novos quando tudo está ativo', async () => {
    const texto = (await montarDashboard()).text()
    expect(texto).toContain('Caixas abertos')
    expect(texto).toContain('Fila de atendimento')
    expect(texto).toContain('Contratos ativos')
    expect(texto).toContain('Pedidos da loja')
    // E os que já existiam continuam lá.
    expect(texto).toContain('Faturamento')
    expect(texto).toContain('Catálogo')
  }, 10000)

  // O bug relatado: conta com menus ocultos via configuração continuava vendo os KPIs.
  it('esconde KPIs, blocos e gráficos de módulo fora da whitelist', async () => {
    uiStoreMock = montarUiStore({ visibleMenuKeys: ['vendas', 'financeiro'] })
    const texto = (await montarDashboard()).text()
    expect(texto).toContain('Faturamento')
    expect(texto).not.toContain('Catálogo')
    expect(texto).not.toContain('Estoque crítico')
    expect(texto).not.toContain('Serviços em aberto')
    // Gráfico de produtos também some.
    expect(texto).not.toContain('Top produtos')
  })

  it('não busca dados de módulo inativo', async () => {
    uiStoreMock = montarUiStore({ visibleMenuKeys: ['vendas'], appModules: {} })
    await montarDashboard()
    expect(chamadas).toContain('vendas.resumo')
    expect(chamadas).not.toContain('produtos.resumoGeral')
    expect(chamadas).not.toContain('servicos.resumo')
    expect(chamadas).not.toContain('financeiro.resumoTotal')
    // Apps não contratados nem chegam a ser consultados.
    expect(chamadas).not.toContain('atendimento.painel')
    expect(chamadas).not.toContain('assinaturas.dashboard')
    expect(chamadas).not.toContain('loja.resumo')
  })

  it('esconde KPIs de app não contratado mesmo com permissão total', async () => {
    uiStoreMock = montarUiStore({ appModules: {} })
    const texto = (await montarDashboard()).text()
    expect(texto).not.toContain('Fila de atendimento')
    expect(texto).not.toContain('Contratos ativos')
    expect(texto).not.toContain('Pedidos da loja')
    // Caixas não é app contratado: continua aparecendo junto com vendas.
    expect(texto).toContain('Caixas abertos')
  })

  // Os atalhos de período de vendas/produtos agora existem aqui: clicar deve refazer a busca
  // com o novo intervalo, não só pintar o botão.
  it('refaz a busca ao trocar o preset de período', async () => {
    const wrapper = await montarDashboard()
    const antes = chamadas.filter((c) => c === 'dashboard.resumo').length

    const botaoHoje = wrapper.findAll('button').find((b) => b.text() === 'Hoje')!
    expect(botaoHoje).toBeTruthy()
    await botaoHoje.trigger('click')
    await new Promise((r) => setTimeout(r, 30))

    expect(chamadas.filter((c) => c === 'dashboard.resumo').length).toBe(antes + 1)
    expect(wrapper.text()).toContain('Hoje')
  })

  it('oferece todos os atalhos de período', async () => {
    const texto = (await montarDashboard()).text()
    for (const label of ['Hoje', '7 dias', '30 dias', 'Este mês', 'Mês passado']) {
      expect(texto, label).toContain(label)
    }
  })

  it('esconde caixas quando o submenu está oculto, sem derrubar vendas', async () => {
    uiStoreMock = montarUiStore()
    uiStoreMock.hiddenSubmenuKeys = ['vendas:caixas']
    const texto = (await montarDashboard()).text()
    expect(texto).toContain('Faturamento')
    expect(texto).not.toContain('Caixas abertos')
    expect(chamadas).not.toContain('caixas.resumo')
  })
})
