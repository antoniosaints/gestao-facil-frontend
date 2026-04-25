<template>
  <div>
    <div class="mt-2 flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
      <div v-if="loading" class="flex h-[calc(100vh-13rem)] items-center justify-center">
        <div class="h-16 w-16 animate-spin rounded-full border-b-2 border-primary dark:border-primary-dark"></div>
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-if="dataMobile.length === 0"
          class="flex h-[calc(100vh-12rem)] items-center justify-center rounded-md bg-card dark:bg-card-dark"
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
          <div class="flex justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold dark:text-white">{{ row.descricao }}</div>
              <div v-if="row.origemSistema === 'ASSINATURA_PAGAR' && row.assinaturaPagar" class="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span class="rounded-md border border-violet-300 px-2 py-0.5 text-violet-700 dark:border-violet-800 dark:text-violet-300">Assinatura</span>
                <span class="truncate text-muted-foreground">{{ row.assinaturaPagar.nomeServico }}</span>
              </div>
            </div>
            <div
              :class="[
                'flex items-center justify-center text-sm',
                row.tipo === 'RECEITA' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400',
              ]"
            >
              <ArrowDown v-if="row.tipo === 'DESPESA'" class="inline-flex h-4 w-4" />
              <ArrowUp v-else class="inline-flex h-4 w-4" />
              {{ formatCurrencyBR(Number(row.valorTotal)) }}
            </div>
          </div>
          <div
            :class="[
              'flex items-center justify-between text-xs',
              row.tipo === 'RECEITA' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400',
            ]"
          >
            <span class="flex items-center">
              {{ row.tipo || '-' }}
              <Dot class="inline-flex h-5 w-5" />
              <div
                :class="`text-xs text-${row.status === 'PAGO' ? 'green' : 'red'}-500 dark:text-${row.status === 'PAGO' ? 'green' : 'gray'}-400`"
              >
                {{ row.status }}
              </div>
            </span>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ new Date(row.dataLancamento).toLocaleDateString('pt-BR') }}
            </div>
          </div>
          <div class="mt-2 flex justify-between gap-2">
            <div class="flex gap-1">
              <button
                class="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                @click="store.openUpdate(row.id!)"
              >
                <Pencil class="h-5 w-5" />
              </button>
              <RouterLink :to="`/financeiro/detalhes?id=${row.id}`">
                <button class="rounded-md bg-blue-200 px-2 py-1 text-sm text-blue-900 dark:bg-blue-800 dark:text-blue-100">
                  <Eye class="h-5 w-5" />
                </button>
              </RouterLink>
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
            @click="renderListaVendas(1)"
          >
            <i class="fa-solid fa-magnifying-glass"></i> Buscar
          </button>
        </div>
      </div>
    </div>

    <Drawer v-model:open="showDrawer">
      <DrawerContent>
        <DrawerHeader class="text-left">
          <DrawerTitle>Lançamentos</DrawerTitle>
        </DrawerHeader>
        <div class="grid grid-cols-3 gap-4 p-4 lg:grid-cols-4">
          <div
            class="cursor-pointer rounded-lg border-2 bg-gray-50 p-4 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="openSave('RECEITA')"
          >
            <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
              <TrendingUp class="h-10 w-10 text-green-500 dark:text-green-400" />
            </div>
            <div class="text-center font-medium text-gray-500 dark:text-gray-400">Receita</div>
          </div>
          <div
            class="cursor-pointer rounded-lg border-2 bg-gray-50 p-4 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="openSave('DESPESA')"
          >
            <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
              <TrendingDown class="h-10 w-10 text-red-500 dark:text-red-400" />
            </div>
            <div class="text-center font-medium text-gray-500 dark:text-gray-400">Despesa</div>
          </div>
          <div
            class="cursor-pointer rounded-lg border-2 bg-gray-50 p-4 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="store.openModalDre = true"
          >
            <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
              <FileChartLine class="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <div class="text-center font-medium text-gray-500 dark:text-gray-400">DRE</div>
          </div>
          <div
            class="cursor-pointer rounded-lg border-2 bg-gray-50 p-4 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="goToCategorias"
          >
            <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
              <Tags class="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <div class="text-center font-medium text-gray-500 dark:text-gray-400">Categorias</div>
          </div>
          <div
            class="cursor-pointer rounded-lg border-2 bg-gray-50 p-4 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="goToContas"
          >
            <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
              <Wallet class="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <div class="text-center font-medium text-gray-500 dark:text-gray-400">Contas</div>
          </div>
          <div
            class="cursor-pointer rounded-lg border-2 bg-gray-50 p-4 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="openLote"
          >
            <div class="mx-auto mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-full p-1">
              <Upload class="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <div class="text-center font-medium text-gray-500 dark:text-gray-400">Importar CSV</div>
          </div>
        </div>
        <DrawerFooter class="pt-2">
          <DrawerClose as-child>
            <Button variant="outline">
              Fechar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

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
        @click="showDrawer = !showDrawer"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
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

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import http from '@/utils/axios'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, Dot, Eye, FileChartLine, Pencil, Tags, Trash, TrendingDown, TrendingUp, Upload, Wallet } from 'lucide-vue-next'
import type { LancamentoFinanceiro } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useToast } from 'vue-toastification'
import router from '@/router'

const store = useLancamentosStore()
const toast = useToast()
const dataMobile = ref<LancamentoFinanceiro[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const showModalBuscar = ref(false)
const showDrawer = ref(false)

function openSave(tipo: 'RECEITA' | 'DESPESA') {
  store.form.tipo = tipo
  store.openSave()
}

function renderListaVendas(page = 1) {
  loading.value = true
  http
    .get('/lancamentos/mobile/data', {
      params: {
        search: searchQuery.value,
        limit: 10,
        page,
        tipo: store.filters.tipo,
        status: store.filters.status,
        origem: store.filters.origem,
        contaFinanceiraId: store.filters.contaFinanceiraId,
        categoriaId: store.filters.categoriaId,
        clienteId: store.filters.clienteId,
        inicio: store.filters.inicio,
        fim: store.filters.fim,
      },
    })
    .then((response) => {
      dataMobile.value = response.data.data
      currentPage.value = response.data.pagination.page
      totalPages.value = response.data.pagination.totalPages
      loading.value = false
      showModalBuscar.value = false
    })
    .catch((err) => {
      console.error('mobile_lancamentos:', err)
      dataMobile.value = []
      loading.value = false
    })
}

function previousPage() {
  if (currentPage.value > 1) renderListaVendas(currentPage.value - 1)
}

function nextPage() {
  if (currentPage.value < totalPages.value) renderListaVendas(currentPage.value + 1)
}

function goToCategorias() {
  showDrawer.value = false
  router.push('/financeiro/categorias')
}

function goToContas() {
  showDrawer.value = false
  router.push('/financeiro/contas')
}

function openLote() {
  showDrawer.value = false
  store.openModalLote = true
}

watch(
  () => store.filters.update,
  () => {
    renderListaVendas()
  },
)

async function deletar(id: number) {
  if (!id) return toast.error('ID não informado!')
  const confirm = await useConfirm().confirm({
    title: 'Excluir lançamento',
    message: 'Tem certeza que deseja excluir este lançamento?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await LancamentosRepository.remove(id)
    store.updateTable()
    toast.success('Lançamento deletado com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar o lançamento')
  }
}

onMounted(() => renderListaVendas())
</script>
