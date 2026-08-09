<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns'
import { useToast } from 'vue-toastification'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RestauranteRepository,
  type RestaurantePedido,
  type RestaurantePedidoStatus,
} from '@/repositories/restaurante-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  ChefHat,
  Clock3,
  FileTextIcon,
  Filter,
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
const status = ref('TODOS')
const atualizando = ref<number | null>(null)
const page = ref(1)
const pages = ref(1)
const total = ref(0)
const presetAtivo = ref<PeriodPreset>('today')
const filtroPeriodo = ref<[Date, Date]>([startOfDay(new Date()), endOfDay(new Date())])
const openModalFiltros = ref(false)
const openModalDetalhes = ref(false)
const pedidoSelecionado = ref<RestaurantePedido | null>(null)

const presets: Array<{ key: Exclude<PeriodPreset, 'custom'>; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'month', label: 'Mês' },
  { key: 'all', label: 'Geral' },
]

const statusLabels: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}
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
      ...(status.value !== 'TODOS' ? { status: status.value } : {}),
      ...periodoQuery(),
    })
    pedidos.value = append ? [...pedidos.value, ...response.data] : response.data
    pages.value = response.meta.pages
    total.value = response.meta.total
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
  const hoje = new Date()
  if (preset === 'today') filtroPeriodo.value = [startOfDay(hoje), endOfDay(hoje)]
  if (preset === 'month') filtroPeriodo.value = [startOfMonth(hoje), endOfMonth(hoje)]
  openModalFiltros.value = false
  recarregar()
}

function aplicarPeriodoPersonalizado() {
  presetAtivo.value = 'custom'
  openModalFiltros.value = false
  recarregar()
}

function carregarMais() {
  if (loadingMore.value || page.value >= pages.value) return
  page.value += 1
  carregar({ append: true })
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
  return origem.replaceAll('_', ' ')
}

function pagamentoLabel(metodo?: string | null) {
  if (!metodo) return 'Não informado'
  return metodo.replaceAll('_', ' ')
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

function selecoes(item: RestaurantePedido['itens'][number]) {
  if (!Array.isArray(item.selecoesSnapshotJson)) return ''
  return item.selecoesSnapshotJson
    .map((selecao) => selecao.nome)
    .filter(Boolean)
    .join(', ')
}

onMounted(() => recarregar())
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

    <div class="grid gap-3 sm:grid-cols-[1fr_220px]">
      <div class="relative">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="busca"
          class="pl-9"
          placeholder="Buscar nesta lista por código, cliente, telefone ou mesa"
        />
      </div>
      <Select v-model="status" @update:model-value="recarregar()">
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os status</SelectItem>
          <SelectItem v-for="(label, key) in statusLabels" :key="key" :value="key">{{
            label
          }}</SelectItem>
        </SelectContent>
      </Select>
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
  </section>
</template>
