<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import http from '@/utils/axios'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ProdutoRepository, ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoBase, ProdutoVariante } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import {
  ArchiveRestore,
  BadgePlus,
  BarChart3,
  Boxes,
  Eye,
  FileChartLine,
  FolderTree,
  Layers3,
  Package2,
  PenLine,
  Plus,
  Search,
  Trash,
} from 'lucide-vue-next'
import router from '@/router'

const store = useProdutoStore()
const toast = useToast()

const dataMobile = ref<Array<ProdutoBase | ProdutoVariante>>([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const showModalBuscarProdutos = ref(false)
const showDrawerProdutos = ref(false)

function getStatusColor(status?: string) {
  switch (status) {
    case 'ATIVO':
      return 'text-green-500 dark:text-green-400'
    case 'INATIVO':
      return 'text-gray-500 dark:text-gray-400'
    case 'BLOQUEADO':
      return 'text-red-500 dark:text-red-400'
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
}

function getBaseSecondaryText(row: ProdutoBase) {
  return `${row.totalVariantes || 0} variante(s) • ${row.estoqueTotal || 0} ${row.unidade || 'un'} em estoque`
}

function getVariantSecondaryText(row: ProdutoVariante) {
  return `${row.produtoBaseNome || row.nome} • ${row.estoque || 0} ${row.unidade || 'un'} em estoque`
}

async function renderMobile(page = 1) {
  loading.value = true
  try {
    const response = await http.get(`/produtos/mobile/data`, {
      params: {
        search: searchQuery.value,
        limit: 10,
        page,
        listingMode: store.filters.listingMode,
      },
    })
    dataMobile.value = response.data.data
    currentPage.value = response.data.pagination.page
    totalPages.value = response.data.pagination.totalPages
    showModalBuscarProdutos.value = false
  } catch (error) {
    console.error('mobile_produtos:', error)
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

function openSaveProduto() {
  showDrawerProdutos.value = false
  store.openSave()
}

function openSaveVariante() {
  showDrawerProdutos.value = false
  store.openSaveVariante()
}

function openDashboard() {
  showDrawerProdutos.value = false
  router.push('/produtos/dashboard')
}

function openCategorias() {
  showDrawerProdutos.value = false
  router.push('/produtos/categorias')
}

function openCatalogoReport() {
  showDrawerProdutos.value = false
  store.openReportModal({ reportType: 'catalogo' })
}

function switchListingMode(mode: 'base' | 'variante') {
  showDrawerProdutos.value = false
  store.updateListingMode(mode)
}

function openModalReposicao(varianteId?: number | null) {
  if (!varianteId) return toast.error('Variante padrão não encontrada')
  store.idMutation = varianteId
  store.openModalReposicao = true
}

function gerarRelatorioVariante(varianteId?: number | null) {
  if (!varianteId) return toast.error('Variante não encontrada')
  store.openReportModal({
    reportType: 'movimentacoes',
    scope: 'variante',
    targetId: varianteId,
  })
}

function openCentralRelatoriosProduto(produtoId?: number | null) {
  if (!produtoId) return toast.error('Produto base não encontrado')
  store.openReportModal({
    reportType: 'vendas',
    scope: 'produto-base',
    targetId: produtoId,
  })
}

async function deletar(id: number) {
  if (!id) return toast.error('ID não informado')
  const confirm = await useConfirm().confirm({
    title: 'Excluir produto',
    message: 'Tem certeza que deseja excluir este produto base e suas variantes?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await ProdutoRepository.remove(id)
    store.updateTable()
    toast.success('Produto deletado com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar o produto')
  }
}

async function deletarVariante(id: number) {
  if (!id) return toast.error('ID não informado')
  const confirm = await useConfirm().confirm({
    title: 'Excluir variante',
    message: 'Tem certeza que deseja excluir esta variante?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await ProdutoVarianteRepository.remove(id)
    store.updateTable()
    toast.success('Variante deletada com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar a variante')
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
          <p class="text-gray-500 dark:text-gray-300">
            Nenhum {{ store.filters.listingMode === 'base' ? 'produto' : 'item' }} encontrado.
          </p>
        </div>
      </div>

      <article
        v-for="row in dataMobile"
        :key="row.id"
        class="rounded-2xl cursor-pointer border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      >
        <template v-if="store.filters.listingMode === 'base'">
          <div class="flex justify-between gap-3">
            <div class="text-sm font-semibold dark:text-white">{{ row.Uid || `#${row.id}` }}</div>
            <div class="text-sm text-green-500 dark:text-green-400">
              {{ formatCurrencyBR(Number((row as ProdutoBase).preco || 0)) }}
            </div>
          </div>

          <div class="flex justify-between gap-3">
            <div :class="`text-xs ${getStatusColor(row.status)}`">{{ row.status }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ row.categoria || 'Sem categoria' }}
            </div>
          </div>

          <div class="text-sm font-medium text-gray-700 dark:text-gray-100">{{ row.nome }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ getBaseSecondaryText(row as ProdutoBase) }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ (row as ProdutoBase).codigo || 'Sem código padrão' }}</div>

          <div class="mt-2 flex justify-between gap-2">
            <div class="flex gap-1">
              <button
                @click="router.push(`/produtos/detalhes?id=${row.id}`)"
                class="rounded-md bg-blue-200 px-2 py-1 text-sm text-blue-900 dark:bg-blue-800 dark:text-blue-100"
              >
                <Eye class="h-5 w-5" />
              </button>
              <button
                @click="openCentralRelatoriosProduto(row.id)"
                class="rounded-md bg-orange-200 px-2 py-1 text-sm text-orange-900 dark:bg-orange-800 dark:text-orange-100"
              >
                <FileChartLine class="h-5 w-5" />
              </button>
              <button
                @click="openModalReposicao((row as ProdutoBase).variantePadraoId)"
                class="rounded-md bg-emerald-200 px-2 py-1 text-sm text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100"
              >
                <ArchiveRestore class="h-5 w-5" />
              </button>
              <button
                @click="store.openUpdate(row.id!)"
                class="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              >
                <PenLine class="h-5 w-5" />
              </button>
            </div>
            <button
              @click="deletar(row.id!)"
              class="rounded-md bg-red-200 px-2 py-1 text-sm text-red-900 dark:bg-red-800 dark:text-red-100"
            >
              <Trash class="h-5 w-5" />
            </button>
          </div>
        </template>

        <template v-else>
          <div class="flex justify-between gap-3">
            <div class="text-sm font-semibold dark:text-white">{{ row.Uid || `#${row.id}` }}</div>
            <div class="text-sm text-green-500 dark:text-green-400">
              {{ formatCurrencyBR(Number((row as ProdutoVariante).preco || 0)) }}
            </div>
          </div>

          <div class="flex justify-between gap-3">
            <div :class="`text-xs ${getStatusColor(row.status)}`">{{ row.status }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ (row as ProdutoVariante).categoria || 'Sem categoria' }}
            </div>
          </div>

          <div class="text-sm font-medium text-gray-700 dark:text-gray-100">
            {{ (row as ProdutoVariante).nomeVariante || 'Padrão' }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ getVariantSecondaryText(row as ProdutoVariante) }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ (row as ProdutoVariante).codigo || 'Sem código' }}</div>

          <div class="mt-2 flex justify-between gap-2">
            <div class="flex gap-1">
              <button
                @click="router.push(`/produtos/detalhes?id=${(row as ProdutoVariante).produtoBaseId}&varianteId=${row.id}`)"
                class="rounded-md bg-blue-200 px-2 py-1 text-sm text-blue-900 dark:bg-blue-800 dark:text-blue-100"
              >
                <Eye class="h-5 w-5" />
              </button>
              <button
                @click="gerarRelatorioVariante(row.id)"
                class="rounded-md bg-orange-200 px-2 py-1 text-sm text-orange-900 dark:bg-orange-800 dark:text-orange-100"
              >
                <FileChartLine class="h-5 w-5" />
              </button>
              <button
                @click="openModalReposicao(row.id)"
                class="rounded-md bg-emerald-200 px-2 py-1 text-sm text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100"
              >
                <ArchiveRestore class="h-5 w-5" />
              </button>
              <button
                @click="store.openUpdateVariante(row.id!)"
                class="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              >
                <PenLine class="h-5 w-5" />
              </button>
            </div>
            <button
              @click="deletarVariante(row.id!)"
              :disabled="(row as ProdutoVariante).ehPadrao === true"
              class="rounded-md bg-red-200 px-2 py-1 text-sm text-red-900 disabled:opacity-50 dark:bg-red-800 dark:text-red-100"
            >
              <Trash class="h-5 w-5" />
            </button>
          </div>
        </template>
      </article>
    </div>

    <div
      v-if="showModalBuscarProdutos"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="max-w-[95%] transform rounded bg-card p-6 shadow-xl transition-all duration-300 animate-fade-in dark:bg-card-dark"
      >
        <h2 class="mb-4 text-xl font-bold">Buscar no catálogo</h2>
        <p class="mb-4">Digite o nome, código ou variante que deseja buscar.</p>
        <input
          v-model="searchQuery"
          type="text"
          class="mb-4 w-full rounded border border-border bg-card px-4 py-2 dark:border-border-dark dark:bg-card-dark"
          :placeholder="store.filters.listingMode === 'base' ? 'Buscar produto base...' : 'Buscar variante...'
          "
        />
        <div class="mb-4 flex w-full items-center justify-between">
          <button
            class="rounded-md bg-secondary px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-secondary-dark"
            @click="showModalBuscarProdutos = false"
          >
            <i class="fa-regular fa-circle-xmark"></i>
            Fechar
          </button>
          <button
            type="button"
            class="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-primary-dark"
            @click="renderMobile(1)"
          >
            <i class="fa-solid fa-magnifying-glass"></i>
            Buscar
          </button>
        </div>
      </div>
    </div>

    <ModalView v-model:open="showDrawerProdutos" title="Produtos" description="Ações do catálogo no mobile">
      <div class="grid grid-cols-3 gap-4 p-4 lg:grid-cols-4">
        <div
          @click="switchListingMode('base')"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <Package2 class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Produtos</div>
        </div>

        <div
          @click="switchListingMode('variante')"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <Layers3 class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Variantes</div>
        </div>

        <div
          @click="openSaveProduto"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <BadgePlus class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Cadastrar</div>
        </div>

        <div
          @click="openSaveVariante"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <Plus class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Variante</div>
        </div>

        <div
          @click="openDashboard"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <BarChart3 class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Dashboard</div>
        </div>

        <div
          @click="openCategorias"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <FolderTree class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Categorias</div>
        </div>

        <div
          @click="openCatalogoReport"
          class="rounded-lg border-2 bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
            <FileChartLine class="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-center font-medium text-gray-500 dark:text-gray-400">Relatório</div>
        </div>
      </div>
      <div class="flex w-full px-4">
        <Button @click="showDrawerProdutos = false" variant="outline" class="w-full">
          Fechar
        </Button>
      </div>
    </ModalView>

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
        @click="showModalBuscarProdutos = true"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
      >
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button
        type="button"
        @click="showDrawerProdutos = !showDrawerProdutos"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
      >
        <i class="fa-solid fa-bars text-lg"></i>
        <span class="text-xs">Mais</span>
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
