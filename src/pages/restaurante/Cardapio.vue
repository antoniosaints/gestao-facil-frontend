<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import HelpTooltip from './components/HelpTooltip.vue'
import VarianteImagemField from '@/pages/produtos/formulario/VarianteImagemField.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import ModalProdutos from '@/pages/produtos/formulario/ModalProdutos.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoBase, ProdutoCategoria } from '@/types/schemas'
import {
  RestauranteRepository,
  type RestauranteCatalogoItem,
  type RestauranteCatalogoBulkAction,
  type RestauranteCatalogoPayload,
  type RestauranteGrupoOpcao,
  type RestauranteGrupoPayload,
  type RestauranteProdutoDisponivel,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { BadgePlusIcon, Eye, EyeOff, Layers3, LoaderCircle, PackagePlus, PackageSearch, Pencil, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-vue-next'

const toast = useToast()
const confirm = useConfirm()
const produtoStore = useProdutoStore()
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const items = ref<RestauranteCatalogoItem[]>([])
const groups = ref<RestauranteGrupoOpcao[]>([])
const products = ref<RestauranteProdutoDisponivel[]>([])
const itemDialogOpen = ref(false)
const groupDialogOpen = ref(false)
const editingItemId = ref<number | undefined>()
const editingGroupId = ref<number | undefined>()
const imagemChange = ref<{ file: File | null; remove: boolean }>({ file: null, remove: false })
const updatingAvailabilityItemId = ref<number | null>(null)
const updatingHighlightItemId = ref<number | null>(null)
const bulkSaving = ref(false)
type CatalogVisibilityFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS'
const visibilityFilterStorageKey = 'gestao_facil:restaurante:cardapio:visibilidade'
const catalogVisibilityFilter = ref<CatalogVisibilityFilter>(readCatalogVisibilityFilter())
const selectedItemIds = ref<number[]>([])

const itemForm = reactive<RestauranteCatalogoPayload>({
  modoCadastro: 'AVULSO',
  produtoId: null,
  categoriaId: null,
  categoriaSugestaoId: null,
  preco: 0,
  nomePublico: null,
  descricao: null,
  imagem: null,
  disponivel: true,
  maisPedido: false,
  regraPrecoSabores: 'MAIOR_PRECO',
  ordem: 0,
  grupoIds: [],
})

const emptyGroup = (): RestauranteGrupoPayload => ({
  nome: '',
  tipo: 'COMPLEMENTO',
  minimo: 0,
  maximo: 1,
  ativo: true,
  opcoes: [{ nome: '', produtoId: null, precoAdicional: 0, ativo: true, ordem: 0 }],
})
const groupForm = ref<RestauranteGrupoPayload>(emptyGroup())

const filteredItems = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  return items.value.filter((item) => {
    if (catalogVisibilityFilter.value === 'ATIVOS' && !item.disponivel) return false
    if (catalogVisibilityFilter.value === 'INATIVOS' && item.disponivel) return false
    if (!term) return true
    return (
    [item.nomePublico, item.Produto?.nome, item.Produto?.nomeVariante].some((value) =>
      value?.toLocaleLowerCase('pt-BR').includes(term),
    ))
  })
})

const selectedFilteredItemIds = computed(() => filteredItems.value
  .map((item) => item.id)
  .filter((id) => selectedItemIds.value.includes(id)))
const allFilteredItemsSelected = computed(() => filteredItems.value.length > 0 && selectedFilteredItemIds.value.length === filteredItems.value.length)
const filteredSelectionState = computed<boolean | 'indeterminate'>(() => allFilteredItemsSelected.value
  ? true
  : selectedFilteredItemIds.value.length
    ? 'indeterminate'
    : false)
const selectedItemsCount = computed(() => selectedItemIds.value.length)

const activeGroups = computed(() => groups.value.filter((group) => group.ativo))
const availableItems = computed(() => items.value.filter((item) => item.disponivel).length)
const linkedProductCategory = computed(() => {
  const product = products.value.find((item) => item.id === itemForm.produtoId)
  return product?.ProdutoBase?.Categoria?.nome || null
})
const groupFormValid = computed(() => {
  const activeOptions = groupForm.value.opcoes.filter((option) => option.ativo)
  return (
    groupForm.value.nome.trim().length >= 2 &&
    groupForm.value.minimo <= groupForm.value.maximo &&
    groupForm.value.minimo <= activeOptions.length &&
    groupForm.value.opcoes.every((option) => option.nome.trim().length > 0)
  )
})

async function load() {
  try {
    loading.value = true
    const [catalog, optionGroups, availableProducts] = await Promise.all([
      RestauranteRepository.catalogo({ limit: 100 }),
      RestauranteRepository.gruposOpcoes(),
      RestauranteRepository.produtosCardapio(),
    ])
    items.value = catalog.data
    selectedItemIds.value = selectedItemIds.value.filter((id) => items.value.some((item) => item.id === id))
    groups.value = optionGroups
    products.value = availableProducts
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o cardápio.')
  } finally {
    loading.value = false
  }
}

function readCatalogVisibilityFilter(): CatalogVisibilityFilter {
  try {
    const value = localStorage.getItem(visibilityFilterStorageKey)
    return value === 'ATIVOS' || value === 'INATIVOS' ? value : 'TODOS'
  } catch {
    return 'TODOS'
  }
}

function changeCatalogVisibilityFilter(value: string) {
  const filter: CatalogVisibilityFilter = value === 'ATIVOS' || value === 'INATIVOS' ? value : 'TODOS'
  catalogVisibilityFilter.value = filter
  selectedItemIds.value = []
  try {
    localStorage.setItem(visibilityFilterStorageKey, filter)
  } catch {
    // A filtragem continua funcionando mesmo quando o armazenamento não está disponível.
  }
}

function toggleItemSelection(id: number, checked: boolean | 'indeterminate') {
  if (checked === true && !selectedItemIds.value.includes(id)) selectedItemIds.value.push(id)
  if (checked !== true) selectedItemIds.value = selectedItemIds.value.filter((itemId) => itemId !== id)
}

function toggleAllFilteredItems(checked: boolean | 'indeterminate') {
  const visibleIds = filteredItems.value.map((item) => item.id)
  if (checked === true) {
    selectedItemIds.value = [...new Set([...selectedItemIds.value, ...visibleIds])]
    return
  }
  selectedItemIds.value = selectedItemIds.value.filter((id) => !visibleIds.includes(id))
}

function bulkActionLabel(action: RestauranteCatalogoBulkAction) {
  return {
    EXIBIR: 'exibidos',
    OCULTAR: 'ocultados',
    DESTACAR: 'destacados',
    REMOVER_DESTAQUE: 'sem destaque',
    EXCLUIR: 'excluídos',
  }[action]
}

async function applyBulkAction(action: RestauranteCatalogoBulkAction) {
  if (!selectedItemIds.value.length || bulkSaving.value) return
  if (action === 'EXCLUIR') {
    const confirmed = await confirm.confirm({
      title: 'Excluir itens do cardápio',
      message: `Deseja excluir ${selectedItemsCount.value} item(ns) selecionado(s)? Os produtos-base e pedidos já realizados não serão removidos.`,
      confirmText: 'Excluir itens',
      cancelText: 'Cancelar',
      colorButton: 'danger',
    })
    if (!confirmed) return
  }
  try {
    bulkSaving.value = true
    const result = await RestauranteRepository.aplicarAcoesEmMassaCardapio(selectedItemIds.value, action)
    selectedItemIds.value = []
    await load()
    toast.success(`${result.affected} item(ns) ${bulkActionLabel(action)} com sucesso.`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível aplicar a ação aos itens selecionados.')
  } finally {
    bulkSaving.value = false
  }
}

async function deleteCatalogItem(item: RestauranteCatalogoItem) {
  if (bulkSaving.value) return
  const confirmed = await confirm.confirm({
    title: 'Excluir item do cardápio',
    message: `Deseja excluir “${item.nomePublico || item.Produto?.nome || 'este item'}”? Os produtos-base e pedidos já realizados não serão removidos.`,
    confirmText: 'Excluir item',
    cancelText: 'Cancelar',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    bulkSaving.value = true
    await RestauranteRepository.aplicarAcoesEmMassaCardapio([item.id], 'EXCLUIR')
    selectedItemIds.value = selectedItemIds.value.filter((id) => id !== item.id)
    await load()
    toast.success('Item excluído do cardápio.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível excluir o item do cardápio.')
  } finally {
    bulkSaving.value = false
  }
}

function newItem() {
  editingItemId.value = undefined
  Object.assign(itemForm, {
    modoCadastro: 'AVULSO',
    produtoId: null,
    categoriaId: null,
    categoriaSugestaoId: null,
    preco: 0,
    nomePublico: null,
    descricao: null,
    imagem: null,
    disponivel: true,
    maisPedido: false,
    regraPrecoSabores: 'MAIOR_PRECO',
    ordem: items.value.length,
    grupoIds: [],
    version: undefined,
  })
  imagemChange.value = { file: null, remove: false }
  itemDialogOpen.value = true
}

function editItem(item: RestauranteCatalogoItem) {
  editingItemId.value = item.id
  Object.assign(itemForm, {
    modoCadastro: item.produtoId ? 'VINCULAR' : 'AVULSO',
    produtoId: item.produtoId || null,
    categoriaId: item.categoriaId || item.Categoria?.id || item.Produto?.ProdutoBase?.categoriaId || null,
    categoriaSugestaoId: item.categoriaSugestaoId || null,
    preco: Number(item.preco),
    nomePublico: item.nomePublico,
    descricao: item.descricao,
    imagem: item.imagem,
    disponivel: item.disponivel,
    maisPedido: item.maisPedido,
    regraPrecoSabores: item.regraPrecoSabores,
    ordem: item.ordem,
    grupoIds: item.grupos.map((link) => link.grupoId),
    version: item.version,
  })
  imagemChange.value = { file: null, remove: false }
  itemDialogOpen.value = true
}

function toggleGroup(groupId: number, checked: boolean | 'indeterminate') {
  if (checked === true && !itemForm.grupoIds.includes(groupId)) itemForm.grupoIds.push(groupId)
  if (checked !== true) itemForm.grupoIds = itemForm.grupoIds.filter((id) => id !== groupId)
}

async function saveItem() {
  if (itemForm.modoCadastro === 'VINCULAR' && !itemForm.produtoId) return toast.info('Selecione um produto para vincular.')
  if (itemForm.modoCadastro !== 'VINCULAR' && !itemForm.nomePublico?.trim()) return toast.info('Informe o nome do item do cardápio.')
  if (!itemForm.categoriaId) return toast.info('Selecione a categoria do item.')
  try {
    saving.value = true
    const saved = await RestauranteRepository.salvarItemCardapio(itemForm, editingItemId.value)
    try {
      if (imagemChange.value.file) await RestauranteRepository.enviarImagemItemCardapio(saved.id, imagemChange.value.file, itemForm.modoCadastro === 'CRIAR_PRODUTO')
      else if (imagemChange.value.remove) await RestauranteRepository.removerImagemItemCardapio(saved.id)
    } catch {
      toast.error('Item salvo, mas não foi possível atualizar a imagem.')
    }
    itemDialogOpen.value = false
    await load()
    toast.success(editingItemId.value ? 'Item atualizado' : 'Item adicionado ao cardápio')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o item.')
  } finally {
    saving.value = false
  }
}

function newGroup() {
  editingGroupId.value = undefined
  groupForm.value = emptyGroup()
  groupDialogOpen.value = true
}

function editGroup(group: RestauranteGrupoOpcao) {
  editingGroupId.value = group.id
  groupForm.value = {
    nome: group.nome,
    tipo: group.tipo,
    minimo: group.minimo,
    maximo: group.maximo,
    ativo: group.ativo,
    opcoes: group.opcoes.map((option) => ({ ...option })),
  }
  groupDialogOpen.value = true
}

function addOption() {
  groupForm.value.opcoes.push({
    nome: '',
    produtoId: null,
    precoAdicional: 0,
    ativo: true,
    ordem: groupForm.value.opcoes.length,
  })
}

function removeOption(index: number) {
  if (groupForm.value.opcoes.length === 1) return
  groupForm.value.opcoes.splice(index, 1)
  groupForm.value.opcoes.forEach((option, order) => (option.ordem = order))
}

async function saveGroup() {
  if (!groupFormValid.value) return toast.info('Revise o nome, os limites e as opções do grupo.')
  try {
    saving.value = true
    await RestauranteRepository.salvarGrupoOpcoes(groupForm.value, editingGroupId.value)
    groupDialogOpen.value = false
    await load()
    toast.success(editingGroupId.value ? 'Grupo atualizado' : 'Grupo criado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o grupo.')
  } finally {
    saving.value = false
  }
}

function productLabel(product: RestauranteProdutoDisponivel) {
  return product.nomeVariante && product.nomeVariante !== 'Padrão'
    ? `${product.nome} · ${product.nomeVariante}`
    : product.nome
}

function itemCategoryLabel(item: RestauranteCatalogoItem) {
  return item.Categoria?.nome || item.Produto?.ProdutoBase?.Categoria?.nome || 'Sem categoria'
}

function itemPayload(item: RestauranteCatalogoItem, changes: Partial<Pick<RestauranteCatalogoPayload, 'disponivel' | 'maisPedido'>> = {}): RestauranteCatalogoPayload {
  return {
    modoCadastro: item.produtoId ? 'VINCULAR' : 'AVULSO',
    produtoId: item.produtoId || null,
    categoriaId: item.categoriaId || item.Categoria?.id || item.Produto?.ProdutoBase?.categoriaId || null,
    categoriaSugestaoId: item.categoriaSugestaoId || null,
    preco: Number(item.preco),
    nomePublico: item.nomePublico || null,
    descricao: item.descricao || null,
    imagem: item.imagem || null,
    disponivel: changes.disponivel ?? item.disponivel,
    maisPedido: changes.maisPedido ?? item.maisPedido,
    regraPrecoSabores: item.regraPrecoSabores,
    ordem: item.ordem,
    grupoIds: item.grupos.map((link) => link.grupoId),
    version: item.version,
  }
}

async function toggleItemAvailability(item: RestauranteCatalogoItem) {
  if (updatingAvailabilityItemId.value !== null) return
  const disponivel = !item.disponivel
  try {
    updatingAvailabilityItemId.value = item.id
    const saved = await RestauranteRepository.salvarItemCardapio(itemPayload(item, { disponivel }), item.id)
    item.disponivel = saved.disponivel
    item.version = saved.version
    toast.success(disponivel ? 'Produto visível no cardápio' : 'Produto ocultado do cardápio')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível alterar a visibilidade do produto.')
    await load()
  } finally {
    updatingAvailabilityItemId.value = null
  }
}

async function toggleItemHighlight(item: RestauranteCatalogoItem, checked: boolean | 'indeterminate') {
  if (updatingHighlightItemId.value !== null || checked === 'indeterminate') return
  const maisPedido = checked === true
  try {
    updatingHighlightItemId.value = item.id
    const saved = await RestauranteRepository.salvarItemCardapio(itemPayload(item, { maisPedido }), item.id)
    item.maisPedido = saved.maisPedido
    item.version = saved.version
    toast.success(maisPedido ? 'Produto destacado em Mais pedidos' : 'Destaque de Mais pedidos removido')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível alterar o destaque do produto.')
    await load()
  } finally {
    updatingHighlightItemId.value = null
  }
}

function setCatalogMode(mode: RestauranteCatalogoPayload['modoCadastro']) {
  itemForm.modoCadastro = mode
  if (mode !== 'VINCULAR') itemForm.produtoId = null
}

function selectLinkedProduct(value: unknown) {
  itemForm.produtoId = value ? Number(value) : null
  const product = products.value.find((item) => item.id === itemForm.produtoId)
  if (product) {
    if (!itemForm.nomePublico) itemForm.nomePublico = productLabel(product)
    itemForm.preco = Number(product.preco)
    itemForm.categoriaId = product.ProdutoBase?.categoriaId || null
  }
}

function openProductCreation() {
  produtoStore.openSaveProduto(true)
}

function openCategoryCreation() {
  produtoStore.openSaveCategoria()
}

async function onProductCreated(base: ProdutoBase) {
  await load()
  const variantId = base.variantePadraoId
  if (!variantId) return
  itemForm.modoCadastro = 'VINCULAR'
  selectLinkedProduct(variantId)
}

function onCategoryCreated(category: ProdutoCategoria) {
  if (!category.id) return
  itemForm.categoriaId = Number(category.id)
}

onMounted(load)
</script>

<template>
  <section class="mx-auto space-y-3">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <UtensilsCrossed class="h-6 w-6 text-primary" />Cardápio
        </h1>
        <p class="text-sm text-muted-foreground">Escolha o que aparece para o cliente e organize sabores e complementos.</p>
      </div>
    </header>

    <Tabs default-value="itens" class="space-y-2">
      <TabsList class="grid h-auto w-full rounded-md grid-cols-2 gap-1 p-1 sm:max-w-xl">
        <TabsTrigger value="itens"><UtensilsCrossed class="mr-2 h-4 w-4 inline-flex" />Itens do cardápio</TabsTrigger>
        <TabsTrigger value="grupos"><Layers3 class="mr-2 h-4 w-4 inline-flex" />Sabores e complementos</TabsTrigger>
      </TabsList>

      <TabsContent value="itens" class="space-y-2">
        <div class="flex flex-col gap-3 rounded-xl border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex w-full flex-col gap-2 sm:max-w-2xl sm:flex-row sm:items-center">
            <Input v-model="search" :icon-label="Search" :icon-label-position="'left'" placeholder="Buscar item do cardápio" />
            <Select :model-value="catalogVisibilityFilter" @update:model-value="changeCatalogVisibilityFilter(String($event))">
              <SelectTrigger class="w-full sm:w-36"><SelectValue placeholder="Visibilidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
                <SelectItem value="INATIVOS">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <label v-if="filteredItems.length" class="flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted"><Checkbox :model-value="filteredSelectionState" @update:model-value="toggleAllFilteredItems($event)" />Selecionar visíveis</label>
          </div>
          <div class="flex items-center gap-1"><HelpTooltip text="Os produtos vêm do cadastro de estoque. Aqui você escolhe o nome, a descrição, a imagem e os grupos que aparecem no cardápio público." /><Button @click="newItem"><Plus class="mr-2 h-4 w-4" />Adicionar produto</Button></div>
        </div>

        <div v-if="selectedItemsCount" class="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1 sm:flex-row sm:items-center sm:justify-between">
          <label class="flex cursor-pointer items-center gap-2 text-sm font-medium"><Checkbox :model-value="allFilteredItemsSelected" @update:model-value="toggleAllFilteredItems($event)" />{{ selectedItemsCount }} selecionado(s)</label>
          <div class="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" :disabled="bulkSaving" @click="applyBulkAction('EXIBIR')"><Eye class="mr-1.5 h-4 w-4" />Exibir</Button>
            <Button size="sm" variant="outline" :disabled="bulkSaving" @click="applyBulkAction('OCULTAR')"><EyeOff class="mr-1.5 h-4 w-4" />Ocultar</Button>
            <Button size="sm" variant="outline" :disabled="bulkSaving" @click="applyBulkAction('DESTACAR')"><BadgePlusIcon class="mr-1.5 h-4 w-4" />Destacar</Button>
            <Button size="sm" variant="outline" :disabled="bulkSaving" @click="applyBulkAction('REMOVER_DESTAQUE')">Remover destaque</Button>
            <Button size="sm" variant="destructive" :disabled="bulkSaving" @click="applyBulkAction('EXCLUIR')"><LoaderCircle v-if="bulkSaving" class="mr-1.5 h-4 w-4 animate-spin" /><Trash2 v-else class="mr-1.5 h-4 w-4" />Excluir</Button>
            <Button size="sm" variant="ghost" :disabled="bulkSaving" @click="selectedItemIds = []">Limpar</Button>
          </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton v-for="item in 6" :key="item" class="h-40 rounded-xl" />
        </div>
        <div v-else-if="!filteredItems.length" class="rounded-xl border border-dashed p-10 text-center">
          <UtensilsCrossed class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p class="font-medium">Nenhum item no cardápio</p>
          <p class="text-sm text-muted-foreground">Adicione um produto já cadastrado para começar.</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="item in filteredItems" :key="item.id" class="relative overflow-hidden rounded-xl">
            <Checkbox class="absolute left-3 top-3 z-10 rounded bg-background/90 p-0.5 shadow-sm" :model-value="selectedItemIds.includes(item.id)" :aria-label="`Selecionar ${item.nomePublico || item.Produto?.nome || 'item do cardápio'}`" @update:model-value="toggleItemSelection(item.id, $event)" />
            <CardContent class="p-3">
              <div class="flex gap-3">
                <img
                  v-if="item.imagem || item.Produto?.imagem"
                  :src="item.imagem || item.Produto?.imagem || ''"
                  :alt="item.nomePublico || item.Produto?.nome || 'Item do cardápio'"
                  class="h-16 w-16 shrink-0 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                />
                <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><UtensilsCrossed class="h-5 w-5" /></div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2"><div class="min-w-0"><CardTitle class="truncate text-sm">{{ item.nomePublico || (item.Produto ? productLabel(item.Produto) : 'Item do cardápio') }}</CardTitle><p class="mt-0.5 text-lg font-medium text-green-600 dark:text-green-500">{{ formatCurrencyBR(Number(item.Produto?.preco || item.preco)) }}</p></div><div class="flex shrink-0 items-center gap-1"><label class="flex h-7 cursor-pointer items-center gap-2 rounded-md border bg-background px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted" :class="{ 'cursor-not-allowed opacity-60': updatingHighlightItemId === item.id }" title="Destacar em Mais pedidos no cardápio online" @click.prevent="toggleItemHighlight(item, !item.maisPedido)"><span>Destacar</span><Switch :model-value="item.maisPedido" :disabled="updatingHighlightItemId === item.id" aria-label="Destacar em Mais pedidos" @click.stop @update:model-value="toggleItemHighlight(item, $event)" /><LoaderCircle v-if="updatingHighlightItemId === item.id" class="h-3.5 w-3.5 animate-spin" /></label><Button type="button" size="icon" variant="outline" class="h-7 w-7 shrink-0" :disabled="updatingAvailabilityItemId === item.id" :title="item.disponivel ? 'Ocultar do cardápio' : 'Mostrar no cardápio'" :aria-label="item.disponivel ? 'Ocultar do cardápio' : 'Mostrar no cardápio'" @click="toggleItemAvailability(item)"><LoaderCircle v-if="updatingAvailabilityItemId === item.id" class="h-4 w-4 animate-spin" /><component :is="item.disponivel ? Eye : EyeOff" v-else class="h-4 w-4" :class="item.disponivel ? 'text-emerald-600' : 'text-muted-foreground'" /></Button></div></div>
                  <Badge variant="outline" class="mt-1.5 max-w-full gap-1 truncate text-xs"><PackageSearch class="h-3 w-3 shrink-0" />{{ itemCategoryLabel(item) }}</Badge>
                  <p class="mt-2 line-clamp-1 text-xs text-muted-foreground">{{ item.descricao || 'Sem descrição pública.' }}</p>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-between gap-3 border-t pt-2">
                <div class="flex min-w-0 flex-wrap gap-1"><Badge v-for="link in item.grupos.slice(0, 2)" :key="link.grupoId" variant="outline" class="max-w-32 truncate">{{ link.Grupo.nome }}</Badge><span v-if="item.grupos.length > 2" class="text-xs text-muted-foreground">+{{ item.grupos.length - 2 }}</span><span v-if="!item.grupos.length" class="text-xs text-muted-foreground">Sem complementos</span></div>
                <div class="flex shrink-0 items-center gap-1"><Button size="sm" variant="outline" @click="editItem(item)"><Pencil class="mr-1.5 h-3.5 w-3.5" />Editar</Button><Button size="icon" variant="destructive" class="h-8 w-8" title="Excluir item" :disabled="bulkSaving" @click="deleteCatalogItem(item)"><Trash2 class="h-3.5 w-3.5" /></Button></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="grupos" class="space-y-4">
        <div class="flex flex-col gap-3 rounded-xl border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div><p class="font-medium">Sabores e complementos</p><p class="text-pretty text-xs text-muted-foreground">Crie grupos reutilizáveis e depois associe-os aos itens do cardápio.</p></div>
          <div class="flex items-center gap-1"><HelpTooltip text="Use grupos para escolhas como sabores, tamanhos, bordas e adicionais. O mínimo e o máximo controlam quantas opções o cliente pode selecionar." /><Button @click="newGroup"><Plus class="mr-2 h-4 w-4" />Novo grupo</Button></div>
        </div>
        <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton v-for="item in 4" :key="item" class="h-40 rounded-xl" />
        </div>
        <div v-else-if="!groups.length" class="rounded-xl border border-dashed p-10 text-center">
          <Layers3 class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p class="font-medium">Nenhum grupo configurado</p>
          <p class="text-sm text-muted-foreground">Crie sabores, adicionais ou complementos.</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="group in groups" :key="group.id" class="flex flex-col rounded-xl">
            <CardHeader class="p-3 pb-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle class="text-base">{{ group.nome }}</CardTitle>
                  <CardDescription>
                    {{ group.tipo === 'SABOR' ? 'Sabores' : 'Complementos' }} · escolha de
                    {{ group.minimo }} a {{ group.maximo }}
                  </CardDescription>
                </div>
                <Badge :variant="group.ativo ? 'secondary' : 'outline'">{{ group.ativo ? 'Ativo' : 'Inativo' }}</Badge>
              </div>
            </CardHeader>
            <CardContent class="flex-1 space-y-1.5 px-3 pb-3 text-sm">
              <div v-for="option in group.opcoes.slice(0, 4)" :key="option.id || option.nome" class="flex justify-between gap-3">
                <span :class="{ 'text-muted-foreground line-through': !option.ativo }">{{ option.nome }}</span>
                <span v-if="Number(option.precoAdicional) > 0" class="text-muted-foreground">
                  +{{ formatCurrencyBR(Number(option.precoAdicional)) }}
                </span>
              </div>
              <p v-if="group.opcoes.length > 4" class="text-xs text-muted-foreground">+ {{ group.opcoes.length - 4 }} opção(ões)</p>
              <p class="pt-2 text-xs text-muted-foreground">Usado em {{ group._count?.itens || 0 }} item(ns).</p>
            </CardContent>
            <CardFooter class="border-t px-3 py-2.5">
              <Button size="sm" class="w-full" variant="outline" @click="editGroup(group)">
                <Pencil class="mr-1.5 h-3.5 w-3.5" />Editar grupo
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="itemDialogOpen">
      <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingItemId ? 'Editar item' : 'Adicionar produto ao cardápio' }}</DialogTitle>
          <DialogDescription>Vincule um produto existente, crie um novo automaticamente ou publique um item avulso.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-2 py-2 sm:grid-cols-2">
          <div class="space-y-2 sm:col-span-2 mb-2">
            <Label>Como deseja cadastrar?</Label>
            <div class="grid gap-2 sm:grid-cols-3">
              <button type="button" class="rounded-lg border p-3 text-left transition" :class="itemForm.modoCadastro === 'VINCULAR' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'" @click="setCatalogMode('VINCULAR')"><strong class="block text-sm">Vincular produto</strong><span class="mt-1 block text-xs text-muted-foreground">Usa preço e estoque já cadastrados.</span></button>
              <button type="button" class="rounded-lg border p-3 text-left transition" :class="itemForm.modoCadastro === 'AVULSO' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'" @click="setCatalogMode('AVULSO')"><strong class="block text-sm">Item avulso</strong><span class="mt-1 block text-xs text-muted-foreground">Só existe no cardápio, sem estoque.</span></button>
              <button type="button" class="rounded-lg border p-3 text-left transition" :class="itemForm.modoCadastro === 'CRIAR_PRODUTO' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'" @click="setCatalogMode('CRIAR_PRODUTO')"><strong class="block text-sm">Criar em Produtos</strong><span class="mt-1 block text-xs text-muted-foreground">Cria o produto automaticamente.</span></button>
            </div>
          </div>
          <div v-if="itemForm.modoCadastro === 'VINCULAR'" class="space-y-2 mt-1">
            <div class="flex flex-wrap items-center justify-between gap-2 pr-1">
              <Label>Produto existente</Label>
              <span class="text-sm text-blue-500 cursor-pointer flex items-center" @click="openProductCreation"><PackagePlus class="mr-1.5 h-4 w-4" />Novo</span>
            </div>
            <Select :model-value="itemForm.produtoId ? String(itemForm.produtoId) : undefined" @update:model-value="selectLinkedProduct($event)">
              <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent><SelectItem v-for="product in products" :key="product.id" :value="String(product.id)">{{ productLabel(product) }} · {{ formatCurrencyBR(Number(product.preco)) }}</SelectItem></SelectContent>
            </Select>
            <p v-if="linkedProductCategory" class="text-xs text-muted-foreground">Categoria: <strong class="font-medium text-foreground">{{ linkedProductCategory }}</strong></p>
          </div>
           <div class="space-y-2">
              <Label for="public-name">Nome público</Label>
              <Input
                id="public-name"
                :model-value="itemForm.nomePublico ?? ''"
                :placeholder="itemForm.modoCadastro === 'VINCULAR' ? 'Selecione um produto' : 'Ex.: Salada de frutas'"
                @update:model-value="itemForm.nomePublico = String($event)"
              />
            </div>
            <div class="space-y-2 mt-1">
              <div class="flex items-center justify-between gap-2 pr-1">
                <Label>Categoria no cardápio <span class="text-destructive">*</span></Label>
                <span title="Criar categoria" class="text-sm text-blue-500 cursor-pointer flex items-center" @click="openCategoryCreation"><BadgePlusIcon class="mr-1.5 h-4 w-4" /> Criar</span>
              </div>
              <Select2Ajax v-model:model-value="itemForm.categoriaId" url="/produtos/categorias/select2" placeholder="Selecione a categoria" />
            </div>
          <div class="space-y-2 sm:col-span-1">
            <Label for="order">Ordem</Label>
            <Input id="order" v-model.number="itemForm.ordem" type="number" />
          </div>
          <div v-if="itemForm.modoCadastro !== 'VINCULAR'" class="space-y-2">
            <Label for="catalog-price">Preço (R$)</Label>
            <Input id="catalog-price" v-model.number="itemForm.preco" type="number" min="0" step="0.01" />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label for="description">Descrição</Label>
            <Textarea
              id="description"
              :model-value="itemForm.descricao ?? ''"
              placeholder="Ex.: Salada de frutas"
              rows="3"
              @update:model-value="itemForm.descricao = String($event)"
            />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label>Imagem do cardápio</Label>
            <VarianteImagemField :key="editingItemId ?? 'novo-cardapio'" :existing="itemForm.imagem" @change="imagemChange = $event" />
            <p class="text-xs text-muted-foreground">Se não enviar uma imagem, o item vinculado usará automaticamente a imagem do produto.</p>
          </div>
          <div class="space-y-2">
            <Label>Preço para múltiplos sabores</Label>
            <Select v-model="itemForm.regraPrecoSabores">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIOR_PRECO">Maior preço</SelectItem>
                <SelectItem value="MEDIA_PROPORCIONAL">Média proporcional</SelectItem>
                <SelectItem value="SOMA">Somar sabores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-center justify-between rounded-lg border p-4">
            <div><Label>Disponível</Label><p class="text-xs text-muted-foreground">Exibir no cardápio público.</p></div>
            <Switch v-model="itemForm.disponivel" />
          </div>
          <div class="space-y-3 sm:col-span-2">
            <Label>Grupos associados</Label>
            <p v-if="!activeGroups.length" class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Crie um grupo de sabores ou complementos na outra aba.
            </p>
            <label v-for="group in activeGroups" :key="group.id" class="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
              <Checkbox :model-value="itemForm.grupoIds.includes(group.id)" @update:model-value="toggleGroup(group.id, $event)" />
              <span class="flex-1 text-sm"><strong>{{ group.nome }}</strong><span class="ml-2 text-muted-foreground">{{ group.tipo === 'SABOR' ? 'Sabores' : 'Complementos' }}</span></span>
            </label>
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label>Sugestões</Label>
            <p class="text-xs text-muted-foreground">Opcional. Depois de adicionar este item, o cliente verá os produtos dessa categoria para incluir rapidamente no pedido.</p>
            <Select2Ajax v-model:model-value="itemForm.categoriaSugestaoId" url="/produtos/categorias/select2" placeholder="Sem sugestão" :allow-clear="true" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="itemDialogOpen = false">Cancelar</Button>
          <Button :disabled="saving || (itemForm.modoCadastro === 'VINCULAR' && !itemForm.produtoId) || !itemForm.categoriaId || (itemForm.modoCadastro !== 'VINCULAR' && !itemForm.nomePublico?.trim())" @click="saveItem">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />Salvar item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ModalProdutos @saved="onProductCreated" @category-saved="onCategoryCreated" />

    <Dialog v-model:open="groupDialogOpen">
      <DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingGroupId ? 'Editar grupo' : 'Novo grupo' }}</DialogTitle>
          <DialogDescription>Defina quantas escolhas são permitidas e o acréscimo de cada opção.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2 sm:grid-cols-2">
          <div class="space-y-2"><Label>Nome</Label><Input v-model="groupForm.nome" placeholder="Ex.: Escolha até 2 sabores" /></div>
          <div class="space-y-2">
            <Label>Tipo</Label>
            <Select v-model="groupForm.tipo"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COMPLEMENTO">Complemento</SelectItem><SelectItem value="SABOR">Sabor</SelectItem></SelectContent></Select>
          </div>
          <div class="space-y-2"><Label>Mínimo</Label><Input v-model.number="groupForm.minimo" type="number" min="0" /></div>
          <div class="space-y-2"><Label>Máximo</Label><Input v-model.number="groupForm.maximo" type="number" min="1" /></div>
          <div class="flex items-center justify-between rounded-lg border p-4 sm:col-span-2"><div><Label>Grupo ativo</Label><p class="text-xs text-muted-foreground">Grupos inativos não aparecem no cardápio público.</p></div><Switch v-model="groupForm.ativo" /></div>
          <div class="space-y-3 sm:col-span-2">
            <div class="flex items-center justify-between"><Label>Opções</Label><Button size="sm" variant="outline" @click="addOption"><Plus class="mr-2 h-4 w-4" />Adicionar opção</Button></div>
            <div v-for="(option, index) in groupForm.opcoes" :key="index" class="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_170px_1fr_auto] sm:items-end">
              <div class="space-y-1"><Label :for="`option-${index}`">Nome</Label><Input :id="`option-${index}`" v-model="option.nome" /></div>
              <div class="space-y-1"><Label>Acréscimo (R$)</Label><Input v-model.number="option.precoAdicional" type="number" min="0" step="0.01" /></div>
              <div class="space-y-1">
                <Label>Produto para estoque</Label>
                <Select :model-value="option.produtoId ? String(option.produtoId) : 'NONE'" @update:model-value="option.produtoId = $event === 'NONE' ? null : Number($event)">
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sem vínculo</SelectItem><SelectItem v-for="product in products" :key="product.id" :value="String(product.id)">{{ productLabel(product) }}</SelectItem></SelectContent>
                </Select>
              </div>
              <Button size="icon" variant="ghost" :disabled="groupForm.opcoes.length === 1" aria-label="Remover opção" @click="removeOption(index)"><Trash2 class="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="groupDialogOpen = false">Cancelar</Button>
          <Button :disabled="saving || !groupFormValid" @click="saveGroup"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />Salvar grupo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
