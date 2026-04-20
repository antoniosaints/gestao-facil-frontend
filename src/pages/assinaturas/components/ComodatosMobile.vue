<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Package, RefreshCcw, Search } from 'lucide-vue-next'
import http from '@/utils/axios'
import { useToast } from 'vue-toastification'
import type { AssinaturaComodatoListItem } from '@/repositories/assinatura-repository'
import { formatDateToPtBR } from '@/utils/formatters'
import { getStatusComodatoMeta } from '../shared'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'

const toast = useToast()
const store = useAssinaturasStore()

const dataMobile = ref<AssinaturaComodatoListItem[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const showSearchModal = ref(false)

async function loadMobile(page = 1) {
  loading.value = true
  try {
    const response = await http.get('/assinaturas/comodatos/mobile', {
      params: {
        search: searchQuery.value,
        status: store.comodatosFilters.status,
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
    toast.error('Erro ao carregar os comodatos.')
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

watch(
  () => store.comodatosFilters.update,
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
          <p class="text-gray-500 dark:text-gray-300">Nenhum comodato encontrado.</p>
        </div>
      </div>

      <article
        v-for="row in dataMobile"
        :key="row.id"
        class="rounded-2xl border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold dark:text-white">{{ row.produto?.nome || 'Produto sem vínculo' }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.assinatura.nomeContrato }} • {{ row.assinatura.cliente }}</div>
          </div>
          <div class="text-xs" :class="getStatusComodatoMeta(row.status).className">
            {{ getStatusComodatoMeta(row.status).label }}
          </div>
        </div>

        <div class="mt-2 text-sm text-gray-700 dark:text-gray-200">
          Qtde: {{ row.quantidade }} • Entrega: {{ formatDateToPtBR(row.dataEntrega) }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Devolução: {{ row.dataDevolucao ? formatDateToPtBR(row.dataDevolucao) : '-' }}
        </div>

        <RouterLink :to="`/assinaturas/assinaturas/${row.assinatura.id}`" class="mt-3 block">
          <Button variant="outline" class="w-full">Abrir assinatura</Button>
        </RouterLink>
      </article>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar comodatos" description="Refine por contrato, cliente ou UID.">
      <div class="space-y-4 px-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Busca</label>
          <Input v-model="searchQuery" placeholder="Contrato, cliente ou UID" @keyup.enter="loadMobile(1)" />
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
      <RouterLink
        to="/assinaturas/assinaturas"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
      >
        <Package class="h-5 w-5" />
        <span class="text-xs">Assinaturas</span>
      </RouterLink>
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
