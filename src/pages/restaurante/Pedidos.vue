<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useToast } from 'vue-toastification'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
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
} from '@/repositories/restaurante-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { calculateRestaurantRoadRoute, type RoadRoute } from '@/utils/restaurantRoadRouting'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  ChefHat,
  Clock3,
  FileTextIcon,
  Filter,
  MapPinned,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
} from 'lucide-vue-next'

type PeriodPreset = 'today' | 'month' | 'all' | 'custom'

const toast = useToast()
const uiStore = useUiStore()
const canOperate = computed(() => uiStore.hasRestaurantCapability('PEDIDOS_OPERAR'))
const canConfigure = computed(() => uiStore.hasRestaurantCapability('CONFIGURACOES_GERENCIAR'))
const canViewKds = computed(() => uiStore.hasRestaurantCapability('KDS_VISUALIZAR'))
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
const pedidoSelecionado = ref<RestaurantePedido | null>(null)
const localizacaoEmpresa = ref<RestauranteLocalizacao | null>(null)
const pedidoRota = ref<RestaurantePedido | null>(null)
const mapElement = ref<HTMLElement | null>(null)
const routeLoading = ref(false)
const routeSummary = ref<Pick<RoadRoute, 'distance' | 'duration'> | null>(null)

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
const statusOptions = Object.keys(statusLabels) as RestaurantePedidoStatus[]
const statusStorageKey = 'gestao_facil:restaurante:pedidos-status'

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

function proximoDisponivel(pedido: RestaurantePedido) {
  if (pedido.tickets?.length && ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status))
    return undefined
  return nextStatus[pedido.status]
}

function abrirDetalhes(pedido: RestaurantePedido) {
  pedidoSelecionado.value = pedido
  openModalDetalhes.value = true
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

function pagamentoLabel(metodo?: string | null) {
  if (!metodo) return 'Não informado'
  return metodo.replace(/_/g, ' ')
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

function routeMarker(label: string, className: string) {
  return L.divIcon({
    className: 'route-modal-map-icon',
    html: `<span class="route-modal-map-pin ${className}"><b>${label}</b></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  })
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

function selecoes(item: RestaurantePedido['itens'][number]) {
  if (!Array.isArray(item.selecoesSnapshotJson)) return ''
  return item.selecoesSnapshotJson
    .map((selecao) => selecao.nome)
    .filter(Boolean)
    .join(', ')
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
          <FileTextIcon class="h-6 w-6 text-primary" />Pedidos
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
            class="flex w-full items-center px-2 py-1.5 text-left text-sm text-primary hover:bg-accent"
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
    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <Badge variant="outline">{{ statusLabels[pedido.status] }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="flex-1 space-y-2 px-4 pb-3">
          <div class="space-y-1 text-sm">
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
        <CardFooter v-if="canOperate && proximoDisponivel(pedido)" class="border-t px-4 py-3">
          <Button
            size="sm"
            class="w-full"
            :disabled="atualizando === pedido.id"
            @click.stop="avancar(pedido)"
          >
            <ChefHat class="mr-1.5 h-3.5 w-3.5" />{{ nextLabel[pedido.status] }}
          </Button>
        </CardFooter>
        <CardFooter
          v-else-if="
            canViewKds &&
            pedido.tickets?.length &&
            ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status)
          "
          class="border-t px-4 py-3"
        >
          <Button as-child size="sm" variant="outline" class="w-full" @click.stop>
            <RouterLink to="/restaurante/kds"
              ><ChefHat class="mr-1.5 h-3.5 w-3.5" />Acompanhar no KDS</RouterLink
            >
          </Button>
        </CardFooter>
      </Card>
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

    <ModalView
      v-model:open="openModalDetalhes"
      :title="pedidoSelecionado ? `Pedido ${pedidoSelecionado.codigo}` : 'Detalhes do pedido'"
      size="2xl"
    >
      <div v-if="pedidoSelecionado" class="space-y-4 p-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ statusLabels[pedidoSelecionado.status] }}</Badge>
          <Badge variant="secondary">{{ origemLabel(pedidoSelecionado.origem) }}</Badge>
          <span class="text-sm text-muted-foreground"
            >Recebido em {{ dataHora(pedidoSelecionado.createdAt) }}</span
          >
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border p-3">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</p>
            <p class="mt-1 font-medium">
              {{ pedidoSelecionado.clienteNomeSnapshot || 'Cliente visitante' }}
            </p>
            <p
              v-if="pedidoSelecionado.clienteTelefone"
              class="mt-1 flex items-center gap-1 text-sm text-muted-foreground"
            >
              <Phone class="h-3.5 w-3.5" />{{ pedidoSelecionado.clienteTelefone }}
            </p>
            <p v-if="pedidoSelecionado.clienteEmail" class="mt-1 text-sm text-muted-foreground">
              {{ pedidoSelecionado.clienteEmail }}
            </p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pagamento e atendimento
            </p>
            <p class="mt-1 font-medium">
              {{ pagamentoLabel(pedidoSelecionado.pagamentoMetodoSnapshot) }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              Pagamento: {{ pagamentoLabel(pedidoSelecionado.pagamentoStatus) }}
            </p>
            <p v-if="pedidoSelecionado.Mesa?.nome" class="mt-1 text-sm text-muted-foreground">
              {{ pedidoSelecionado.Mesa.nome }}
            </p>
          </div>
        </div>

        <div v-if="enderecoFormatado(pedidoSelecionado)" class="rounded-lg border p-3">
          <p
            class="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            <MapPin class="h-3.5 w-3.5" />Endereço de entrega
          </p>
          <p class="mt-1 text-sm">{{ enderecoFormatado(pedidoSelecionado) }}</p>
          <Button
            v-if="localizacaoEmpresa && customerCoordinates(pedidoSelecionado)"
            class="mt-3"
            size="sm"
            variant="outline"
            @click="abrirRota(pedidoSelecionado)"
          >
            <MapPinned class="mr-1.5 h-4 w-4" />Traçar rota até o cliente
          </Button>
          <p v-else class="mt-2 text-xs text-muted-foreground">
            A rota no mapa fica disponível quando a localização do cliente é enviada no checkout.
          </p>
        </div>

        <div class="rounded-lg border">
          <div class="border-b px-3 py-2 text-sm font-medium">Itens do pedido</div>
          <div class="divide-y">
            <div v-for="item in pedidoSelecionado.itens" :key="item.id" class="flex gap-3 p-3">
              <div class="min-w-0 flex-1">
                <p class="font-medium">{{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}</p>
                <p v-if="item.tamanhoSnapshot" class="text-sm text-muted-foreground">
                  {{ item.tamanhoSnapshot }}
                </p>
                <p v-if="selecoes(item)" class="text-sm text-muted-foreground">
                  {{ selecoes(item) }}
                </p>
                <p v-if="item.observacao" class="text-sm text-muted-foreground">
                  Obs.: {{ item.observacao }}
                </p>
              </div>
              <strong class="shrink-0">{{
                formatCurrencyBR(Number(item.subtotalSnapshot))
              }}</strong>
            </div>
          </div>
          <div class="space-y-1 border-t p-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Subtotal</span
              ><span>{{ formatCurrencyBR(Number(pedidoSelecionado.subtotal)) }}</span>
            </div>
            <div v-if="Number(pedidoSelecionado.frete)" class="flex justify-between">
              <span class="text-muted-foreground">Entrega</span
              ><span>{{ formatCurrencyBR(Number(pedidoSelecionado.frete)) }}</span>
            </div>
            <div v-if="Number(pedidoSelecionado.desconto)" class="flex justify-between">
              <span class="text-muted-foreground">Desconto</span
              ><span>- {{ formatCurrencyBR(Number(pedidoSelecionado.desconto)) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span><span>{{ formatCurrencyBR(Number(pedidoSelecionado.total)) }}</span>
            </div>
          </div>
        </div>

        <div v-if="pedidoSelecionado.observacao" class="rounded-lg border p-3">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Observação do pedido
          </p>
          <p class="mt-1 whitespace-pre-wrap text-sm">{{ pedidoSelecionado.observacao }}</p>
        </div>
      </div>
    </ModalView>

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
:deep(.route-modal-map-icon) {
  border: 0;
  background: transparent;
}
:deep(.route-modal-map-pin) {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 3px solid white;
  border-radius: 11px 11px 11px 3px;
  color: white;
  box-shadow: 0 6px 16px rgb(15 23 42 / 25%);
  font-size: 14px;
  font-weight: 800;
  transform: rotate(-45deg);
}
:deep(.route-modal-map-pin b) {
  transform: rotate(45deg);
}
:deep(.route-modal-map-pin--origin) {
  background: #0f172a;
}
:deep(.route-modal-map-pin--destination) {
  background: #2563eb;
}
</style>
