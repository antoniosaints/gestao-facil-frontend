<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
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
import {
  RestauranteRepository,
  type RestauranteCatalogoItem,
  type RestauranteCatalogoPayload,
  type RestauranteGrupoOpcao,
  type RestauranteGrupoPayload,
  type RestauranteProdutoDisponivel,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { Layers3, LoaderCircle, Pencil, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-vue-next'

const toast = useToast()
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

const itemForm = reactive<RestauranteCatalogoPayload>({
  produtoId: 0,
  nomePublico: null,
  descricao: null,
  imagem: null,
  disponivel: true,
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
  if (!term) return items.value
  return items.value.filter((item) =>
    [item.nomePublico, item.Produto.nome, item.Produto.nomeVariante].some((value) =>
      value?.toLocaleLowerCase('pt-BR').includes(term),
    ),
  )
})

const activeGroups = computed(() => groups.value.filter((group) => group.ativo))
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
    groups.value = optionGroups
    products.value = availableProducts
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o cardápio.')
  } finally {
    loading.value = false
  }
}

function newItem() {
  editingItemId.value = undefined
  Object.assign(itemForm, {
    produtoId: 0,
    nomePublico: null,
    descricao: null,
    imagem: null,
    disponivel: true,
    regraPrecoSabores: 'MAIOR_PRECO',
    ordem: items.value.length,
    grupoIds: [],
    version: undefined,
  })
  itemDialogOpen.value = true
}

function editItem(item: RestauranteCatalogoItem) {
  editingItemId.value = item.id
  Object.assign(itemForm, {
    produtoId: item.produtoId,
    nomePublico: item.nomePublico,
    descricao: item.descricao,
    imagem: item.imagem,
    disponivel: item.disponivel,
    regraPrecoSabores: item.regraPrecoSabores,
    ordem: item.ordem,
    grupoIds: item.grupos.map((link) => link.grupoId),
    version: item.version,
  })
  itemDialogOpen.value = true
}

function toggleGroup(groupId: number, checked: boolean | 'indeterminate') {
  if (checked === true && !itemForm.grupoIds.includes(groupId)) itemForm.grupoIds.push(groupId)
  if (checked !== true) itemForm.grupoIds = itemForm.grupoIds.filter((id) => id !== groupId)
}

async function saveItem() {
  if (!itemForm.produtoId) return toast.info('Selecione um produto para o cardápio.')
  try {
    saving.value = true
    await RestauranteRepository.salvarItemCardapio(itemForm, editingItemId.value)
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

onMounted(load)
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Cardápio do restaurante</h1>
        <p class="text-sm text-muted-foreground">
          Publique produtos existentes e configure sabores e complementos.
        </p>
      </div>
    </header>

    <Tabs default-value="itens" class="space-y-3">
      <TabsList>
        <TabsTrigger value="itens"><UtensilsCrossed class="mr-2 h-4 w-4" />Itens do cardápio</TabsTrigger>
        <TabsTrigger value="grupos"><Layers3 class="mr-2 h-4 w-4" />Sabores e complementos</TabsTrigger>
      </TabsList>

      <TabsContent value="itens" class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div class="relative w-full sm:max-w-md">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input v-model="search" class="pl-9" placeholder="Buscar item do cardápio" />
          </div>
          <Button @click="newItem"><Plus class="mr-2 h-4 w-4" />Adicionar produto</Button>
        </div>

        <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton v-for="item in 8" :key="item" class="h-52 rounded-xl" />
        </div>
        <div v-else-if="!filteredItems.length" class="rounded-xl border border-dashed p-10 text-center">
          <UtensilsCrossed class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p class="font-medium">Nenhum item no cardápio</p>
          <p class="text-sm text-muted-foreground">Adicione um produto já cadastrado para começar.</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card v-for="item in filteredItems" :key="item.id" class="flex flex-col overflow-hidden rounded-xl">
            <img
              v-if="item.imagem || item.Produto.imagem"
              :src="item.imagem || item.Produto.imagem || ''"
              :alt="item.nomePublico || item.Produto.nome"
              class="h-24 w-full object-cover"
            />
            <CardHeader class="p-4 pb-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle class="text-base">{{ item.nomePublico || productLabel(item.Produto) }}</CardTitle>
                  <CardDescription>{{ formatCurrencyBR(Number(item.Produto.preco)) }}</CardDescription>
                </div>
                <Badge :variant="item.disponivel ? 'secondary' : 'outline'">
                  {{ item.disponivel ? 'Disponível' : 'Oculto' }}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="flex-1 space-y-2 px-4 pb-3 text-sm">
              <p class="line-clamp-2 text-muted-foreground">{{ item.descricao || 'Sem descrição pública.' }}</p>
              <div class="flex flex-wrap gap-1.5">
                <Badge v-for="link in item.grupos" :key="link.grupoId" variant="outline">
                  {{ link.Grupo.nome }}
                </Badge>
              </div>
            </CardContent>
            <CardFooter class="border-t px-4 py-3">
              <Button size="sm" class="w-full" variant="outline" @click="editItem(item)">
                <Pencil class="mr-1.5 h-3.5 w-3.5" />Editar item
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="grupos" class="space-y-4">
        <div class="flex justify-end">
          <Button @click="newGroup"><Plus class="mr-2 h-4 w-4" />Novo grupo</Button>
        </div>
        <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton v-for="item in 4" :key="item" class="h-40 rounded-xl" />
        </div>
        <div v-else-if="!groups.length" class="rounded-xl border border-dashed p-10 text-center">
          <Layers3 class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p class="font-medium">Nenhum grupo configurado</p>
          <p class="text-sm text-muted-foreground">Crie sabores, adicionais ou complementos.</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card v-for="group in groups" :key="group.id" class="flex flex-col rounded-xl">
            <CardHeader class="p-4 pb-2">
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
            <CardContent class="flex-1 space-y-1.5 px-4 pb-3 text-sm">
              <div v-for="option in group.opcoes" :key="option.id || option.nome" class="flex justify-between gap-3">
                <span :class="{ 'text-muted-foreground line-through': !option.ativo }">{{ option.nome }}</span>
                <span v-if="Number(option.precoAdicional) > 0" class="text-muted-foreground">
                  +{{ formatCurrencyBR(Number(option.precoAdicional)) }}
                </span>
              </div>
              <p class="pt-2 text-xs text-muted-foreground">Usado em {{ group._count?.itens || 0 }} item(ns).</p>
            </CardContent>
            <CardFooter class="border-t px-4 py-3">
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
          <DialogDescription>O preço base e o estoque continuam vindo do cadastro de produtos.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2 sm:grid-cols-2">
          <div class="space-y-2 sm:col-span-2">
            <Label>Produto</Label>
            <Select :model-value="itemForm.produtoId ? String(itemForm.produtoId) : undefined" @update:model-value="itemForm.produtoId = Number($event)">
              <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="product in products" :key="product.id" :value="String(product.id)">
                  {{ productLabel(product) }} · {{ formatCurrencyBR(Number(product.preco)) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="public-name">Nome público</Label>
            <Input
              id="public-name"
              :model-value="itemForm.nomePublico ?? ''"
              placeholder="Opcional"
              @update:model-value="itemForm.nomePublico = String($event)"
            />
          </div>
          <div class="space-y-2">
            <Label for="order">Ordem</Label>
            <Input id="order" v-model.number="itemForm.ordem" type="number" />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label for="description">Descrição</Label>
            <Textarea
              id="description"
              :model-value="itemForm.descricao ?? ''"
              rows="3"
              @update:model-value="itemForm.descricao = String($event)"
            />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label for="image">URL da imagem</Label>
            <Input
              id="image"
              :model-value="itemForm.imagem ?? ''"
              placeholder="Opcional; usa a imagem do produto por padrão"
              @update:model-value="itemForm.imagem = String($event)"
            />
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
        </div>
        <DialogFooter>
          <Button variant="outline" @click="itemDialogOpen = false">Cancelar</Button>
          <Button :disabled="saving || !itemForm.produtoId" @click="saveItem">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />Salvar item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
