<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import http from '@/utils/axios'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoBase } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import { ArchiveRestore, BadgePlus, FileChartLine, Package2, Plus, RefreshCw, Tags, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Loader } from 'lucide-vue-next'
import router from '@/router'

const store = useProdutoStore()
const toast = useToast()

const dataMobile = ref<ProdutoBase[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchQuery = ref('')

async function renderMobile(page = 1) {
  loading.value = true
  try {
    const response = await http.get(`/produtos/mobile/data`, {
      params: {
        search: searchQuery.value,
        limit: 10,
        page,
      },
    })
    dataMobile.value = response.data.data
    currentPage.value = response.data.pagination.page
    totalPages.value = response.data.pagination.totalPages
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

function openModalReposicao(varianteId?: number | null) {
  if (!varianteId) return toast.error('Variante padrão não encontrada')
  store.idMutation = varianteId
  store.openModalReposicao = true
}

function gerarRelatorio(varianteId?: number | null) {
  if (!varianteId) return toast.error('Variante padrão não encontrada')
  store.idMutation = varianteId
  store.openModalRelatorio = true
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

watch(
  () => store.filters.update,
  () => {
    renderMobile()
  },
)

onMounted(() => renderMobile())
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <Input v-model="searchQuery" type="search" placeholder="Buscar produto base ou variante..." />
      <div class="grid grid-cols-2 gap-2">
        <Button class="text-white" @click="store.openSave">
          <BadgePlus class="mr-2 h-4 w-4" />
          Novo
        </Button>
        <Button variant="outline" @click="renderMobile()">
          <RefreshCw class="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-border p-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader class="h-6 w-6 animate-spin text-info" />
          </EmptyMedia>
          <EmptyTitle>Carregando produtos</EmptyTitle>
          <EmptyDescription>Buscando o catálogo cadastrado.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else-if="!dataMobile.length" class="rounded-2xl border border-border p-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package2 class="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum produto encontrado</EmptyTitle>
          <EmptyDescription>Cadastre um produto para começar a trabalhar com variantes.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else class="grid grid-cols-1 gap-3">
      <article
        v-for="row in dataMobile"
        :key="row.id"
        class="rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="text-base font-semibold">{{ row.nome }}</div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{{ row.Uid || `#${row.id}` }}</span>
              <span>•</span>
              <span>{{ row.categoria || 'Sem categoria' }}</span>
            </div>
          </div>
          <div class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {{ row.totalVariantes || 0 }} variantes
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl border border-border p-3">
            <div class="text-xs text-muted-foreground">Preço padrão</div>
            <div class="font-semibold text-green-600">{{ formatCurrencyBR(Number(row.preco || 0)) }}</div>
          </div>
          <div class="rounded-xl border border-border p-3">
            <div class="text-xs text-muted-foreground">Estoque total</div>
            <div class="font-semibold">{{ row.estoqueTotal || 0 }} {{ row.unidade || 'un' }}</div>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Tags class="h-4 w-4" />
          {{ row.codigo || 'Sem código padrão' }}
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" @click="router.push(`/produtos/detalhes?id=${row.id}`)">Ver detalhes</Button>
          <Button variant="outline" @click="store.openUpdate(row.id!)">Editar</Button>
          <Button variant="outline" @click="openModalReposicao(row.variantePadraoId)">Reposição</Button>
          <Button variant="outline" @click="gerarRelatorio(row.variantePadraoId)">Relatório</Button>
          <Button variant="outline" class="col-span-2" @click="deletar(row.id!)">
            <Trash2 class="mr-2 h-4 w-4" />
            Excluir produto
          </Button>
        </div>
      </article>
    </div>

    <div class="flex items-center justify-between gap-2 pb-20">
      <Button variant="outline" :disabled="currentPage <= 1" @click="previousPage">
        <ArchiveRestore class="mr-2 h-4 w-4" />
        Anterior
      </Button>
      <span class="text-sm text-muted-foreground">Página {{ currentPage }} de {{ totalPages }}</span>
      <Button variant="outline" :disabled="currentPage >= totalPages" @click="nextPage">
        <Plus class="mr-2 h-4 w-4" />
        Próxima
      </Button>
    </div>
  </div>
</template>
