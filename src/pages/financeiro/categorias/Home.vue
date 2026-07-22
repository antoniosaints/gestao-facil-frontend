<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { BadgePlus, RefreshCcw, RotateCw, Search, Tags, X } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import ModalCategoria from './ModalCategoria.vue'
import ArvoreCategorias from './ArvoreCategorias.vue'
import { useCategoriasFinanceirasStore } from '@/stores/lancamentos/useCategoriasFinanceiras'
import type { CategoriaArvoreNode } from '@/types/schemas'

const uiStore = useUiStore()
const store = useCategoriasFinanceirasStore()
const toast = useToast()

const arvore = ref<CategoriaArvoreNode[]>([])
const loading = ref(false)
const search = ref('')
const showSearchModal = ref(false)

/// Lista plana usada pelo modal para escolher a categoria pai.
const categoriasPlanas = computed<CategoriaArvoreNode[]>(() => {
  const resultado: CategoriaArvoreNode[] = []
  const percorrer = (nodes: CategoriaArvoreNode[]) => {
    for (const node of nodes) {
      resultado.push(node)
      percorrer(node.filhos)
    }
  }
  percorrer(arvore.value)
  return resultado
})

async function loadCategorias() {
  try {
    loading.value = true
    const response = await LancamentosRepository.arvoreCategorias()
    arvore.value = response.data?.arvore ?? []
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar as categorias')
  } finally {
    loading.value = false
  }
}

async function moverCategoria(payload: { id: number; parentId: number | null }) {
  try {
    await LancamentosRepository.moverCategoria(payload.id, payload.parentId)
    toast.success(payload.parentId ? 'Categoria movida para a nova subcategoria.' : 'Categoria agora é principal.')
    await loadCategorias()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível mover a categoria.')
  }
}

async function removeCategoria(item: CategoriaArvoreNode) {
  const confirmed = await useConfirm().confirm({
    title: 'Excluir categoria',
    message: item.totalDescendentes
      ? `A categoria "${item.nome}" possui ${item.totalDescendentes} subcategoria(s), que subirão um nível. Deseja excluir?`
      : `Tem certeza que deseja excluir a categoria "${item.nome}"?`,
  })

  if (!confirmed) return

  try {
    await LancamentosRepository.deletarCategoria(item.id)
    toast.success('Categoria excluída com sucesso!')
    await loadCategorias()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao excluir a categoria')
  }
}

function novaSubcategoria(item: CategoriaArvoreNode) {
  store.openSave(item.id)
}

function editarCategoria(item: CategoriaArvoreNode) {
  store.openUpdate({ id: item.id, Uid: item.Uid, nome: item.nome, parentId: item.parentId })
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
  <div>
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Tags class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Categorias financeiras
        </h2>
        <p class="text-sm text-muted-foreground">
          Organize a hierarquia usada nos lançamentos financeiros
        </p>
      </div>
      <div class="hidden items-center gap-2 md:flex">
        <Input v-model="search" type="search" placeholder="Buscar categoria..." class="w-56" />
        <button
          @click="store.openSave()"
          class="flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-sm text-white"
        >
          <BadgePlus class="inline-flex h-5 w-5" />
          <span class="hidden md:inline">Nova categoria</span>
        </button>
        <button
          @click="loadCategorias"
          title="Atualizar"
          class="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <ArvoreCategorias
      :arvore="arvore"
      :loading="loading"
      :busca="search"
      :pode-arrastar="!uiStore.isMobile"
      @nova-sub="novaSubcategoria"
      @editar="editarCategoria"
      @excluir="removeCategoria"
      @mover="moverCategoria"
    />

    <ModalView
      v-model:open="showSearchModal"
      title="Buscar categorias"
      description="Encontre uma categoria pelo nome ou pelo caminho na hierarquia."
    >
      <div class="space-y-3 px-4">
        <Input v-model="search" type="search" placeholder="Buscar categoria..." @keyup.enter="applySearch" />
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
        @click="store.openSave()"
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

    <ModalCategoria
      v-model:open="store.openModal"
      :categoria="store.selectedCategoria"
      :categorias="categoriasPlanas"
      @saved="loadCategorias"
    />
  </div>
</template>
