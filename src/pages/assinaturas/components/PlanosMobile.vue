<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Layers3, PenLine, RefreshCcw, Search, Trash2 } from 'lucide-vue-next'
import http from '@/utils/axios'
import { useToast } from 'vue-toastification'
import type { PlanoAssinaturaListItem } from '@/repositories/assinatura-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { getPeriodicidadeLabel, getStatusPlanoMeta } from '../shared'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { AssinaturaRepository } from '@/repositories/assinatura-repository'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const store = useAssinaturasStore()

const dataMobile = ref<PlanoAssinaturaListItem[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const showSearchModal = ref(false)
const processingId = ref<number | null>(null)

async function loadMobile(page = 1) {
  loading.value = true
  try {
    const response = await http.get('/assinaturas/planos/mobile', {
      params: {
        search: searchQuery.value,
        status: store.planosFilters.status,
        limit: 10,
        page,
      },
    })

    dataMobile.value = response.data.data
    currentPage.value = response.data.pagination.page
    totalPages.value = response.data.pagination.totalPages
    showSearchModal.value = false
  } catch (error) {
    console.error(error)
    dataMobile.value = []
    toast.error('Erro ao carregar os planos.')
  } finally {
    loading.value = false
  }
}

function previousPage() {
  if (currentPage.value > 1) loadMobile(currentPage.value - 1)
}

function nextPage() {
  if (currentPage.value < totalPages.value) loadMobile(currentPage.value + 1)
}

async function excluir(row: PlanoAssinaturaListItem) {
  const ok = await useConfirm().confirm({
    title: 'Excluir plano',
    message: 'Tem certeza que deseja excluir este plano de assinatura?',
    confirmText: 'Sim, excluir',
  })
  if (!ok) return

  try {
    processingId.value = row.id
    await AssinaturaRepository.deletarPlano(row.id)
    toast.success('Plano excluído com sucesso.')
    await loadMobile(currentPage.value)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir o plano.')
  } finally {
    processingId.value = null
  }
}

watch(
  () => store.planosFilters.update,
  () => {
    loadMobile(1)
  },
)

onMounted(() => loadMobile())
</script>

<template>
  <div class="mt-2 flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
    <div v-if="loading" class="flex h-[calc(100vh-13rem)] items-center justify-center">
      <div class="h-16 w-16 animate-spin rounded-full border-b-2 border-primary dark:border-primary-dark"></div>
    </div>

    <div v-else class="flex flex-col gap-2 pb-20">
      <div
        v-if="!dataMobile.length"
        class="flex h-[calc(100vh-13rem)] items-center justify-center rounded-md bg-card dark:bg-card-dark"
      >
        <div class="text-center">
          <i class="fa-solid fa-box-open mb-4 text-4xl text-gray-500 dark:text-gray-300"></i>
          <p class="text-gray-500 dark:text-gray-300">Nenhum plano encontrado.</p>
        </div>
      </div>

      <article
        v-for="row in dataMobile"
        :key="row.id"
        class="rounded-2xl border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold dark:text-white">{{ row.nome }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.Uid }}</div>
          </div>
          <div class="text-xs" :class="row.status === 'ATIVO' ? 'text-green-500' : 'text-gray-500'">
            {{ getStatusPlanoMeta(row.status).label }}
          </div>
        </div>

        <div class="mt-2 text-sm text-gray-700 dark:text-gray-200">
          {{ formatCurrencyBR(row.valorBase) }} • {{ getPeriodicidadeLabel(row.periodicidadePadrao) }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.resumo.itens }} item(ns) • {{ row.resumo.assinaturasVinculadas }} assinatura(s)
        </div>

        <div class="mt-3 flex justify-between gap-2">
          <button
            class="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            :disabled="processingId === row.id"
            @click="store.openEditPlano(row)"
          >
            <PenLine class="h-5 w-5" />
          </button>
          <button
            class="rounded-md bg-red-200 px-2 py-1 text-sm text-red-900 dark:bg-red-800 dark:text-red-100"
            :disabled="processingId === row.id"
            @click="excluir(row)"
          >
            <Trash2 class="h-5 w-5" />
          </button>
        </div>
      </article>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar planos" description="Refine por nome, descrição ou UID.">
      <div class="space-y-4 px-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Busca</label>
          <Input v-model="searchQuery" placeholder="Nome, UID ou descrição" @keyup.enter="loadMobile(1)" />
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="searchQuery = ''">Limpar</Button>
          <Button class="flex-1" @click="loadMobile(1)">Aplicar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="previousPage"
        :disabled="currentPage <= 1"
      >
        <i class="fa-solid fa-arrow-left text-lg"></i>
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
        @click="store.openCreatePlano()"
      >
        <Layers3 class="h-5 w-5" />
        <span class="text-xs">Novo</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="loadMobile(currentPage)"
      >
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="nextPage"
        :disabled="currentPage >= totalPages"
      >
        <i class="fa-solid fa-arrow-right text-lg"></i>
        <span class="text-xs">Próximo</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
