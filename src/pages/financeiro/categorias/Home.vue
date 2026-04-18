<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BadgePlus,
  BadgeQuestionMark,
  Loader,
  RefreshCcw,
  RotateCw,
  Search,
  Tags,
  Trash,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import ModalCategoria from './ModalCategoria.vue'
import Tabela from './tabela/Tabela.vue'
import { useCategoriasFinanceirasStore } from '@/stores/lancamentos/useCategoriasFinanceiras'

type CategoriaRow = {
  id: number
  Uid?: string
  nome: string
  parentId: number | null
}

type CategoriaExibicao = CategoriaRow & {
  nivel: number
  parentName: string | null
}

const uiStore = useUiStore()
const store = useCategoriasFinanceirasStore()
const toast = useToast()

const categorias = ref<CategoriaRow[]>([])
const loading = ref(false)
const search = ref('')
const showSearchModal = ref(false)

const categoriasPai = computed(() => categorias.value.filter((item) => item.parentId === null))

const categoriasOrdenadas = computed<CategoriaExibicao[]>(() => {
  const parents = categorias.value
    .filter((item) => item.parentId === null)
    .sort((a, b) => a.nome.localeCompare(b.nome))
  const childrenByParent = new Map<number, CategoriaRow[]>()

  categorias.value
    .filter((item) => item.parentId !== null)
    .forEach((item) => {
      const parentId = item.parentId as number
      const rows = childrenByParent.get(parentId) ?? []
      rows.push(item)
      rows.sort((a, b) => a.nome.localeCompare(b.nome))
      childrenByParent.set(parentId, rows)
    })

  const ordered: CategoriaExibicao[] = []

  for (const parent of parents) {
    ordered.push({
      ...parent,
      nivel: 0,
      parentName: null,
    })

    for (const child of childrenByParent.get(parent.id) ?? []) {
      ordered.push({
        ...child,
        nivel: 1,
        parentName: parent.nome,
      })
    }
  }

  const orphanChildren = categorias.value
    .filter((item) => item.parentId !== null && !categorias.value.some((parent) => parent.id === item.parentId))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  for (const child of orphanChildren) {
    ordered.push({
      ...child,
      nivel: 1,
      parentName: 'Categoria pai removida',
    })
  }

  return ordered
})

const categoriasFiltradas = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return categoriasOrdenadas.value

  return categoriasOrdenadas.value.filter((item) => {
    const haystack = [item.nome, item.parentName ?? '', String(item.id), item.nivel === 0 ? 'pai' : 'filha']
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

async function loadCategorias() {
  try {
    loading.value = true
    const response = await LancamentosRepository.listarCategorias()
    categorias.value = (response.data ?? []).map((item: CategoriaRow) => ({
      id: Number(item.id),
      Uid: item.Uid,
      nome: item.nome,
      parentId: item.parentId ?? null,
    }))
  } catch (error) {
    console.log(error)
    toast.error('Erro ao carregar as categorias')
  } finally {
    loading.value = false
  }
}

async function removeCategoria(item: CategoriaRow) {
  try {
    const confirmed = await useConfirm().confirm({
      title: 'Excluir categoria',
      message: `Tem certeza que deseja excluir a categoria "${item.nome}"?`,
    })

    if (!confirmed) return

    await LancamentosRepository.deletarCategoria(item.id)
    toast.success('Categoria excluída com sucesso!')
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir a categoria')
  }
}

function handleSaved() {
  store.updateTable()
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
        <h2 class="flex items-center gap-2 text-2xl font-bold text-gray-700 dark:text-gray-300">
          <Tags class="h-6 w-6" :stroke-width="2.5" />
          Categorias financeiras
        </h2>
        <p class="text-sm text-muted-foreground">Gerencie as categorias usadas nos lançamentos financeiros</p>
      </div>
      <div class="hidden items-center justify-between gap-2 md:flex">
        <button
          @click="store.openSave"
          class="flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-sm text-white"
        >
          <BadgePlus class="inline-flex h-5 w-5" />
          <span class="hidden md:inline">Nova categoria</span>
        </button>
        <button @click="store.updateTable" class="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
          <RotateCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="hidden overflow-x-auto rounded-lg md:block">
      <Tabela />
    </div>

    <div v-else class="flex max-h-[calc(100vh-13rem)] flex-col gap-2 overflow-auto md:max-h-full">
      <div class="text-xs text-muted-foreground">{{ categoriasFiltradas.length }} categoria(s) encontrada(s)</div>

      <div v-if="loading && !categoriasFiltradas.length" class="rounded-2xl border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando categorias cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else class="flex flex-col gap-2 pb-20">
        <div v-if="!loading && !categoriasFiltradas.length" class="rounded-2xl border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BadgeQuestionMark />
              </EmptyMedia>
              <EmptyTitle>Nenhuma categoria encontrada</EmptyTitle>
              <EmptyDescription>Cadastre categorias para organizar os lançamentos financeiros.</EmptyDescription>
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
            <Badge :variant="item.nivel === 0 ? 'secondary' : 'outline'">
              {{ item.nivel === 0 ? 'Pai' : 'Filha' }}
            </Badge>
          </div>

          <div class="mt-1 text-xs text-muted-foreground">
            {{ item.parentName ? `Categoria pai: ${item.parentName}` : 'Categoria principal' }}
          </div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <button
              @click="store.openUpdate(item)"
              class="rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            >
              Editar
            </button>
            <button
              @click="removeCategoria(item)"
              class="inline-flex items-center gap-1 rounded-md bg-red-200 px-3 py-1.5 text-sm text-red-900 dark:bg-red-800 dark:text-red-100"
            >
              <Trash class="h-4 w-4" />
              Excluir
            </button>
          </div>
        </article>
      </div>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar categorias" description="Encontre uma categoria pelo nome, nível ou identificador.">
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
        @click="store.openSave"
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
      :categorias-pai="categoriasPai"
      @saved="handleSaved"
    />
  </div>
</template>
