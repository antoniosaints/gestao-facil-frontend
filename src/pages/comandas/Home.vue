<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BadgePlus,
  ClipboardList,
  Cog,
  FileText,
  Loader,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  ComandaOperacaoRepository,
  type ComandaListResponse,
  type ComandaOperacao,
  type ComandaOperacaoItem,
} from '@/repositories/comanda-operacao-repository'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { ServicoRepository } from '@/repositories/servico-repository'
import { useComandasStore, getDefaultItemForm, type ComandaItemForm } from '@/stores/comandas/useComandas'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'

const store = useComandasStore()
const uiStore = useUiStore()
const toast = useToast()

const loading = ref(false)
const savingItem = ref(false)
const comandas = ref<ComandaOperacao[]>([])
const total = ref(0)
const totalPages = ref(1)
const itemLabel = ref('')
const createItemLabels = ref<string[]>([''])
const searchModalOpen = ref(false)
const cancelObservation = ref('')
const stockDecision = ref<{
  open: boolean
  action: 'remove-item' | 'cancel-comanda'
  comandaId: number
  item?: ComandaOperacaoItem
  title: string
  description: string
}>({
  open: false,
  action: 'remove-item',
  comandaId: 0,
  title: '',
  description: '',
})

const pageInfo = computed(() => `Pagina ${store.filters.page} de ${totalPages.value}`)
const hasComandas = computed(() => comandas.value.length > 0)
const selectedItems = computed(() => store.selectedComanda?.itens || [])
const selectedOpenItems = computed(() => selectedItems.value.filter((item) => !item.pagamentoId))
const selectedPaidItems = computed(() => selectedItems.value.filter((item) => item.pagamentoId))
const selectedCanChange = computed(() => store.selectedComanda?.status === 'ABERTA')
const selectedCanFaturar = computed(() => store.selectedComanda?.status === 'PENDENTE')
const selectedCanCancel = computed(() => ['ABERTA', 'PENDENTE'].includes(store.selectedComanda?.status || '') && selectedPaidItems.value.length === 0)
const selectedHasStockProducts = computed(() =>
  selectedItems.value.some((item) => item.origemTipo === 'PRODUTO' && item.estoqueDebitado),
)
const selectedPaymentTotal = computed(() =>
  selectedOpenItems.value
    .filter((item) => store.faturarForm.itemIds.includes(item.id))
    .reduce((acc, item) => acc + getItemTotal(item), 0),
)

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ABERTA: 'Aberta',
    PENDENTE: 'Pendente',
    FATURADA: 'Faturada',
    CANCELADA: 'Cancelada',
  }
  return labels[status] || status
}

function statusClass(status: string) {
  const classes: Record<string, string> = {
    ABERTA: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-200',
    PENDENTE: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-200',
    FATURADA: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    CANCELADA: 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-200',
  }
  return classes[status] || 'border-border'
}

function itemTypeLabel(type: string) {
  if (type === 'PRODUTO') return 'Produto'
  if (type === 'SERVICO') return 'Servico'
  return 'Avulso'
}

function getItemTotal(item: ComandaOperacaoItem) {
  return Number(item.subtotal || 0)
}

function getClienteLabel(comanda: ComandaOperacao) {
  return comanda.clienteNomeSnapshot || 'Sem cliente vinculado'
}

function hasPaidItems(comanda: ComandaOperacao) {
  return (comanda.itens || []).some((item) => item.pagamentoId)
}

function togglePaymentItem(itemId: number, checked: boolean | 'indeterminate') {
  const ids = new Set(store.faturarForm.itemIds)
  if (checked === true) {
    ids.add(itemId)
  } else {
    ids.delete(itemId)
  }
  store.faturarForm.itemIds = Array.from(ids)
}

function handlePaymentItemChecked(itemId: number, checked: boolean | 'indeterminate') {
  togglePaymentItem(itemId, checked)
}

function selectAllPaymentItems() {
  store.faturarForm.itemIds = selectedOpenItems.value.map((item) => item.id)
}

function clearPaymentItems() {
  store.faturarForm.itemIds = []
}

async function loadComandas() {
  loading.value = true
  try {
    const response: ComandaListResponse = await ComandaOperacaoRepository.list({
      page: store.filters.page,
      pageSize: store.filters.pageSize,
      search: store.filters.search,
      status: store.filters.status,
      inicio: store.filters.inicio,
      fim: store.filters.fim,
      sortBy: 'abertura',
      order: 'desc',
    })
    comandas.value = response.data || []
    total.value = response.total || 0
    totalPages.value = response.totalPages || 1
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar comandas.')
    comandas.value = []
  } finally {
    loading.value = false
  }
}

function applySearch() {
  store.filters.page = 1
  store.updateTable()
  searchModalOpen.value = false
}

function clearFilters() {
  store.filters.search = ''
  store.filters.status = 'ABERTA,PENDENTE'
  store.filters.inicio = null
  store.filters.fim = null
  store.filters.page = 1
  store.updateTable()
}

function nextPage() {
  if (store.filters.page >= totalPages.value) return
  store.filters.page += 1
}

function previousPage() {
  if (store.filters.page <= 1) return
  store.filters.page -= 1
}

function addCreateItem() {
  store.comandaForm.itens.push(getDefaultItemForm())
  createItemLabels.value.push('')
}

function removeCreateItem(index: number) {
  if (store.comandaForm.itens.length === 1) return
  store.comandaForm.itens.splice(index, 1)
  createItemLabels.value.splice(index, 1)
}

async function hydrateItemData(form: ComandaItemForm, id: number | string | null) {
  if (!id || form.origemTipo === 'AVULSO') return

  try {
    if (form.origemTipo === 'PRODUTO') {
      const response = await ProdutoVarianteRepository.get(Number(id))
      if (response.data?.estoque !== undefined && Number(response.data.estoque) <= 0) {
        toast.error('Produto sem estoque disponivel.')
      }
      form.valorUnitario = Number(response.data?.preco || 0)
      form.quantidade = 1
      return
    }

    const servico = await ServicoRepository.get(Number(id))
    form.valorUnitario = Number(servico?.preco || 0)
    form.quantidade = 1
  } catch (error) {
    console.log(error)
    toast.warning('Nao foi possivel preencher o valor automaticamente.')
  }
}

function onCreateItemTypeChange(item: ComandaItemForm, index: number) {
  item.origemId = null
  item.nome = ''
  item.valorUnitario = undefined
  item.quantidade = 1
  createItemLabels.value[index] = ''
}

function onAddItemTypeChange() {
  store.itemForm.origemId = null
  store.itemForm.nome = ''
  store.itemForm.valorUnitario = undefined
  store.itemForm.quantidade = 1
  itemLabel.value = ''
}

async function submitCreate() {
  await store.createComanda()
  createItemLabels.value = ['']
  await loadComandas()
}

async function submitAddItem() {
  savingItem.value = true
  try {
    await store.addItem()
    await loadComandas()
  } finally {
    savingItem.value = false
  }
}

async function openDetalhes(comanda: ComandaOperacao) {
  await store.openDetalhes(comanda.id)
}

async function fecharComanda(comanda: ComandaOperacao) {
  await store.fechar(comanda.id)
  await loadComandas()
}

async function openFaturar(comanda: ComandaOperacao) {
  await store.openFaturar(comanda.id)
}

async function submitFaturar() {
  if (!store.faturarForm.itemIds.length) {
    toast.warning('Selecione ao menos um item para faturar.')
    return
  }
  await store.faturar()
  await loadComandas()
}

async function openComprovante(comanda: ComandaOperacao) {
  await ComandaOperacaoRepository.abrirComprovante(comanda)
}

function askRemoveItem(comandaId: number, item: ComandaOperacaoItem) {
  if (item.origemTipo === 'PRODUTO' && item.estoqueDebitado) {
    stockDecision.value = {
      open: true,
      action: 'remove-item',
      comandaId,
      item,
      title: 'Remover produto da comanda',
      description: `Deseja devolver ${Number(item.quantidade || 0)} unidade(s) de "${item.nomeSnapshot}" ao estoque?`,
    }
    return
  }
  store.removeItem(comandaId, item.id).then(loadComandas)
}

function askCancelComanda(comanda: ComandaOperacao) {
  if (hasPaidItems(comanda)) {
    toast.warning('Comanda com itens faturados nao pode ser cancelada por este fluxo.')
    return
  }

  const hasStockProducts = (comanda.itens || []).some((item) => item.origemTipo === 'PRODUTO' && item.estoqueDebitado)
  if (hasStockProducts) {
    stockDecision.value = {
      open: true,
      action: 'cancel-comanda',
      comandaId: comanda.id,
      title: 'Cancelar comanda',
      description: 'Esta comanda possui produtos com estoque debitado. Deseja devolver as quantidades ao estoque?',
    }
    return
  }
  store.cancelar(comanda.id, undefined, cancelObservation.value || null).then(loadComandas)
}

async function confirmStockDecision(devolverEstoque: boolean) {
  const decision = stockDecision.value
  stockDecision.value.open = false

  if (decision.action === 'remove-item' && decision.item) {
    await store.removeItem(decision.comandaId, decision.item.id, devolverEstoque)
  }

  if (decision.action === 'cancel-comanda') {
    await store.cancelar(decision.comandaId, devolverEstoque, cancelObservation.value || null)
  }

  await loadComandas()
}

watch(
  () => store.filters.update,
  () => loadComandas(),
)

watch(
  () => [store.filters.status, store.filters.page, store.filters.pageSize, store.filters.inicio, store.filters.fim],
  () => loadComandas(),
)

watch(
  () => store.openFormModal,
  (open) => {
    if (open) createItemLabels.value = ['']
  },
)

onMounted(loadComandas)
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col justify-between gap-3 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ClipboardList class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Comandas
        </h2>
        <p class="text-sm text-muted-foreground">Controle operacional de comandas.</p>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <Input v-model="store.filters.search" type="search" placeholder="Buscar numero, cliente, observacao ou item" class="w-72" @keyup.enter="applySearch" />
        <Select v-model="store.filters.status">
          <SelectTrigger class="w-[190px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="ABERTA,PENDENTE">Abertas e pendentes</SelectItem>
            <SelectItem value="ABERTA">Abertas</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="FATURADA">Faturadas</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" @click="applySearch">
          <Search class="h-4 w-4" />
        </Button>
        <Button v-if="uiStore.permissoes.vendas.criar" @click="store.openCreate()">
          <BadgePlus class="mr-2 h-4 w-4" />
          Nova comanda
        </Button>
        <Button v-if="uiStore.permissoes.configuracoes.visualizar" variant="outline" @click="store.openConfiguracao()">
          <Cog class="h-4 w-4" />
        </Button>
        <Button variant="outline" @click="store.updateTable()">
          <RefreshCcw class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
      <div class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">Total filtrado</div>
        <div class="text-xl font-semibold text-foreground">{{ total }}</div>
      </div>
      <div class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">Em operacao</div>
        <div class="text-xl font-semibold text-foreground">{{ comandas.filter((item) => ['ABERTA', 'PENDENTE'].includes(item.status)).length }}</div>
      </div>
      <div class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">Faturadas na pagina</div>
        <div class="text-xl font-semibold text-foreground">{{ comandas.filter((item) => item.status === 'FATURADA').length }}</div>
      </div>
      <div class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">Valor da pagina</div>
        <div class="text-xl font-semibold text-foreground">{{ formatCurrencyBR(comandas.reduce((acc, item) => acc + Number(item.total || 0), 0)) }}</div>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-border bg-background">
      <div class="grid grid-cols-12 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
        <div class="col-span-3">Comanda</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-2">Itens</div>
        <div class="col-span-2">Total</div>
        <div class="col-span-3 text-right">Acoes</div>
      </div>

      <div v-if="loading && !hasComandas" class="p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader class="h-6 w-6 animate-spin text-info" />
            </EmptyMedia>
            <EmptyTitle>Carregando...</EmptyTitle>
            <EmptyDescription>Buscando comandas cadastradas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div v-else-if="!hasComandas" class="p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>Nenhuma comanda encontrada</EmptyTitle>
            <EmptyDescription>Crie a primeira comanda para iniciar o controle operacional.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <article
        v-for="comanda in comandas"
        v-else
        :key="comanda.id"
        class="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-12 md:items-center"
      >
        <div class="md:col-span-3">
          <button type="button" class="text-left" @click="openDetalhes(comanda)">
            <div class="font-semibold text-foreground">#{{ comanda.Uid }}</div>
            <div class="text-xs text-muted-foreground">{{ formatDateToPtBR(comanda.abertura, true) }}</div>
            <div class="truncate text-xs text-muted-foreground">{{ getClienteLabel(comanda) }}</div>
          </button>
        </div>

        <div class="md:col-span-2">
          <Badge variant="outline" :class="statusClass(comanda.status)">{{ statusLabel(comanda.status) }}</Badge>
        </div>

        <div class="text-sm text-muted-foreground md:col-span-2">
          {{ comanda.itens?.length || 0 }} item(ns)
          <span v-if="hasPaidItems(comanda)" class="block text-xs text-emerald-600">parcial faturado</span>
        </div>

        <div class="font-semibold text-foreground md:col-span-2">
          {{ formatCurrencyBR(Number(comanda.total || 0)) }}
        </div>

        <div class="flex flex-wrap justify-start gap-2 md:col-span-3 md:justify-end">
          <Button variant="outline" size="sm" @click="openDetalhes(comanda)">
            <FileText class="mr-2 h-4 w-4" />
            Detalhes
          </Button>
          <Button v-if="comanda.status === 'ABERTA'" size="sm" @click="fecharComanda(comanda)">
            Fechar
          </Button>
          <Button v-if="comanda.status === 'PENDENTE'" size="sm" @click="openFaturar(comanda)">
            <ReceiptText class="mr-2 h-4 w-4" />
            Faturar
          </Button>
          <Button v-if="comanda.status === 'FATURADA'" variant="outline" size="sm" @click="openComprovante(comanda)">
            PDF
          </Button>
        </div>
      </article>
    </div>

    <div class="mt-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{{ pageInfo }}</span>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="store.filters.page <= 1 || loading" @click="previousPage">Anterior</Button>
        <Button variant="outline" size="sm" :disabled="store.filters.page >= totalPages || loading" @click="nextPage">Proximo</Button>
      </div>
    </div>

    <ModalView v-model:open="store.openFormModal" title="Nova comanda" description="Inclua pelo menos um item. Produtos debitam o estoque assim que entram na comanda." size="4xl">
      <form class="space-y-4 px-4 pb-2" @submit.prevent="submitCreate">
        <div>
          <label class="mb-1 block text-sm font-medium">Cliente</label>
          <Select2Ajax v-model="store.comandaForm.clienteId" url="/clientes/select2" :allow-clear="true" placeholder="Cliente opcional" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Observacao</label>
          <Input v-model="store.comandaForm.observacao" placeholder="Mesa, cliente, referencia interna..." />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Itens</span>
            <Button type="button" variant="outline" size="sm" @click="addCreateItem">
              <Plus class="mr-2 h-4 w-4" />
              Adicionar linha
            </Button>
          </div>

          <div v-for="(item, index) in store.comandaForm.itens" :key="index" class="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-12">
            <div class="md:col-span-2">
              <label class="mb-1 block text-xs font-medium">Tipo</label>
              <Select v-model="item.origemTipo" @update:model-value="onCreateItemTypeChange(item, index)">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUTO">Produto</SelectItem>
                  <SelectItem value="SERVICO">Servico</SelectItem>
                  <SelectItem value="AVULSO">Avulso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="md:col-span-4">
              <label class="mb-1 block text-xs font-medium">{{ item.origemTipo === 'AVULSO' ? 'Nome' : 'Item' }}</label>
              <Input v-if="item.origemTipo === 'AVULSO'" v-model="item.nome" placeholder="Nome do item" />
              <Select2Ajax
                v-else
                v-model="item.origemId"
                v-model:label="createItemLabels[index]"
                :url="item.origemTipo === 'PRODUTO' ? '/produtos/select2' : '/servicos/select2'"
                :params="item.origemTipo === 'PRODUTO' ? [{ key: 'withStock', value: true }] : []"
                :allow-clear="true"
                placeholder="Pesquisar item"
                @update:model-value="(value) => hydrateItemData(item, value)"
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-1 block text-xs font-medium">Quantidade</label>
              <Input v-model.number="item.quantidade" type="number" min="1" step="1" />
            </div>

            <div class="md:col-span-2">
              <label class="mb-1 block text-xs font-medium">Valor unitario</label>
              <Input v-model.number="item.valorUnitario" type="number" min="0.01" step="0.01" />
            </div>

            <div class="flex items-end justify-between gap-2 md:col-span-2">
              <div class="pb-2 text-sm font-semibold text-foreground">
                {{ formatCurrencyBR(Number(item.valorUnitario || 0) * Number(item.quantidade || 0)) }}
              </div>
              <Button type="button" variant="outline" size="sm" :disabled="store.comandaForm.itens.length === 1" @click="removeCreateItem(index)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="store.openFormModal = false">Fechar</Button>
          <Button type="submit">Criar comanda</Button>
        </div>
      </form>
    </ModalView>

    <ModalView v-model:open="store.openDetalhesModal" :title="store.selectedComanda ? `Comanda ${store.selectedComanda.Uid}` : 'Comanda'" size="5xl">
      <div v-if="store.selectedComanda" class="space-y-4 px-4 pb-2">
        <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
          <div class="rounded-lg border border-border bg-card p-3">
            <div class="text-xs text-muted-foreground">Status</div>
            <Badge variant="outline" :class="statusClass(store.selectedComanda.status)">{{ statusLabel(store.selectedComanda.status) }}</Badge>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <div class="text-xs text-muted-foreground">Abertura</div>
            <div class="text-sm font-medium">{{ formatDateToPtBR(store.selectedComanda.abertura, true) }}</div>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <div class="text-xs text-muted-foreground">Cliente</div>
            <div class="truncate text-sm font-medium">{{ getClienteLabel(store.selectedComanda) }}</div>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <div class="text-xs text-muted-foreground">Itens</div>
            <div class="text-sm font-medium">{{ selectedItems.length }}</div>
            <div class="text-xs text-muted-foreground">{{ selectedPaidItems.length }} faturado(s)</div>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <div class="text-xs text-muted-foreground">Total</div>
            <div class="text-sm font-semibold">{{ formatCurrencyBR(Number(store.selectedComanda.total || 0)) }}</div>
          </div>
        </div>

        <div class="flex flex-wrap justify-end gap-2">
          <Button v-if="selectedCanChange" variant="outline" @click="store.openAddItem(store.selectedComanda.id)">
            <Plus class="mr-2 h-4 w-4" />
            Adicionar item
          </Button>
          <Button v-if="selectedCanChange" @click="fecharComanda(store.selectedComanda)">Fechar comanda</Button>
          <Button v-if="selectedCanFaturar" @click="openFaturar(store.selectedComanda)">
            <ReceiptText class="mr-2 h-4 w-4" />
            Faturar
          </Button>
          <Button v-if="store.selectedComanda.status === 'FATURADA'" variant="outline" @click="openComprovante(store.selectedComanda)">Abrir PDF</Button>
          <Button v-if="selectedCanCancel" variant="outline" class="text-danger" @click="askCancelComanda(store.selectedComanda)">
            Cancelar
          </Button>
        </div>

        <div class="overflow-hidden rounded-lg border border-border">
          <div class="grid grid-cols-12 bg-muted/40 px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
            <div class="col-span-5">Item</div>
            <div class="col-span-2">Qtd</div>
            <div class="col-span-2">Unitario</div>
            <div class="col-span-2">Subtotal</div>
            <div class="col-span-1 text-right"></div>
          </div>
          <div v-for="item in selectedItems" :key="item.id" class="grid grid-cols-12 items-center border-t border-border px-3 py-2 text-sm">
            <div class="col-span-5 min-w-0">
              <div class="truncate font-medium text-foreground">{{ item.nomeSnapshot }}</div>
              <div class="text-xs text-muted-foreground">
                {{ itemTypeLabel(item.origemTipo) }}
                <span v-if="item.estoqueDebitado"> - estoque debitado</span>
                <span v-if="item.pagamentoId" class="ml-1 text-emerald-600">- faturado</span>
                <span v-else-if="store.selectedComanda.status === 'PENDENTE'" class="ml-1 text-amber-600">- em aberto</span>
              </div>
            </div>
            <div class="col-span-2">{{ Number(item.quantidade || 0) }}</div>
            <div class="col-span-2">{{ formatCurrencyBR(Number(item.valorUnitarioSnapshot || 0)) }}</div>
            <div class="col-span-2 font-medium">{{ formatCurrencyBR(getItemTotal(item)) }}</div>
            <div class="col-span-1 text-right">
              <Button v-if="selectedCanChange && !item.pagamentoId" variant="outline" size="sm" @click="askRemoveItem(store.selectedComanda!.id, item)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div v-if="selectedHasStockProducts && ['ABERTA', 'PENDENTE'].includes(store.selectedComanda.status)" class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-100">
          Ao remover ou cancelar itens de produto, escolha se a quantidade deve voltar ao estoque.
        </div>
      </div>
    </ModalView>

    <ModalView v-model:open="store.openItemModal" title="Adicionar item" description="Produtos debitam o estoque imediatamente." size="xl">
      <form class="grid grid-cols-1 gap-4 px-4 pb-2 md:grid-cols-12" @submit.prevent="submitAddItem">
        <div class="md:col-span-4">
          <label class="mb-1 block text-sm font-medium">Tipo</label>
          <Select v-model="store.itemForm.origemTipo" @update:model-value="onAddItemTypeChange">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUTO">Produto</SelectItem>
              <SelectItem value="SERVICO">Servico</SelectItem>
              <SelectItem value="AVULSO">Avulso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="md:col-span-8">
          <label class="mb-1 block text-sm font-medium">{{ store.itemForm.origemTipo === 'AVULSO' ? 'Nome' : 'Item' }}</label>
          <Input v-if="store.itemForm.origemTipo === 'AVULSO'" v-model="store.itemForm.nome" placeholder="Nome do item" />
          <Select2Ajax
            v-else
            v-model="store.itemForm.origemId"
            v-model:label="itemLabel"
            :url="store.itemForm.origemTipo === 'PRODUTO' ? '/produtos/select2' : '/servicos/select2'"
            :params="store.itemForm.origemTipo === 'PRODUTO' ? [{ key: 'withStock', value: true }] : []"
            :allow-clear="true"
            placeholder="Pesquisar item"
            @update:model-value="(value) => hydrateItemData(store.itemForm, value)"
          />
        </div>
        <div class="md:col-span-6">
          <label class="mb-1 block text-sm font-medium">Quantidade</label>
          <Input v-model.number="store.itemForm.quantidade" type="number" min="1" step="1" />
        </div>
        <div class="md:col-span-6">
          <label class="mb-1 block text-sm font-medium">Valor unitario</label>
          <Input v-model.number="store.itemForm.valorUnitario" type="number" min="0.01" step="0.01" />
        </div>
        <div class="md:col-span-12 flex justify-between gap-2 border-t border-border pt-3">
          <div class="text-sm text-muted-foreground">
            Subtotal: <span class="font-semibold text-foreground">{{ formatCurrencyBR(Number(store.itemForm.valorUnitario || 0) * Number(store.itemForm.quantidade || 0)) }}</span>
          </div>
          <div class="flex gap-2">
            <Button type="button" variant="secondary" @click="store.openItemModal = false">Fechar</Button>
            <Button type="submit" :disabled="savingItem">{{ savingItem ? 'Salvando...' : 'Adicionar' }}</Button>
          </div>
        </div>
      </form>
    </ModalView>

    <ModalView v-model:open="store.openFaturarModal" title="Faturar comanda" description="Os campos financeiros sao preenchidos pela configuracao padrao, mas podem ser alterados nesta tela." size="xl">
      <form class="grid grid-cols-1 gap-4 px-4 pb-2 md:grid-cols-2" @submit.prevent="submitFaturar">
        <div class="space-y-3 md:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-medium">Itens para faturar</div>
              <div class="text-xs text-muted-foreground">Itens ja faturados ficam fora desta selecao.</div>
            </div>
            <div class="flex gap-2">
              <Button type="button" variant="outline" size="sm" @click="selectAllPaymentItems">Todos</Button>
              <Button type="button" variant="outline" size="sm" @click="clearPaymentItems">Limpar</Button>
            </div>
          </div>

          <div class="overflow-hidden rounded-lg border border-border">
            <div v-if="!selectedOpenItems.length" class="p-3 text-sm text-muted-foreground">
              Nenhum item em aberto para faturar.
            </div>
            <label
              v-for="item in selectedOpenItems"
              v-else
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 border-t border-border px-3 py-2 first:border-t-0"
            >
              <Checkbox :checked="store.faturarForm.itemIds.includes(item.id)" @update:checked="handlePaymentItemChecked(item.id, $event)" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-foreground">{{ item.nomeSnapshot }}</span>
                <span class="block text-xs text-muted-foreground">{{ Number(item.quantidade || 0) }} x {{ formatCurrencyBR(Number(item.valorUnitarioSnapshot || 0)) }}</span>
              </span>
              <span class="text-sm font-semibold text-foreground">{{ formatCurrencyBR(getItemTotal(item)) }}</span>
            </label>
          </div>

          <div class="flex justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span class="text-muted-foreground">Total selecionado</span>
            <span class="font-semibold text-foreground">{{ formatCurrencyBR(selectedPaymentTotal) }}</span>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Pagamento</label>
          <Select v-model="store.faturarForm.metodo">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
              <SelectItem value="CARTAO">Cartao</SelectItem>
              <SelectItem value="BOLETO">Boleto</SelectItem>
              <SelectItem value="PROMISSORIA">Promissoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Data</label>
          <Input v-model="store.faturarForm.dataPagamento" type="date" />
        </div>
        <div class="flex items-center justify-between rounded-lg border border-border bg-card p-3 md:col-span-2">
          <div>
            <div class="text-sm font-medium">Lancar no financeiro</div>
            <div class="text-xs text-muted-foreground">Cria uma receita paga ao faturar a comanda.</div>
          </div>
          <Switch v-model="store.faturarForm.lancarFinanceiro" />
        </div>
        <div v-show="store.faturarForm.lancarFinanceiro">
          <label class="mb-1 block text-sm font-medium">Conta financeira</label>
          <Select2Ajax v-model="store.faturarForm.contaFinanceiraId" url="/lancamentos/contas/select2" :allow-clear="true" placeholder="Selecione a conta" />
        </div>
        <div v-show="store.faturarForm.lancarFinanceiro">
          <label class="mb-1 block text-sm font-medium">Categoria</label>
          <Select2Ajax v-model="store.faturarForm.categoriaFinanceiraId" url="/lancamentos/categorias/select2" :allow-clear="true" placeholder="Selecione a categoria" />
        </div>
        <div class="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" @click="store.openFaturarModal = false">Fechar</Button>
          <Button type="submit" :disabled="!store.faturarForm.itemIds.length">Faturar selecionados</Button>
        </div>
      </form>
    </ModalView>

    <ModalView v-model:open="store.openConfiguracaoModal" title="Configuracao de comandas" description="Defina os padroes usados no faturamento financeiro das comandas." size="lg">
      <form class="grid grid-cols-1 gap-4 px-4 pb-2 md:grid-cols-2" @submit.prevent="store.saveConfiguracao()">
        <div>
          <label class="mb-1 block text-sm font-medium">Conta padrao</label>
          <Select2Ajax v-model="store.configuracaoForm.contaFinanceiraIdPadrao" url="/lancamentos/contas/select2" :allow-clear="true" placeholder="Selecione a conta" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Categoria padrao</label>
          <Select2Ajax v-model="store.configuracaoForm.categoriaFinanceiraIdPadrao" url="/lancamentos/categorias/select2" :allow-clear="true" placeholder="Selecione a categoria" />
        </div>
        <div class="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" @click="store.openConfiguracaoModal = false">Fechar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </ModalView>

    <ModalView v-model:open="stockDecision.open" :title="stockDecision.title" :description="stockDecision.description" size="md">
      <div class="space-y-4 px-4 pb-2">
        <div v-if="stockDecision.action === 'cancel-comanda'" class="space-y-2">
          <label class="block text-sm font-medium">Observacao do cancelamento</label>
          <Input v-model="cancelObservation" placeholder="Motivo ou observacao" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="confirmStockDecision(false)">
            Nao devolver
          </Button>
          <Button @click="confirmStockDecision(true)">
            Devolver ao estoque
          </Button>
        </div>
      </div>
    </ModalView>

    <ModalView v-model:open="searchModalOpen" title="Buscar comandas" size="lg">
      <div class="space-y-3 px-4 pb-2">
        <Input v-model="store.filters.search" type="search" placeholder="Numero, cliente, observacao ou item" @keyup.enter="applySearch" />
        <Select v-model="store.filters.status">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="ABERTA,PENDENTE">Abertas e pendentes</SelectItem>
            <SelectItem value="ABERTA">Abertas</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="FATURADA">Faturadas</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="clearFilters">Limpar</Button>
          <Button class="flex-1" @click="applySearch">Buscar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="searchModalOpen = true">
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button v-if="uiStore.permissoes.vendas.criar" type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="store.openCreate()">
        <BadgePlus class="h-5 w-5" />
        <span class="text-xs">Nova</span>
      </button>
      <button v-if="uiStore.permissoes.configuracoes.visualizar" type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="store.openConfiguracao()">
        <Cog class="h-5 w-5" />
        <span class="text-xs">Config.</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="store.updateTable()">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="clearFilters">
        <X class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
