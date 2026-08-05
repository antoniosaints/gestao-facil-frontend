<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
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
import { formatCurrencyBR } from '@/utils/formatters'
import { ChefHat, Clock3, FileTextIcon, RefreshCw, Search, Settings2, ShoppingBag } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast()
const uiStore = useUiStore()
const canOperate = computed(() => uiStore.hasRestaurantCapability('PEDIDOS_OPERAR'))
const canConfigure = computed(() => uiStore.hasRestaurantCapability('CONFIGURACOES_GERENCIAR'))
const canViewKds = computed(() => uiStore.hasRestaurantCapability('KDS_VISUALIZAR'))
const loading = ref(true)
const pedidos = ref<RestaurantePedido[]>([])
const busca = ref('')
const status = ref('TODOS')
const atualizando = ref<number | null>(null)

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

const filtrados = computed(() => {
  const term = busca.value.trim().toLocaleLowerCase('pt-BR')
  return pedidos.value.filter((pedido) => {
    if (status.value !== 'TODOS' && pedido.status !== status.value) return false
    return (
      !term ||
      [pedido.codigo, pedido.clienteNomeSnapshot, pedido.Mesa?.nome].some((value) =>
        value?.toLocaleLowerCase('pt-BR').includes(term),
      )
    )
  })
})

async function carregar(feedback = false) {
  try {
    loading.value = true
    const response = await RestauranteRepository.pedidos({ limit: 100 })
    pedidos.value = response.data
    if (feedback) toast.info('Pedidos atualizados')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar os pedidos.')
  } finally {
    loading.value = false
  }
}

async function avancar(pedido: RestaurantePedido) {
  const proximo = nextStatus[pedido.status]
  if (!proximo) return
  try {
    atualizando.value = pedido.id
    const atualizado = await RestauranteRepository.transicionar(pedido.id, proximo, pedido.version)
    pedidos.value = pedidos.value.map((item) => (item.id === atualizado.id ? atualizado : item))
    toast.success('Status do pedido atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar o pedido.')
    if (error?.response?.status === 409) await carregar()
  } finally {
    atualizando.value = null
  }
}

function proximoDisponivel(pedido: RestaurantePedido) {
  if (pedido.tickets?.length && ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status)) return undefined
  return nextStatus[pedido.status]
}

function dataHora(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(() => carregar())
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FileTextIcon class="h-6 w-6 text-primary" />Pedidos
        </h1>
        <p class="text-sm text-muted-foreground">Acompanhe balcão, salão, retirada e delivery em uma única fila.</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="loading" @click="carregar(true)"
          ><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button
        ><Button v-if="canConfigure" as-child variant="outline"
          ><RouterLink to="/restaurante/configuracoes"
            ><Settings2 class="mr-2 h-4 w-4" />Configurar</RouterLink
          ></Button
        >
      </div>
    </header>

    <div class="grid gap-3 sm:grid-cols-[1fr_220px]">
      <div class="relative">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input
          v-model="busca"
          class="pl-9"
          placeholder="Buscar por código, cliente ou mesa"
        />
      </div>
      <Select v-model="status"
        ><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger
        ><SelectContent
          ><SelectItem value="TODOS">Todos os status</SelectItem
          ><SelectItem v-for="(label, key) in statusLabels" :key="key" :value="key">{{
            label
          }}</SelectItem></SelectContent
        ></Select
      >
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-48 rounded-xl" />
    </div>
    <div v-else-if="!filtrados.length" class="rounded-xl border border-dashed p-10 text-center">
      <ShoppingBag class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      <p class="font-medium">Nenhum pedido encontrado</p>
      <p class="text-sm text-muted-foreground">
        Novos pedidos aparecerão aqui quando forem recebidos.
      </p>
    </div>
    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="pedido in filtrados" :key="pedido.id" class="flex flex-col rounded-xl">
        <CardHeader class="p-4 pb-2"
          ><div class="flex items-start justify-between gap-3">
            <div>
              <CardTitle class="text-base">{{ pedido.codigo }}</CardTitle>
              <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 class="h-3.5 w-3.5" />{{ dataHora(pedido.createdAt) }} ·
                {{ pedido.origem.replace('_', ' ') }}
              </p>
            </div>
            <Badge variant="outline">{{ statusLabels[pedido.status] }}</Badge>
          </div></CardHeader
        >
        <CardContent class="flex-1 space-y-2 px-4 pb-3"
          ><div class="space-y-1 text-sm">
            <div v-for="item in pedido.itens" :key="item.id" class="flex justify-between gap-3">
              <span>{{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}</span
              ><span class="text-muted-foreground">{{
                formatCurrencyBR(Number(item.subtotalSnapshot))
              }}</span>
            </div>
          </div>
          <div class="border-t pt-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{
                pedido.Mesa?.nome || pedido.clienteNomeSnapshot || 'Cliente visitante'
              }}</span
              ><strong>{{ formatCurrencyBR(Number(pedido.total)) }}</strong>
            </div>
          </div></CardContent
        >
        <CardFooter v-if="canOperate && proximoDisponivel(pedido)" class="border-t px-4 py-3"
          ><Button size="sm" class="w-full" :disabled="atualizando === pedido.id" @click="avancar(pedido)"
            ><ChefHat class="mr-1.5 h-3.5 w-3.5" />{{ nextLabel[pedido.status] }}</Button
          ></CardFooter
        ><CardFooter v-else-if="canViewKds && pedido.tickets?.length && ['CONFIRMADO', 'EM_PREPARO'].includes(pedido.status)" class="border-t px-4 py-3"
          ><Button as-child size="sm" variant="outline" class="w-full"><RouterLink to="/restaurante/kds"><ChefHat class="mr-1.5 h-3.5 w-3.5" />Acompanhar no KDS</RouterLink></Button></CardFooter
        >
      </Card>
    </div>
  </section>
</template>
