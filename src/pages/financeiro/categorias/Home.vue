<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { BadgePlus, BadgeQuestionMark, Loader, RotateCw, Search, Tags, Trash } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
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
    <div class="flex flex-col md:flex-row gap-2 justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Tags class="h-6 w-6" :stroke-width="2.5" />
          Categorias financeiras
        </h2>
        <p class="text-sm text-muted-foreground">Gerencie as categorias usadas nos lançamentos financeiros</p>
      </div>
      <div class="justify-between gap-2 items-center hidden md:flex">
        <button
          @click="store.openSave"
          class="bg-primary text-white px-2 py-1.5 text-sm rounded-md flex items-center gap-1"
        >
          <BadgePlus class="h-5 w-5 inline-flex" />
          <span class="hidden md:inline">Nova categoria</span>
        </button>
        <button @click="store.updateTable" class="bg-background border border-border px-2 py-1.5 text-sm rounded-md">
          <RotateCw class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div v-if="!uiStore.isMobile" class="overflow-x-auto hidden md:block rounded-lg">
      <Tabela />
    </div>

    <div v-else class="space-y-3">
      <div class="space-y-2">
        <div class="flex items-center space-x-1 bg-card rounded-md border border-border pl-3">
          <Search class="h-4 w-4 text-muted-foreground" />
          <Input
            v-model="search"
            type="search"
            placeholder="Buscar categoria..."
            class="border-none outline-none focus-visible:ring-0 shadow-none h-9"
          />
        </div>
        <button
          @click="store.openSave"
          class="w-full bg-primary text-white px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2"
        >
          <BadgePlus class="h-5 w-5 inline-flex" />
          Nova categoria
        </button>
      </div>

      <div v-if="loading && !categoriasFiltradas.length" class="rounded-lg border border-border p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 text-info animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando categorias cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div
        v-for="item in categoriasFiltradas"
        :key="item.id"
        class="rounded-lg border border-border bg-background p-3 space-y-2"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium text-foreground">{{ item.nome }}</div>
            <div class="text-xs text-muted-foreground">{{ item.Uid || `#${item.id}` }}</div>
          </div>
          <Badge :variant="item.nivel === 0 ? 'secondary' : 'outline'">
            {{ item.nivel === 0 ? 'Pai' : 'Filha' }}
          </Badge>
        </div>

        <div class="text-sm text-muted-foreground">Categoria pai: {{ item.parentName || '-' }}</div>

        <div class="flex items-center gap-2">
          <button
            @click="store.openUpdate(item)"
            class="flex-1 border border-border px-3 py-1.5 rounded-md text-sm hover:bg-muted"
          >
            Editar
          </button>
          <button
            @click="removeCategoria(item)"
            class="flex-1 bg-danger text-white px-3 py-1.5 rounded-md text-sm inline-flex items-center justify-center gap-1"
          >
            <Trash class="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      <div v-if="!loading && !categoriasFiltradas.length" class="rounded-lg border border-border p-6">
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
    </div>

    <ModalCategoria
      v-model:open="store.openModal"
      :categoria="store.selectedCategoria"
      :categorias-pai="categoriasPai"
      @saved="handleSaved"
    />
  </div>
</template>
