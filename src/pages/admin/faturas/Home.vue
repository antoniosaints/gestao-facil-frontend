<script setup lang="ts">
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContaRepository, type FaturaContaAdmin } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import { CalendarClock, CircleCheck, CircleOff, CreditCard, Loader, RefreshCcw, Search, SquarePen } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalGerenciarFatura from './ModalGerenciarFatura.vue'
import Tabela from './tabela/Tabela.vue'
import { useFaturasAdmin } from './useFaturasAdmin'

const uiStore = useUiStore()
const toast = useToast()
const { openModal, selectedFatura, openManage } = useFaturasAdmin()

const status = ref('TODOS')
const search = ref('')
const loading = ref(false)
const faturas = ref<FaturaContaAdmin[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)

const tableFilters = reactive({
  status: 'TODOS',
  update: 0,
})

const statusOptions = [
  { label: 'Todas', value: 'TODOS' },
  { label: 'Pendentes', value: 'PENDENTE' },
  { label: 'Pagas', value: 'PAGO' },
  { label: 'Atrasadas', value: 'ATRASADO' },
  { label: 'Canceladas', value: 'CANCELADO' },
]

function getStatusBadge(statusFatura: FaturaContaAdmin['status']) {
  if (statusFatura === 'PAGO') return { color: 'green' as const, icon: CircleCheck }
  if (statusFatura === 'ATRASADO') return { color: 'red' as const, icon: CircleOff }
  if (statusFatura === 'CANCELADO') return { color: 'gray' as const, icon: CircleOff }
  return { color: 'yellow' as const, icon: Loader }
}

async function loadFaturas() {
  try {
    loading.value = true
    const response = await ContaRepository.listarFaturasAdmin({
      page: currentPage.value,
      pageSize: 10,
      search: search.value,
      status: status.value,
    })

    faturas.value = response.data || []
    total.value = response.total || 0
    totalPages.value = response.totalPages || 1
    currentPage.value = response.page || 1
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar as faturas do sistema')
  } finally {
    loading.value = false
  }
}

function refreshDesktopTable() {
  tableFilters.status = status.value
  tableFilters.update = Date.now()
}

function refreshAll() {
  refreshDesktopTable()
  loadFaturas()
}

function handleSaved() {
  refreshAll()
}

watch(status, () => {
  currentPage.value = 1
  refreshDesktopTable()
})

watch(
  [status, search, currentPage],
  () => {
    loadFaturas()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-gray-700 dark:text-gray-300">
          <CreditCard class="h-6 w-6" :stroke-width="2.5" />
          Faturas
        </h2>
        <p class="text-sm text-muted-foreground">
          Acompanhe pagamentos, atrasos e o ciclo de cobranca das contas do sistema.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select v-model="status">
          <SelectTrigger class="w-full bg-card sm:w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" class="gap-2 bg-card" @click="refreshAll">
          <RefreshCcw class="h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="rounded-lg">
      <Tabela :filters="tableFilters" />
    </div>

    <div v-else class="space-y-3">
      <div class="space-y-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div class="flex items-center gap-2 rounded-md border border-border bg-background/80 px-3">
          <Search class="h-4 w-4 text-muted-foreground" />
          <Input
            v-model="search"
            type="search"
            placeholder="Buscar fatura, conta ou e-mail..."
            class="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div class="text-xs text-muted-foreground">
          {{ total }} fatura(s) encontrada(s)
        </div>
      </div>

      <div v-if="loading && !faturas.length" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando faturas...</EmptyTitle>
            <EmptyDescription>Buscando as cobrancas das contas cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <Card
        v-for="item in faturas"
        :key="item.id"
        class="border-border/70 bg-card shadow-sm dark:bg-card"
      >
        <CardHeader class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <CardTitle class="text-base text-foreground">{{ item.Uid }}</CardTitle>
              <CardDescription>
                {{ item.conta.nomeFantasia || item.conta.nome }}
              </CardDescription>
            </div>
            <div class="text-xs font-medium text-muted-foreground">
              {{ formatCurrencyBR(item.valor) }}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <BadgeCell
              :label="item.status"
              :color="getStatusBadge(item.status).color"
              :icon="getStatusBadge(item.status).icon"
              :capitalize="false"
            />
            <BadgeCell
              :label="formatDateToPtBR(item.vencimento)"
              :color="item.diasParaVencer < 0 ? 'red' : 'gray'"
              :icon="CalendarClock"
              :capitalize="false"
            />
          </div>
        </CardHeader>

        <CardContent class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Conta</div>
            <div class="mt-1 text-sm text-foreground">{{ item.conta.email }}</div>
            <div class="mt-1 text-sm text-muted-foreground uppercase">{{ item.conta.gateway }}</div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Descricao</div>
            <div class="mt-1 text-sm text-foreground">
              {{ item.descricao || 'Sem descricao informada' }}
            </div>
          </div>
        </CardContent>

        <CardFooter class="flex items-center justify-between gap-2 border-t bg-muted/10">
          <span class="text-xs text-muted-foreground">
            Criada em {{ formatDateToPtBR(item.criadoEm) }}
          </span>
          <div class="flex items-center gap-2">
            <a
              v-if="item.urlPagamento"
              :href="item.urlPagamento"
              target="_blank"
              rel="noreferrer"
              class="text-sm font-medium text-primary"
            >
              Abrir cobranca
            </a>
            <Button variant="outline" size="sm" class="gap-2" @click="openManage(item)">
              <SquarePen class="h-4 w-4" />
              Gerenciar
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div v-if="!loading && !faturas.length" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCard class="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Nenhuma fatura encontrada</EmptyTitle>
            <EmptyDescription>Ajuste a busca ou o filtro para localizar outra cobranca.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div class="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
        <div class="text-sm text-muted-foreground">
          Pagina {{ currentPage }} de {{ totalPages }}
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1 || loading"
            @click="currentPage = Math.max(currentPage - 1, 1)"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages || loading"
            @click="currentPage = Math.min(currentPage + 1, totalPages)"
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>

    <ModalGerenciarFatura
      v-model:open="openModal"
      :fatura="selectedFatura"
      @saved="handleSaved"
    />
  </div>
</template>
