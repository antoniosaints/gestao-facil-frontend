<script setup lang="ts">
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { type ContaAssinanteAdmin, ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR, formatPhone } from '@/utils/formatters'
import {
  CalendarClock,
  CircleOff,
  Loader,
  RefreshCcw,
  Search,
  ShieldCheck,
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
      label: `Vencida ha ${Math.abs(item.diasParaVencer)}d`,
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

watch(status, () => {
  currentPage.value = 1
  refreshDesktopTable()
})

watch(
  [status, search, currentPage],
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
        <h2 class="flex items-center gap-2 text-2xl font-bold text-gray-700 dark:text-gray-300">
          <UserStar class="h-6 w-6" :stroke-width="2.5" />
          Assinantes
        </h2>
        <p class="text-sm text-muted-foreground">
          Visao central das contas do sistema para acompanhamento do superadmin.
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
            placeholder="Buscar conta, e-mail ou documento..."
            class="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div class="text-xs text-muted-foreground">
          {{ total }} conta(s) encontrada(s)
        </div>
      </div>

      <div v-if="loading && !assinantes.length" class="rounded-lg border border-border p-6">
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

      <Card
        v-for="item in assinantes"
        :key="item.id"
        class="border-border/70 bg-card shadow-sm dark:bg-card"
      >
        <CardHeader class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <CardTitle class="text-base text-foreground">{{ item.nome }}</CardTitle>
              <CardDescription>
                {{ item.nomeFantasia || item.email }}
              </CardDescription>
            </div>
            <div class="text-xs font-medium text-muted-foreground">
              {{ item.Uid }}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
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
        </CardHeader>

        <CardContent class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Contato</div>
            <div class="mt-1 text-sm text-foreground">{{ item.email }}</div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ item.telefone ? formatPhone(item.telefone) : '-' }}
            </div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Plano</div>
            <div class="mt-1 text-sm font-medium text-foreground">{{ formatCurrencyBR(item.valor) }}</div>
            <div class="mt-1 text-sm text-muted-foreground uppercase">{{ item.gateway }}</div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Vencimento</div>
            <div class="mt-1 text-sm text-foreground">{{ formatDateToPtBR(item.vencimento) }}</div>
            <div class="mt-1 text-sm text-muted-foreground">Cadastro: {{ formatDateToPtBR(item.data) }}</div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Uso da conta</div>
            <div class="mt-1 text-sm text-foreground">{{ item.usuariosTotal }} usuario(s)</div>
            <div class="mt-1 text-sm text-muted-foreground">Limite informado: {{ item.funcionarios || 0 }}</div>
          </div>
        </CardContent>

        <CardFooter class="flex items-center justify-between gap-2 border-t bg-muted/10">
          <span class="text-xs text-muted-foreground">
            {{ item.documento || 'Sem documento informado' }}
          </span>
          <div class="flex items-center gap-2">
            <a
              v-if="item.linkPagamentoPendente"
              :href="item.linkPagamentoPendente"
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

      <div v-if="!loading && !assinantes.length" class="rounded-lg border border-border p-6">
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

    <ModalGerenciarAssinante
      v-model:open="openModal"
      :conta="selectedConta"
      @saved="handleSaved"
    />
  </div>
</template>
