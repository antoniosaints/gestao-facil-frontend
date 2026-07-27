<script setup lang="ts">
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  WhatsAppRepository,
  type AdminWhatsAppInstance,
  type WhatsAppInstanceStatus,
} from '@/repositories/whatsapp-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smartphone,
  WifiOff,
} from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalGerenciarInstancia from './ModalGerenciarInstancia.vue'
import Tabela from './tabela/Tabela.vue'
import { useAdminWhatsApp } from './useAdminWhatsApp'

const uiStore = useUiStore()
const toast = useToast()
const { openManage, refreshKey } = useAdminWhatsApp()

const status = ref('TODOS')
const search = ref('')
const loading = ref(false)
const instances = ref<AdminWhatsAppInstance[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const showSearchModal = ref(false)
const showFiltersModal = ref(false)

const tableFilters = reactive({
  status: 'TODOS',
  update: 0,
})

const statusOptions = [
  { label: 'Todos os status', value: 'TODOS' },
  { label: 'Conectadas', value: 'CONECTADA' },
  { label: 'Desconectadas', value: 'DESCONECTADA' },
  { label: 'Conectando', value: 'CONECTANDO' },
  { label: 'Pendentes', value: 'PENDENTE' },
  { label: 'Com erro', value: 'ERRO' },
]

function statusBadge(value: WhatsAppInstanceStatus) {
  if (value === 'CONECTADA')
    return { label: 'Conectada', color: 'green' as const, icon: CheckCircle2 }
  if (value === 'ERRO') return { label: 'Erro', color: 'red' as const, icon: AlertTriangle }
  if (value === 'CONECTANDO' || value === 'PENDENTE') {
    return {
      label: value === 'CONECTANDO' ? 'Conectando' : 'Pendente',
      color: 'orange' as const,
      icon: RefreshCw,
    }
  }
  return { label: 'Desconectada', color: 'gray' as const, icon: WifiOff }
}

async function loadMobile() {
  try {
    loading.value = true
    const response = await WhatsAppRepository.listAdminInstances({
      page: currentPage.value,
      pageSize: 10,
      search: search.value,
      status: status.value,
      sortBy: 'updatedAt',
      order: 'desc',
    })
    instances.value = response.data
    total.value = response.total
    totalPages.value = response.totalPages || 1
    currentPage.value = response.page
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar as instâncias.')
  } finally {
    loading.value = false
  }
}

function refreshAll() {
  tableFilters.status = status.value
  tableFilters.update = Date.now()
  loadMobile()
}

function applyFilters() {
  showFiltersModal.value = false
  refreshAll()
}

function applySearch() {
  currentPage.value = 1
  showSearchModal.value = false
  loadMobile()
}

function clearSearch() {
  search.value = ''
  applySearch()
}

function previousPage() {
  if (currentPage.value > 1) currentPage.value -= 1
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(status, () => {
  currentPage.value = 1
  tableFilters.status = status.value
  tableFilters.update = Date.now()
  loadMobile()
})

watch(currentPage, loadMobile, { immediate: true })
watch(refreshKey, refreshAll)
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <MessageCircle class="h-6 w-6 text-emerald-600" :stroke-width="2.5" />
          Instâncias WhatsApp
        </h1>
        <p class="text-sm text-muted-foreground">
          Gestão geral das instâncias W-API por assinante.
        </p>
      </div>
      <div class="hidden items-center gap-2 md:flex">
        <Select v-model="status">
          <SelectTrigger class="w-[190px] bg-card">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" class="bg-card" @click="refreshAll">
          <RefreshCw class="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </header>

    <div v-if="!uiStore.isMobile">
      <Tabela :filters="tableFilters" />
    </div>

    <div v-else class="space-y-2">
      <p class="text-xs text-muted-foreground">
        {{ total }} instância(s) • página {{ currentPage }} de {{ totalPages }}
      </p>

      <div v-if="loading && !instances.length" class="rounded-2xl border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Loader2 class="h-6 w-6 animate-spin" /></EmptyMedia>
            <EmptyTitle>Carregando instâncias...</EmptyTitle>
            <EmptyDescription>Buscando as conexões dos assinantes.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="space-y-2">
        <div v-if="!instances.length" class="rounded-2xl border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Smartphone class="h-6 w-6" /></EmptyMedia>
              <EmptyTitle>Nenhuma instância encontrada</EmptyTitle>
              <EmptyDescription>Ajuste a busca ou o filtro de status.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <article
          v-for="instance in instances"
          :key="instance.id"
          class="rounded-2xl border bg-card p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"
              >
                <Smartphone class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{{ instance.nome }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ instance.instanceId }}</p>
              </div>
            </div>
            <BadgeCell
              :label="statusBadge(instance.status).label"
              :color="statusBadge(instance.status).color"
              :icon="statusBadge(instance.status).icon"
              :capitalize="false"
            />
          </div>

          <div class="mt-3 rounded-xl bg-muted/40 p-3">
            <p class="flex items-center gap-2 text-sm font-medium">
              <Building2 class="h-4 w-4 text-violet-500" />
              {{ instance.Conta.nomeFantasia || instance.Conta.nome }}
            </p>
            <p class="mt-1 truncate pl-6 text-xs text-muted-foreground">
              {{ instance.Conta.email }}
            </p>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p class="text-muted-foreground">Número</p>
              <p class="truncate font-medium">{{ instance.numeroConectado || 'Sem número' }}</p>
            </div>
            <div class="text-right">
              <p class="text-muted-foreground">Sincronização</p>
              <p class="font-medium">
                {{
                  instance.lastSyncAt
                    ? new Date(instance.lastSyncAt).toLocaleString('pt-BR')
                    : 'Nunca'
                }}
              </p>
            </div>
          </div>

          <div
            v-if="instance.ultimoErro"
            class="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"
          >
            <AlertTriangle class="h-4 w-4 shrink-0" />
            <span>{{ instance.ultimoErro }}</span>
          </div>

          <Button size="sm" class="mt-3 w-full text-white" @click="openManage(instance)">
            Gerenciar instância
          </Button>
        </article>
      </div>
    </div>

    <ModalView
      v-model:open="showSearchModal"
      title="Buscar instâncias"
      description="Busque pela instância, número, assinante ou e-mail."
    >
      <div class="space-y-3 px-4">
        <Input v-model="search" type="search" placeholder="Buscar..." @keyup.enter="applySearch" />
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" @click="clearSearch">Limpar</Button>
          <Button class="text-white" @click="applySearch">Buscar</Button>
        </div>
      </div>
    </ModalView>

    <ModalView
      v-model:open="showFiltersModal"
      title="Filtros"
      description="Refine a visão geral das instâncias."
    >
      <div class="space-y-3 px-4">
        <Select v-model="status">
          <SelectTrigger class="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          class="w-full"
          @click="applyFilters"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button
        type="button"
        :disabled="currentPage <= 1 || loading"
        class="flex flex-col items-center disabled:opacity-40"
        @click="previousPage"
      >
        <ArrowLeft class="h-5 w-5" /><span class="text-xs">Anterior</span>
      </button>
      <button type="button" class="flex flex-col items-center" @click="showSearchModal = true">
        <Search class="h-5 w-5" /><span class="text-xs">Busca</span>
      </button>
      <button type="button" class="flex flex-col items-center" @click="showFiltersModal = true">
        <SlidersHorizontal class="h-5 w-5" /><span class="text-xs">Filtros</span>
      </button>
      <button
        type="button"
        :disabled="currentPage >= totalPages || loading"
        class="flex flex-col items-center disabled:opacity-40"
        @click="nextPage"
      >
        <ArrowRight class="h-5 w-5" /><span class="text-xs">Próximo</span>
      </button>
    </MobileBottomBar>

    <ModalGerenciarInstancia />
  </div>
</template>
