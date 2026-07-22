<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  FolderTree,
  GripVertical,
  Home,
  Loader,
  Move,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { CategoriaArvoreNode } from '@/types/schemas'

const props = defineProps<{
  arvore: CategoriaArvoreNode[]
  loading?: boolean
  busca?: string
  /// Drag & drop só faz sentido com mouse; no toque usamos a ação "Mover para".
  podeArrastar?: boolean
}>()

const emit = defineEmits<{
  (e: 'nova-sub', node: CategoriaArvoreNode): void
  (e: 'editar', node: CategoriaArvoreNode): void
  (e: 'excluir', node: CategoriaArvoreNode): void
  (e: 'mover', payload: { id: number; parentId: number | null }): void
}>()

type Linha = CategoriaArvoreNode & { temFilhos: boolean; expandido: boolean }

const recolhidos = ref<Set<number>>(new Set())
const arrastando = ref<CategoriaArvoreNode | null>(null)
const alvo = ref<number | 'raiz' | null>(null)
/// Descendentes do nó arrastado, calculados uma vez no dragstart: o `dragover`
/// dispara dezenas de vezes por segundo e não pode recalcular a subárvore.
const bloqueadosNoArrasto = ref<Set<number>>(new Set())
const pagina = ref(1)
const porPagina = ref(10)

const termo = computed(() => (props.busca || '').trim().toLowerCase())
const buscando = computed(() => termo.value.length > 0)

function combina(node: CategoriaArvoreNode) {
  return node.caminho.toLowerCase().includes(termo.value) || String(node.id).includes(termo.value)
}

/// Mantém na busca o nó que combina e todos os seus ancestrais (para não quebrar a hierarquia).
function filtrarArvore(nodes: CategoriaArvoreNode[]): CategoriaArvoreNode[] {
  return nodes
    .map((node) => ({ ...node, filhos: filtrarArvore(node.filhos) }))
    .filter((node) => combina(node) || node.filhos.length > 0)
}

const arvoreVisivel = computed(() =>
  buscando.value ? filtrarArvore(props.arvore) : props.arvore,
)

// A paginação é por categoria PRINCIPAL: cada raiz leva a subárvore inteira
// junto, senão a hierarquia seria cortada no meio de uma página.
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(arvoreVisivel.value.length / porPagina.value)),
)

const raizesDaPagina = computed(() => {
  const inicio = (pagina.value - 1) * porPagina.value
  return arvoreVisivel.value.slice(inicio, inicio + porPagina.value)
})

const linhas = computed<Linha[]>(() => {
  const resultado: Linha[] = []

  const percorrer = (nodes: CategoriaArvoreNode[]) => {
    for (const node of nodes) {
      const temFilhos = node.filhos.length > 0
      // Durante a busca tudo fica aberto para o resultado aparecer.
      const expandido = buscando.value || !recolhidos.value.has(node.id)
      resultado.push({ ...node, temFilhos, expandido })
      if (temFilhos && expandido) percorrer(node.filhos)
    }
  }

  percorrer(raizesDaPagina.value)
  return resultado
})

const totalRaizes = computed(() => arvoreVisivel.value.length)

// Só busca e tamanho de página voltam para a primeira página. Recarregar a árvore
// (após mover/editar/excluir) mantém o usuário onde ele estava.
watch([termo, porPagina], () => {
  pagina.value = 1
})

watch(totalPaginas, (total) => {
  if (pagina.value > total) pagina.value = total
})

function alternar(node: Linha) {
  if (!node.temFilhos || buscando.value) return
  const proximo = new Set(recolhidos.value)
  if (proximo.has(node.id)) proximo.delete(node.id)
  else proximo.add(node.id)
  recolhidos.value = proximo
}

function recolherTudo() {
  const ids = new Set<number>()
  const percorrer = (nodes: CategoriaArvoreNode[]) => {
    for (const node of nodes) {
      if (node.filhos.length) {
        ids.add(node.id)
        percorrer(node.filhos)
      }
    }
  }
  percorrer(props.arvore)
  recolhidos.value = ids
}

function expandirTudo() {
  recolhidos.value = new Set()
}

/// Lista plana e mapa de descendentes calculados UMA vez por árvore: são usados
/// no menu "Mover para" de cada linha e não podem custar uma varredura por render.
const listaPlana = computed(() => {
  const itens: CategoriaArvoreNode[] = []
  const percorrer = (nodes: CategoriaArvoreNode[]) => {
    for (const node of nodes) {
      itens.push(node)
      percorrer(node.filhos)
    }
  }
  percorrer(props.arvore)
  return itens
})

const mapaDescendentes = computed(() => {
  const mapa = new Map<number, Set<number>>()

  const percorrer = (node: CategoriaArvoreNode): Set<number> => {
    const ids = new Set<number>()
    for (const filho of node.filhos) {
      ids.add(filho.id)
      for (const neto of percorrer(filho)) ids.add(neto)
    }
    mapa.set(node.id, ids)
    return ids
  }

  props.arvore.forEach(percorrer)
  return mapa
})

function descendentesDe(node: CategoriaArvoreNode) {
  return mapaDescendentes.value.get(node.id) ?? new Set<number>()
}

/// Alvo inválido: ele mesmo, um descendente seu (ciclo) ou o pai atual (sem efeito).
function alvoValido(destino: CategoriaArvoreNode | null) {
  const origem = arrastando.value
  if (!origem) return false
  if (!destino) return origem.parentId !== null
  if (destino.id === origem.id) return false
  if (destino.id === origem.parentId) return false
  return !bloqueadosNoArrasto.value.has(destino.id)
}

function onDragStart(event: DragEvent, node: CategoriaArvoreNode) {
  if (!props.podeArrastar) return
  arrastando.value = node
  bloqueadosNoArrasto.value = descendentesDe(node)
  event.dataTransfer?.setData('text/plain', String(node.id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event: DragEvent, destino: CategoriaArvoreNode | null) {
  if (!alvoValido(destino)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  alvo.value = destino ? destino.id : 'raiz'
}

function onDragLeave(destino: CategoriaArvoreNode | null) {
  const chave = destino ? destino.id : 'raiz'
  if (alvo.value === chave) alvo.value = null
}

function onDrop(destino: CategoriaArvoreNode | null) {
  const origem = arrastando.value
  if (origem && alvoValido(destino)) {
    emit('mover', { id: origem.id, parentId: destino ? destino.id : null })
  }
  onDragEnd()
}

function onDragEnd() {
  arrastando.value = null
  alvo.value = null
  bloqueadosNoArrasto.value = new Set()
}

/// Opções do "Mover para" (menu) — alternativa acessível/touch ao drag.
function destinosPara(node: CategoriaArvoreNode) {
  const proibidos = descendentesDe(node)
  return listaPlana.value.filter(
    (item) => item.id !== node.id && item.id !== node.parentId && !proibidos.has(item.id),
  )
}

watch(
  () => props.arvore,
  () => {
    // Recarregou a árvore: encerra qualquer arraste pendente (a página atual e os
    // nós recolhidos são preservados de propósito).
    onDragEnd()
  },
)
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div
      class="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground"
    >
      <span class="flex items-center gap-1.5">
        <FolderTree class="h-3.5 w-3.5" />
        {{ totalRaizes }} categoria(s) principal(is)
        <span v-if="podeArrastar" class="hidden md:inline">
          · arraste uma linha sobre outra para torná-la subcategoria
        </span>
      </span>
      <span class="flex items-center gap-2">
        <button type="button" class="hover:text-foreground" @click="expandirTudo">Expandir</button>
        <span class="text-border">|</span>
        <button type="button" class="hover:text-foreground" @click="recolherTudo">Recolher</button>
      </span>
    </div>

    <div v-if="loading && !linhas.length" class="p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader class="h-6 w-6 animate-spin text-info" />
          </EmptyMedia>
          <EmptyTitle>Carregando...</EmptyTitle>
          <EmptyDescription>Buscando a árvore de categorias.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else-if="!linhas.length" class="p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderTree />
          </EmptyMedia>
          <EmptyTitle>Nenhuma categoria encontrada</EmptyTitle>
          <EmptyDescription>
            {{ busca ? 'Ajuste a busca para ver outras categorias.' : 'Cadastre categorias para organizar os lançamentos.' }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <ul v-else class="divide-y divide-border">
      <li
        v-for="linha in linhas"
        :key="linha.id"
        class="flex items-center gap-1.5 px-2 py-1.5 text-sm"
        :class="
          alvo === linha.id
            ? 'bg-primary/10 ring-1 ring-inset ring-primary'
            : arrastando?.id === linha.id
              ? 'bg-muted'
              : 'hover:bg-muted/50'
        "
        :draggable="podeArrastar"
        @dragstart="onDragStart($event, linha)"
        @dragover="onDragOver($event, linha)"
        @dragleave="onDragLeave(linha)"
        @drop="onDrop(linha)"
        @dragend="onDragEnd"
      >
        <span :style="{ width: `${linha.nivel * 16}px` }" class="shrink-0" />

        <GripVertical v-if="podeArrastar" class="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/40" />

        <button
          type="button"
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground"
          :class="linha.temFilhos && !buscando ? 'hover:bg-muted' : 'invisible'"
          @click="alternar(linha)"
        >
          <ChevronDown v-if="linha.expandido" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>

        <component
          :is="linha.nivel === 0 ? FolderTree : CornerDownRight"
          class="h-4 w-4 shrink-0"
          :class="linha.nivel === 0 ? 'text-primary' : 'text-muted-foreground'"
        />

        <span class="truncate font-medium text-foreground">{{ linha.nome }}</span>

        <Badge v-if="linha.totalDescendentes" variant="outline" class="shrink-0 px-1.5 py-0 text-[11px]">
          {{ linha.totalDescendentes }} sub
        </Badge>
        <Badge v-if="linha.totalLancamentos" variant="secondary" class="shrink-0 gap-1 px-1.5 py-0 text-[11px]">
          <Tag class="h-3 w-3" /> {{ linha.totalLancamentos }}
        </Badge>

        <span class="ml-auto flex shrink-0 items-center gap-1">
          <span class="hidden text-[11px] text-muted-foreground lg:inline">{{ linha.Uid }}</span>
          <button
            type="button"
            title="Nova subcategoria"
            class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="emit('nova-sub', linha)"
          >
            <Plus class="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Editar"
            class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="emit('editar', linha)"
          >
            <Pencil class="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                title="Mover para"
                class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Move class="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="max-h-72 w-64 overflow-y-auto">
              <DropdownMenuItem
                :disabled="linha.parentId === null"
                @click="emit('mover', { id: linha.id, parentId: null })"
              >
                <Home class="mr-2 h-4 w-4" /> Tornar categoria principal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                v-for="destino in destinosPara(linha)"
                :key="destino.id"
                @click="emit('mover', { id: linha.id, parentId: destino.id })"
              >
                <span class="truncate">{{ destino.caminho }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            title="Excluir"
            class="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
            @click="emit('excluir', linha)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </span>
      </li>
    </ul>

    <!-- Zona de soltura que promove a categoria arrastada a principal. -->
    <div
      v-if="arrastando"
      class="m-2 rounded-md border-2 border-dashed px-3 py-2 text-center text-xs"
      :class="
        alvo === 'raiz'
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground'
      "
      @dragover="onDragOver($event, null)"
      @dragleave="onDragLeave(null)"
      @drop="onDrop(null)"
    >
      Solte aqui para tornar "{{ arrastando.nome }}" uma categoria principal
    </div>

    <div
      v-if="linhas.length"
      class="flex items-center justify-between gap-2 border-t border-border px-3 py-2"
    >
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <Select v-model="porPagina">
          <SelectTrigger class="h-8 w-[72px] border border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="10">10</SelectItem>
            <SelectItem :value="25">25</SelectItem>
            <SelectItem :value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-x-2">
        <Button variant="outline" size="sm" :disabled="pagina <= 1" @click="pagina = Math.max(1, pagina - 1)">
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="pagina >= totalPaginas"
          @click="pagina = Math.min(totalPaginas, pagina + 1)"
        >
          Próximo
        </Button>
      </div>
    </div>
  </div>
</template>
