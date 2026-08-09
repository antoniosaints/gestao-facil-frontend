<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { endOfDay, startOfDay } from 'date-fns'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { calculateRestaurantRoadRoute, type RoadRoute } from '@/utils/restaurantRoadRouting'
import {
  RestauranteRepository,
  type RestauranteEntregaStatus,
  type RestauranteLocalizacao,
  type RestaurantePedido,
} from '@/repositories/restaurante-repository'
import { Bike, LocateFixed, MapPin, PackageCheck, RefreshCw, Search, Store } from 'lucide-vue-next'

type DeliveryFilter = 'TODOS' | 'AGUARDANDO' | 'EM_ROTA' | 'ATRASADOS'
type DeliveryLocationEvent = {
  pedidoId: number
  latitude: number
  longitude: number
  updatedAt?: string
  entregadorNome?: string
}
type DriverLocation = Omit<DeliveryLocationEvent, 'pedidoId'>
const toast = useToast()
const mapElement = ref<HTMLElement | null>(null)
const loading = ref(true)
const refreshing = ref(false)
const search = ref('')
const filter = ref<DeliveryFilter>('TODOS')
const orders = ref<RestaurantePedido[]>([])
const companyLocation = ref<RestauranteLocalizacao | null>(null)
const selectedOrderId = ref<number | null>(null)
const driverLocations = ref<Record<number, DriverLocation>>({})
const currentTime = ref(Date.now())
const selectedRoadRoute = ref<Pick<RoadRoute, 'distance' | 'duration'> | null>(null)

let map: L.Map | null = null
let mapLayers: L.LayerGroup | null = null
const orderMarkers = new Map<number, L.Marker>()
let clockTimer: ReturnType<typeof setInterval> | null = null
let routeAbortController: AbortController | null = null
let mapRenderVersion = 0

const deliveryStatus = {
  AGUARDANDO_DESPACHO: {
    label: 'Aguardando despacho',
    className: 'border-amber-200 bg-amber-100 text-amber-800',
    color: '#d97706',
  },
  OFERTADA: {
    label: 'Buscando entregador',
    className: 'border-orange-200 bg-orange-100 text-orange-800',
    color: '#ea580c',
  },
  ATRIBUIDA: {
    label: 'Entregador atribuído',
    className: 'border-sky-200 bg-sky-100 text-sky-800',
    color: '#0284c7',
  },
  RETIRADA: {
    label: 'Pedido retirado',
    className: 'border-indigo-200 bg-indigo-100 text-indigo-800',
    color: '#4f46e5',
  },
  EM_ROTA: {
    label: 'Em rota',
    className: 'border-violet-200 bg-violet-100 text-violet-800',
    color: '#7c3aed',
  },
  ENTREGUE: {
    label: 'Entregue',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    color: '#059669',
  },
  FALHOU: {
    label: 'Entrega com problema',
    className: 'border-red-200 bg-red-100 text-red-800',
    color: '#dc2626',
  },
  NAO_APLICAVEL: {
    label: 'Sem delivery',
    className: 'border-stone-200 bg-stone-100 text-stone-700',
    color: '#78716c',
  },
} satisfies Record<RestauranteEntregaStatus, { label: string; className: string; color: string }>

const deliveryOrders = computed(() => orders.value.filter((order) => order.origem === 'DELIVERY'))
const visibleOrders = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  return deliveryOrders.value
    .filter((order) => !['CONCLUIDO', 'CANCELADO'].includes(order.status))
    .filter((order) => !['ENTREGUE', 'FALHOU'].includes(order.entregaStatus))
    .filter((order) => {
      if (filter.value === 'AGUARDANDO')
        return ['AGUARDANDO_DESPACHO', 'OFERTADA', 'ATRIBUIDA'].includes(order.entregaStatus)
      if (filter.value === 'EM_ROTA') return ['RETIRADA', 'EM_ROTA'].includes(order.entregaStatus)
      if (filter.value === 'ATRASADOS') return waitingMinutes(order) >= 30
      return true
    })
    .filter(
      (order) =>
        !term ||
        [order.codigo, order.clienteNomeSnapshot, order.clienteTelefone, endereco(order)].some(
          (value) =>
            String(value || '')
              .toLocaleLowerCase('pt-BR')
              .includes(term),
        ),
    )
    .sort(
      (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
    )
})
const mappedOrders = computed(() => visibleOrders.value.filter(hasCustomerLocation))
const waitingOrders = computed(
  () =>
    visibleOrders.value.filter((order) =>
      ['AGUARDANDO_DESPACHO', 'OFERTADA', 'ATRIBUIDA'].includes(order.entregaStatus),
    ).length,
)
const lateOrders = computed(
  () => visibleOrders.value.filter((order) => waitingMinutes(order) >= 30).length,
)
const averageWait = computed(() => {
  if (!visibleOrders.value.length) return 0
  return Math.round(
    visibleOrders.value.reduce((total, order) => total + waitingMinutes(order), 0) /
      visibleOrders.value.length,
  )
})

function hasCustomerLocation(order: RestaurantePedido) {
  return (
    Number.isFinite(order.enderecoSnapshotJson?.latitude) &&
    Number.isFinite(order.enderecoSnapshotJson?.longitude)
  )
}

function customerCoordinates(order: RestaurantePedido): L.LatLngTuple | null {
  if (!hasCustomerLocation(order)) return null
  return [
    Number(order.enderecoSnapshotJson!.latitude),
    Number(order.enderecoSnapshotJson!.longitude),
  ]
}

function waitingMinutes(order: RestaurantePedido) {
  return Math.max(0, Math.floor((currentTime.value - new Date(order.createdAt).getTime()) / 60000))
}

function waitLabel(order: RestaurantePedido) {
  const minutes = waitingMinutes(order)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}

function waitProgress(order: RestaurantePedido) {
  return Math.min(100, Math.max(8, Math.round((waitingMinutes(order) / 45) * 100)))
}

function deliveryInfo(order: RestaurantePedido) {
  return deliveryStatus[order.entregaStatus]
}

function endereco(order: RestaurantePedido) {
  const address = order.enderecoSnapshotJson
  if (!address) return 'Endereço não informado'
  return [
    [address.logradouro, address.numero].filter(Boolean).join(', '),
    address.bairro,
    address.cidade,
  ]
    .filter(Boolean)
    .join(' · ')
}

function markerIcon(content: string, className: string) {
  return L.divIcon({
    className: 'delivery-map-icon',
    html: `<span class="delivery-map-pin ${className}"><b>${content}</b></span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34],
  })
}

function escapeHtml(value: unknown) {
  return String(value || '').replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ||
      character,
  )
}

function popupContent(order: RestaurantePedido) {
  const driver = driverLocations.value[order.id]
  return `<div class="delivery-map-popup"><span>Pedido ${escapeHtml(order.codigo)}</span><strong>${escapeHtml(order.clienteNomeSnapshot || 'Cliente')}</strong><p>${escapeHtml(endereco(order))}</p><div><b>${escapeHtml(deliveryInfo(order).label)}</b><b>${escapeHtml(waitLabel(order))} aguardando</b></div>${driver ? `<small>Entregador: ${escapeHtml(driver.entregadorNome || 'em localização')}</small>` : ''}</div>`
}

function addRoadRoute(route: RoadRoute, options: L.PathOptions, bounds: L.LatLngBounds) {
  const layer = L.geoJSON(route.geometry, { style: options }).addTo(mapLayers!)
  const routeBounds = layer.getBounds()
  if (routeBounds.isValid()) bounds.extend(routeBounds)
}

async function renderMap() {
  if (!map || !mapLayers) return
  const renderVersion = ++mapRenderVersion
  routeAbortController?.abort()
  const controller = new AbortController()
  routeAbortController = controller
  selectedRoadRoute.value = null
  mapLayers.clearLayers()
  orderMarkers.clear()
  const bounds = L.latLngBounds([])

  if (companyLocation.value) {
    const coordinates: L.LatLngTuple = [
      companyLocation.value.latitude,
      companyLocation.value.longitude,
    ]
    bounds.extend(coordinates)
    L.marker(coordinates, { icon: markerIcon('⌂', 'delivery-map-pin--store') })
      .bindPopup(
        '<div class="delivery-map-popup"><span>Origem</span><strong>Empresa</strong><p>Local de saída das entregas</p></div>',
      )
      .addTo(mapLayers)
  }

  for (const order of mappedOrders.value) {
    const coordinates = customerCoordinates(order)!
    const marker = L.marker(coordinates, {
      icon: markerIcon(
        String(order.id),
        waitingMinutes(order) >= 30 ? 'delivery-map-pin--late' : 'delivery-map-pin--customer',
      ),
    })
      .bindPopup(popupContent(order))
      .addTo(mapLayers)
    marker.on('click', () => {
      selectedOrderId.value = order.id
    })
    orderMarkers.set(order.id, marker)
    bounds.extend(coordinates)

    const driver = driverLocations.value[order.id]
    if (driver) {
      const driverPoint: L.LatLngTuple = [driver.latitude, driver.longitude]
      bounds.extend(driverPoint)
      L.marker(driverPoint, { icon: markerIcon('↗', 'delivery-map-pin--driver') })
        .bindPopup(
          `<div class="delivery-map-popup"><span>Entregador</span><strong>${escapeHtml(driver.entregadorNome || 'Posição recebida')}</strong><p>Atualização em tempo real</p></div>`,
        )
        .addTo(mapLayers)
    }
  }

  const selectedOrder =
    mappedOrders.value.find((order) => order.id === selectedOrderId.value) || mappedOrders.value[0]
  const selectedCoordinates = selectedOrder && customerCoordinates(selectedOrder)
  if (selectedOrder && selectedCoordinates && companyLocation.value) {
    const companyCoordinates: L.LatLngTuple = [
      companyLocation.value.latitude,
      companyLocation.value.longitude,
    ]
    const driver = driverLocations.value[selectedOrder.id]
    const routeRequests = [
      {
        kind: 'empresa' as const,
        promise: calculateRestaurantRoadRoute(
          companyCoordinates,
          selectedCoordinates,
          controller.signal,
        ),
        options: {
          color: deliveryInfo(selectedOrder).color,
          weight: 4,
          opacity: 0.85,
        } satisfies L.PathOptions,
      },
      ...(driver
        ? [
            {
              kind: 'entregador' as const,
              promise: calculateRestaurantRoadRoute(
                [driver.latitude, driver.longitude],
                selectedCoordinates,
                controller.signal,
              ),
              options: { color: '#16a34a', weight: 4, opacity: 0.85 } satisfies L.PathOptions,
            },
          ]
        : []),
    ]
    const results = await Promise.allSettled(routeRequests.map((request) => request.promise))
    if (renderVersion !== mapRenderVersion || controller.signal.aborted || !map || !mapLayers)
      return
    for (const [index, result] of results.entries()) {
      if (result.status !== 'fulfilled') continue
      const request = routeRequests[index]
      addRoadRoute(result.value, request.options, bounds)
      if (request.kind === 'empresa') selectedRoadRoute.value = result.value
    }
  }

  if (bounds.isValid()) map.fitBounds(bounds, { padding: [52, 52], maxZoom: 14 })
  else map.setView([-14.235, -51.9253], 4)
}

function routeSummary(route: Pick<RoadRoute, 'distance' | 'duration'>) {
  const distance =
    route.distance >= 1000
      ? `${(route.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`
      : `${Math.round(route.distance)} m`
  return `${distance} · ${Math.max(1, Math.round(route.duration / 60))} min`
}

function selectOrder(order: RestaurantePedido) {
  selectedOrderId.value = order.id
  const coordinates = customerCoordinates(order)
  if (map && coordinates) {
    map.flyTo(coordinates, Math.max(map.getZoom(), 14), { duration: 0.5 })
    orderMarkers.get(order.id)?.openPopup()
  } else if (!coordinates) {
    toast.info('Este pedido não possui localização enviada pelo cliente.')
  }
}

function resetMapView() {
  selectedOrderId.value = null
  void renderMap()
}

async function loadOrders(feedback = false) {
  try {
    if (loading.value) loading.value = true
    else refreshing.value = true
    const response = await RestauranteRepository.pedidos({
      page: 1,
      limit: 100,
      inicio: startOfDay(new Date()).toISOString(),
      fim: endOfDay(new Date()).toISOString(),
    })
    orders.value = response.data
    companyLocation.value = response.meta.localizacaoEmpresa || null
    if (!selectedOrderId.value && mappedOrders.value[0])
      selectedOrderId.value = mappedOrders.value[0].id
    await nextTick()
    await renderMap()
    if (feedback) toast.info('Acompanhamento atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar as entregas.')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function initializeMap() {
  if (!mapElement.value || map) return
  map = L.map(mapElement.value, { zoomControl: true, preferCanvas: true }).setView(
    [-14.235, -51.9253],
    4,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  mapLayers = L.layerGroup().addTo(map)
}

function receiveDriverLocation(payload: DeliveryLocationEvent) {
  if (
    !Number.isInteger(payload?.pedidoId) ||
    !Number.isFinite(payload.latitude) ||
    !Number.isFinite(payload.longitude)
  )
    return
  driverLocations.value = {
    ...driverLocations.value,
    [payload.pedidoId]: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      updatedAt: payload.updatedAt,
      entregadorNome: payload.entregadorNome,
    },
  }
  void renderMap()
}

watch(
  [visibleOrders, selectedOrderId, currentTime],
  () => {
    void renderMap()
  },
  { deep: false },
)
useSocketEvent('restaurante:pedido', () => {
  void loadOrders()
})
useSocketEvent<DeliveryLocationEvent>('restaurante:entrega-localizacao', receiveDriverLocation)

onMounted(async () => {
  initializeMap()
  clockTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 60_000)
  await loadOrders()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  routeAbortController?.abort()
  map?.remove()
  map = null
  mapLayers = null
})
</script>

<template>
  <section class="delivery-tracker-page">
    <div class="delivery-tracker">
      <div class="delivery-map-shell">
        <div
          ref="mapElement"
          class="delivery-map"
          aria-label="Mapa de acompanhamento de entregas"
        />
        <div class="delivery-map-topbar">
          <div class="delivery-map-title">
            <span><i />Monitoramento operacional</span>
            <strong
              >{{ mappedOrders.length }}
              {{ mappedOrders.length === 1 ? 'destino no mapa' : 'destinos no mapa' }}</strong
            >
            <small>{{
              selectedRoadRoute
                ? `Menor rota: ${routeSummary(selectedRoadRoute)}`
                : 'Posição do entregador será exibida assim que recebida.'
            }}</small>
          </div>
          <Button size="sm" variant="secondary" class="shadow-sm" @click="resetMapView"
            ><LocateFixed class="mr-1.5 h-3.5 w-3.5" />Ver todos</Button
          >
        </div>
        <div class="delivery-map-stats">
          <div>
            <span>Em espera</span><strong>{{ waitingOrders }}</strong>
          </div>
          <div>
            <span>Atrasados</span
            ><strong :class="lateOrders ? 'text-red-600' : ''">{{ lateOrders }}</strong>
          </div>
          <div>
            <span>Média</span><strong>{{ averageWait }}<small> min</small></strong>
          </div>
        </div>
      </div>

      <aside class="delivery-panel">
        <div class="border-b p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">Fila de delivery</h2>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {{ visibleOrders.length }} pedido(s) em acompanhamento
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1.5">
              <Badge class="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                ><span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />Ao vivo</Badge
              >
              <Button
                size="icon"
                variant="outline"
                class="h-8 w-8"
                :disabled="refreshing"
                aria-label="Atualizar acompanhamento"
                title="Atualizar acompanhamento"
                @click="loadOrders(true)"
                ><RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': refreshing }"
              /></Button>
            </div>
          </div>
          <div class="relative mt-4">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            /><Input v-model="search" class="h-10 pl-9" placeholder="Buscar pedido ou cliente" />
          </div>
          <div class="mt-3 flex gap-2 overflow-x-auto pb-0.5">
            <button
              v-for="option in [
                ['TODOS', 'Todos'],
                ['AGUARDANDO', 'Aguardando'],
                ['EM_ROTA', 'Em rota'],
                ['ATRASADOS', 'Atrasados'],
              ] as Array<[DeliveryFilter, string]>"
              :key="option[0]"
              type="button"
              class="delivery-filter"
              :class="{ active: filter === option[0] }"
              @click="filter = option[0]"
            >
              {{ option[1] }}
            </button>
          </div>
        </div>

        <div class="delivery-list">
          <template v-if="loading"
            ><Skeleton v-for="item in 5" :key="item" class="h-40 rounded-xl"
          /></template>
          <div
            v-else-if="!visibleOrders.length"
            class="flex min-h-60 flex-col items-center justify-center px-6 text-center"
          >
            <PackageCheck class="h-10 w-10 text-muted-foreground/40" />
            <p class="mt-3 font-medium">Nenhuma entrega para acompanhar</p>
            <p class="mt-1 text-sm text-muted-foreground">
              Ajuste o filtro ou aguarde novos pedidos delivery.
            </p>
          </div>
          <button
            v-for="order in visibleOrders"
            v-else
            :key="order.id"
            type="button"
            class="delivery-order"
            :class="{ selected: selectedOrderId === order.id }"
            @click="selectOrder(order)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p
                  class="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {{ order.codigo }}
                </p>
                <h3 class="mt-0.5 truncate text-sm font-semibold">
                  {{ order.clienteNomeSnapshot || 'Cliente visitante' }}
                </h3>
              </div>
              <Badge class="shrink-0 text-[10px]" :class="deliveryInfo(order).className">{{
                deliveryInfo(order).label
              }}</Badge>
            </div>
            <div class="delivery-route">
              <div class="delivery-route-stop">
                <span class="delivery-route-dot"><Store class="h-3 w-3" /></span>
                <div><strong>Empresa</strong><small>Origem da entrega</small></div>
              </div>
              <span class="delivery-route-line" />
              <div class="delivery-route-stop">
                <span class="delivery-route-dot delivery-route-dot--destination"
                  ><MapPin class="h-3 w-3"
                /></span>
                <div>
                  <strong>{{
                    hasCustomerLocation(order) ? endereco(order) : 'Localização não enviada'
                  }}</strong
                  ><small>{{
                    hasCustomerLocation(order)
                      ? 'Destino no mapa'
                      : 'O endereço está salvo, mas sem coordenadas'
                  }}</small>
                </div>
              </div>
            </div>
            <div class="delivery-order-meta">
              <span class="delivery-driver"
                ><Bike class="h-3.5 w-3.5 text-primary" />{{
                  driverLocations[order.id]?.entregadorNome ||
                  (driverLocations[order.id] ? 'Entregador em localização' : 'Aguardando posição')
                }}</span
              ><span class="delivery-wait"
                ><strong>{{ waitLabel(order) }}</strong
                ><small>espera</small></span
              >
            </div>
            <div class="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <span
                class="block h-full rounded-full"
                :class="waitingMinutes(order) >= 30 ? 'bg-red-500' : 'bg-primary'"
                :style="{ width: `${waitProgress(order)}%` }"
              />
            </div>
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.delivery-tracker-page {
  height: calc(100dvh - 60px);
  min-height: 0;
}
.delivery-tracker {
  display: grid;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: hsl(var(--background));
  grid-template-columns: minmax(0, 1fr) minmax(320px, 350px);
}
.delivery-map-shell {
  position: relative;
  min-height: 0;
  background: hsl(var(--muted));
}
.delivery-map {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.delivery-map-topbar {
  position: absolute;
  z-index: 500;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
}
.delivery-map-topbar > * {
  pointer-events: auto;
}
.delivery-map-title {
  display: grid;
  gap: 3px;
  max-width: 300px;
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 14px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
  backdrop-filter: blur(10px);
}
.delivery-map-title span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.delivery-map-title i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgb(16 185 129 / 16%);
}
.delivery-map-title strong {
  font-size: 15px;
  line-height: 1.15;
}
.delivery-map-title small {
  color: hsl(var(--muted-foreground));
  font-size: 11px;
}
.delivery-map-stats {
  position: absolute;
  z-index: 500;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 9px;
  pointer-events: none;
}
.delivery-map-stats div {
  display: grid;
  gap: 2px;
  min-width: 86px;
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 12px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
  backdrop-filter: blur(10px);
}
.delivery-map-stats span {
  color: hsl(var(--muted-foreground));
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.delivery-map-stats strong {
  font-size: 19px;
  line-height: 1;
}
.delivery-map-stats small {
  font-size: 10px;
}
.delivery-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border-left: 1px solid hsl(var(--border));
  background: hsl(var(--background));
}
.delivery-list {
  display: grid;
  flex: 1;
  min-height: 0;
  align-content: start;
  gap: 8px;
  overflow-y: auto;
  padding: 10px;
  background: hsl(var(--muted) / 0.32);
}
.delivery-filter {
  flex: 0 0 auto;
  border: 1px solid hsl(var(--border));
  border-radius: 999px;
  padding: 7px 10px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--background));
  font-size: 11px;
  font-weight: 700;
  transition: 0.15s ease;
}
.delivery-filter:hover {
  border-color: hsl(var(--primary) / 0.45);
}
.delivery-filter.active {
  border-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
}
.delivery-order {
  width: 100%;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  padding: 10px;
  background: hsl(var(--background));
  text-align: left;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}
.delivery-order:hover {
  transform: translateY(-1px);
  border-color: hsl(var(--primary) / 0.4);
  box-shadow: 0 8px 18px rgb(15 23 42 / 7%);
}
.delivery-order.selected {
  border-color: hsl(var(--primary) / 0.7);
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
}
.delivery-route {
  display: grid;
  gap: 4px;
  margin-top: 8px;
  padding: 8px 0;
  border-top: 1px solid hsl(var(--border));
  border-bottom: 1px solid hsl(var(--border));
}
.delivery-route-stop {
  display: grid;
  min-width: 0;
  grid-template-columns: 18px minmax(0, 1fr);
  column-gap: 8px;
}
.delivery-route strong,
.delivery-route small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.delivery-route strong {
  font-size: 11px;
  line-height: 1.25;
}
.delivery-route small {
  margin-top: 1px;
  color: hsl(var(--muted-foreground));
  font-size: 10px;
  line-height: 1.2;
}
.delivery-route-dot {
  position: relative;
  z-index: 1;
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 999px;
  color: white;
  background: hsl(var(--foreground));
}
.delivery-route-dot--destination {
  background: hsl(var(--primary));
}
.delivery-route-line {
  height: 5px;
  margin-left: 8px;
  border-left: 1px dashed hsl(var(--border));
}
.delivery-order-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.delivery-driver {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: hsl(var(--muted-foreground));
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.delivery-wait {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 4px;
}
.delivery-wait strong {
  font-size: 12px;
}
.delivery-wait small {
  color: hsl(var(--muted-foreground));
  font-size: 10px;
}
:deep(.delivery-map-icon) {
  border: 0;
  background: transparent;
}
:deep(.delivery-map-pin) {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 3px solid white;
  border-radius: 12px 12px 12px 3px;
  color: white;
  box-shadow: 0 8px 18px rgb(15 23 42 / 24%);
  font-size: 10px;
  font-weight: 800;
  transform: rotate(-45deg);
}
:deep(.delivery-map-pin b) {
  transform: rotate(45deg);
}
:deep(.delivery-map-pin--store) {
  background: #0f172a;
}
:deep(.delivery-map-pin--customer) {
  background: #2563eb;
}
:deep(.delivery-map-pin--late) {
  background: #dc2626;
}
:deep(.delivery-map-pin--driver) {
  background: #16a34a;
}
:deep(.delivery-map-popup) {
  min-width: 190px;
  padding: 2px;
  font-family: inherit;
}
:deep(.delivery-map-popup span) {
  display: block;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
:deep(.delivery-map-popup strong) {
  display: block;
  margin-top: 3px;
  font-size: 14px;
}
:deep(.delivery-map-popup p) {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.35;
}
:deep(.delivery-map-popup div) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid #e2e8f0;
  font-size: 10px;
}
:deep(.delivery-map-popup small) {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 10px;
}
@media (max-width: 1100px) {
  .delivery-tracker {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}
@media (max-width: 840px) {
  .delivery-tracker-page {
    height: auto;
    min-height: 0;
  }
  .delivery-tracker {
    display: flex;
    min-height: 0;
    flex-direction: column;
  }
  .delivery-map-shell {
    min-height: 440px;
  }
  .delivery-panel {
    border-top: 1px solid hsl(var(--border));
    border-left: 0;
  }
  .delivery-list {
    max-height: 560px;
  }
  .delivery-map-topbar {
    top: 12px;
    left: 12px;
    right: 12px;
  }
  .delivery-map-title {
    max-width: 235px;
  }
  .delivery-map-title small {
    display: none;
  }
  .delivery-map-stats {
    bottom: 12px;
    left: 12px;
  }
  .delivery-map-stats div {
    min-width: 72px;
    padding: 9px;
  }
}
</style>
