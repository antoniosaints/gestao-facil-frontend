<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { endOfMonth, startOfMonth } from 'date-fns'
import { useToast } from 'vue-toastification'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  Boxes,
  ChartPie,
  ChevronRight,
  DollarSign,
  EyeClosed,
  FileDigit,
  Filter,
  HandCoins,
  Headset,
  Menu,
  PackageSearch,
  Receipt,
  LoaderCircle,
  RefreshCcw,
  RotateCw,
  ShoppingCart,
  Sparkles,
  Store,
  Tags,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Eye,
} from 'lucide-vue-next'

import BarChart from '@/components/graficos/BarChart.vue'
import LineChart from '@/components/graficos/LineChart.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import AutoGrid from '@/components/layout/AutoGrid.vue'
import { intervaloDoPreset, PERIODO_PRESETS, type PeriodoPresetKey } from '@/components/layout/periodoPresets'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PALETTE, useChartTheme } from '@/composables/useChartTheme'
import { isModuleActive, type ModuleKey } from '@/layouts/moduleAccess'
import { AssinaturaRepository, type AssinaturaDashboardResponse } from '@/repositories/assinatura-repository'
import { CaixaRepository, type ResumoCaixas } from '@/repositories/caixa-repository'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { LojaRepository, type ResumoLoja } from '@/repositories/loja-repository'
import { MetasRepository, type MetaResumo } from '@/repositories/metas-repository'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { VendaRepository } from '@/repositories/venda-repository'
import { WhatsAppRepository, type PainelAtendimento } from '@/repositories/whatsapp-repository'
import { useDashboardStore } from '@/stores/dashboard/useDashboardStore'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDuracaoMs, formatToCapitalize, formatToNumberValue } from '@/utils/formatters'
import { IaRepository, isIaQuotaError } from '@/repositories/ia-repository'
import { renderMarkdown } from '@/utils/simpleMarkdown'

// Todo bloco da dashboard declara a que módulo pertence, e some junto com ele. Sem isso a
// dashboard mostrava catálogo, estoque e serviços mesmo para contas com esses menus ocultos.
type KpiCard = {
  modulo: ModuleKey
  titulo: string
  valor: string | any
  detalhe: string
  icone: any
  colorClass: string
  link?: string
}

type AlertCard = {
  modulo: ModuleKey
  titulo: string
  descricao: string
  tone: 'danger' | 'warning' | 'info' | 'success'
  link?: string
  cta?: string
}

type SummaryBlock = {
  modulo: ModuleKey
  titulo: string
  descricao: string
  icone: any
  link: string
  metrics: Array<{ label: string; value: string | Component }>
}

type ChartCard = {
  modulo: ModuleKey
  titulo: string
  descricao: string
  icone: any
  iconClass: string
  tipo: 'bar' | 'line' | 'bar-dual' | 'ranking'
  data: any
  options?: any
}

const mapperIndex = (index: any): string => String(index + 1).padStart(2, '0')

const { primary, primarySoft, lineOptions, barOptions, barDualAxisOptions } = useChartTheme()

const store = useDashboardStore()
const uiStore = useUiStore()
const toast = useToast()

const loading = ref(true)
const filtroPeriodo = ref<[Date, Date]>(intervaloDoPreset('month'))
const presetAtivo = ref<string>('month')
const openModalFiltros = ref(false)

const dataVendasMensais: any = ref({ labels: [], datasets: [] })
const dataSaldoMensal: any = ref({ labels: [], datasets: [] })
const dataTicketMedio: any = ref({ labels: [], datasets: [] })
const dataTopProdutos: any = ref({ labels: [], datasets: [] })

const dashboardResumo = ref<any>(null)
const vendasResumo = ref<any>(null)
const financeiroResumo = ref<any>(null)
const financeiroStatus = ref<any>(null)
const produtoResumo = ref<any>(null)
const servicosResumo = ref<any>(null)
const metasResumo = ref<MetaResumo[]>([])
const caixasResumo = ref<ResumoCaixas | null>(null)
const atendimentoResumo = ref<PainelAtendimento | null>(null)
const assinaturasResumo = ref<AssinaturaDashboardResponse['data'] | null>(null)
const lojaResumo = ref<ResumoLoja | null>(null)

// Combina permissões, apps contratados e a visibilidade configurada na conta. A regra vive em
// moduleAccess.ts para espelhar o menu lateral: o que não aparece no menu não aparece aqui.
const modulos = computed(() => {
  const ctx = {
    permissoes: uiStore.permissoes,
    appModules: uiStore.appModules,
    visibleMenuKeys: uiStore.visibleMenuKeys,
    hiddenSubmenuKeys: uiStore.hiddenSubmenuKeys,
  }
  const chaves: ModuleKey[] = [
    'vendas', 'caixas', 'comandas', 'financeiro', 'produtos', 'servicos',
    'clientes', 'metas', 'assinaturas', 'atendimento', 'loja-virtual',
  ]
  return Object.fromEntries(chaves.map((k) => [k, isModuleActive(k, ctx)])) as Record<ModuleKey, boolean>
})

const periodoDescricao = computed(() => {
  const preset = PERIODO_PRESETS.find((p) => p.key === presetAtivo.value)
  if (preset) return preset.label
  const [inicio, fim] = filtroPeriodo.value ?? []
  if (!inicio || !fim) return 'Mês atual'
  return `${inicio.toLocaleDateString('pt-BR')} — ${fim.toLocaleDateString('pt-BR')}`
})

function applyPreset(preset: PeriodoPresetKey) {
  presetAtivo.value = preset
  filtroPeriodo.value = intervaloDoPreset(preset)
  getDataDashboard()
}

function aplicarCustom() {
  presetAtivo.value = 'custom'
  openModalFiltros.value = false
  getDataDashboard()
}

// O subtítulo listava módulos fixos ("vendas, financeiro, catálogo e serviços") mesmo em contas
// que não os têm. Agora descreve o que a conta realmente vê.
const NOME_MODULO: Record<ModuleKey, string> = {
  vendas: 'vendas',
  caixas: 'caixas',
  comandas: 'comandas',
  financeiro: 'financeiro',
  produtos: 'catálogo',
  servicos: 'serviços',
  clientes: 'clientes',
  metas: 'metas',
  assinaturas: 'assinaturas',
  atendimento: 'atendimento',
  'loja-virtual': 'loja',
}

const resumoModulosLabel = computed(() => {
  const ativos = (Object.keys(modulos.value) as ModuleKey[])
    .filter((k) => modulos.value[k] && k !== 'caixas' && k !== 'metas')
    .map((k) => NOME_MODULO[k])
  if (!ativos.length) return 'nenhum módulo ativo para o seu acesso.'
  if (ativos.length === 1) return `dados de ${ativos[0]}.`
  return `dados centralizados de ${ativos.slice(0, -1).join(', ')} e ${ativos.at(-1)}.`
})

const todosKpis = computed<KpiCard[]>(() => {
  const resumo = dashboardResumo.value?.data
  const vendas = vendasResumo.value
  const financeiro = financeiroResumo.value
  const produtos = produtoResumo.value
  const servicos = servicosResumo.value?.data
  const caixas = caixasResumo.value
  const atendimento = atendimentoResumo.value
  const assinaturas = assinaturasResumo.value
  const loja = lojaResumo.value

  return [
    {
      modulo: 'vendas',
      titulo: 'Faturamento',
      valor: resumo?.vendasCount || 'R$ 0,00',
      detalhe: `${vendas?.totalFaturado || 0} venda(s) faturada(s) no período`,
      icone: DollarSign,
      colorClass: 'text-green-600 bg-green-500/10',
      link: '/vendas',
    },
    {
      modulo: 'vendas',
      titulo: 'Ticket médio',
      valor: uiStore.permissoes.vendas.painel ? formatCurrencyBR(vendas?.ticketMedio || 0) : EyeClosed,
      detalhe: 'Média das vendas faturadas no período',
      icone: Receipt,
      colorClass: 'text-blue-600 bg-blue-500/10',
      link: '/vendas/dashboard',
    },
    {
      modulo: 'financeiro',
      titulo: 'Saldo financeiro',
      valor: uiStore.permissoes.financeiro.painel ? (financeiro?.saldo || 'R$ 0,00') : EyeClosed,
      detalhe: uiStore.permissoes.financeiro.painel ? `Receitas ${financeiro?.receitas || 'R$ 0,00'} • Despesas ${financeiro?.despesas || 'R$ 0,00'}` : 'Sem acesso à essa informação.',
      icone: Wallet,
      colorClass: 'text-emerald-600 bg-emerald-500/10',
      link: '/financeiro/painel',
    },
    {
      modulo: 'clientes',
      titulo: 'Clientes',
      valor: `${resumo?.clientes || 0}`,
      detalhe: 'Base total cadastrada no sistema',
      icone: Users,
      colorClass: 'text-violet-600 bg-violet-500/10',
      link: '/clientes',
    },
    {
      modulo: 'produtos',
      titulo: 'Catálogo',
      valor: `${produtos?.totalProdutosBase || 0} Produto(s)`,
      detalhe: `${produtos?.totalVariantes || 0} variante(s) e ${produtos?.totalCategorias || 0} categoria(s)`,
      icone: Boxes,
      colorClass: 'text-sky-600 bg-sky-500/10',
      link: '/produtos',
    },
    {
      modulo: 'produtos',
      titulo: 'Estoque crítico',
      valor: `${produtos?.estoqueBaixo || resumo?.estoquesBaixos?.length || 0}`,
      detalhe: `${produtos?.produtosSemEstoque || 0} sem estoque • ${produtos?.controlaEstoque || 0} com controle ativo`,
      icone: PackageSearch,
      colorClass: 'text-amber-600 bg-amber-500/10',
      link: '/produtos/dashboard',
    },
    {
      modulo: 'servicos',
      titulo: 'Serviços em aberto',
      valor: `${(servicos?.qtdAberta || 0) + (servicos?.qtdAndamento || 0)}`,
      detalhe: `${servicos?.qtdAberta || 0} aberta(s) • ${servicos?.qtdAndamento || 0} em andamento`,
      icone: Wrench,
      colorClass: 'text-orange-600 bg-orange-500/10',
      link: '/servicos/os',
    },
    {
      modulo: 'financeiro',
      titulo: 'Pendências financeiras',
      valor: uiStore.permissoes.financeiro.painel ? formatCurrencyBR(financeiroStatus.value?.pendente || 0) : EyeClosed,
      detalhe: uiStore.permissoes.financeiro.painel ? `Pago no histórico: ${formatCurrencyBR(financeiroStatus.value?.pago || 0)}` : 'Sem acesso à essa informação.',
      icone: HandCoins,
      colorClass: 'text-rose-600 bg-rose-500/10',
      link: '/financeiro/lancamentos',
    },
    // Estado agora, não recorte do período: "tem caixa aberto?" é a primeira pergunta do dia,
    // e caixa esquecido aberto não aparece em nenhum outro lugar do sistema.
    {
      modulo: 'caixas',
      titulo: 'Caixas abertos',
      valor: `${caixas?.caixasAbertos || 0}`,
      detalhe: caixas?.caixasAbertos
        ? `${formatCurrencyBR(caixas.saldoEsperado)} esperado • aberto há ${formatDuracaoMs(caixas.abertoHaMaisTempoMs)}`
        : 'Nenhum caixa aberto no momento',
      icone: Wallet,
      colorClass: 'text-teal-600 bg-teal-500/10',
      link: '/vendas/caixas',
    },
    {
      modulo: 'atendimento',
      titulo: 'Fila de atendimento',
      valor: `${atendimento?.agora.naFila || 0}`,
      detalhe: atendimento?.agora.naFila
        ? `Maior espera: ${formatDuracaoMs(atendimento.agora.esperaMaiorMs)} • ${atendimento.agora.emAtendimento} em atendimento`
        : `${atendimento?.agora.emAtendimento || 0} em atendimento • fila zerada`,
      icone: Headset,
      colorClass: 'text-cyan-600 bg-cyan-500/10',
      link: '/atendimento/painel',
    },
    {
      modulo: 'assinaturas',
      titulo: 'Contratos ativos',
      valor: `${assinaturas?.kpis.assinaturasAtivas || 0}`,
      detalhe: uiStore.permissoes.financeiro.painel
        ? `MRR estimado ${formatCurrencyBR(assinaturas?.kpis.mrrEstimado || 0)}`
        : 'Sem acesso à essa informação.',
      icone: RefreshCcw,
      colorClass: 'text-indigo-600 bg-indigo-500/10',
      link: '/assinaturas',
    },
    {
      modulo: 'loja-virtual',
      titulo: 'Pedidos da loja',
      valor: `${loja?.pedidos || 0}`,
      detalhe: `${loja?.emAberto || 0} aguardando ação • ${formatCurrencyBR(loja?.faturamento || 0)} no período`,
      icone: Store,
      colorClass: 'text-pink-600 bg-pink-500/10',
      link: '/loja-virtual',
    },
  ]
})

const kpis = computed(() => todosKpis.value.filter((kpi) => modulos.value[kpi.modulo]))

const todosAlerts = computed<AlertCard[]>(() => {
  const produtos = produtoResumo.value
  const resumo = dashboardResumo.value?.data
  const vendas = vendasResumo.value
  const financeiroPendencias = formatToNumberValue(financeiroStatus.value?.pendente || 0)
  const servicos = servicosResumo.value?.data

  const list: AlertCard[] = []

  if ((produtos?.estoqueBaixo || 0) > 0) {
    list.push({
      modulo: 'produtos',
      titulo: 'Estoque baixo precisa de revisão',
      descricao: `${produtos.estoqueBaixo} variante(s) estão em nível crítico de estoque.`,
      tone: 'danger',
      link: '/produtos/dashboard',
      cta: 'Abrir painel de produtos',
    })
  }

  if ((produtos?.produtosSemEstoque || 0) > 0) {
    list.push({
      modulo: 'produtos',
      titulo: 'Há itens sem estoque',
      descricao: `${produtos.produtosSemEstoque} variante(s) já estão zeradas.`,
      tone: 'warning',
      link: '/produtos',
      cta: 'Ver catálogo',
    })
  }

  if (financeiroPendencias > 0 && uiStore.permissoes.financeiro.painel) {
    list.push({
      modulo: 'financeiro',
      titulo: 'Existem pendências financeiras',
      descricao: `Total pendente acumulado em ${formatCurrencyBR(financeiroPendencias)}.`,
      tone: 'warning',
      link: '/financeiro/lancamentos',
      cta: 'Revisar lançamentos',
    })
  }

  if ((vendas?.totalAberto || 0) > 0) {
    list.push({
      modulo: 'vendas',
      titulo: 'Vendas em aberto exigem acompanhamento',
      descricao: `${vendas.totalAberto} venda(s) ainda não faturadas/concluídas.`,
      tone: 'info',
      link: '/vendas',
      cta: 'Abrir vendas',
    })
  }

  if (((servicos?.qtdAberta || 0) + (servicos?.qtdAndamento || 0)) > 0) {
    list.push({
      modulo: 'servicos',
      titulo: 'Ordens de serviço em execução',
      descricao: `${servicos?.qtdAberta || 0} aberta(s) e ${servicos?.qtdAndamento || 0} em andamento.`,
      tone: 'info',
      link: '/servicos/os',
      cta: 'Ir para serviços',
    })
  }

  return list
})

// Alertas de módulo inativo não fazem sentido: a conta não pode agir sobre eles. O "tudo sob
// controle" entra só depois do filtro, senão apareceria junto de alertas que foram removidos.
const alerts = computed<AlertCard[]>(() => {
  const list = todosAlerts.value.filter((alert) => modulos.value[alert.modulo]).slice(0, 4)
  if (list.length) return list
  return [
    {
      modulo: 'vendas',
      titulo: 'Tudo sob controle',
      descricao: 'Nenhum alerta crítico foi identificado com os dados carregados agora.',
      tone: 'success',
      link: '/',
      cta: 'Atualizar painel',
    },
  ]
})

const todosSummaryBlocks = computed<SummaryBlock[]>(() => {
  const resumo = dashboardResumo.value?.data
  const vendas = vendasResumo.value
  const financeiro = financeiroResumo.value
  const produtos = produtoResumo.value
  const servicos = servicosResumo.value?.data

  return [
    {
      modulo: 'vendas',
      titulo: 'Vendas',
      descricao: 'Visão rápida do comercial.',
      icone: ShoppingCart,
      link: '/vendas/dashboard',
      metrics: [
        { label: 'Vendas totais', value: `${vendas?.totalVendas || 0}` },
        { label: 'Faturadas', value: `${vendas?.totalFaturado || 0}` },
        { label: 'Valor total', value: uiStore.permissoes.vendas.painel ? formatCurrencyBR(vendas?.totalValorVendas || 0) : EyeClosed },
      ],
    },
    {
      modulo: 'financeiro',
      titulo: 'Financeiro',
      descricao: 'Receitas, despesas e saldo consolidado.',
      icone: Wallet,
      link: '/financeiro/painel',
      metrics: [
        { label: 'Receitas', value: uiStore.permissoes.financeiro.painel ? (financeiro?.receitas || 'R$ 0,00') : EyeClosed },
        { label: 'Despesas', value: uiStore.permissoes.financeiro.painel ? (financeiro?.despesas || 'R$ 0,00') : EyeClosed },
        { label: 'Saldo', value: uiStore.permissoes.financeiro.painel ? (financeiro?.saldo || 'R$ 0,00') : EyeClosed },
      ],
    },
    {
      modulo: 'produtos',
      titulo: 'Produtos',
      descricao: 'Catálogo operacional do estoque.',
      icone: Boxes,
      link: '/produtos/dashboard',
      metrics: [
        { label: 'Produtos base', value: `${produtos?.totalProdutosBase || 0}` },
        { label: 'Estoque baixo', value: `${produtos?.estoqueBaixo || 0}` },
        { label: 'Valor em estoque', value: uiStore.permissoes.financeiro.painel ? formatCurrencyBR(produtos?.valorEstoque || 0) : EyeClosed },
      ],
    },
    {
      modulo: 'servicos',
      titulo: 'Serviços',
      descricao: 'Carteira atual de ordens e faturamento.',
      icone: FileDigit,
      link: '/servicos/os',
      metrics: [
        { label: 'Abertas', value: `${servicos?.qtdAberta || 0}` },
        { label: 'Em andamento', value: `${servicos?.qtdAndamento || 0}` },
        { label: 'Faturadas', value: `${servicos?.qtdFaturada || 0}` },
      ],
    },
  ]
})

const summaryBlocks = computed(() =>
  todosSummaryBlocks.value.filter((block) => modulos.value[block.modulo]),
)

// As séries do backend vêm com cores fixas; reconstruímos os datasets no front
// aplicando as cores do tema (reativas ao dark/light) — mesmo padrão dos painéis.
const vendasMensaisChart = computed(() => {
  const src = dataVendasMensais.value
  const dsValor = src?.datasets?.[0]
  const dsQtd = src?.datasets?.[1]
  const datasets: any[] = []
  if (dsValor) {
    datasets.push({
      label: dsValor.label || 'Valor Total (R$)',
      data: dsValor.data ?? [],
      backgroundColor: primary.value,
      yAxisID: 'y1',
      borderRadius: 6,
    })
  }
  if (dsQtd) {
    datasets.push({
      label: dsQtd.label || 'Qtd de vendas',
      data: dsQtd.data ?? [],
      backgroundColor: PALETTE[3],
      yAxisID: 'y2',
      borderRadius: 6,
    })
  }
  return { labels: src?.labels ?? [], datasets }
})

const saldoMensalChart = computed(() => {
  const src = dataSaldoMensal.value
  const ds = src?.datasets?.[0]
  return {
    labels: src?.labels ?? [],
    datasets: [{
      label: ds?.label || 'Saldo',
      data: ds?.data ?? [],
      borderColor: primary.value,
      backgroundColor: primarySoft.value,
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 5,
    }],
  }
})

const ticketMedioChart = computed(() => {
  const src = dataTicketMedio.value
  const ds = src?.datasets?.[0]
  return {
    labels: src?.labels ?? [],
    datasets: [{
      label: ds?.label || 'Ticket médio',
      data: ds?.data ?? [],
      backgroundColor: primary.value,
      borderRadius: 6,
    }],
  }
})

// Top produtos vira lista ranqueada: o backend retorna quantidade por produto.
const topProdutosRanking = computed(() => {
  const labels: string[] = dataTopProdutos.value?.labels ?? []
  const valores: number[] = dataTopProdutos.value?.datasets?.[0]?.data ?? []
  const max = Math.max(1, ...valores.map((v) => Number(v) || 0))
  return labels.map((nome, i) => {
    const qtd = Number(valores[i]) || 0
    return { nome, qtd, pct: (qtd / max) * 100 }
  })
})

// Gráficos também seguem o módulo: um gráfico de estoque numa conta sem Produtos é ruído.
const charts = computed<ChartCard[]>(() =>
  [
    {
      modulo: 'vendas' as const,
      titulo: 'Vendas mensais',
      descricao: 'Receita e volume vendidos ao longo dos meses.',
      icone: Tags,
      iconClass: 'text-green-600',
      tipo: 'bar-dual' as const,
      data: vendasMensaisChart.value,
      options: barDualAxisOptions.value,
    },
    {
      modulo: 'financeiro' as const,
      titulo: 'Saldo mensal',
      descricao: 'Evolução consolidada do financeiro.',
      icone: HandCoins,
      iconClass: 'text-emerald-600',
      tipo: 'line' as const,
      data: saldoMensalChart.value,
      options: lineOptions.value,
    },
    {
      modulo: 'vendas' as const,
      titulo: 'Ticket médio mensal',
      descricao: 'Média de faturamento por venda faturada.',
      icone: Receipt,
      iconClass: 'text-blue-600',
      tipo: 'bar' as const,
      data: ticketMedioChart.value,
      options: barOptions.value,
    },
    {
      modulo: 'produtos' as const,
      titulo: 'Top produtos',
      descricao: 'Itens com melhor saída no período filtrado.',
      icone: Boxes,
      iconClass: 'text-violet-600',
      tipo: 'ranking' as const,
      data: topProdutosRanking.value,
    },
  ].filter((chart) => modulos.value[chart.modulo]),
)

const quickActions = [
  { titulo: 'Nova venda', link: '/vendas', icon: ShoppingCart, modulo: 'vendas' as const },
  { titulo: 'Novo lançamento', link: '/financeiro/lancamentos', icon: Wallet, modulo: 'financeiro' as const },
  { titulo: 'Novo produto', link: '/produtos', icon: Boxes, modulo: 'produtos' as const },
  { titulo: 'Nova OS', link: '/servicos/os', icon: Wrench, modulo: 'servicos' as const },
]

const visibleQuickActions = computed(() =>
  quickActions.filter((action) => modulos.value[action.modulo]),
)

// Atalhos da barra inferior no mobile: mesma regra dos demais blocos.
const mobileLinks = computed(() =>
  [
    { titulo: 'Vendas', link: '/vendas', icon: Tags, modulo: 'vendas' as const },
    { titulo: 'Serviços', link: '/servicos/os', icon: FileDigit, modulo: 'servicos' as const },
    { titulo: 'Produtos', link: '/produtos', icon: Boxes, modulo: 'produtos' as const },
  ].filter((item) => modulos.value[item.modulo]),
)

const podeVerMetas = computed(() => modulos.value.metas)

const metasSlider = computed(() => (podeVerMetas.value ? metasResumo.value.slice(0, 8) : []))

function getPeriodoSelecionado() {
  const inicio = filtroPeriodo.value === null
    ? startOfMonth(new Date()).toISOString()
    : filtroPeriodo.value[0].toISOString()
  const fim = filtroPeriodo.value === null
    ? endOfMonth(new Date()).toISOString()
    : filtroPeriodo.value[1].toISOString()

  return { inicio, fim }
}

// ---- Fase 3: análise do dashboard com IA (só com o app core-ia ativo) ----
const iaInsightsAtivo = computed(() => uiStore.hasActiveModule('core-ia'))
const insightsIa = ref<{ open: boolean; loading: boolean; texto: string }>({
  open: false,
  loading: false,
  texto: '',
})
const insightsHtml = computed(() => renderMarkdown(insightsIa.value.texto))

async function analisarComIa() {
  insightsIa.value.texto = ''
  insightsIa.value.loading = true
  insightsIa.value.open = true
  try {
    const { inicio, fim } = getPeriodoSelecionado()
    const r = await IaRepository.insightsDashboard({ inicio, fim })
    insightsIa.value.texto = (r.text || '').trim()
  } catch (error: any) {
    insightsIa.value.open = false
    if (isIaQuotaError(error)) {
      toast.error('Limite mensal de IA do plano atingido. Fale com o administrador.')
    } else {
      toast.error(error?.response?.data?.message || 'Não foi possível analisar o período.')
    }
  } finally {
    insightsIa.value.loading = false
  }
}

function getAlertClasses(tone: AlertCard['tone']) {
  switch (tone) {
    case 'danger':
      return 'border-red-200 bg-red-500/5 dark:border-red-800 dark:bg-red-900/10'
    case 'warning':
      return 'border-amber-200 bg-amber-500/5 dark:border-amber-800 dark:bg-amber-900/10'
    case 'success':
      return 'border-emerald-200 bg-emerald-500/5 dark:border-emerald-800 dark:bg-emerald-900/10'
    default:
      return 'border-blue-200 bg-blue-500/5 dark:border-blue-800 dark:bg-blue-900/10'
  }
}

function formatMetaValue(meta: Pick<MetaResumo, 'metrica'>, value: number) {
  return meta.metrica === 'QUANTIDADE' ? String(Math.round(value || 0)) : formatCurrencyBR(value || 0)
}

function getMetaTipoLabel(meta: MetaResumo) {
  if (meta.tipo === 'SERVICOS') return 'Serviços'
  if (meta.tipo === 'FINANCEIRO') return meta.financeiroTipo === 'DESPESA' ? 'Despesas' : 'Receitas'
  return 'Vendas'
}

async function getDataDashboard(showFeedback = false) {
  try {
    loading.value = true
    const { inicio, fim } = getPeriodoSelecionado()

    // Só busca o que a conta enxerga: antes eram 11 requisições fixas, inclusive de módulos
    // ocultos, cujo resultado era descartado (ou pior, exibido).
    const m = modulos.value
    const quando = <T,>(ativo: boolean, promessa: () => Promise<T>) =>
      ativo ? promessa() : Promise.resolve(null)

    const [
      resumoDashboard,
      resumoVendas,
      vendasMensais,
      saldoMensal,
      ticketMedio,
      topProdutos,
      resumoFinanceiro,
      resumoFinanceiroStatus,
      resumoProdutos,
      resumoServicos,
      resumoMetas,
      resumoCaixas,
      resumoAtendimento,
      resumoAssinaturas,
      resumoLoja,
    ] = await Promise.all([
      store.getResumo(inicio, fim),
      quando(m.vendas, () => VendaRepository.resumo(inicio, fim)),
      quando(m.vendas, () => VendaRepository.getResumoMensal(inicio, fim)),
      quando(m.financeiro, () => LancamentosRepository.getSaldoMensal(inicio, fim)),
      quando(m.vendas, () => ProdutoRepository.getTicketMedioMensal(inicio, fim)),
      quando(m.produtos, () => VendaRepository.getTopProdutos(inicio, fim)),
      quando(m.financeiro, () => LancamentosRepository.resumoTotal()),
      quando(m.financeiro, () => LancamentosRepository.resumoStatusTotal()),
      quando(m.produtos, () => ProdutoRepository.getResumoGeral(inicio, fim)),
      quando(m.servicos, () => OrdensServicoRepository.getResumo()),
      quando(m.metas, () => MetasRepository.resumo()),
      quando(m.caixas, () => CaixaRepository.getResumo()),
      quando(m.atendimento, () => WhatsAppRepository.getPainel(inicio, fim)),
      quando(m.assinaturas, () => AssinaturaRepository.dashboard()),
      quando(m['loja-virtual'], () => LojaRepository.getResumo(inicio, fim)),
    ])

    dashboardResumo.value = resumoDashboard
    vendasResumo.value = resumoVendas?.data ?? null
    financeiroResumo.value = resumoFinanceiro
    financeiroStatus.value = resumoFinanceiroStatus
    produtoResumo.value = resumoProdutos
    servicosResumo.value = resumoServicos
    metasResumo.value = resumoMetas?.data ?? []
    caixasResumo.value = resumoCaixas
    atendimentoResumo.value = resumoAtendimento
    assinaturasResumo.value = resumoAssinaturas?.data ?? null
    lojaResumo.value = resumoLoja

    const serie = (fonte: any) =>
      fonte ? { labels: [...fonte.labels], datasets: [...fonte.datasets] } : { labels: [], datasets: [] }

    dataVendasMensais.value = serie(vendasMensais?.data)
    dataSaldoMensal.value = serie(saldoMensal)
    dataTicketMedio.value = serie(ticketMedio)
    dataTopProdutos.value = serie(topProdutos)

    if (showFeedback) {
      toast.info('Dashboard atualizada!')
    }
  } catch (error) {
    console.log(error)
    toast.warning('Erro ao buscar os dados da dashboard, recarregue a página!')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // O guard de rota já carrega os apps antes de liberar rotas privadas, mas a dashboard depende
  // deles para decidir o que buscar. A chamada é cacheada; sem ela, uma mudança no guard faria
  // os KPIs de apps (atendimento, assinaturas, loja) sumirem silenciosamente.
  await uiStore.loadAppModules().catch(() => undefined)
  getDataDashboard()
})
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ChartPie class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Dashboard
        </h2>
        <p class="text-sm text-muted-foreground">Resumo geral com indicadores centralizados do sistema.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
          <button v-for="p in PERIODO_PRESETS" :key="p.key" type="button" @click="applyPreset(p.key)"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="presetAtivo === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'">
            {{ p.label }}
          </button>
        </div>
        <Button variant="outline" size="sm" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Período
        </Button>
        <Button v-if="iaInsightsAtivo" variant="outline" size="sm" class="gap-2 text-violet-600 dark:text-violet-400"
          :disabled="loading || insightsIa.loading" @click="analisarComIa">
          <LoaderCircle v-if="insightsIa.loading" class="h-4 w-4 animate-spin" />
          <Sparkles v-else class="h-4 w-4" />
          Analisar com IA
        </Button>
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loading" @click="getDataDashboard(true)">
          <RotateCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <Card class="border-border/70 bg-card shadow-sm">
      <CardContent class="flex flex-col gap-3 px-3 py-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="text-sm font-medium text-foreground flex items-center gap-1">
            <Eye class="h-4 w-4 text-foreground" />
            Visão executiva do negócio
          </div>
          <p class="text-xs text-muted-foreground truncate max-w-[500px]">
            {{ periodoDescricao }} • {{ resumoModulosLabel }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink v-for="action in visibleQuickActions" :key="action.titulo" :to="action.link">
            <Button variant="outline" class="gap-2">
              <component :is="action.icon" class="h-4 w-4" />
              {{ action.titulo }}
            </Button>
          </RouterLink>
        </div>
      </CardContent>
    </Card>

    <section v-if="metasSlider.length" class="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <div class="mb-2 flex items-center justify-between gap-3">
        <div>
          <p class="flex items-center gap-2 text-sm font-medium text-foreground">
            <Target class="h-4 w-4 text-foreground" />
            Metas em andamento
          </p>
          <p class="text-xs text-muted-foreground">Acompanhamento discreto do período atual.</p>
        </div>
        <RouterLink to="/metas">
          <Button variant="outline" size="sm" class="gap-1">
            Ver metas
            <ChevronRight class="h-4 w-4" />
          </Button>
        </RouterLink>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-1">
        <RouterLink v-for="meta in metasSlider" :key="meta.id" to="/metas"
          class="min-w-[240px] flex-1 rounded-xl border bg-background/60 p-3 transition hover:border-primary/40">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-foreground">{{ meta.nome }}</p>
              <p class="text-xs text-muted-foreground">{{ getMetaTipoLabel(meta) }} • {{ meta.periodoAtual.label }}</p>
            </div>
            <Badge class="px-2 rounded-sm" :class="meta.atingida ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'">
              {{ meta.atingida ? '100%' : `${meta.percentual}%` }}
            </Badge>
          </div>
          <div class="mt-1 h-1 rounded-full bg-muted">
            <div class="h-2 rounded-full" :class="meta.atingida ? 'bg-emerald-500' : 'bg-primary'"
              :style="{ width: `${Math.min(meta.percentual, 100)}%` }" />
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            {{ formatMetaValue(meta, meta.valorAtual) }} de {{ formatMetaValue(meta, meta.valorAlvo) }}
          </p>
        </RouterLink>
      </div>
    </section>

    <AutoGrid v-if="loading" :items="kpis" :min="200">
      <Skeleton class="h-[152px] w-full rounded-2xl" />
    </AutoGrid>

    <AutoGrid v-else :items="kpis" :min="200" v-slot="{ item }">
      <RouterLink :to="item.link || '/'" class="block h-full">
        <Card
          class="h-full rounded-2xl border-border/70 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md">
          <CardHeader class="py-3">
            <CardTitle class="flex items-center gap-3 text-sm text-foreground">
              <span class="rounded-xl p-2" :class="item.colorClass">
                <component :is="item.icone" class="h-4 w-4" />
              </span>
              <span>{{ item.titulo }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-1 pb-3">
            <p class="text-lg font-semibold text-foreground md:text-xl">
              <component v-if="(typeof item.valor !== 'string')" :is="item.valor" class="h-5 w-5 my-1.5" />
              <span v-else>{{ item.valor }}</span>
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">{{ item.detalhe }}</p>
          </CardContent>
        </Card>
      </RouterLink>
    </AutoGrid>

    <div v-if="loading" class="grid grid-cols-1 gap-4 lg:grid-cols-6">
      <div class="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm lg:col-span-4">
        <Skeleton class="h-6 w-44 rounded-lg" />
        <div class="grid gap-3 md:grid-cols-2">
          <Skeleton v-for="i in 4" :key="i" class="h-20 rounded-xl" />
        </div>
      </div>
      <div class="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm lg:col-span-2">
        <Skeleton class="h-6 w-40 rounded-lg" />
        <Skeleton class="h-9 w-24 rounded-lg" />
        <Skeleton class="h-24 w-full rounded-xl" />
        <Skeleton class="h-9 w-full rounded-lg" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-6">
      <!-- Sem "Tendência comercial" ao lado (conta sem vendas), os alertas ocupam a linha
           inteira em vez de deixar 2 colunas vazias. -->
      <Card class="border-border/70 bg-card shadow-sm" :class="modulos.vendas ? 'lg:col-span-4' : 'lg:col-span-6'">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <AlertTriangle class="h-5 w-5 text-amber-600" />
            Centro de alertas
          </CardTitle>
          <CardDescription>Prioridades operacionais para revisão rápida.</CardDescription>
        </CardHeader>
        <CardContent>
          <AutoGrid :items="alerts" :max="2" :min="260" :gap="12" v-slot="{ item: alert }">
            <div class="h-full rounded-xl border px-4 py-2" :class="getAlertClasses(alert.tone)">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium text-foreground">{{ alert.titulo }}</p>
                  <p class="mt-1 text-sm text-muted-foreground">{{ alert.descricao }}</p>
                </div>
                <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <RouterLink v-if="alert.link" :to="alert.link"
                class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary dark:text-blue-500">
                {{ alert.cta || 'Abrir' }}
                <ChevronRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </AutoGrid>
        </CardContent>
      </Card>

      <Card v-if="modulos.vendas" class="border-border/70 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <TrendingUp class="h-5 w-5 text-green-600" />
            Tendência comercial
          </CardTitle>
          <CardDescription>
            {{ dashboardResumo?.data?.percentageByLastMonth >= 0 ? 'Crescimento' : 'Queda' }} frente ao mês anterior.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex gap-2 flex-col">
          <div>
            <p class="text-3xl font-semibold text-foreground">
              {{ dashboardResumo?.data?.percentageByLastMonth?.toFixed?.(1) || 0 }}%
            </p>
            <p class="text-sm text-muted-foreground">Comparação do faturamento com o mês anterior.</p>
          </div>
          <div class="space-y-2 rounded-xl border border-border/70 bg-muted/10 p-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Vendas totais</span>
              <span class="font-medium text-foreground">{{ vendasResumo?.totalVendas || 0 }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Vendas em aberto</span>
              <span class="font-medium text-foreground">{{ vendasResumo?.totalAberto || 0 }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Orçamentos</span>
              <span class="font-medium text-foreground">{{ vendasResumo?.totalOrcamento || 0 }}</span>
            </div>
          </div>
          <RouterLink to="/vendas/dashboard">
            <Button variant="outline" class="w-full">Abrir painel de vendas</Button>
          </RouterLink>
        </CardContent>
      </Card>
    </div>

    <AutoGrid v-if="loading" :items="summaryBlocks" :min="260">
      <div class="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <Skeleton class="h-6 w-32 rounded-lg" />
        <Skeleton class="h-4 w-40 rounded" />
        <Skeleton v-for="j in 3" :key="j" class="h-10 w-full rounded-lg" />
        <Skeleton class="h-9 w-full rounded-lg" />
      </div>
    </AutoGrid>

    <AutoGrid v-else :items="summaryBlocks" :min="260" v-slot="{ item: block }">
      <Card class="h-full border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <component :is="block.icone" class="h-5 w-5 text-primary" />
            {{ block.titulo }}
          </CardTitle>
          <CardDescription>{{ block.descricao }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="metric in block.metrics" :key="metric.label"
            class="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm">
            <span class="text-muted-foreground">{{ metric.label }}</span>
            <component v-if="(typeof metric.value !== 'string')" :is="metric.value" class="h-5 w-5" />
            <span v-else class="font-medium text-foreground">{{ metric.value }}</span>
          </div>
          <RouterLink :to="block.link">
            <Button variant="outline" class="mt-1 w-full">Ver mais</Button>
          </RouterLink>
        </CardContent>
      </Card>
    </AutoGrid>

    <AutoGrid v-if="loading" :items="charts" :max="2" :min="380">
      <div class="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <Skeleton class="h-6 w-44 rounded-lg" />
        <Skeleton class="h-4 w-56 rounded" />
        <Skeleton class="h-64 w-full rounded-xl" />
      </div>
    </AutoGrid>

    <AutoGrid v-else :items="charts" :max="2" :min="380" v-slot="{ item: chart }">
      <Card class="h-full border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <component :is="chart.icone" class="h-5 w-5" :class="chart.iconClass" />
            {{ chart.titulo }}
          </CardTitle>
          <CardDescription>{{ chart.descricao }}</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Top produtos: lista ranqueada com barras de progresso -->
          <div v-if="chart.tipo === 'ranking'">
            <div v-if="!chart.data.length" class="flex h-72 items-center justify-center text-sm text-muted-foreground">
              Sem itens vendidos no período.
            </div>
            <ul v-else class="space-y-3">
              <li v-for="(item, i) in chart.data" :key="i" class="space-y-1">
                <div class="flex items-center justify-between gap-2 text-sm">
                  <span class="flex min-w-0 items-center gap-2">
                    <span
                      class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{{
                      mapperIndex(i) }}</span>
                    <span class="truncate font-medium" :title="item.nome">{{ item.nome }}</span>
                  </span>
                  <span class="shrink-0 text-xs text-muted-foreground">{{ item.qtd }} un</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div class="h-full rounded-full bg-primary" :style="{ width: `${item.pct}%` }" />
                </div>
              </li>
            </ul>
          </div>
          <div v-else class="h-72">
            <LineChart v-if="chart.tipo === 'line'" :data="chart.data" :options="chart.options" />
            <BarChart v-else :data="chart.data" :options="chart.options" />
          </div>
        </CardContent>
      </Card>
    </AutoGrid>

    <MobileBottomBar v-if="uiStore.isMobile">
      <RouterLink v-for="item in mobileLinks" :key="item.titulo" :to="item.link">
        <button type="button"
          class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
          <component :is="item.icon" class="h-5 w-5" />
          <span class="text-xs">{{ item.titulo }}</span>
        </button>
      </RouterLink>
      <button type="button" @click="uiStore.openSidebar = true"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Menu class="h-5 w-5" />
        <span class="text-xs">Menu</span>
      </button>
    </MobileBottomBar>

    <ModalView v-model:open="openModalFiltros" title="Período personalizado" size="lg">
      <div class="space-y-4">
        <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="openModalFiltros = false">Cancelar</Button>
          <Button size="sm" @click="aplicarCustom">Aplicar</Button>
        </div>
      </div>
    </ModalView>

    <!-- Análise do período com IA -->
    <ModalView v-model:open="insightsIa.open" title="Análise com IA" :icon="Sparkles" size="xl"
      :description="`Panorama do período: ${periodoDescricao}`">
      <div class="px-1">
        <div v-if="insightsIa.loading" class="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <LoaderCircle class="h-4 w-4 animate-spin" /> Analisando os indicadores do período...
        </div>
        <div v-else class="ia-markdown max-h-[65vh] overflow-y-auto text-sm leading-relaxed" v-html="insightsHtml" />
      </div>
    </ModalView>
  </div>
</template>

<style scoped>
.ia-markdown :deep(h2) {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.75rem 0 0.35rem;
}

.ia-markdown :deep(h3) {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.65rem 0 0.3rem;
}

.ia-markdown :deep(h4) {
  font-weight: 600;
  margin: 0.5rem 0 0.25rem;
}

.ia-markdown :deep(p) {
  margin: 0.35rem 0;
}

.ia-markdown :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.35rem 0;
}

.ia-markdown :deep(li) {
  margin: 0.15rem 0;
}
</style>
