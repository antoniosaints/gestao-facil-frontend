<script setup lang="ts">
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/composables/useConfirm'
import { type AcessoSuporteLog, ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatDateToPtBR } from '@/utils/formatters'
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  LifeBuoy,
  Loader,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Tabela from './tabela/Tabela.vue'
import { getSituacaoBadge } from './tabela/columnDef'
import { useAcessosSuporte } from './useAcessosSuporte'

const uiStore = useUiStore()
const toast = useToast()
const confirm = useConfirm()
const { refreshKey, triggerRefresh } = useAcessosSuporte()

const situacao = ref('TODOS')
const search = ref('')
const loading = ref(false)
const revogando = ref<number | null>(null)
const acessos = ref<AcessoSuporteLog[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const showSearchModal = ref(false)
const showActionsModal = ref(false)

const tableFilters = reactive({
  situacao: 'TODOS',
  update: 0,
})

const situacaoOptions = [
  { label: 'Todas', value: 'TODOS' },
  { label: 'Em andamento', value: 'ATIVAS' },
  { label: 'Encerradas', value: 'ENCERRADAS' },
]

async function loadAcessos() {
  try {
    loading.value = true
    const response = await ContaRepository.listarAcessosSuporte({
      page: currentPage.value,
      pageSize: 10,
      search: search.value,
      situacao: situacao.value,
    })

    acessos.value = response.data || []
    total.value = response.total || 0
    totalPages.value = response.totalPages || 1
    currentPage.value = response.page || 1
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar os acessos de suporte')
  } finally {
    loading.value = false
  }
}

function refreshDesktopTable() {
  tableFilters.situacao = situacao.value
  tableFilters.update = Date.now()
}

function refreshAll() {
  refreshDesktopTable()
  loadAcessos()
}

async function revogarMobile(item: AcessoSuporteLog) {
  const ok = await confirm.confirm({
    title: 'Revogar acesso',
    message: `Encerrar agora a sessão de ${item.superAdminNome} na conta "${item.contaNome}"? A sessão cai na próxima requisição.`,
    confirmText: 'Revogar',
    colorButton: 'danger',
  })
  if (!ok) return

  try {
    revogando.value = item.id
    const res = await ContaRepository.revogarAcessoSuporte(item.id)
    toast.success(res?.message || 'Sessão revogada')
    refreshAll()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao revogar a sessão')
  } finally {
    revogando.value = null
  }
}

function applySearch() {
  currentPage.value = 1
  showSearchModal.value = false
  loadAcessos()
}

function clearSearch() {
  search.value = ''
  currentPage.value = 1
  showSearchModal.value = false
  loadAcessos()
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

watch(situacao, () => {
  currentPage.value = 1
  refreshDesktopTable()
})

watch(
  [situacao, currentPage],
  () => {
    loadAcessos()
  },
  { immediate: true },
)

watch(refreshKey, () => {
  refreshAll()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <LifeBuoy class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Acessos de suporte
        </h2>
        <p class="text-sm text-muted-foreground">
          Todo acesso do CEO à conta de um assinante fica registrado aqui.
        </p>
      </div>

      <div class="hidden flex-col gap-2 sm:flex-row sm:items-center md:flex">
        <Select v-model="situacao">
          <SelectTrigger class="w-full bg-card sm:w-[180px]">
            <SelectValue placeholder="Filtrar situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in situacaoOptions" :key="option.value" :value="option.value">
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
        {{ total }} acesso(s) • página {{ currentPage }} de {{ totalPages }}
      </div>

      <div v-if="loading && !acessos.length" class="rounded-2xl border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando acessos...</EmptyTitle>
            <EmptyDescription>Buscando o histórico de sessões de suporte.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2 pb-20">
        <div v-if="!loading && !acessos.length" class="rounded-2xl border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LifeBuoy class="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum acesso encontrado</EmptyTitle>
              <EmptyDescription>Ajuste a busca ou o filtro para localizar outra sessão.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <article
          v-for="item in acessos"
          :key="item.id"
          class="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex justify-between gap-3">
            <div class="text-sm font-semibold text-foreground">{{ item.Uid }}</div>
            <div class="text-xs text-muted-foreground">{{ formatDateToPtBR(item.iniciadoEm, true) }}</div>
          </div>

          <div class="text-sm font-medium text-foreground">{{ item.contaNome }}</div>
          <div class="text-xs text-muted-foreground">como {{ item.usuarioAlvoEmail }}</div>

          <div class="mt-2 text-xs text-muted-foreground">
            Por <span class="font-medium text-foreground">{{ item.superAdminNome }}</span>
            ({{ item.superAdminEmail }})
          </div>
          <div class="text-xs text-muted-foreground">Motivo: {{ item.motivo }}</div>
          <div class="text-xs text-muted-foreground">
            {{ item.encerradoEm ? 'Encerrado' : 'Expira' }} em
            {{ formatDateToPtBR(item.encerradoEm || item.expiraEm, true) }}
            <span v-if="item.ip"> • IP {{ item.ip }}</span>
          </div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <BadgeCell
              :label="getSituacaoBadge(item).label"
              :color="getSituacaoBadge(item).color"
              :icon="getSituacaoBadge(item).icon"
              :capitalize="false"
            />
            <button
              v-if="item.ativa"
              type="button"
              title="Revogar acesso"
              class="rounded-md bg-red-100 px-2 py-1 text-sm text-red-700 disabled:opacity-60 dark:bg-red-950 dark:text-red-300"
              :disabled="revogando === item.id"
              @click="revogarMobile(item)"
            >
              <Loader v-if="revogando === item.id" class="h-5 w-5 animate-spin" />
              <Ban v-else class="h-5 w-5" />
            </button>
          </div>
        </article>
      </div>
    </div>

    <ModalView
      v-model:open="showSearchModal"
      title="Buscar acessos"
      description="Busque por conta, e-mail ou motivo."
    >
      <div class="space-y-3 px-4">
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar conta, e-mail ou motivo..."
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
          <label class="text-sm font-medium text-foreground">Situação</label>
          <Select v-model="situacao">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Filtrar situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in situacaoOptions" :key="option.value" :value="option.value">
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
  </div>
</template>
