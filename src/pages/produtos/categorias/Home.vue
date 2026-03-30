<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ProdutoCategoriaRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoCategoria } from '@/types/schemas'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { BadgePlus, FolderTree, Loader, RotateCw, Search, Trash2 } from 'lucide-vue-next'
import Tabela from './tabela/Tabela.vue'
import ModalCategoriaProduto from '../formulario/ModalCategoriaProduto.vue'

const store = useProdutoStore()
const toast = useToast()
const categorias = ref<ProdutoCategoria[]>([])
const loading = ref(false)
const search = ref('')

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
    <div class="flex flex-col gap-2 justify-between md:flex-row md:items-center">
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

    <div class="space-y-3 md:hidden">
      <div class="space-y-2">
        <div class="flex items-center space-x-1 rounded-md border border-border bg-card pl-3">
          <Search class="h-4 w-4 text-muted-foreground" />
          <Input
            v-model="search"
            type="search"
            placeholder="Buscar categoria..."
            class="h-9 border-none shadow-none focus-visible:ring-0"
          />
        </div>
        <Button class="w-full text-white" @click="store.openSaveCategoria">
          <BadgePlus class="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

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

      <div
        v-for="item in categorias.filter((categoria) =>
          [categoria.nome, categoria.Uid || ''].join(' ').toLowerCase().includes(search.toLowerCase()),
        )"
        :key="item.id"
        class="rounded-2xl border border-border bg-card p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-semibold">{{ item.nome }}</div>
            <div class="text-xs text-muted-foreground">{{ item.Uid || `#${item.id}` }}</div>
          </div>
          <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {{ item.status || 'ATIVO' }}
          </span>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" @click="editarCategoria(item)">Editar</Button>
          <Button variant="outline" @click="removeCategoria(item)">
            <Trash2 class="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
    </div>

    <ModalCategoriaProduto />
  </div>
</template>
