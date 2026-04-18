<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ProdutoCategoriaRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { useUiStore } from '@/stores/ui/uiStore'
import type { ProdutoCategoria } from '@/types/schemas'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { BadgePlus, FolderTree, Loader, RefreshCcw, RotateCw, Search, Trash2, X } from 'lucide-vue-next'
import Tabela from './tabela/Tabela.vue'
import ModalCategoriaProduto from '../formulario/ModalCategoriaProduto.vue'

const uiStore = useUiStore()
const store = useProdutoStore()
const toast = useToast()
const categorias = ref<ProdutoCategoria[]>([])
const loading = ref(false)
const search = ref('')
const showSearchModal = ref(false)

const categoriasFiltradas = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return categorias.value

  return categorias.value.filter((categoria) =>
    [categoria.nome, categoria.Uid || '', categoria.status || ''].join(' ').toLowerCase().includes(term),
  )
})

async function loadCategorias() {
  try {
    loading.value = true
    const response = await ProdutoCategoriaRepository.list()
    categorias.value = response.data ?? []
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar categorias')
  } finally {
    loading.value = false
  }
}

async function removeCategoria(item: ProdutoCategoria) {
  if (!item.id) return
  const confirm = await useConfirm().confirm({
    title: 'Excluir categoria',
    message: `Tem certeza que deseja excluir a categoria "${item.nome}"?`,
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return

  try {
    await ProdutoCategoriaRepository.remove(item.id)
    toast.success('Categoria excluída com sucesso')
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir categoria')
  }
}

function editarCategoria(item: ProdutoCategoria) {
  store.categoriaForm = {
    id: item.id,
    nome: item.nome,
    status: item.status || 'ATIVO',
  }
  store.openModalCategoria = true
}

function applySearch() {
  showSearchModal.value = false
}

function clearSearch() {
  search.value = ''
  showSearchModal.value = false
}

watch(
  () => store.filters.update,
  () => {
    loadCategorias()
  },
)

onMounted(loadCategorias)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-gray-700 dark:text-gray-300">
          <FolderTree class="h-6 w-6" :stroke-width="2.5" />
          Categorias de produtos
        </h2>
        <p class="text-sm text-muted-foreground">Organize os produtos base em categorias próprias do catálogo.</p>
      </div>
      <div class="hidden items-center gap-2 md:flex">
        <Button class="text-white" @click="store.openSaveCategoria">
          <BadgePlus class="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
        <Button variant="outline" @click="store.updateTable">
          <RotateCw class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="hidden overflow-x-auto rounded-lg md:block">
      <Tabela />
    </div>

    <div v-if="uiStore.isMobile" class="flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
      <div class="text-xs text-muted-foreground">{{ categoriasFiltradas.length }} categoria(s) encontrada(s)</div>

      <div v-if="loading" class="rounded-2xl border border-border p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando categorias</EmptyTitle>
            <EmptyDescription>Buscando categorias cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2 pb-20">
        <div v-if="!categoriasFiltradas.length" class="rounded-2xl border border-border p-8">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderTree class="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma categoria encontrada</EmptyTitle>
              <EmptyDescription>Ajuste a busca ou cadastre uma nova categoria.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <article
          v-for="item in categoriasFiltradas"
          :key="item.id"
          class="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-foreground">{{ item.Uid || `#${item.id}` }}</div>
              <div class="text-sm font-medium text-foreground">{{ item.nome }}</div>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {{ item.status || 'ATIVO' }}
            </span>
          </div>

          <div class="mt-1 text-xs text-muted-foreground">Categoria do catálogo de produtos base.</div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <Button variant="outline" @click="editarCategoria(item)">Editar</Button>
            <Button variant="outline" @click="removeCategoria(item)">
              <Trash2 class="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </article>
      </div>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar categorias" description="Encontre categorias do catálogo pelo nome ou identificador.">
      <div class="space-y-3 px-4">
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar categoria..."
          @keyup.enter="applySearch"
        />
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="clearSearch">Limpar</Button>
          <Button class="flex-1" @click="applySearch">Buscar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
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
        @click="clearSearch"
      >
        <X class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="store.openSaveCategoria"
      >
        <BadgePlus class="h-5 w-5" />
        <span class="text-xs">Nova</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="loadCategorias"
      >
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>

    <ModalCategoriaProduto />
  </div>
</template>
