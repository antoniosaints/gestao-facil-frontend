<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BadgePlus,
  BadgeQuestionMark,
  Loader,
  RefreshCcw,
  ReceiptText,
  RotateCw,
  Search,
  Sparkles,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
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
import { Badge } from '@/components/ui/badge'
import { AssinaturaPagarRepository, type AssinaturaPagarListItem } from '@/repositories/assinatura-pagar-repository'
import { useAssinaturasPagarStore } from '@/stores/lancamentos/useAssinaturasPagar'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import AssinaturasPagarTabela from './components/AssinaturasPagarTabela.vue'
import ModalAssinaturaPagar from './ModalAssinaturaPagar.vue'

const store = useAssinaturasPagarStore()
const uiStore = useUiStore()
const toast = useToast()

const loading = ref(false)
const showSearchModal = ref(false)
const search = ref('')
const cards = ref<AssinaturaPagarListItem[]>([])

const cardsFiltrados = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return cards.value

  return cards.value.filter((item) => {
    const haystack = [item.nomeServico, item.Uid, item.observacoes || '', item.links.map((link) => link.titulo).join(' ')]
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

async function loadCards() {
  try {
    loading.value = true
    const response = await AssinaturaPagarRepository.listar({
      status: store.filters.status === 'TODOS' ? undefined : store.filters.status,
      search: search.value.trim() || undefined,
    })
    cards.value = response.data || []
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar assinaturas a pagar.')
    cards.value = []
  } finally {
    loading.value = false
  }
}

async function gerarFinanceiro(item: AssinaturaPagarListItem) {
  try {
    const response = await AssinaturaPagarRepository.gerarFinanceiro(item.id)
    toast.success(response?.message || 'Financeiro gerado com sucesso.')
    store.updateTable()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao gerar o financeiro.')
  }
}

watch(
  () => store.filters.update,
  () => {
    loadCards()
  },
)

watch(
  () => store.filters.status,
  () => {
    store.updateTable()
  },
)

onMounted(loadCards)
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Assinaturas a pagar
        </h2>
        <p class="text-sm text-muted-foreground">Serviços, SaaS e ferramentas recorrentes com geração financeira opcional e automação segura.</p>
      </div>
      <div class="hidden items-center gap-2 md:flex">
        <Select v-model="store.filters.status">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="ATIVA">Ativas</SelectItem>
            <SelectItem value="INATIVA">Inativas</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button v-if="uiStore.permissoes.financeiro.criar" @click="store.openCreate()">
          <BadgePlus class="mr-2 h-4 w-4" />
          Nova assinatura
        </Button>
        <Button variant="outline" @click="store.updateTable()">
          <RotateCw class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="hidden md:block">
      <AssinaturasPagarTabela />
    </div>

    <div v-else class="flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ cardsFiltrados.length }} assinatura(s)</span>
        <Badge variant="outline">{{ store.filters.status === 'TODOS' ? 'Todos os status' : store.filters.status }}</Badge>
      </div>

      <div v-if="loading && !cardsFiltrados.length" class="rounded-2xl border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando assinaturas recorrentes a pagar.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div v-if="!cardsFiltrados.length" class="rounded-2xl border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BadgeQuestionMark />
              </EmptyMedia>
              <EmptyTitle>Nenhuma assinatura encontrada</EmptyTitle>
              <EmptyDescription>Cadastre softwares, serviços e assinaturas operacionais da empresa.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <article
          v-for="item in cardsFiltrados"
          :key="item.id"
          class="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
              :style="{ backgroundColor: `${item.corDestaque || '#6366F1'}14`, borderColor: item.corDestaque || undefined }"
            >
              <img v-if="item.icone" :src="resolveFileUrl(item.icone, { fallback: '/imgs/logo.png' })" alt="Ícone do serviço" class="h-full w-full object-cover" />
              <Sparkles v-else class="h-6 w-6" :style="{ color: item.corDestaque || '#6366F1' }" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-foreground">{{ item.nomeServico }}</div>
                  <div class="text-xs text-muted-foreground">{{ item.Uid }}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-rose-600">{{ formatCurrencyBR(item.valor) }}</div>
                  <div class="text-xs text-muted-foreground">{{ item.periodicidade }}</div>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{{ item.status }}</Badge>
                <Badge variant="outline">{{ item.gerarFinanceiro ? (item.gerarAutomatico ? 'Financeiro automático' : 'Financeiro manual') : 'Sem financeiro' }}</Badge>
                <Badge v-if="item.links.length" variant="outline">{{ item.links.length }} link(s)</Badge>
                <Badge v-if="item.lancamentoAtual" variant="secondary">Ciclo atual: {{ item.lancamentoAtual.status }}</Badge>
              </div>

              <div class="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground">Próximo vencimento</span>
                  <span class="font-medium text-foreground">{{ item.proximoVencimento ? new Date(item.proximoVencimento).toLocaleDateString('pt-BR') : 'Sem data' }}</span>
                </div>
                <div v-if="item.observacoes" class="mt-2 text-xs text-muted-foreground line-clamp-2">{{ item.observacoes }}</div>
              </div>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <Button v-if="uiStore.permissoes.financeiro.editar" variant="outline" size="sm" @click="store.openEdit(item)">Editar</Button>
            <Button v-if="item.gerarFinanceiro && uiStore.permissoes.financeiro.editar" size="sm" @click="gerarFinanceiro(item)">
              <ReceiptText class="mr-2 h-4 w-4" />
              Gerar financeiro
            </Button>
          </div>
        </article>
      </div>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar assinatura" description="Filtre pelo nome do serviço, UID ou observações.">
      <div class="space-y-3 px-4 pb-4">
        <Input v-model="search" type="search" placeholder="Ex.: Figma, AWS, hospedagem" @keyup.enter="store.updateTable()" />
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="search = ''; store.updateTable(); showSearchModal = false">Limpar</Button>
          <Button class="flex-1" @click="store.updateTable(); showSearchModal = false">Buscar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="showSearchModal = true">
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="store.filters.status = store.filters.status === 'TODOS' ? 'ATIVA' : 'TODOS'">
        <ReceiptText class="h-5 w-5" />
        <span class="text-xs">{{ store.filters.status === 'TODOS' ? 'Ativas' : 'Todos' }}</span>
      </button>
      <button v-if="uiStore.permissoes.financeiro.criar" type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="store.openCreate()">
        <BadgePlus class="h-5 w-5" />
        <span class="text-xs">Nova</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="store.updateTable()">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="search = ''; store.updateTable()">
        <X class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
    </MobileBottomBar>

    <ModalAssinaturaPagar />
  </div>
</template>
