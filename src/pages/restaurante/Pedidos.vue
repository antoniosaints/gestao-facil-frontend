<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { vMaska } from 'maska/vue'
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useToast } from 'vue-toastification'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import PedidoDetalhesDialog from './PedidoDetalhesDialog.vue'
import PedidoManualDialog from './PedidoManualDialog.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RestauranteRepository,
  type RestauranteLocalizacao,
  type RestaurantePedido,
  type RestaurantePedidoStatus,
  type RestauranteEstacaoImpressao,
} from '@/repositories/restaurante-repository'
import { WhatsAppRepository } from '@/repositories/whatsapp-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { useConfirm } from '@/composables/useConfirm'
import { calculateRestaurantRoadRoute, type RoadRoute } from '@/utils/restaurantRoadRouting'
import { formatCurrencyBR } from '@/utils/formatters'
import { phoneMaskOptions } from '@/lib/imaska'
import { restaurantMapIcons } from './restaurantMapIcons'
import {
  ChefHat,
  CircleCheckBig,
  CircleX,
  Columns3,
  Clock3,
  FileTextIcon,
  Filter,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  TableProperties,
} from 'lucide-vue-next'

type PeriodPreset = 'today' | 'month' | 'all' | 'custom'

const toast = useToast()
const confirm = useConfirm()
const uiStore = useUiStore()
const router = useRouter()
const canOperate = computed(() => uiStore.hasRestaurantCapability('PEDIDOS_OPERAR'))
const canLinkTableOrder = computed(() => uiStore.hasRestaurantCapability('SALAO_OPERAR'))
const canConfigure = computed(() => uiStore.hasRestaurantCapability('CONFIGURACOES_GERENCIAR'))
const canViewKds = computed(() => uiStore.hasRestaurantCapability('KDS_VISUALIZAR'))
const canPrint = computed(() => uiStore.hasRestaurantCapability('IMPRESSAO_VISUALIZAR'))
const loading = ref(true)
const loadingMore = ref(false)
const pedidos = ref<RestaurantePedido[]>([])
const busca = ref('')
const atualizando = ref<number | null>(null)
const page = ref(1)
const pages = ref(1)
const total = ref(0)
const openModalFiltros = ref(false)
const openModalDetalhes = ref(false)
const openModalRota = ref(false)
const openModalPedidoManual = ref(false)
const openModalEditarCliente = ref(false)
const openModalEditarItens = ref(false)
const openModalImpressao = ref(false)
const abrindoChat = ref(false)
const salvandoCliente = ref(false)
const pedidoSelecionado = ref<RestaurantePedido | null>(null)
const localizacaoEmpresa = ref<RestauranteLocalizacao | null>(null)
const pedidoRota = ref<RestaurantePedido | null>(null)
const mapElement = ref<HTMLElement | null>(null)
const routeLoading = ref(false)
const routeSummary = ref<Pick<RoadRoute, 'distance' | 'duration'> | null>(null)
const pedidoParaImpressao = ref<RestaurantePedido | null>(null)
const estacoesImpressao = ref<RestauranteEstacaoImpressao[]>([])
const estacoesSelecionadas = ref<number[]>([])
const imprimindo = ref(false)
const pedidoArrastado = ref<RestaurantePedido | null>(null)
const atendimentoDisponivel = computed(() => uiStore.hasActiveModule('atendimento'))
const podeEditarClienteSelecionado = computed(
  () =>
    canOperate.value && !['CONCLUIDO', 'CANCELADO'].includes(pedidoSelecionado.value?.status || ''),
)
const podeEditarItensSelecionado = computed(() => {
  const pedido = pedidoSelecionado.value
  return Boolean(
    canOperate.value &&
      pedido &&
      ['RECEBIDO', 'CONFIRMADO'].includes(pedido.status) &&
      pedido.origem !== 'MESA' &&
      pedido.pagamentoStatus !== 'PAGO',
  )
})
const clienteEdicao = ref({ nome: '', telefone: '', email: '' })

let routeMap: L.Map | null = null
let routeLayers: L.LayerGroup | null = null
let routeAbortController: AbortController | null = null

const presets: Array<{ key: Exclude<PeriodPreset, 'custom'>; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'month', label: 'Mês' },
  { key: 'all', label: 'Geral' },
]
const periodoStorageKey = 'gestao_facil:restaurante:pedidos-periodo'

function intervaloDoPreset(preset: Exclude<PeriodPreset, 'custom' | 'all'>) {
  const hoje = new Date()
  return preset === 'month'
    ? ([startOfMonth(hoje), endOfMonth(hoje)] as [Date, Date])
    : ([startOfDay(hoje), endOfDay(hoje)] as [Date, Date])
}

function periodoSalvo() {
  const padrao = { preset: 'today' as PeriodPreset, intervalo: intervaloDoPreset('today') }
  try {
    const saved = JSON.parse(localStorage.getItem(periodoStorageKey) || '{}')
    if (!['today', 'month', 'all', 'custom'].includes(saved?.preset)) return padrao
    if (saved.preset === 'all')
      return { preset: 'all' as PeriodPreset, intervalo: padrao.intervalo }
    if (saved.preset === 'custom') {
      const inicio = new Date(saved.inicio)
      const fim = new Date(saved.fim)
      if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime()) && inicio <= fim) {
        return { preset: 'custom' as PeriodPreset, intervalo: [inicio, fim] as [Date, Date] }
      }
      return padrao
    }
    return { preset: saved.preset as PeriodPreset, intervalo: intervaloDoPreset(saved.preset) }
  } catch {
    return padrao
  }
}

const periodoInicial = periodoSalvo()
const presetAtivo = ref<PeriodPreset>(periodoInicial.preset)
const filtroPeriodo = ref<[Date, Date]>(periodoInicial.intervalo)

function salvarPeriodo() {
  const [inicio, fim] = filtroPeriodo.value
  localStorage.setItem(
    periodoStorageKey,
    JSON.stringify({
      preset: presetAtivo.value,
      ...(presetAtivo.value === 'custom'
        ? { inicio: inicio.toISOString(), fim: fim.toISOString() }
        : {}),
    }),
  )
}

const statusLabels: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

const statusBadgeClasses: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO:
    'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-200',
  CONFIRMADO:
    'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300',
  EM_PREPARO:
    'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300',
  PRONTO:
    'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300',
  CONCLUIDO:
    'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-300',
  CANCELADO:
    'border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/15 dark:text-red-300',
}

const statusColumnClasses: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO: 'border-t-slate-500 bg-slate-500/[0.035] dark:bg-slate-400/[0.06]',
  CONFIRMADO: 'border-t-blue-500 bg-blue-500/[0.035] dark:bg-blue-400/[0.06]',
  EM_PREPARO: 'border-t-amber-500 bg-amber-500/[0.04] dark:bg-amber-400/[0.07]',
  PRONTO: 'border-t-emerald-500 bg-emerald-500/[0.035] dark:bg-emerald-400/[0.06]',
  CONCLUIDO: 'border-t-violet-500 bg-violet-500/[0.035] dark:bg-violet-400/[0.06]',
  CANCELADO: 'border-t-red-500 bg-red-500/[0.035] dark:bg-red-400/[0.06]',
}

function statusBadgeClass(status: RestaurantePedidoStatus) {
  return statusBadgeClasses[status]
}

function statusColumnClass(status: RestaurantePedidoStatus) {
  return statusColumnClasses[status]
}
const statusOptions = Object.keys(statusLabels) as RestaurantePedidoStatus[]
const statusStorageKey = 'gestao_facil:restaurante:pedidos-status'
const visualizacaoStorageKey = 'gestao_facil:restaurante:pedidos-visualizacao'
type VisualizacaoPedidos = 'cards' | 'kanban'

function visualizacaoSalva(): VisualizacaoPedidos {
  try {
    return localStorage.getItem(visualizacaoStorageKey) === 'kanban' ? 'kanban' : 'cards'
  } catch {
    return 'cards'
  }
}

const visualizacao = ref<VisualizacaoPedidos>(visualizacaoSalva())
const kanbanStatuses = statusOptions.filter((status) => status !== 'CANCELADO')

function alterarVisualizacao(value: VisualizacaoPedidos) {
  visualizacao.value = value
  localStorage.setItem(visualizacaoStorageKey, value)
}

function statusesSalvos() {
  try {
    const saved = JSON.parse(localStorage.getItem(statusStorageKey) || '[]')
    const valid = Array.isArray(saved)
      ? saved.filter((status): status is RestaurantePedidoStatus => statusOptions.includes(status))
      : []
    return valid.length ? [...new Set(valid)] : [...statusOptions]
  } catch {
    return [...statusOptions]
  }
}

const statusSelecionados = ref<RestaurantePedidoStatus[]>(statusesSalvos())
const statusFiltroLabel = computed(() => {
  if (statusSelecionados.value.length === statusOptions.length) return 'Todos os status'
  if (statusSelecionados.value.length === 1) return statusLabels[statusSelecionados.value[0]]
  return `${statusSelecionados.value.length} status selecionados`
})
const nextStatus: Partial<Record<RestaurantePedidoStatus, RestaurantePedidoStatus>> = {
  RECEBIDO: 'CONFIRMADO',
  CONFIRMADO: 'EM_PREPARO',
  EM_PREPARO: 'PRONTO',
  PRONTO: 'CONCLUIDO',
}
const nextLabel: Partial<Record<RestaurantePedidoStatus, string>> = {
  RECEBIDO: 'Confirmar pedido',
  CONFIRMADO: 'Iniciar preparo',
  EM_PREPARO: 'Marcar pronto',
  PRONTO: 'Concluir',
}

const filtroLabel = computed(() => {
  if (presetAtivo.value === 'today') return 'Pedidos de hoje'
  if (presetAtivo.value === 'month') return 'Pedidos deste mês'
  if (presetAtivo.value === 'all') return 'Todos os pedidos'
  const [inicio, fim] = filtroPeriodo.value
  return `${format(inicio, 'dd/MM/yyyy')} até ${format(fim, 'dd/MM/yyyy')}`
})

const filtrados = computed(() => {
  const term = busca.value.trim().toLocaleLowerCase('pt-BR')
  if (!term) return pedidos.value
  return pedidos.value.filter((pedido) =>
    [pedido.codigo, pedido.clienteNomeSnapshot, pedido.clienteTelefone, pedido.Mesa?.nome].some(
      (value) => value?.toLocaleLowerCase('pt-BR').includes(term),
    ),
  )
})

function periodoQuery() {
  if (presetAtivo.value === 'all') return {}
  const [inicio, fim] = filtroPeriodo.value
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

async function carregar({ feedback = false, append = false } = {}) {
  try {
    if (append) loadingMore.value = true
    else loading.value = true
    const response = await RestauranteRepository.pedidos({
      page: page.value,
      limit: 30,
      ...(statusSelecionados.value.length < statusOptions.length
        ? { status: statusSelecionados.value.join(',') }
        : {}),
      ...periodoQuery(),
    })
    pedidos.value = append ? [...pedidos.value, ...response.data] : response.data
    pages.value = response.meta.pages
    total.value = response.meta.total
    localizacaoEmpresa.value = response.meta.localizacaoEmpresa || null
    if (feedback) toast.info('Pedidos atualizados')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar os pedidos.')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function recarregar(feedback = false) {
  page.value = 1
  return carregar({ feedback })
}

function aplicarPreset(preset: Exclude<PeriodPreset, 'custom'>) {
  presetAtivo.value = preset
  if (preset !== 'all') filtroPeriodo.value = intervaloDoPreset(preset)
  salvarPeriodo()
  openModalFiltros.value = false
  recarregar()
}

function aplicarPeriodoPersonalizado() {
  presetAtivo.value = 'custom'
  salvarPeriodo()
  openModalFiltros.value = false
  recarregar()
}

function carregarMais() {
  if (loadingMore.value || page.value >= pages.value) return
  page.value += 1
  carregar({ append: true })
}

function atualizarStatus(status: RestaurantePedidoStatus, selecionado: boolean) {
  const atual = statusSelecionados.value
  if (!selecionado && atual.length === 1) {
    toast.info('Selecione ao menos um status para exibir pedidos.')
    return
  }
  statusSelecionados.value = selecionado
    ? [...new Set([...atual, status])]
    : atual.filter((item) => item !== status)
  localStorage.setItem(statusStorageKey, JSON.stringify(statusSelecionados.value))
  recarregar()
}

function selecionarTodosStatus() {
  statusSelecionados.value = [...statusOptions]
  localStorage.setItem(statusStorageKey, JSON.stringify(statusSelecionados.value))
  recarregar()
}

async function avancar(pedido: RestaurantePedido) {
  const proximo = nextStatus[pedido.status]
  if (!proximo) return
  await moverParaStatus(pedido, proximo)
}

async function moverParaStatus(pedido: RestaurantePedido, proximo: RestaurantePedidoStatus) {
  if (nextStatus[pedido.status] !== proximo) {
    toast.info('Avance um status por vez para manter o fluxo de produção.')
    return
  }
  if (
    proximo === 'CONCLUIDO' &&
    pedido.origem === 'DELIVERY' &&
    pedido.entregaStatus !== 'ENTREGUE'
  ) {
    toast.info('Não é possível concluir este pedido: o entregador ainda não confirmou a entrega.')
    return
  }
  try {
    atualizando.value = pedido.id
    const atualizado = await RestauranteRepository.transicionar(pedido.id, proximo, pedido.version)
    pedidos.value = pedidos.value.map((item) => (item.id === atualizado.id ? atualizado : item))
    if (pedidoSelecionado.value?.id === atualizado.id) pedidoSelecionado.value = atualizado
    toast.success('Status do pedido atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar o pedido.')
    if (error?.response?.status === 409) await recarregar()
  } finally {
    atualizando.value = null
  }
}

function iniciarArraste(pedido: RestaurantePedido) {
  if (!canOperate.value || !proximoDisponivel(pedido)) return
  pedidoArrastado.value = pedido
}

async function soltarNoKanban(status: RestaurantePedidoStatus) {
  const pedido = pedidoArrastado.value
  pedidoArrastado.value = null
  if (!pedido || pedido.status === status) return
  await moverParaStatus(pedido, status)
}

async function abrirImpressao(pedido: RestaurantePedido) {
  if (!podeImprimirPedido(pedido))
    return toast.info('O pedido só pode ser impresso depois de confirmado.')
  try {
    const [stations, rules] = await Promise.all([
      RestauranteRepository.estacoesImpressao(),
      RestauranteRepository.regrasImpressao(),
    ])
    const ticketPointIds = new Set((pedido.tickets || []).map((ticket) => ticket.pontoId))
    const allowedStationIds = pedido.tickets?.length
      ? new Set(
          rules
            .filter((rule) => rule.ativa && ticketPointIds.has(rule.pontoId))
            .flatMap((rule) => [
              rule.estacaoId,
              ...rule.destinos.map((destination) => destination.estacaoId),
            ]),
        )
      : null
    estacoesImpressao.value = stations.filter(
      (station) => station.ativa && (!allowedStationIds || allowedStationIds.has(station.id)),
    )
    if (!estacoesImpressao.value.length)
      return toast.info(
        pedido.tickets?.length
          ? 'Não há conector de impressão configurado para os pontos deste pedido.'
          : 'Não há conector de impressão ativo neste restaurante.',
      )
    pedidoParaImpressao.value = pedido
    estacoesSelecionadas.value = estacoesImpressao.value.map((station) => station.id)
    openModalImpressao.value = true
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message ||
        'Não foi possível carregar os conectores de impressão.',
    )
  }
}

function alternarEstacaoImpressao(id: number, checked: unknown) {
  const selected = new Set(estacoesSelecionadas.value)
  if (checked === true) selected.add(id)
  else selected.delete(id)
  estacoesSelecionadas.value = [...selected]
}

function alterarEstacaoImpressao(id: number, event: Event) {
  alternarEstacaoImpressao(id, event.target instanceof HTMLInputElement && event.target.checked)
}

async function imprimirPedido() {
  if (!pedidoParaImpressao.value || !estacoesSelecionadas.value.length)
    return toast.info('Selecione ao menos um conector.')
  try {
    imprimindo.value = true
    const jobs = await RestauranteRepository.imprimirPedido(
      pedidoParaImpressao.value.id,
      estacoesSelecionadas.value,
    )
    openModalImpressao.value = false
    toast.success(`${jobs.length} trabalho(s) de impressão enfileirado(s).`)
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível enviar o pedido para impressão.',
    )
  } finally {
    imprimindo.value = false
  }
}

function podeCancelar(pedido: RestaurantePedido) {
  return !['CANCELADO', 'CONCLUIDO'].includes(pedido.status)
}

function podeImprimirPedido(pedido: RestaurantePedido) {
  return ['CONFIRMADO', 'EM_PREPARO', 'PRONTO', 'CONCLUIDO'].includes(pedido.status)
}

function aguardandoPagamentoOnline(pedido: RestaurantePedido) {
  return (
    pedido.status === 'RECEBIDO' &&
    pedido.pagamentoStatus === 'PENDENTE' &&
    ['PIX', 'CHECKOUT_PRO'].includes(pedido.pagamentoMetodoSnapshot || '')
  )
}

async function cancelar(pedido: RestaurantePedido) {
  const confirmed = await confirm.confirm({
    title: 'Cancelar pedido',
    message: `Deseja cancelar o pedido ${pedido.codigo}? Esta ação não pode ser desfeita.`,
    confirmText: 'Cancelar pedido',
  })
  if (!confirmed) return
  try {
    atualizando.value = pedido.id
    const atualizado = await RestauranteRepository.transicionar(
      pedido.id,
      'CANCELADO',
      pedido.version,
    )
    pedidos.value = pedidos.value.map((item) => (item.id === atualizado.id ? atualizado : item))
    if (pedidoSelecionado.value?.id === atualizado.id) pedidoSelecionado.value = atualizado
    toast[atualizado.status === 'CANCELADO' ? 'success' : 'info'](
      atualizado.status === 'CANCELADO'
        ? 'Pedido cancelado.'
        : 'Cancelamento registrado para revisão financeira.',
    )
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível cancelar o pedido.')
    if (error?.response?.status === 409) await recarregar()
  } finally {
    atualizando.value = null
  }
}

function proximoDisponivel(pedido: RestaurantePedido) {
  if (pedido.tickets?.length && ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status))
    return undefined
  return nextStatus[pedido.status]
}

function abrirDetalhes(pedido: RestaurantePedido) {
  pedidoSelecionado.value = pedido
  openModalDetalhes.value = true
}

function atualizarPedidoLocal(atualizado: RestaurantePedido) {
  pedidos.value = pedidos.value.map((item) => (item.id === atualizado.id ? atualizado : item))
  pedidoSelecionado.value = atualizado
}

function abrirEdicaoCliente(pedido: RestaurantePedido) {
  clienteEdicao.value = {
    nome: pedido.clienteNomeSnapshot || '',
    telefone: pedido.clienteTelefone || '',
    email: pedido.clienteEmail || '',
  }
  openModalEditarCliente.value = true
}

function abrirEdicaoItens() {
  openModalEditarItens.value = true
}

async function salvarClientePedido() {
  const pedido = pedidoSelecionado.value
  if (!pedido) return
  try {
    salvandoCliente.value = true
    const atualizado = await RestauranteRepository.atualizarClientePedido(pedido.id, {
      clienteNome: clienteEdicao.value.nome.trim() || null,
      clienteTelefone: clienteEdicao.value.telefone.trim() || null,
      clienteEmail: clienteEdicao.value.email.trim() || null,
      version: pedido.version,
    })
    atualizarPedidoLocal(atualizado)
    openModalEditarCliente.value = false
    toast.success('Dados do cliente atualizados')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar o cliente.')
    if (error?.response?.status === 409) await recarregar()
  } finally {
    salvandoCliente.value = false
  }
}

async function abrirChatPedido(pedido: RestaurantePedido) {
  const telefone = pedido.clienteTelefone?.trim()
  if (!telefone) {
    toast.info('Este pedido não possui telefone para iniciar o atendimento.')
    return
  }
  try {
    abrindoChat.value = true
    const conversa = await WhatsAppRepository.startConversation({
      phone: telefone,
      nome: pedido.clienteNomeSnapshot || undefined,
    })
    await router.push({ name: 'atendimento', query: { conversa: String(conversa.id) } })
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível abrir o chat deste cliente.')
  } finally {
    abrindoChat.value = false
  }
}

function dataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function origemLabel(origem: string) {
  return origem.replace(/_/g, ' ')
}

function enderecoFormatado(pedido: RestaurantePedido) {
  const endereco = pedido.enderecoSnapshotJson
  if (!endereco) return ''
  return [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.complemento,
    endereco.bairro,
    [endereco.cidade, endereco.uf].filter(Boolean).join(' - '),
    endereco.cep,
    endereco.referencia ? `Ref.: ${endereco.referencia}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function customerCoordinates(pedido: RestaurantePedido): L.LatLngTuple | null {
  const endereco = pedido.enderecoSnapshotJson
  if (!Number.isFinite(endereco?.latitude) || !Number.isFinite(endereco?.longitude)) return null
  return [Number(endereco!.latitude), Number(endereco!.longitude)]
}

function routeMarker(_label: string, className: string) {
  return className.includes('--origin')
    ? restaurantMapIcons.restaurante
    : restaurantMapIcons.cliente
}

function formatRouteSummary(route: Pick<RoadRoute, 'distance' | 'duration'>) {
  const distance =
    route.distance >= 1000
      ? `${(route.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`
      : `${Math.round(route.distance)} m`
  return `${distance} · ${Math.max(1, Math.round(route.duration / 60))} min`
}

function initializeRouteMap() {
  if (!mapElement.value || routeMap) return
  routeMap = L.map(mapElement.value, { zoomControl: true, preferCanvas: true }).setView(
    [-14.235, -51.9253],
    4,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(routeMap)
  routeLayers = L.layerGroup().addTo(routeMap)
}

async function renderRouteModal() {
  const pedido = pedidoRota.value
  const origem = localizacaoEmpresa.value
  const destino = pedido && customerCoordinates(pedido)
  if (!pedido || !origem || !destino || !routeMap || !routeLayers) return

  routeAbortController?.abort()
  const controller = new AbortController()
  routeAbortController = controller
  routeLoading.value = true
  routeSummary.value = null
  routeLayers.clearLayers()
  const origemCoordenadas: L.LatLngTuple = [origem.latitude, origem.longitude]
  const bounds = L.latLngBounds([origemCoordenadas, destino])
  L.marker(origemCoordenadas, { icon: routeMarker('⌂', 'route-modal-map-pin--origin') })
    .bindPopup('Empresa')
    .addTo(routeLayers)
  L.marker(destino, { icon: routeMarker('⌖', 'route-modal-map-pin--destination') })
    .bindPopup(enderecoFormatado(pedido))
    .addTo(routeLayers)

  try {
    const route = await calculateRestaurantRoadRoute(origemCoordenadas, destino, controller.signal)
    if (controller.signal.aborted || !routeMap || !routeLayers) return
    const layer = L.geoJSON(route.geometry, {
      style: { color: '#2563eb', weight: 4, opacity: 0.9 },
    }).addTo(routeLayers)
    const routeBounds = layer.getBounds()
    if (routeBounds.isValid()) bounds.extend(routeBounds)
    routeSummary.value = route
  } catch (error) {
    if (!controller.signal.aborted) toast.error('Não foi possível calcular a rota pelas ruas.')
  } finally {
    if (!controller.signal.aborted) {
      routeLoading.value = false
      routeMap?.fitBounds(bounds, { padding: [44, 44], maxZoom: 15 })
    }
  }
}

async function abrirRota(pedido: RestaurantePedido) {
  if (!localizacaoEmpresa.value)
    return toast.info('Informe a localização da empresa nas configurações do Restaurante.')
  if (!customerCoordinates(pedido))
    return toast.info('Este pedido não possui a localização enviada pelo cliente.')
  pedidoRota.value = pedido
  openModalRota.value = true
  await nextTick()
  initializeRouteMap()
  routeMap?.invalidateSize()
  await renderRouteModal()
}

function handleRouteModalChange(open: boolean) {
  if (open) return
  routeAbortController?.abort()
  routeAbortController = null
  routeMap?.remove()
  routeMap = null
  routeLayers = null
  routeSummary.value = null
}

useSocketEvent('restaurante:pedido', () => {
  void recarregar()
})

onMounted(() => recarregar())

onBeforeUnmount(() => handleRouteModalChange(false))
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FileTextIcon class="h-6 w-6 text-primary dark:text-primary-foreground" />Pedidos
        </h1>
        <p class="text-sm text-muted-foreground">{{ filtroLabel }} · {{ total }} no período</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="
              presetAtivo === preset.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            "
            @click="aplicarPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>
        <Button variant="outline" size="sm" @click="openModalFiltros = true">
          <Filter class="mr-1.5 h-4 w-4" />Período
        </Button>
        <div class="flex rounded-lg border bg-card p-1" aria-label="Visualização dos pedidos">
          <Button
            size="icon"
            variant="ghost"
            class="h-7 w-7"
            :class="visualizacao === 'cards' ? 'bg-muted' : ''"
            aria-label="Visualizar em cards"
            @click="alterarVisualizacao('cards')"
            ><TableProperties class="h-4 w-4"
          /></Button>
          <Button
            size="icon"
            variant="ghost"
            class="h-7 w-7"
            :class="visualizacao === 'kanban' ? 'bg-muted' : ''"
            aria-label="Visualizar em kanban"
            @click="alterarVisualizacao('kanban')"
            ><Columns3 class="h-4 w-4"
          /></Button>
        </div>
        <Button v-if="canOperate" size="sm" @click="openModalPedidoManual = true"
          ><Plus class="mr-1.5 h-4 w-4" />Novo pedido</Button
        >
        <Button
          variant="outline"
          size="icon"
          class="h-9 w-9"
          :disabled="loading"
          @click="recarregar(true)"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="sr-only">Atualizar pedidos</span>
        </Button>
        <Button v-if="canConfigure" as-child variant="outline" size="sm">
          <RouterLink to="/restaurante/configuracoes"
            ><Settings2 class="mr-1.5 h-4 w-4" />Configurar</RouterLink
          >
        </Button>
      </div>
    </header>

    <div class="grid gap-3 sm:grid-cols-[1fr_240px]">
      <div class="relative">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="busca"
          class="pl-9"
          placeholder="Buscar nesta lista por código, cliente, telefone ou mesa"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="w-full justify-between font-normal">
            {{ statusFiltroLabel }}
            <Filter class="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-60">
          <DropdownMenuLabel>Status exibidos</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-for="item in statusOptions"
            :key="item"
            :model-value="statusSelecionados.includes(item)"
            @select.prevent
            @update:model-value="(selecionado) => atualizarStatus(item, Boolean(selecionado))"
          >
            {{ statusLabels[item] }}
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <button
            type="button"
            class="flex w-full items-center px-2 py-1.5 text-left text-sm text-primary hover:bg-accent dark:text-primary-foreground"
            :disabled="statusSelecionados.length === statusOptions.length"
            @click="selecionarTodosStatus"
          >
            Selecionar todos
          </button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-48 rounded-xl" />
    </div>
    <div v-else-if="!filtrados.length" class="rounded-xl border border-dashed p-10 text-center">
      <ShoppingBag class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      <p class="font-medium">Nenhum pedido encontrado</p>
      <p class="text-sm text-muted-foreground">
        Ajuste o período ou os filtros para consultar outros pedidos.
      </p>
    </div>
    <div
      v-else-if="visualizacao === 'cards'"
      class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
    >
      <Card
        v-for="pedido in filtrados"
        :key="pedido.id"
        role="button"
        tabindex="0"
        class="flex cursor-pointer flex-col rounded-xl transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="abrirDetalhes(pedido)"
        @keydown.enter="abrirDetalhes(pedido)"
        @keydown.space.prevent="abrirDetalhes(pedido)"
      >
        <CardHeader class="p-4 pb-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <CardTitle class="text-base">{{ pedido.codigo }}</CardTitle>
              <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 class="h-3.5 w-3.5" />{{ dataHora(pedido.createdAt) }} ·
                {{ origemLabel(pedido.origem) }}
              </p>
            </div>
            <Badge variant="outline" :class="statusBadgeClass(pedido.status)">
              {{ statusLabels[pedido.status] }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="flex-1 space-y-2 px-4 pb-3">
          <div class="space-y-1 text-sm">
            <Badge v-if="aguardandoPagamentoOnline(pedido)" variant="secondary" class="w-fit"
              >Online · aguardando pagamento</Badge
            >
            <div v-for="item in pedido.itens" :key="item.id" class="flex justify-between gap-3">
              <span class="min-w-0 truncate"
                >{{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}</span
              >
              <span class="shrink-0 text-muted-foreground">{{
                formatCurrencyBR(Number(item.subtotalSnapshot))
              }}</span>
            </div>
          </div>
          <div class="border-t pt-2 text-sm">
            <div class="flex justify-between gap-3">
              <span class="min-w-0 truncate text-muted-foreground">{{
                pedido.Mesa?.nome || pedido.clienteNomeSnapshot || 'Cliente visitante'
              }}</span>
              <strong class="shrink-0">{{ formatCurrencyBR(Number(pedido.total)) }}</strong>
            </div>
          </div>
        </CardContent>
        <CardFooter
          v-if="canPrint || (canOperate && (proximoDisponivel(pedido) || podeCancelar(pedido)))"
          class="min-w-0 gap-2 overflow-hidden border-t px-4 py-3"
        >
          <Button
            v-if="proximoDisponivel(pedido)"
            size="sm"
            class="flex-1"
            :disabled="atualizando === pedido.id"
            @click.stop="avancar(pedido)"
          >
            <ChefHat class="mr-1.5 h-3.5 w-3.5" />{{ nextLabel[pedido.status] }}
          </Button>
          <Button
            v-if="
              canViewKds &&
              pedido.tickets?.length &&
              ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status)
            "
            as-child
            size="sm"
            variant="outline"
            class="min-w-0 flex-1 px-3"
            @click.stop
          >
            <RouterLink to="/restaurante/kds" class="flex min-w-0 items-center"
              ><ChefHat class="mr-1.5 h-3.5 w-3.5 shrink-0" /><span class="truncate"
                >Acompanhar no KDS</span
              ></RouterLink
            >
          </Button>
          <Button
            v-if="podeCancelar(pedido)"
            size="sm"
            variant="destructive"
            class="shrink-0"
            :disabled="atualizando === pedido.id"
            aria-label="Cancelar pedido"
            @click.stop="cancelar(pedido)"
            ><CircleX class="h-4 w-4" /><span class="sr-only">Cancelar pedido</span></Button
          >
          <Button
            v-if="canPrint && podeImprimirPedido(pedido)"
            size="sm"
            variant="outline"
            class="shrink-0"
            aria-label="Imprimir pedido"
            @click.stop="abrirImpressao(pedido)"
            ><Printer class="h-4 w-4" /><span class="sr-only">Imprimir pedido</span></Button
          >
          <Button
            v-else-if="canPrint"
            size="sm"
            variant="ghost"
            class="shrink-0 cursor-not-allowed text-muted-foreground/60"
            aria-label="Pedido ainda não disponível para impressão"
            title="O pedido poderá ser impresso depois de confirmado"
            disabled
            ><Printer class="h-4 w-4" /><span class="sr-only"
              >Pedido ainda não disponível para impressão</span
            ></Button
          >
        </CardFooter>
        <CardFooter
          v-else-if="
            canViewKds &&
            pedido.tickets?.length &&
            ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status)
          "
          class="border-t px-4 py-3"
        >
          <Button as-child size="sm" variant="outline" class="w-full min-w-0" @click.stop>
            <RouterLink to="/restaurante/kds" class="flex min-w-0 items-center"
              ><ChefHat class="mr-1.5 h-3.5 w-3.5 shrink-0" /><span class="truncate"
                >Acompanhar no KDS</span
              ></RouterLink
            >
          </Button>
        </CardFooter>
      </Card>
    </div>

    <div v-else class="flex gap-4 overflow-x-auto pb-2">
      <section
        v-for="status in kanbanStatuses"
        :key="status"
        class="flex min-h-[30rem] w-72 shrink-0 flex-col overflow-hidden rounded-md border border-t-4 shadow-sm"
        :class="statusColumnClass(status)"
        @dragover.prevent
        @drop.prevent="soltarNoKanban(status)"
      >
        <header
          class="flex items-center justify-between border-b border-border/70 bg-card/80 px-3.5 py-3 backdrop-blur-sm"
        >
          <span class="font-semibold">{{ statusLabels[status] }}</span
          ><Badge variant="outline" :class="statusBadgeClass(status)">{{
            filtrados.filter((pedido) => pedido.status === status).length
          }}</Badge>
        </header>
        <div class="min-h-40 flex-1 space-y-2 p-2.5">
          <Card
            v-for="pedido in filtrados.filter((item) => item.status === status)"
            :key="pedido.id"
            :draggable="Boolean(canOperate && proximoDisponivel(pedido))"
            class="cursor-pointer rounded-md border-border/80 bg-card/95 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            :class="{
              'cursor-grab active:cursor-grabbing': canOperate && proximoDisponivel(pedido),
            }"
            @dragstart="iniciarArraste(pedido)"
            @click="abrirDetalhes(pedido)"
          >
            <CardContent class="space-y-2 p-3"
              ><div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold">{{ pedido.codigo }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ dataHora(pedido.createdAt) }} · {{ origemLabel(pedido.origem) }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <Button
                    v-if="canOperate && pedido.status === 'RECEBIDO'"
                    size="icon"
                    class="h-7 w-7"
                    :disabled="atualizando === pedido.id"
                    aria-label="Confirmar pedido"
                    title="Confirmar pedido"
                    @click.stop="avancar(pedido)"
                  >
                    <CircleCheckBig class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    v-if="canOperate && pedido.status === 'PRONTO'"
                    size="icon"
                    class="h-7 w-7"
                    :disabled="atualizando === pedido.id"
                    aria-label="Concluir pedido"
                    title="Concluir pedido"
                    @click.stop="avancar(pedido)"
                  >
                    <CircleCheckBig class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    v-else-if="canViewKds && pedido.tickets?.length"
                    as-child
                    size="icon"
                    variant="ghost"
                    class="h-7 w-7 text-primary hover:text-primary dark:text-primary-foreground dark:hover:text-primary-foreground"
                    aria-label="Acompanhar no KDS"
                    @click.stop
                  >
                    <RouterLink to="/restaurante/kds"><ChefHat class="h-3.5 w-3.5" /></RouterLink>
                  </Button>
                  <Button
                    v-if="canPrint && podeImprimirPedido(pedido)"
                    size="icon"
                    variant="ghost"
                    class="h-7 w-7"
                    aria-label="Imprimir pedido"
                    @click.stop="abrirImpressao(pedido)"
                    ><Printer class="h-3.5 w-3.5"
                  /></Button>
                  <Button
                    v-else-if="canPrint"
                    size="icon"
                    variant="ghost"
                    class="h-7 w-7 cursor-not-allowed text-muted-foreground/60"
                    aria-label="Pedido ainda não disponível para impressão"
                    title="O pedido poderá ser impresso depois de confirmado"
                    disabled
                    ><Printer class="h-3.5 w-3.5"
                  /></Button>
                </div>
              </div>
              <div class="space-y-1 text-sm">
                <p v-for="item in pedido.itens.slice(0, 3)" :key="item.id" class="truncate">
                  {{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}
                </p>
                <p v-if="pedido.itens.length > 3" class="text-xs text-muted-foreground">
                  + {{ pedido.itens.length - 3 }} item(ns)
                </p>
              </div>
              <div class="flex justify-between border-t pt-2 text-sm">
                <span class="truncate text-muted-foreground">{{
                  pedido.Mesa?.nome || pedido.clienteNomeSnapshot || 'Cliente visitante'
                }}</span
                ><strong>{{ formatCurrencyBR(Number(pedido.total)) }}</strong>
              </div></CardContent
            >
          </Card>
          <p
            v-if="!filtrados.some((pedido) => pedido.status === status)"
            class="rounded-xl border border-dashed border-border/80 bg-background/40 p-3 text-center text-xs text-muted-foreground"
          >
            Solte aqui para {{ statusLabels[status].toLocaleLowerCase('pt-BR') }}.
          </p>
        </div>
      </section>
    </div>

    <div v-if="!loading && pedidos.length < total" class="flex justify-center">
      <Button variant="outline" :disabled="loadingMore" @click="carregarMais">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loadingMore }" />
        Carregar mais pedidos
      </Button>
    </div>

    <ModalView v-model:open="openModalFiltros" title="Período personalizado" size="lg">
      <div class="grid gap-4 p-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Atalhos rápidos</label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="preset in presets"
              :key="preset.key"
              type="button"
              variant="outline"
              size="sm"
              @click="aplicarPreset(preset.key)"
            >
              {{ preset.label }}
            </Button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Intervalo de datas</label>
          <Calendarpicker v-model="filtroPeriodo" class="w-full" :range="true" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="openModalFiltros = false">Cancelar</Button>
          <Button @click="aplicarPeriodoPersonalizado"
            ><Filter class="mr-1.5 h-4 w-4" />Aplicar</Button
          >
        </div>
      </div>
    </ModalView>

    <PedidoManualDialog
      v-model:open="openModalPedidoManual"
      :permitir-vinculo-mesa="canLinkTableOrder"
      @created="recarregar()"
    />

    <PedidoManualDialog
      v-model:open="openModalEditarItens"
      :pedido-para-editar="pedidoSelecionado"
      @updated="atualizarPedidoLocal"
    />

    <ModalView
      v-model:open="openModalEditarCliente"
      :title="
        pedidoSelecionado ? `Editar cliente — pedido ${pedidoSelecionado.codigo}` : 'Editar cliente'
      "
      description="Altere apenas os dados registrados neste pedido. O cadastro original do cliente não será modificado."
      size="lg"
    >
      <div class="space-y-4 p-4">
        <label class="block space-y-1.5 text-sm font-medium"
          >Nome
          <Input v-model="clienteEdicao.nome" placeholder="Nome do cliente" />
        </label>
        <label class="block space-y-1.5 text-sm font-medium"
          >Telefone
          <Input
            v-model="clienteEdicao.telefone"
            v-maska="phoneMaskOptions"
            inputmode="tel"
            autocomplete="tel"
            placeholder="(00) 00000-0000"
          />
        </label>
        <label class="block space-y-1.5 text-sm font-medium"
          >E-mail
          <Input v-model="clienteEdicao.email" type="email" placeholder="cliente@exemplo.com" />
        </label>
        <div class="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" @click="openModalEditarCliente = false">Cancelar</Button>
          <Button :disabled="salvandoCliente" @click="salvarClientePedido">
            {{ salvandoCliente ? 'Salvando...' : 'Salvar cliente' }}
          </Button>
        </div>
      </div>
    </ModalView>

    <ModalView
      v-model:open="openModalImpressao"
      :title="
        pedidoParaImpressao ? `Imprimir pedido ${pedidoParaImpressao.codigo}` : 'Imprimir pedido'
      "
      description="Escolha os conectores que devem receber o comprovante."
      size="lg"
    >
      <div class="space-y-3 p-4">
        <label
          v-for="station in estacoesImpressao"
          :key="station.id"
          class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3"
          ><span
            ><span class="block font-medium">{{ station.nome }}</span
            ><span class="text-xs text-muted-foreground"
              >{{ station.online ? 'Conectado' : 'Sem conexão recente' }} ·
              {{ station.impressoraNome || 'Impressora não identificada' }}</span
            ></span
          ><input
            type="checkbox"
            class="h-4 w-4"
            :checked="estacoesSelecionadas.includes(station.id)"
            @change="alterarEstacaoImpressao(station.id, $event)"
        /></label>
        <p class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          {{
            pedidoParaImpressao?.tickets?.length
              ? 'Somente conectores configurados como destinos dos pontos deste pedido receberão trabalhos de impressão.'
              : 'Como este pedido não utiliza pontos KDS, o comprovante completo será enviado diretamente aos conectores selecionados.'
          }}
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="openModalImpressao = false">Cancelar</Button
          ><Button :disabled="imprimindo || !estacoesSelecionadas.length" @click="imprimirPedido"
            ><Printer class="mr-2 h-4 w-4" />Imprimir selecionados</Button
          >
        </div>
      </div>
    </ModalView>

    <PedidoDetalhesDialog
      v-model:open="openModalDetalhes"
      :pedido="pedidoSelecionado"
      :localizacao-empresa="localizacaoEmpresa"
      :pode-abrir-chat="atendimentoDisponivel"
      :abrindo-chat="abrindoChat"
      :pode-editar-cliente="podeEditarClienteSelecionado"
      :pode-editar-itens="podeEditarItensSelecionado"
      @abrir-rota="abrirRota"
      @abrir-chat="abrirChatPedido"
      @editar-cliente="abrirEdicaoCliente"
      @editar-itens="abrirEdicaoItens"
    >
      <template #actions="{ pedido }">
        <div
          v-if="canOperate || (canPrint && podeImprimirPedido(pedido))"
          class="flex justify-end gap-2 border-t pt-4"
        >
          <Button
            v-if="canPrint && podeImprimirPedido(pedido)"
            variant="outline"
            @click="abrirImpressao(pedido)"
            ><Printer class="mr-1.5 h-4 w-4" />Imprimir</Button
          >
          <Button
            v-if="canOperate && podeCancelar(pedido)"
            variant="destructive"
            :disabled="atualizando === pedido.id"
            @click="cancelar(pedido)"
            ><CircleX class="mr-1.5 h-4 w-4" />Cancelar pedido</Button
          >
        </div>
      </template>
    </PedidoDetalhesDialog>

    <ModalView
      v-model:open="openModalRota"
      title="Rota até o cliente"
      :description="
        pedidoRota ? `Pedido ${pedidoRota.codigo} · ${enderecoFormatado(pedidoRota)}` : ''
      "
      size="5xl"
      @update:open="handleRouteModalChange"
    >
      <div class="space-y-3 p-4">
        <div class="route-modal-map-shell">
          <div ref="mapElement" class="route-modal-map" aria-label="Mapa da rota de entrega" />
          <div v-if="routeLoading" class="route-modal-map-loading">Calculando rota pelas ruas…</div>
        </div>
        <div
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
        >
          <span class="font-medium">Empresa → cliente</span>
          <Badge v-if="routeSummary" variant="secondary"
            >Menor rota: {{ formatRouteSummary(routeSummary) }}</Badge
          >
          <span v-else class="text-muted-foreground"
            >A rota mais curta será exibida quando disponível.</span
          >
        </div>
      </div>
    </ModalView>
  </section>
</template>

<style scoped>
.route-modal-map-shell {
  position: relative;
  height: min(62dvh, 580px);
  min-height: 340px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--muted));
}
.route-modal-map {
  position: absolute;
  inset: 0;
}
.route-modal-map-loading {
  position: absolute;
  z-index: 500;
  top: 12px;
  left: 50%;
  padding: 8px 12px;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 999px;
  color: #334155;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 6px 18px rgb(15 23 42 / 14%);
  font-size: 12px;
  font-weight: 600;
  transform: translateX(-50%);
}
</style>
