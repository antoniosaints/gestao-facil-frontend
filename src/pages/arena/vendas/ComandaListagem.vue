<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Socket } from 'socket.io-client'
import {
  BadgeCheck,
  BadgePlus,
  CircleDollarSign,
  CircleSlash,
  Clock3,
  ConciergeBell,
  FileDown,
  LoaderCircle,
  PackagePlus,
  Pencil,
  ReceiptText,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-vue-next'
import { getSocket } from '@/pluguins/socket'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrencyBR } from '@/utils/formatters'
import { useComandaStore } from '@/stores/arena/comandaStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import type { ComandaVenda, StatusComanda } from '@/types/schemas'
import { ComandaRepository } from '@/repositories/comanda-repository'
import ModalComanda from './ModalComanda.vue'
import ModalItemComanda from './ModalItemComanda.vue'
import ModalCheckoutComanda from './ModalCheckoutComanda.vue'
import ModalDetalhesComanda from './ModalDetalhesComanda.vue'
import ModalFaturar from '@/pages/vendas/formulario/ModalFaturar.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import { deletarComanda } from './ActionsComandas'
import ModalRelatorioVendas from '@/pages/vendas/formulario/ModalRelatorioVendas.vue'

const store = useComandaStore()
const storeVendas = useVendasStore()
const openReport = ref(false);

type ComandaStatusFilter = 'ABERTA,PENDENTE' | 'ABERTA' | 'PENDENTE' | 'FECHADA' | 'CANCELADA' | 'TODAS'

const loading = ref(false)
const comandas = ref<ComandaVenda[]>([])
const search = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

let socket: Socket | null = null

const statusFilter = computed({
  get: () => (store.filters.status as ComandaStatusFilter | undefined) ?? 'ABERTA,PENDENTE',
  set: (value: ComandaStatusFilter) => {
    store.filters.status = value === 'TODAS' ? undefined : value
    store.updateTable()
  },
})

const cards = computed(() => comandas.value)

function getResumo(item: ComandaVenda) {
  return {
    itensAbertos: item.resumo?.itensAbertos ?? item.itensAbertos ?? 0,
    valorItensAbertos: Number(item.resumo?.valorItensAbertos ?? item.valorItensAbertos ?? 0),
    valorPendente: Number(item.resumo?.valorPendente ?? item.valorPendente ?? 0),
    valorPago: Number(item.resumo?.valorPago ?? item.valorPago ?? 0),
  }
}

function getClienteNome(item: ComandaVenda) {
  return item.Cliente?.nome || item.clienteNome || `Comanda #${item.id}`
}

function getReservaLabel(item: ComandaVenda) {
  if (!item.ArenaReservas?.Quadra?.name) return null
  return item.ArenaReservas.Quadra.name
}

function getStatusClass(status: StatusComanda) {
  if (status === 'ABERTA') return 'text-blue-600 dark:text-blue-400'
  if (status === 'PENDENTE') return 'text-warning dark:text-yellow-400'
  if (status === 'FECHADA') return 'text-success dark:text-green-400'
  return 'text-danger dark:text-red-400'
}

function getStatusLabel(status: StatusComanda) {
  if (status === 'ABERTA') return 'Aberta'
  if (status === 'PENDENTE') return 'Pendente'
  if (status === 'FECHADA') return 'Fechada'
  return 'Cancelada'
}

async function loadList(page = 1) {
  try {
    loading.value = true
    const response = await ComandaRepository.list({
      page,
      pageSize: 12,
      search: search.value,
      status: store.filters.status,
      sortBy: 'abertura',
      order: 'desc',
    })
    comandas.value = response.data || []
    currentPage.value = response.page || 1
    totalPages.value = response.totalPages || 1
  } catch (error) {
    console.log(error)
    comandas.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => store.filters.update,
  () => {
    loadList(currentPage.value)
  },
)

watch(
  () => storeVendas.filters.update,
  async () => {
    store.updateTable()
    if (store.openDetalhesModal) {
      await store.reloadDetalhes()
    }
  },
)

onMounted(() => {
  loadList()
  socket = getSocket()
  socket.on('vendas:updatetable', async () => {
    store.updateTable()
    if (store.openDetalhesModal) {
      await store.reloadDetalhes()
    }
  })
})

onUnmounted(() => {
  socket?.off('vendas:updatetable')
})
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ConciergeBell class="h-6 w-6" :stroke-width="2.5" />
          Comandas
        </h2>
        <p class="text-sm text-muted-foreground">Abra comandas, lance itens e gere cobrancas pendentes ou automaticas.
        </p>
      </div>
      <div class="justify-between gap-2 items-center hidden md:flex">
        <button @click="openReport = true"
          class="border border-orange-500 hover:border-orange-700 text-orange-900 dark:text-orange-200 bg-orange-500/20 px-3 py-1.5 text-sm rounded-lg flex items-center gap-1">
          <FileDown class="w-4 h-4 inline-flex" />
          <span class="hidden lg:inline">Exportar relatório</span>
        </button>
        <button @click="store.openSave"
          class="bg-teal-700 dark:bg-teal-900 text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1">
          <BadgePlus class="h-5 w-5 inline-flex" />
          <span class="hidden md:inline">Nova comanda</span>
        </button>
        <button @click="store.updateTable" class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
          <RotateCw class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
        <div class="flex items-center space-x-1 bg-card rounded-md border border-border pl-3 md:col-span-7">
          <Search class="h-4 w-4 text-muted-foreground" />
          <Input v-model="search" type="search" placeholder="Buscar comanda..."
            class="border-none outline-none focus-visible:ring-0 shadow-none h-9" @keyup.enter="loadList(1)" />
        </div>

        <div class="md:col-span-3">
          <Select v-model="statusFilter">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ABERTA,PENDENTE">Abertas e pendentes</SelectItem>
              <SelectItem value="ABERTA">Abertas</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="FECHADA">Fechadas</SelectItem>
              <SelectItem value="CANCELADA">Canceladas</SelectItem>
              <SelectItem value="TODAS">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button @click="store.openSave"
          class="w-full bg-teal-700 dark:bg-teal-900 text-white px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2 md:hidden">
          <BadgePlus class="h-5 w-5 inline-flex" />
          Nova comanda
        </button>
      </div>

      <div v-if="loading" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LoaderCircle class="h-6 w-6 animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando comandas cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else-if="!cards.length" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ConciergeBell />
            </EmptyMedia>
            <EmptyTitle>Nenhuma comanda encontrada</EmptyTitle>
            <EmptyDescription>Cadastre uma comanda para comecar a lancar itens e cobrancas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <div v-for="item in cards" :key="item.id"
          class="rounded-xl border dark:border-border-dark flex flex-col justify-between bg-card dark:bg-card-dark p-4">
          <div>
            <div class="flex justify-between gap-2">
              <div class="min-w-0">
                <div class="text-md font-semibold dark:text-white flex items-center gap-1.5">
                  <ConciergeBell class="h-4 w-4 text-primary dark:text-blue-400 shrink-0" />
                  <span class="truncate">{{ getClienteNome(item) }}</span>
                </div>
                <div class="mt-0.5 flex items-center gap-2">
                  <span v-if="getReservaLabel(item)"
                    class="text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md truncate">
                    {{ getReservaLabel(item) }}
                  </span>
                </div>
              </div>
              <div class="text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
                {{ formatCurrencyBR(getResumo(item).valorItensAbertos) }}
              </div>
            </div>

            <div class="flex justify-between items-center mt-1">
              <div class="text-xs flex items-center gap-1" :class="getStatusClass(item.status)">
                <Clock3 v-if="item.status === 'PENDENTE' || item.status === 'ABERTA'" class="w-4 h-4" />
                <BadgeCheck v-else-if="item.status === 'FECHADA'" class="w-4 h-4" />
                <CircleSlash v-else-if="item.status === 'CANCELADA'" class="w-4 h-4" />
                <LoaderCircle v-else class="w-4 h-4" />
                {{ getStatusLabel(item.status) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ new Date(item.abertura).toLocaleDateString('pt-BR') }}
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span class="rounded-md bg-muted px-2 py-1">
                {{ getResumo(item).itensAbertos }} item(ns) abertos
              </span>
              <span class="rounded-md bg-muted px-2 py-1">
                A receber {{ formatCurrencyBR(getResumo(item).valorPendente) }}
              </span>
              <span class="rounded-md bg-muted px-2 py-1">
                Pago {{ formatCurrencyBR(getResumo(item).valorPago) }}
              </span>
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
              {{ item.observacao || 'Sem observacoes registradas.' }}
            </div>
          </div>

          <div class="mt-2 flex justify-between gap-2">
            <button @click="store.openDetalhes(item.id as number)"
              class="bg-blue-200 text-blue-900 dark:text-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-2">
              <CircleDollarSign class="w-4 h-4 inline-flex" />
              Detalhes
            </button>
            <div v-if="item.status === 'ABERTA'" class="flex gap-1">
              <button @click="store.openAddItem(item.id as number)"
                class="bg-emerald-200 text-emerald-900 dark:text-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded-md text-sm"
                title="Adicionar item">
                <PackagePlus class="w-5 h-5" />
              </button>
              <button @click="store.openUpdate(item.id as number)"
                class="bg-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm"
                title="Editar comanda">
                <Pencil class="w-5 h-5" />
              </button>
              <button @click="deletarComanda(item.id as number)"
                class="bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800 px-2 py-1 rounded-md text-sm"
                title="Excluir comanda">
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
            <div v-else class="px-2 py-1 rounded-md text-xs flex items-center gap-1" :class="item.status === 'FECHADA'
              ? 'bg-emerald-200 text-emerald-900 dark:text-emerald-100 dark:bg-emerald-800'
              : item.status === 'CANCELADA'
                ? 'bg-red-200 text-red-900 dark:text-red-100 dark:bg-red-800'
                : 'bg-yellow-200 text-yellow-900 dark:text-yellow-100 dark:bg-yellow-800'">
              <ReceiptText class="w-4 h-4 inline-flex" />
              {{ getStatusLabel(item.status) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && cards.length && totalPages > 1" class="flex items-center justify-between gap-2">
        <button type="button" class="flex-1 border border-border px-3 py-2 rounded-md text-sm disabled:opacity-50"
          :disabled="currentPage <= 1" @click="loadList(currentPage - 1)">
          Anterior
        </button>
        <div class="text-xs text-muted-foreground">Pagina {{ currentPage }} de {{ totalPages }}</div>
        <button type="button" class="flex-1 border border-border px-3 py-2 rounded-md text-sm disabled:opacity-50"
          :disabled="currentPage >= totalPages" @click="loadList(currentPage + 1)">
          Proxima
        </button>
      </div>
    </div>

    <ModalComanda />
    <ModalItemComanda />
    <ModalCheckoutComanda />
    <ModalDetalhesComanda />
    <ModalFaturar />
    <ClientesModal />
    <ModalRelatorioVendas v-model:open="openReport" />
  </div>
</template>
