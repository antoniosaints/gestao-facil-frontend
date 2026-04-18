<script setup lang="ts">
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContaRepository, type FaturaContaAdmin } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CircleCheck,
  CircleOff,
  CreditCard,
  Loader,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  SquarePen,
} from 'lucide-vue-next'
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
const showSearchModal = ref(false)
const showActionsModal = ref(false)

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

function applySearch() {
  currentPage.value = 1
  showSearchModal.value = false
  loadFaturas()
}

function clearSearch() {
  search.value = ''
  currentPage.value = 1
  showSearchModal.value = false
  loadFaturas()
}

function previousPage() {
  if (currentPage.value > 1) currentPage.value -= 1
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(status, () => {
  currentPage.value = 1
  refreshDesktopTable()
})

watch(
  [status, currentPage],
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
          Acompanhe pagamentos, atrasos e o ciclo de cobrança das contas do sistema.
        </p>
      </div>

      <div class="hidden flex-col gap-2 sm:flex-row sm:items-center md:flex">
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

    <div v-else class="flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
      <div class="text-xs text-muted-foreground">
        {{ total }} fatura(s) • página {{ currentPage }} de {{ totalPages }}
      </div>

      <div v-if="loading && !faturas.length" class="rounded-2xl border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando faturas...</EmptyTitle>
            <EmptyDescription>Buscando as cobranças das contas cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2 pb-20">
        <div v-if="!loading && !faturas.length" class="rounded-2xl border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CreditCard class="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma fatura encontrada</EmptyTitle>
              <EmptyDescription>Ajuste a busca ou o filtro para localizar outra cobrança.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <article
          v-for="item in faturas"
          :key="item.id"
          class="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex justify-between gap-3">
            <div class="text-sm font-semibold text-foreground">{{ item.Uid }}</div>
            <div class="text-sm text-green-500 dark:text-green-400">
              {{ formatCurrencyBR(item.valor) }}
            </div>
          </div>

          <div class="flex justify-between gap-3">
            <div class="text-xs text-muted-foreground">{{ item.conta.nomeFantasia || item.conta.nome }}</div>
            <div class="text-xs text-muted-foreground uppercase">{{ item.conta.gateway }}</div>
          </div>

          <div class="text-sm font-medium text-foreground">{{ item.conta.email }}</div>
          <div class="text-xs text-muted-foreground">{{ item.descricao || 'Sem descrição informada' }}</div>
          <div class="text-xs text-muted-foreground">
            Vencimento {{ formatDateToPtBR(item.vencimento) }} • Criada em {{ formatDateToPtBR(item.criadoEm) }}
          </div>

          <div class="mt-2 flex flex-wrap gap-2">
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

          <div class="mt-3 flex items-center justify-between gap-2">
            <div class="text-xs text-muted-foreground">{{ item.conta.nome }}</div>
            <div class="flex items-center gap-2">
              <a
                v-if="item.urlPagamento"
                :href="item.urlPagamento"
                target="_blank"
                rel="noreferrer"
                class="text-xs font-medium text-primary"
              >
                Cobrança
              </a>
              <button
                type="button"
                class="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                @click="openManage(item)"
              >
                <SquarePen class="h-5 w-5" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar faturas" description="Busque por fatura, conta ou e-mail.">
      <div class="space-y-3 px-4">
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar fatura, conta ou e-mail..."
          @keyup.enter="applySearch"
        />
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="clearSearch">Limpar</Button>
          <Button class="flex-1" @click="applySearch">Buscar</Button>
        </div>
      </div>
    </ModalView>

    <ModalView v-model:open="showActionsModal" title="Ações" description="Filtros e atalhos da listagem mobile">
      <div class="space-y-4 px-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Status</label>
          <Select v-model="status">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" @click="refreshAll">
            <RefreshCcw class="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" @click="showActionsModal = false">Fechar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button
        type="button"
        :disabled="currentPage <= 1 || loading"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
        @click="previousPage"
      >
        <ArrowLeft class="h-5 w-5" />
        <span class="text-xs">Anterior</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="showSearchModal = true"
      >
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="showActionsModal = true"
      >
        <SlidersHorizontal class="h-5 w-5" />
        <span class="text-xs">Filtros</span>
      </button>
      <button
        type="button"
        :disabled="currentPage >= totalPages || loading"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
        @click="nextPage"
      >
        <ArrowRight class="h-5 w-5" />
        <span class="text-xs">Próximo</span>
      </button>
    </MobileBottomBar>

    <ModalGerenciarFatura
      v-model:open="openModal"
      :fatura="selectedFatura"
      @saved="handleSaved"
    />
  </div>
</template>
