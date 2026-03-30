<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrencyBR } from '@/utils/formatters'
import { ComandaRepository } from '@/repositories/comanda-repository'
import { useComandaStore } from '@/stores/arena/comandaStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { deletarVenda } from '@/pages/vendas/ActionsVendas'
import {
  BadgeCheck,
  Check,
  CircleDollarSign,
  CircleSlash,
  Clock3,
  ConciergeBell,
  ExternalLink,
  FileClock,
  LoaderCircle,
  Minus,
  PackageSearch,
  ReceiptText,
  Trash2,
} from 'lucide-vue-next'
import { deletarComanda } from './ActionsComandas'

const store = useComandaStore()
const storeVendas = useVendasStore()
const toast = useToast()
const selectedItemIds = ref<number[]>([])

const comanda = computed(() => store.selectedComanda)
const pendingItems = computed(() =>
  (comanda.value?.itens ?? []).filter((item) => item.vendaId === null || item.vendaId === undefined),
)
const pendingItemIds = computed(() =>
  Array.from(
    new Set(
      pendingItems.value.map((item) => getItemId(item.id)).filter((id): id is number => id !== null),
    ),
  ),
)
const salesHistory = computed(() => comanda.value?.vendas ?? [])
const resumo = computed(() => ({
  itensAbertos: comanda.value?.resumo?.itensAbertos ?? pendingItems.value.length,
  valorItensAbertos: Number(comanda.value?.resumo?.valorItensAbertos ?? 0),
  valorPendente: Number(comanda.value?.resumo?.valorPendente ?? 0),
  valorPago: Number(comanda.value?.resumo?.valorPago ?? 0),
}))
const someSelected = computed(
  () => selectedItemIds.value.length > 0 && selectedItemIds.value.length < pendingItemIds.value.length,
)
const allSelected = computed(
  () => pendingItemIds.value.length > 0 && selectedItemIds.value.length === pendingItemIds.value.length,
)

function getItemId(itemId?: number | string | null) {
  const normalizedId = Number(itemId)
  return Number.isFinite(normalizedId) ? normalizedId : null
}

watch(
  () => store.openDetalhesModal,
  (isOpen) => {
    if (!isOpen) selectedItemIds.value = []
  },
)

watch(
  () => comanda.value?.id,
  () => {
    selectedItemIds.value = []
  },
)

watch(
  pendingItemIds,
  (itemIds) => {
    selectedItemIds.value = selectedItemIds.value.filter((id) => itemIds.includes(id))
  },
  { immediate: true },
)

function setSelectedItems(itemIds: number[]) {
  selectedItemIds.value = Array.from(
    new Set(itemIds.filter((itemId) => pendingItemIds.value.includes(itemId))),
  )
}

function toggleSelectAll() {
  setSelectedItems(allSelected.value ? [] : pendingItemIds.value)
}

function getSelectAllVisualState() {
  if (allSelected.value) return 'checked'
  if (someSelected.value) return 'indeterminate'
  return 'unchecked'
}

function isItemSelected(itemId?: number | string | null) {
  const normalizedId = getItemId(itemId)
  return normalizedId !== null && selectedItemIds.value.includes(normalizedId)
}

function setItemSelection(itemId?: number | string | null, checked?: boolean | 'indeterminate') {
  const normalizedId = getItemId(itemId)

  if (normalizedId === null) return

  if (checked === true) {
    setSelectedItems([...selectedItemIds.value, normalizedId])
    return
  }

  if (checked === false) {
    selectedItemIds.value = selectedItemIds.value.filter((id) => id !== normalizedId)
  }
}

function toggleItemSelection(itemId?: number | string | null) {
  const normalizedId = getItemId(itemId)

  if (normalizedId === null) return

  setItemSelection(normalizedId, !selectedItemIds.value.includes(normalizedId))
}

function openCheckoutSelected() {
  store.openCheckout(selectedItemIds.value.filter((itemId) => pendingItemIds.value.includes(itemId)))
}

function openCheckoutAll() {
  store.openCheckout(pendingItemIds.value)
}

function abrirLink(url?: string | null) {
  if (!url) return
  window.open(url, '_blank')
}

function openFaturarVenda(vendaId: number) {
  storeVendas.idMutation = vendaId
  storeVendas.openModalFaturar = true
}

function getComandaStatusLabel(status?: string) {
  if (status === 'ABERTA') return 'Aberta'
  if (status === 'PENDENTE') return 'Pendente'
  if (status === 'FECHADA') return 'Fechada'
  return 'Cancelada'
}

function getComandaStatusClass(status?: string) {
  if (status === 'ABERTA') return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
  if (status === 'PENDENTE') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
  if (status === 'FECHADA') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
}

function getComandaStatusIcon(status?: string) {
  if (status === 'PENDENTE') return Clock3
  if (status === 'FECHADA') return BadgeCheck
  if (status === 'CANCELADA') return CircleSlash
  return ConciergeBell
}

function getChargeStatus(venda: (typeof salesHistory.value)[number]) {
  const cobranca = venda?.CobrancasFinanceiras?.[0]
  return cobranca?.status || 'SEM_COBRANCA'
}

function getSaleStatusLabel(status?: string) {
  if (status === 'FATURADO') return 'Pago'
  if (status === 'PENDENTE') return 'Pendente'
  if (status === 'CANCELADO') return 'Cancelada'
  return status || 'Aberta'
}

function getChargeStatusLabel(status: string) {
  if (status === 'PAGO') return 'Paga'
  if (status === 'EFETIVADO') return 'Efetivada'
  if (status === 'PENDENTE') return 'Pendente'
  if (status === 'CANCELADO') return 'Cancelada'
  if (status === 'ATRASADO') return 'Atrasada'
  return 'Sem cobranca'
}

function getSaleStatusClass(status?: string) {
  if (status === 'FATURADO') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (status === 'PENDENTE') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
  if (status === 'CANCELADO') return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
}

function getChargeStatusClass(status: string) {
  if (status === 'PAGO') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (status === 'EFETIVADO') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (status === 'PENDENTE') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
  if (status === 'CANCELADO') return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
  if (status === 'ATRASADO') return 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
  return 'bg-muted text-muted-foreground'
}

function getItemTotal(valor?: number, quantidade?: number) {
  return Number(valor || 0) * Number(quantidade || 0)
}

function getHistoryItems(venda: (typeof salesHistory.value)[number]) {
  return venda?.ComandaItens ?? []
}

function getHistorySummary(venda: (typeof salesHistory.value)[number]) {
  const quantity = getHistoryItems(venda).reduce((total, item) => total + Number(item.quantidade || 0), 0)
  return `${getHistoryItems(venda).length} item(ns) • ${quantity} unidade(s)`
}

function hasBlockedExternalCharge(venda: (typeof salesHistory.value)[number]) {
  return (
    venda?.CobrancasFinanceiras?.some(
      (cobranca) =>
        cobranca.gateway !== 'interno' && ['PENDENTE', 'EFETIVADO'].includes(cobranca.status || ''),
    ) ?? false
  )
}

function canEditSaleItems(venda: (typeof salesHistory.value)[number]) {
  return !hasBlockedExternalCharge(venda)
}

async function deleteSale(vendaId: number) {
  await deletarVenda(vendaId)

  if (!store.openDetalhesModal || !comanda.value?.id) return

  await store.reloadDetalhes()
  store.updateTable()
}

async function removeItem(itemId: number, itemName: string) {
  if (!comanda.value?.id) return

  const confirmed = await useConfirm().confirm({
    title: 'Remover item',
    message: `Deseja remover "${itemName}" desta comanda?`,
    confirmText: 'Remover',
  })

  if (!confirmed) return

  try {
    await ComandaRepository.removeItem(comanda.value.id, itemId)
    toast.success('Item removido com sucesso.')
    await store.reloadDetalhes()
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao remover o item.')
  }
}
</script>

<template>
  <ModalView v-model:open="store.openDetalhesModal" title="Detalhes da comanda"
    description="Acompanhe pendências, cobranças geradas e ações disponíveis para a comanda." size="5xl">
    <div v-if="store.loadingDetalhes" class="px-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Carregando comanda</EmptyTitle>
          <EmptyDescription>Buscando os dados mais recentes da comanda.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else-if="comanda" class="space-y-4 px-4">
      <div class="rounded-xl border border-border bg-background p-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-3 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-xl font-semibold text-foreground">
                {{ comanda.Cliente?.nome || comanda.clienteNome || 'Comanda sem identificacao' }}
              </div>
              <span class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                :class="getComandaStatusClass(comanda.status)">
                <component :is="getComandaStatusIcon(comanda.status)" class="h-3.5 w-3.5" />
                {{ getComandaStatusLabel(comanda.status) }}
              </span>
              <span v-if="comanda.ArenaReservas?.Quadra?.name"
                class="inline-flex items-center rounded-md bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                {{ comanda.ArenaReservas?.Quadra?.name }}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <div class="text-[11px] uppercase tracking-wide">Abertura</div>
                <div class="font-medium text-foreground">
                  {{ new Date(comanda.abertura).toLocaleDateString('pt-BR') }}
                </div>
              </div>
              <div>
                <div class="text-[11px] uppercase tracking-wide">Cliente vinculado</div>
                <div class="font-medium text-foreground">{{ comanda.Cliente?.nome || 'Não informado' }}</div>
              </div>
            </div>

            <div class="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {{ comanda.observacao || 'Sem observações registradas para esta comanda.' }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 lg:w-[360px]">
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Itens pendentes</div>
              <div class="text-lg font-semibold text-foreground">{{ resumo.itensAbertos }}</div>
            </div>
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Em aberto</div>
              <div class="text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo.valorItensAbertos) }}</div>
            </div>
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">A receber</div>
              <div class="text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo.valorPendente) }}</div>
            </div>
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Pago</div>
              <div class="text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo.valorPago) }}</div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" class="text-white" @click="store.openAddItem()">
            <PackageSearch class="w-4 h-4" />
            Adicionar item
          </Button>
          <Button type="button" variant="outline" :disabled="selectedItemIds.length === 0"
            @click="openCheckoutSelected">
            <ReceiptText class="w-4 h-4" />
            Cobrar selecionados
          </Button>
          <Button type="button" variant="outline" :disabled="pendingItems.length === 0" @click="openCheckoutAll">
            <CircleDollarSign class="w-4 h-4" />
            Cobrar todos
          </Button>
          <Button type="button" variant="outline" class="text-red-600" @click="deletarComanda(comanda.id as number)">
            <Trash2 class="w-4 h-4" />
            Excluir comanda
          </Button>
        </div>
      </div>

      <Tabs default-value="itens" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="itens">
            Itens pendentes ({{ pendingItems.length }})
          </TabsTrigger>
          <TabsTrigger value="historico">
            Histórico ({{ salesHistory.length }})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itens" class="mt-4">
          <div class="rounded-xl border border-border bg-background">
            <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="font-medium text-foreground">Itens aguardando cobrança</div>
                <div class="text-xs text-muted-foreground">
                  Selecione os itens que devem ser enviados para cobrança agora.
                </div>
              </div>
              <button v-if="pendingItems.length" type="button"
                class="inline-flex items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
                @click="toggleSelectAll">
                <span class="flex h-4 w-4 items-center justify-center rounded-sm border shadow-sm" :class="getSelectAllVisualState() === 'unchecked'
                  ? 'border-primary bg-background text-transparent'
                  : 'border-primary bg-primary text-primary-foreground'
                  ">
                  <Minus v-if="getSelectAllVisualState() === 'indeterminate'" class="h-3.5 w-3.5" />
                  <Check v-else-if="getSelectAllVisualState() === 'checked'" class="h-3.5 w-3.5" />
                </span>
                <span>Selecionar todos</span>
                <span class="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
                  {{ selectedItemIds.length }}
                </span>
              </button>
            </div>
            <Separator />

            <div v-if="pendingItems.length" class="divide-y divide-border">
              <div v-for="item in pendingItems" :key="item.id"
                class="flex cursor-pointer flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between"
                :class="isItemSelected(item.id) ? 'bg-primary/5' : 'hover:bg-muted/40'" role="checkbox" tabindex="0"
                :aria-checked="isItemSelected(item.id)" @click="toggleItemSelection(item.id)"
                @keydown.enter.prevent="toggleItemSelection(item.id)"
                @keydown.space.prevent="toggleItemSelection(item.id)">
                <div class="flex items-start gap-3 min-w-0">
                  <span
                    class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow-sm"
                    :class="isItemSelected(item.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-transparent'
                      ">
                    <Check class="h-3.5 w-3.5" />
                  </span>
                  <div class="min-w-0">
                    <div class="font-medium text-foreground break-words">{{ item.itemName }}</div>
                    <div class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span class="rounded-md px-2 py-0 text-[11px]"
                        :class="{ 'bg-success': item.tipo === 'PRODUTO', 'bg-warning': item.tipo === 'SERVICO' }">{{
                          item.tipo }}</span>
                      <span>{{ item.quantidade }} x {{ formatCurrencyBR(Number(item.valor || 0)) }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3 sm:justify-end">
                  <div class="text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(getItemTotal(item.valor, item.quantidade)) }}
                  </div>
                  <Button type="button" size="sm" variant="outline"
                    @click.stop="removeItem(item.id as number, item.itemName)">
                    <Trash2 class="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>

            <div v-else class="p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileClock />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum item pendente</EmptyTitle>
                  <EmptyDescription>A comanda não possui itens aguardando cobrança.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" class="mt-4">
          <div class="rounded-xl border border-border bg-background">
            <div class="px-4 py-3">
              <div class="font-medium text-foreground">Cobranças e vendas geradas</div>
              <div class="text-xs text-muted-foreground">
                Histórico do que já saiu da comanda e o status de cada cobrança.
              </div>
            </div>
            <Separator />

            <div v-if="salesHistory.length" class="space-y-2 p-3 sm:p-4">
              <div v-for="venda in salesHistory" :key="venda.id"
                class="overflow-hidden rounded-xl border border-border bg-card/60">
                <div class="flex flex-col gap-0">
                  <div
                    class="flex flex-col gap-3 border-b border-border/80 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                    <div class="min-w-0 space-y-2">
                      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div
                          class="truncate text-xs font-light text-foreground sm:text-xs rounded-md bg-muted px-2 py-1">
                          {{ venda.Uid || 'Venda sem identificacao' }}
                        </div>
                        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                          :class="getSaleStatusClass(venda.status)">
                          Venda: {{ getSaleStatusLabel(venda.status) }}
                        </span>
                        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                          :class="getChargeStatusClass(getChargeStatus(venda))">
                          Cobranca: {{ getChargeStatusLabel(getChargeStatus(venda)) }}
                        </span>
                      </div>

                      <div class="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
                        <span class="rounded-md bg-muted text-foreground px-2 py-1">
                          {{ new Date(venda.data).toLocaleDateString('pt-BR') }}
                        </span>
                        <span class="rounded-md bg-muted text-foreground px-2 py-1">
                          {{ getHistorySummary(venda) }}
                        </span>
                        <span v-if="hasBlockedExternalCharge(venda)"
                          class="rounded-md bg-orange-100 px-2 py-1 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                          Edicao bloqueada por cobranca externa
                        </span>
                      </div>
                    </div>

                    <div class="flex flex-col gap-2 lg:min-w-[280px] lg:items-end">
                      <div class="text-base font-semibold text-foreground sm:text-md">
                        {{ formatCurrencyBR(Number(venda.valor || 0)) }}
                      </div>
                      <div class="flex flex-wrap gap-1.5 lg:justify-end">
                        <Button v-if="venda.CobrancasFinanceiras?.[0]?.externalLink" type="button" variant="outline"
                          size="sm" @click="abrirLink(venda.CobrancasFinanceiras?.[0]?.externalLink)">
                          <ExternalLink class="w-4 h-4" />
                          Abrir
                        </Button>
                        <Button v-if="!venda.faturado" type="button" class="text-white" size="sm"
                          @click="openFaturarVenda(venda.id as number)">
                          <BadgeCheck class="w-4 h-4" />
                          Confirmar
                        </Button>
                        <Button v-if="!venda.faturado" type="button" variant="outline" size="sm" class="text-red-600"
                          @click="deleteSale(venda.id as number)">
                          <Trash2 class="w-4 h-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div v-if="getHistoryItems(venda).length" class="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                    <div v-for="item in getHistoryItems(venda)" :key="item.id"
                      class="rounded-lg border border-border bg-background px-3 py-2">
                      <div class="flex items-start justify-between gap-2.5">
                        <div class="min-w-0 space-y-1">
                          <div class="line-clamp-2 text-sm font-medium text-foreground">{{ item.itemName }}</div>
                          <div class="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                            <span class="rounded-md text-foreground text-[11px] px-2 py-0"
                              :class="{ 'bg-success': item.tipo === 'PRODUTO', 'bg-warning': item.tipo === 'SERVICO' }">{{
                                item.tipo }}
                            </span>
                            <span class="rounded-md text-foreground text-[11px] px-2 py-0 bg-info">
                              {{ item.quantidade }} x {{ formatCurrencyBR(Number(item.valor || 0)) }}
                            </span>
                          </div>
                          <div class="text-sm text-foreground">
                            {{ formatCurrencyBR(getItemTotal(item.valor, item.quantidade)) }}
                          </div>
                        </div>
                        <div class="flex shrink-0 items-start">
                          <Button v-if="canEditSaleItems(venda)" type="button" size="sm" variant="outline"
                            @click="removeItem(item.id as number, item.itemName)">
                            <Trash2 class="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else
                    class="mx-3 mb-3 rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground sm:mx-4 sm:mb-4">
                    Nenhum item vinculado foi encontrado para esta venda.
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ReceiptText />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma cobrança gerada</EmptyTitle>
                  <EmptyDescription>Os itens da comanda ainda não foram enviados para venda/cobrança.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </ModalView>
</template>
