<script setup lang="ts">
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { type ContaAssinanteAdmin, ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR, formatPhone } from '@/utils/formatters'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CircleOff,
  Loader,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
  UserStar,
} from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalGerenciarAssinante from './ModalGerenciarAssinante.vue'
import Tabela from './tabela/Tabela.vue'
import { useAssinantesAdmin } from './useAssinantesAdmin'

const uiStore = useUiStore()
const toast = useToast()
const { openModal, selectedConta, openManage } = useAssinantesAdmin()

const status = ref('TODOS')
const search = ref('')
const loading = ref(false)
const assinantes = ref<ContaAssinanteAdmin[]>([])
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
  { label: 'Todos', value: 'TODOS' },
  { label: 'Ativos', value: 'ATIVO' },
  { label: 'Inativos', value: 'INATIVO' },
  { label: 'Bloqueados', value: 'BLOQUEADO' },
]

function getStatusBadge(statusConta: string) {
  if (statusConta === 'BLOQUEADO') {
    return { label: statusConta, color: 'red' as const, icon: CircleOff }
  }

  if (statusConta === 'INATIVO') {
    return { label: statusConta, color: 'orange' as const, icon: CalendarClock }
  }

  return { label: statusConta, color: 'green' as const, icon: ShieldCheck }
}

function getAssinaturaBadge(item: ContaAssinanteAdmin) {
  if (item.statusAssinatura === 'VENCIDA') {
    return {
      label: `Vencida há ${Math.abs(item.diasParaVencer)}d`,
      color: 'red' as const,
      icon: CircleOff,
    }
  }

  if (item.statusAssinatura === 'VENCE_HOJE') {
    return {
      label: 'Vence hoje',
      color: 'orange' as const,
      icon: CalendarClock,
    }
  }

  return {
    label: `Em dia (${item.diasParaVencer}d)`,
    color: 'green' as const,
    icon: ShieldCheck,
  }
}

async function loadAssinantes() {
  try {
    loading.value = true
    const response = await ContaRepository.listarAssinantes({
      page: currentPage.value,
      pageSize: 10,
      search: search.value,
      status: status.value,
    })

    assinantes.value = response.data || []
    total.value = response.total || 0
    totalPages.value = response.totalPages || 1
    currentPage.value = response.page || 1
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar os assinantes do sistema')
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
  loadAssinantes()
}

function handleSaved() {
  refreshAll()
}

function applySearch() {
  currentPage.value = 1
  showSearchModal.value = false
  loadAssinantes()
}

function clearSearch() {
  search.value = ''
  currentPage.value = 1
  showSearchModal.value = false
  loadAssinantes()
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

watch(status, () => {
  currentPage.value = 1
  refreshDesktopTable()
})

watch(
  [status, currentPage],
  () => {
    loadAssinantes()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <UserStar class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Assinantes
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão central das contas do sistema para acompanhamento do superadmin.
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
        {{ total }} conta(s) • página {{ currentPage }} de {{ totalPages }}
      </div>

      <div v-if="loading && !assinantes.length" class="rounded-2xl border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando contas...</EmptyTitle>
            <EmptyDescription>Buscando os assinantes cadastrados no sistema.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2 pb-20">
        <div v-if="!loading && !assinantes.length" class="rounded-2xl border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserStar class="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum assinante encontrado</EmptyTitle>
              <EmptyDescription>Ajuste a busca ou o filtro para localizar outra conta.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <article
          v-for="item in assinantes"
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
            <div class="text-xs text-muted-foreground">{{ item.nomeFantasia || item.nome }}</div>
            <div class="text-xs text-muted-foreground">{{ item.usuariosTotal }} usuário(s)</div>
          </div>

          <div class="text-sm font-medium text-foreground">{{ item.nome }}</div>
          <div class="text-xs text-muted-foreground">{{ item.email }}</div>
          <div class="text-xs text-muted-foreground">
            {{ item.telefone ? formatPhone(item.telefone) : '-' }} • Vencimento {{ formatDateToPtBR(item.vencimento) }}
          </div>

          <div class="mt-2 flex flex-wrap gap-2">
            <BadgeCell
              :label="getStatusBadge(item.status).label"
              :color="getStatusBadge(item.status).color"
              :icon="getStatusBadge(item.status).icon"
            />
            <BadgeCell
              :label="getAssinaturaBadge(item).label"
              :color="getAssinaturaBadge(item).color"
              :icon="getAssinaturaBadge(item).icon"
              :capitalize="false"
            />
          </div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <div class="text-xs text-muted-foreground">{{ item.documento || 'Sem documento informado' }}</div>
            <div class="flex items-center gap-2">
              <a
                v-if="item.linkPagamentoPendente"
                :href="item.linkPagamentoPendente"
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

    <ModalView v-model:open="showSearchModal" title="Buscar assinantes" description="Busque por conta, e-mail ou documento.">
      <div class="space-y-3 px-4">
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar conta, e-mail ou documento..."
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

    <ModalGerenciarAssinante
      v-model:open="openModal"
      :conta="selectedConta"
      @saved="handleSaved"
    />
  </div>
</template>
