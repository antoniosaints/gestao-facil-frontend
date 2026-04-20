<template>
  <div class="mt-2 flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
    <div v-if="loading" class="flex h-[calc(100vh-13rem)] items-center justify-center">
      <div class="h-16 w-16 animate-spin rounded-full border-b-2 border-primary dark:border-primary-dark"></div>
    </div>

    <div v-else class="flex flex-col gap-2 pb-20">
      <div
        v-if="dataMobile.length === 0"
        class="flex h-[calc(100vh-13rem)] items-center justify-center rounded-md bg-card dark:bg-card-dark"
      >
        <div class="text-center">
          <i class="fa-solid fa-box-open mb-4 text-4xl text-gray-500 dark:text-gray-300"></i>
          <p class="text-gray-500 dark:text-gray-300">Nenhum item encontrado.</p>
        </div>
      </div>

      <article
        v-for="row in dataMobile"
        :key="row.id"
        class="rounded-2xl border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="text-sm font-semibold dark:text-white">{{ row.descricao || 'Sem descrição' }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.Uid }}</div>
          </div>
          <div
            :class="[
              'text-xs',
              row.status === 'FATURADA'
                ? 'text-green-500 dark:text-green-400'
                : row.status === 'CANCELADA'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-blue-500 dark:text-blue-400',
            ]"
          >
            {{ row.status }}
          </div>
        </div>

        <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">Cliente: {{ row.Cliente?.nome || '-' }}</div>
        <div class="text-sm font-medium text-gray-700 dark:text-gray-100">
          {{ formatCurrencyBR(getTotal(row)) }}
        </div>

        <div class="mt-3 flex justify-between gap-2">
          <div class="flex flex-wrap gap-1">
            <button
              class="rounded-md bg-cyan-200 px-2 py-1 text-sm text-cyan-900 dark:bg-cyan-800 dark:text-cyan-100"
              @click="store.openDetalhes(row.id!)"
            >
              <Eye class="h-5 w-5" />
            </button>
            <button
              v-if="row.status !== 'FATURADA'"
              class="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              @click="store.openUpdate(row.id!)"
            >
              <PenLine class="h-5 w-5" />
            </button>
            <button
              v-if="row.status !== 'FATURADA'"
              class="rounded-md bg-emerald-200 px-2 py-1 text-sm text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100"
              @click="abrirFaturamento(row.id!)"
            >
              <Wallet class="h-5 w-5" />
            </button>
            <button
              v-else
              class="rounded-md bg-orange-200 px-2 py-1 text-sm text-orange-900 dark:bg-orange-800 dark:text-orange-100"
              @click="estornar(row.id!)"
            >
              <RotateCcw class="h-5 w-5" />
            </button>
            <button
              class="rounded-md bg-blue-200 px-2 py-1 text-sm text-blue-900 dark:bg-blue-800 dark:text-blue-100"
              @click="abrirCobranca(row)"
            >
              <CircleDollarSign class="h-5 w-5" />
            </button>
          </div>
          <button
            class="rounded-md bg-red-200 px-2 py-1 text-sm text-red-900 dark:bg-red-800 dark:text-red-100"
            @click="deletar(row.id!)"
          >
            <Trash class="h-5 w-5" />
          </button>
        </div>
      </article>
    </div>

    <div v-if="showModalBuscar" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        class="max-w-[95%] transform rounded bg-card p-6 shadow-xl transition-all duration-300 animate-fade-in dark:bg-card-dark"
      >
        <h2 class="mb-4 text-xl font-bold">Buscar registro</h2>
        <p class="mb-4">Digite o nome do item que deseja buscar.</p>
        <input
          v-model="searchQuery"
          type="text"
          class="mb-4 w-full rounded border border-border bg-card px-4 py-2 dark:border-border-dark dark:bg-card-dark"
          placeholder="Digite o nome do item"
        />
        <div class="mb-4 flex w-full items-center justify-between">
          <button
            class="rounded-md bg-secondary px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-secondary-dark"
            @click="showModalBuscar = false"
          >
            <i class="fa-regular fa-circle-xmark"></i> Fechar
          </button>
          <button
            type="button"
            class="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-primary-dark"
            @click="renderMobile(1)"
          >
            <i class="fa-solid fa-magnifying-glass"></i> Buscar
          </button>
        </div>
      </div>
    </div>

    <nav
      class="fixed bottom-0 left-0 z-20 flex h-20 w-full justify-around border-t border-border bg-card pt-4 shadow-lg dark:border-border-dark dark:bg-card-dark md:hidden"
    >
      <button
        type="button"
        @click="previousPage"
        :disabled="currentPage <= 1"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
      >
        <i class="fa-solid fa-arrow-left text-lg"></i>
        <span class="text-xs">Anterior</span>
      </button>
      <button
        type="button"
        @click="showModalBuscar = true"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
      >
        <i class="fa-solid fa-search text-lg"></i>
        <span class="text-xs">Busca</span>
      </button>
      <button
        type="button"
        @click="store.openSave()"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
      >
        <i class="fa-solid fa-plus text-lg"></i>
        <span class="text-xs">Nova</span>
      </button>
      <button
        type="button"
        @click="renderMobile(currentPage)"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
      >
        <RotateCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button
        type="button"
        @click="nextPage"
        :disabled="currentPage >= totalPages"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
      >
        <i class="fa-solid fa-arrow-right text-lg"></i>
        <span class="text-xs">Próximo</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import http from '@/utils/axios'
import type { ItensOrdensServico, OrdensServico } from '@/types/schemas'
import { CircleDollarSign, Eye, PenLine, RotateCcw, Trash, Wallet } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'vue-toastification'
import { formatCurrencyBR } from '@/utils/formatters'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'

const store = useOrdemServicoStore()
const storeCobranca = useCobrancasFinanceirasStore()
const toast = useToast()
const dataMobile = ref<Array<OrdensServico & { ItensOrdensServico: ItensOrdensServico[] }>>([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const showModalBuscar = ref(false)

function getTotal(row: OrdensServico & { ItensOrdensServico: ItensOrdensServico[] }) {
  return (
    row.ItensOrdensServico.reduce(
      (acc, item) => acc + Number(item.valor || 0) * Number(item.quantidade || 0),
      0,
    ) - Number(row.desconto || 0)
  )
}

async function renderMobile(page = 1) {
  loading.value = true
  try {
    const response = await http.get('/servicos/lista/ordens/mobile', {
      params: {
        search: searchQuery.value,
        limit: 10,
        page,
      },
    })
    dataMobile.value = response.data.data
    currentPage.value = response.data.pagination.page
    totalPages.value = response.data.pagination.totalPages
    showModalBuscar.value = false
  } catch (error) {
    console.error('mobile_ordens:', error)
    dataMobile.value = []
  } finally {
    loading.value = false
  }
}

function previousPage() {
  if (currentPage.value > 1) renderMobile(currentPage.value - 1)
}

function nextPage() {
  if (currentPage.value < totalPages.value) renderMobile(currentPage.value + 1)
}

function abrirFaturamento(id: number) {
  store.idMutation = id
  store.openModalFaturar = true
}

function abrirCobranca(row: OrdensServico & { ItensOrdensServico: ItensOrdensServico[] }) {
  storeCobranca.openSave({
    id: row.id!,
    tipo: 'os',
    valor: getTotal(row),
  })
}

async function deletar(id: number) {
  if (!id) return toast.error('ID não informado!')
  const confirm = await useConfirm().confirm({
    title: 'Excluir OS',
    message: 'Tem certeza que deseja excluir esta OS?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await OrdensServicoRepository.remove(id)
    store.updateTable()
    toast.success('OS deletada com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao deletar a OS')
  }
}

async function estornar(id: number) {
  const confirm = await useConfirm().confirm({
    title: 'Estornar faturamento',
    message: 'Tem certeza que deseja estornar o faturamento desta OS?',
    confirmText: 'Sim, estornar',
  })
  if (!confirm) return

  try {
    await OrdensServicoRepository.estornar(id)
    store.updateTable()
    toast.success('OS estornada com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a OS')
  }
}

watch(
  () => store.filters.update,
  () => {
    renderMobile()
  },
)

onMounted(() => renderMobile())
</script>
