<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Clock3,
  Columns3,
  Eye,
  Factory,
  Plus,
  RefreshCw,
  Search,
  TableProperties,
  Trash2,
  Wrench,
} from 'lucide-vue-next'
import DataTable from '@/components/tabela/DataTable.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OuriveRepository } from '@/repositories/ourive-repository'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { useConfirm } from '@/composables/useConfirm'
import type { ClientesFornecedores } from '@/types/schemas'

const router = useRouter()
const toast = useToast()
const ui = useUiStore()
const clientesStore = useClientesStore()
const open = ref(false)
const saving = ref(false)
const ordersLoading = ref(false)
const ordersSearch = ref('')
const orders = ref<any[]>([])
const predefinicoes = ref<{
  pecas: Array<{ id: number; nome: string }>
  metais: Array<{ id: number; nome: string }>
}>({ pecas: [], metais: [] })
const tableUpdate = ref(0)
const canReceive = ui.hasOuriveCapability('RECEBER')
type TipoNovaOrdem = 'CONSERTO' | 'ENCOMENDA'
type OuriveOrderStatus =
  | 'RECEBIDA'
  | 'ORCAMENTO'
  | 'AGUARDANDO_MATERIAL'
  | 'PRONTA_PRODUCAO'
  | 'PRODUCAO'
  | 'FINALIZADA'
  | 'REVISAO'
  | 'PRONTA_ENTREGA'
  | 'ENTREGUE'
  | 'RECUSADA'
  | 'CANCELADA'
type VisualizacaoOrdens = 'lista' | 'kanban'
const newOrderStep = ref<'tipo' | 'formulario'>('tipo')
const selectedOrderType = ref<TipoNovaOrdem | null>(null)

const statusLabels: Record<OuriveOrderStatus, string> = {
  RECEBIDA: 'Recebida',
  ORCAMENTO: 'Orçamento',
  AGUARDANDO_MATERIAL: 'Aguardando material',
  PRONTA_PRODUCAO: 'Pronta para produção',
  PRODUCAO: 'Em produção',
  FINALIZADA: 'Finalizada',
  REVISAO: 'Revisão',
  PRONTA_ENTREGA: 'Pronta para entrega',
  ENTREGUE: 'Entregue',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
}
const kanbanStatuses = Object.keys(statusLabels) as OuriveOrderStatus[]
const visualizacaoStorageKey = 'gestao_facil:ourive:ordens-visualizacao'
const visualizacao = ref<VisualizacaoOrdens>(visualizacaoSalva())

function visualizacaoSalva(): VisualizacaoOrdens {
  try {
    return localStorage.getItem(visualizacaoStorageKey) === 'kanban' ? 'kanban' : 'lista'
  } catch {
    return 'lista'
  }
}

function alterarVisualizacao(value: VisualizacaoOrdens) {
  visualizacao.value = value
  localStorage.setItem(visualizacaoStorageKey, value)
}

function openNewOrder() {
  resetDraft()
  selectedOrderType.value = null
  newOrderStep.value = 'tipo'
  open.value = true
}

function selectOrderType(type: TipoNovaOrdem) {
  selectedOrderType.value = type
  newOrderStep.value = 'formulario'
}

function openQuickClientCreate() {
  clientesStore.openSave((client: ClientesFornecedores) => {
    if (client?.id != null) draft.value.clienteId = Number(client.id)
  })
}

function updateNewOrderModal(isOpen: boolean) {
  open.value = isOpen
  if (!isOpen) {
    selectedOrderType.value = null
    newOrderStep.value = 'tipo'
  }
}

const label = (status: string) => statusLabels[status as OuriveOrderStatus] || status
const statusBadgeClasses: Record<OuriveOrderStatus, string> = {
  RECEBIDA:
    'border-slate-500/35 bg-slate-500/10 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-300',
  ORCAMENTO:
    'border-blue-500/35 bg-blue-500/10 text-blue-800 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300',
  AGUARDANDO_MATERIAL:
    'border-orange-500/35 bg-orange-500/10 text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/15 dark:text-orange-300',
  PRONTA_PRODUCAO:
    'border-cyan-500/35 bg-cyan-500/10 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300',
  PRODUCAO:
    'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300',
  FINALIZADA:
    'border-indigo-500/35 bg-indigo-500/10 text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-400/15 dark:text-indigo-300',
  REVISAO:
    'border-violet-500/35 bg-violet-500/10 text-violet-800 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-300',
  PRONTA_ENTREGA:
    'border-teal-500/35 bg-teal-500/10 text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300',
  ENTREGUE:
    'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300',
  RECUSADA:
    'border-orange-500/35 bg-orange-500/10 text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/15 dark:text-orange-300',
  CANCELADA:
    'border-red-500/35 bg-red-500/10 text-red-800 dark:border-red-400/30 dark:bg-red-400/15 dark:text-red-300',
}
const statusColumnClasses: Record<OuriveOrderStatus, string> = {
  RECEBIDA: 'border-t-slate-500 bg-slate-500/[0.035] dark:bg-slate-400/[0.06]',
  ORCAMENTO: 'border-t-blue-500 bg-blue-500/[0.035] dark:bg-blue-400/[0.06]',
  AGUARDANDO_MATERIAL: 'border-t-orange-500 bg-orange-500/[0.04] dark:bg-orange-400/[0.07]',
  PRONTA_PRODUCAO: 'border-t-cyan-500 bg-cyan-500/[0.04] dark:bg-cyan-400/[0.07]',
  PRODUCAO: 'border-t-amber-500 bg-amber-500/[0.04] dark:bg-amber-400/[0.07]',
  FINALIZADA: 'border-t-indigo-500 bg-indigo-500/[0.04] dark:bg-indigo-400/[0.07]',
  REVISAO: 'border-t-violet-500 bg-violet-500/[0.035] dark:bg-violet-400/[0.06]',
  PRONTA_ENTREGA: 'border-t-teal-500 bg-teal-500/[0.04] dark:bg-teal-400/[0.07]',
  ENTREGUE: 'border-t-emerald-500 bg-emerald-500/[0.035] dark:bg-emerald-400/[0.06]',
  RECUSADA: 'border-t-orange-500 bg-orange-500/[0.035] dark:bg-orange-400/[0.06]',
  CANCELADA: 'border-t-red-500 bg-red-500/[0.035] dark:bg-red-400/[0.06]',
}
const statusBadgeClass = (status: string) => statusBadgeClasses[status as OuriveOrderStatus] || ''
const statusColumnClass = (status: OuriveOrderStatus) => statusColumnClasses[status]
const draggedOrder = ref<any>()
const canMoveKanban = ui.hasOuriveCapability('KANBAN')
function startDrag(order: any) {
  if (canMoveKanban) draggedOrder.value = order
}
async function dropOnStatus(status: OuriveOrderStatus) {
  const order = draggedOrder.value
  draggedOrder.value = undefined
  if (!order || order.status === status) return
  try {
    await OuriveRepository.atualizarStatus(order.id, { status })
    order.status = status
    order.updatedAt = new Date().toISOString()
    toast.success(`OS movida para ${statusLabels[status]}.`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível mover a OS.')
  }
}
const emptyPiece = () => ({
  descricao: '',
  metal: '',
  pedras: '',
  pesoInformado: undefined as number | undefined,
  estadoConservacao: '',
  checklist: '',
})
const draft = ref({
  clienteId: undefined as number | undefined,
  descricao: '',
  garantia: 'Sem garantia informada',
  observacoes: '',
  prazoPrevisto: null as Date | null,
  valorMaoObra: undefined as number | undefined,
  pecas: [emptyPiece()],
})
function resetDraft() {
  draft.value = {
    clienteId: undefined,
    descricao: '',
    garantia: 'Sem garantia informada',
    observacoes: '',
    prazoPrevisto: null,
    valorMaoObra: undefined,
    pecas: [emptyPiece()],
  }
}
async function loadPredefinicoes() {
  try {
    const data = await OuriveRepository.predefinicoes()
    predefinicoes.value = { pecas: data.pecas, metais: data.metais }
  } catch {
    // O preenchimento manual segue disponível se o catálogo estiver indisponível.
  }
}
async function savePreset(tipo: 'PECA' | 'METAL', nome: string) {
  const value = nome.trim()
  if (value.length < 2) return toast.info('Digite um nome antes de salvar a predefinição.')
  try {
    await OuriveRepository.salvarPredefinicao(tipo, value)
    await loadPredefinicoes()
    toast.success('Predefinição salva.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a predefinição.')
  }
}

async function removeOrder(order: any) {
  const confirmed = await useConfirm().confirm({
    title: 'Apagar ordem de serviço',
    message: `A ordem ${order.codigoRastreio} será apagada definitivamente. Ordens com faturamento ou estoque movimentado não podem ser apagadas.`,
    confirmText: 'Apagar ordem',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    await OuriveRepository.excluirOrdem(order.id)
    tableUpdate.value++
    orders.value = orders.value.filter((item) => item.id !== order.id)
    toast.success('Ordem apagada com sucesso.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível apagar a ordem.')
  }
}

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'codigoRastreio',
    header: 'Código',
    cell: ({ row }) =>
      h('span', { class: 'font-semibold whitespace-nowrap' }, row.original.codigoRastreio),
  },
  {
    id: 'cliente',
    header: 'Cliente',
    cell: ({ row }) =>
      h('div', { class: 'min-w-[190px]' }, [
        h(
          'p',
          { class: 'font-medium' },
          row.original.ordemServico?.Cliente?.nome || 'Cliente não informado',
        ),
        h(
          'p',
          { class: 'max-w-[280px] truncate text-xs text-muted-foreground' },
          row.original.ordemServico?.descricao || 'Sem solicitação',
        ),
      ]),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { variant: row.original.status === 'ENTREGUE' ? 'default' : 'secondary' }, () =>
        label(row.original.status),
      ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Atualizada em',
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString('pt-BR'),
  },
  {
    id: 'acoes',
    header: 'Ações',
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end gap-2' }, [
        h(
          Button,
          {
            variant: 'outline',
            size: 'sm',
            onClick: () => router.push({ name: 'ourive-ordem', params: { id: row.original.id } }),
          },
          () => [h(Eye, { class: 'mr-1 h-4 w-4' }), 'Abrir'],
        ),
        ui.hasOuriveCapability('CONFIGURAR') && !row.original.faturadaEm
          ? h(
              Button,
              {
                variant: 'outline',
                size: 'icon',
                class:
                  'border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground',
                ariaLabel: 'Apagar ordem',
                onClick: () => removeOrder(row.original),
              },
              () => h(Trash2, { class: 'h-4 w-4' }),
            )
          : null,
      ]),
  },
]
const filteredOrders = computed(() => {
  const term = ordersSearch.value.trim().toLocaleLowerCase('pt-BR')
  return term
    ? orders.value.filter((order) =>
        `${order.codigoRastreio} ${order.ordemServico?.Cliente?.nome || ''} ${order.ordemServico?.descricao || ''}`
          .toLocaleLowerCase('pt-BR')
          .includes(term),
      )
    : orders.value
})
async function loadOrders() {
  ordersLoading.value = true
  try {
    const response = await OuriveRepository.ordens()
    orders.value = response.items
  } catch {
    toast.error('Não foi possível carregar as ordens.')
  } finally {
    ordersLoading.value = false
  }
}
function addPiece() {
  draft.value.pecas.push(emptyPiece())
}
async function save() {
  if (
    draft.value.descricao.trim().length < 3 ||
    draft.value.pecas.some((piece) => piece.descricao.trim().length < 2)
  )
    return toast.info('Informe a solicitação e a descrição de cada item.')
  saving.value = true
  try {
    const created = await OuriveRepository.criarOrdem({
      ...draft.value,
      tipo: selectedOrderType.value || 'CONSERTO',
      prazoPrevisto: draft.value.prazoPrevisto || undefined,
      pecas: draft.value.pecas.map((piece) => ({
        ...piece,
        checklistRecebimento: piece.checklist
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      })),
    })
    toast.success(
      selectedOrderType.value === 'ENCOMENDA' ? 'Encomenda registrada.' : 'Recebimento registrado.',
    )
    await router.push({ name: 'ourive-ordem', params: { id: created.id } })
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar a ordem.')
  } finally {
    saving.value = false
  }
}
onMounted(() => {
  void loadOrders()
  void loadPredefinicoes()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold">
          <ClipboardList class="h-6 w-6 text-primary" />Ordens de serviço
        </h2>
        <p class="text-sm text-muted-foreground">
          Acompanhe a custódia, o orçamento e a produção em uma só visão.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div
          class="hidden rounded-lg border bg-card p-1 md:flex"
          aria-label="Visualização das ordens"
        >
          <Button
            size="icon"
            variant="ghost"
            class="h-7 w-7"
            :class="visualizacao === 'lista' ? 'bg-muted' : ''"
            aria-label="Visualizar em lista"
            @click="alterarVisualizacao('lista')"
            ><TableProperties class="h-4 w-4"
          /></Button>
          <Button
            size="icon"
            variant="ghost"
            class="h-7 w-7"
            :class="visualizacao === 'kanban' ? 'bg-muted' : ''"
            aria-label="Visualizar em kanban"
            @click="alterarVisualizacao('kanban')"
            ><Columns3 class="h-4 w-4"
          /></Button>
        </div>
        <Button
          v-if="visualizacao === 'kanban'"
          variant="outline"
          size="icon"
          class="hidden h-9 w-9 md:inline-flex"
          :disabled="ordersLoading"
          aria-label="Atualizar ordens"
          @click="loadOrders()"
          ><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': ordersLoading }"
        /></Button>
        <Button v-if="canReceive" @click="openNewOrder"
          ><Plus class="mr-2 h-4 w-4" />Nova ordem</Button
        >
      </div>
    </div>

    <div v-if="visualizacao === 'lista'" class="hidden md:block">
      <DataTable
        :key="tableUpdate"
        :columns="columns"
        api="/v1/ourive/ordens"
        :filters="{ update: tableUpdate }"
      />
    </div>

    <div v-else class="hidden space-y-4 md:block">
      <div class="relative max-w-xl">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="ordersSearch" class="pl-9" placeholder="Buscar ordem, cliente ou serviço" />
      </div>
      <div
        v-if="ordersLoading && !orders.length"
        class="py-12 text-center text-sm text-muted-foreground"
      >
        Carregando ordens…
      </div>
      <div v-else class="flex gap-4 overflow-x-auto pb-2">
        <section
          v-for="status in kanbanStatuses"
          :key="status"
          class="flex min-h-[30rem] w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-t-4 shadow-sm"
          :class="statusColumnClass(status)"
          @dragover.prevent
          @drop="dropOnStatus(status)"
        >
          <header
            class="flex items-center justify-between border-b border-border/70 bg-card/80 px-3.5 py-3 backdrop-blur-sm"
          >
            <span class="font-semibold">{{ statusLabels[status] }}</span>
            <div class="flex items-center gap-1.5">
              <Badge variant="outline" :class="statusBadgeClass(status)">{{
                filteredOrders.filter((order) => order.status === status).length
              }}</Badge>
              <Button
                v-if="canReceive && status === 'RECEBIDA'"
                size="icon"
                variant="ghost"
                class="h-7 w-7"
                aria-label="Adicionar nova ordem recebida"
                title="Nova ordem recebida"
                @click="openNewOrder"
                ><Plus class="h-4 w-4"
              /></Button>
            </div>
          </header>
          <div class="min-h-40 flex-1 space-y-2 p-2.5">
            <p
              v-if="status === 'RECEBIDA' && !filteredOrders.length"
              class="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground"
            >
              Nenhuma ordem encontrada.
            </p>
            <Card
              v-for="order in filteredOrders.filter((item) => item.status === status)"
              :key="order.id"
              role="button"
              :draggable="canMoveKanban"
              tabindex="0"
              class="cursor-pointer rounded-xl border-border/80 bg-card/95 shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @click="router.push({ name: 'ourive-ordem', params: { id: order.id } })"
              @dragstart="startDrag(order)"
              @keydown.enter="router.push({ name: 'ourive-ordem', params: { id: order.id } })"
              @keydown.space.prevent="
                router.push({ name: 'ourive-ordem', params: { id: order.id } })
              "
            >
              <CardContent class="space-y-2 p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate font-semibold">{{ order.codigoRastreio }}</p>
                    <p class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 class="h-3.5 w-3.5" />{{
                        new Date(order.updatedAt).toLocaleDateString('pt-BR')
                      }}
                    </p>
                  </div>
                  <Badge variant="outline" :class="statusBadgeClass(order.status)">{{
                    label(order.status)
                  }}</Badge>
                </div>
                <div class="border-t pt-2 text-sm">
                  <p class="truncate font-medium">
                    {{ order.ordemServico?.Cliente?.nome || 'Cliente não informado' }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-muted-foreground">
                    {{ order.ordemServico?.descricao || 'Sem solicitação' }}
                  </p>
                </div>
                <div class="flex items-center gap-1 text-xs font-medium text-primary">
                  <Eye class="h-3.5 w-3.5" /> Abrir ordem
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>

    <div class="space-y-3 md:hidden">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        /><Input
          v-model="ordersSearch"
          class="pl-9"
          placeholder="Buscar ordem, cliente ou serviço"
        />
      </div>
      <div v-if="ordersLoading" class="py-12 text-center text-sm text-muted-foreground">
        Carregando ordens…
      </div>
      <template v-else-if="filteredOrders.length"
        ><button
          v-for="order in filteredOrders"
          :key="order.id"
          class="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition active:scale-[.99]"
          @click="router.push({ name: 'ourive-ordem', params: { id: order.id } })"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold">{{ order.codigoRastreio }}</p>
              <p class="mt-1 truncate text-sm text-muted-foreground">
                {{ order.ordemServico?.Cliente?.nome || 'Cliente não informado' }}
              </p>
            </div>
            <Badge :variant="order.status === 'ENTREGUE' ? 'default' : 'secondary'">{{
              label(order.status)
            }}</Badge>
          </div>
          <p class="mt-3 line-clamp-2 text-sm">
            {{ order.ordemServico?.descricao || 'Sem solicitação' }}
          </p>
          <div class="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
            <Eye class="h-3.5 w-3.5" /> Ver detalhes
          </div>
        </button></template
      >
      <Empty v-else
        ><EmptyHeader
          ><EmptyMedia variant="icon"><ClipboardList /></EmptyMedia
          ><EmptyTitle>Nenhuma ordem encontrada</EmptyTitle
          ><EmptyDescription>As ordens recebidas aparecerão aqui.</EmptyDescription></EmptyHeader
        ></Empty
      >
    </div>
    <Dialog :open="open" @update:open="updateNewOrderModal">
      <DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto">
        <template v-if="newOrderStep === 'tipo'">
          <DialogHeader class="text-center sm:text-left">
            <DialogTitle>Qual tipo de ordem deseja criar?</DialogTitle>
            <DialogDescription>
              Escolha o fluxo para iniciar o cadastro com as informações adequadas.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-3 sm:grid-cols-2">
            <button
              type="button"
              class="group rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              @click="selectOrderType('ENCOMENDA')"
            >
              <div class="mb-5 flex items-start justify-between">
                <div class="rounded-xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
                  <Factory class="h-7 w-7" />
                </div>
                <ArrowRight
                  class="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-amber-500"
                />
              </div>
              <p class="text-lg font-semibold">Encomenda</p>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">
                Produção de uma peça nova, com etapas e especificações próprias.
              </p>
              <span class="mt-5 inline-flex text-sm font-medium text-amber-600 dark:text-amber-400"
                >Iniciar encomenda</span
              >
            </button>
            <button
              type="button"
              class="group rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              @click="selectOrderType('CONSERTO')"
            >
              <div class="mb-5 flex items-start justify-between">
                <div class="rounded-xl bg-sky-500/15 p-3 text-sky-600 dark:text-sky-400">
                  <Wrench class="h-7 w-7" />
                </div>
                <ArrowRight
                  class="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-500"
                />
              </div>
              <p class="text-lg font-semibold">Serviço</p>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">
                Conserto, ajuste ou restauração de uma peça recebida do cliente.
              </p>
              <span class="mt-5 inline-flex text-sm font-medium text-sky-600 dark:text-sky-400"
                >Iniciar serviço</span
              >
            </button>
          </div>
        </template>

        <template v-else>
          <div class="flex items-start gap-2">
            <Button
              variant="ghost"
              size="icon"
              class="mt-0.5 h-8 w-8 shrink-0"
              aria-label="Voltar para tipos de ordem"
              @click="newOrderStep = 'tipo'"
            >
              <ArrowLeft class="h-4 w-4" />
            </Button>
            <DialogHeader>
              <DialogTitle>{{
                selectedOrderType === 'ENCOMENDA' ? 'Nova encomenda' : 'Receber peças para conserto'
              }}</DialogTitle>
              <DialogDescription>
                Uma OS pode agrupar várias peças e o cliente é opcional no cadastro.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div class="grid gap-4 py-2">
            <div class="grid gap-1 text-sm font-medium">
              <div class="flex items-center justify-between gap-2">
                <span>Cliente <span class="text-muted-foreground">(opcional)</span></span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  class="h-auto px-0 text-primary"
                  @click="openQuickClientCreate"
                >
                  <Plus class="mr-1 h-3.5 w-3.5" />Novo cliente
                </Button>
              </div>
              <Select2Ajax
                v-model="draft.clienteId"
                url="/clientes/select2"
                :allow-clear="true"
                placeholder="Busque o cliente ou deixe em branco"
              />
            </div>
            <template v-if="selectedOrderType === 'ENCOMENDA'">
              <div class="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-sm">
                <p class="font-medium text-amber-700 dark:text-amber-300">Detalhes da produção</p>
                <p class="mt-1 text-muted-foreground">
                  Registre o projeto e os itens a produzir. Materiais e etapas serão definidos na
                  ordem após o cadastro.
                </p>
              </div>
              <label class="grid gap-1 text-sm font-medium"
                >Descrição da encomenda<textarea
                  v-model="draft.descricao"
                  class="min-h-20 rounded-md border bg-background p-3"
                  placeholder="Ex.: Aliança personalizada em ouro 18k"
                />
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-medium"
                  >Prazo previsto<Calendarpicker v-model="draft.prazoPrevisto" :teleport="true" />
                </label>
                <label class="grid gap-1 text-sm font-medium"
                  >Garantia<Input v-model="draft.garantia" placeholder="Ex.: 90 dias"
                /></label>
              </div>
              <label class="grid gap-1 text-sm font-medium"
                >Especificações do projeto<textarea
                  v-model="draft.observacoes"
                  class="min-h-24 rounded-md border bg-background p-3"
                  placeholder="Medidas, acabamento, referências, gravações e demais orientações"
                />
              </label>
              <div
                v-for="(piece, index) in draft.pecas"
                :key="index"
                class="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4"
              >
                <div class="flex items-center justify-between">
                  <p class="font-semibold">Item da encomenda {{ index + 1 }}</p>
                  <Button
                    v-if="draft.pecas.length > 1"
                    size="sm"
                    variant="ghost"
                    @click="draft.pecas.splice(index, 1)"
                    ><Trash2 class="h-4 w-4"
                  /></Button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="flex gap-2">
                    <Input v-model="piece.descricao" list="ourive-piece-presets" placeholder="Peça a produzir" />
                    <Button type="button" size="icon" variant="outline" title="Salvar tipo de peça" @click="savePreset('PECA', piece.descricao)"><Plus class="h-4 w-4" /></Button>
                  </div>
                  <div class="flex gap-2">
                    <Input v-model="piece.metal" list="ourive-metal-presets" placeholder="Metal desejado (ex.: ouro 18k)" />
                    <Button type="button" size="icon" variant="outline" title="Salvar metal" @click="savePreset('METAL', piece.metal)"><Plus class="h-4 w-4" /></Button>
                  </div>
                  <Input v-model="piece.pedras" placeholder="Pedras e detalhes" />
                  <Input
                    v-model.number="piece.pesoInformado"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Peso estimado (g)"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" class="w-fit" @click="addPiece"
                ><Plus class="mr-2 h-4 w-4" />Adicionar item</Button
              >
            </template>

            <template v-else>
              <div class="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 text-sm">
                <p class="font-medium text-sky-700 dark:text-sky-300">Recebimento sob custódia</p>
                <p class="mt-1 text-muted-foreground">
                  Descreva a peça como foi recebida para manter o registro de custódia completo.
                </p>
              </div>
              <label class="grid gap-1 text-sm font-medium"
                >Solicitação do cliente<textarea
                  v-model="draft.descricao"
                  class="min-h-20 rounded-md border bg-background p-3"
                  placeholder="Descreva o conserto, ajuste ou restauração solicitada"
                />
              </label>
              <label class="grid gap-1 text-sm font-medium"
                >Garantia<Input v-model="draft.garantia" placeholder="Ex.: 90 dias"
              /></label>
              <label class="grid gap-1 text-sm font-medium"
                >Valor da mão de obra
                <Input
                  v-model.number="draft.valorMaoObra"
                  :icon-label="'R$'"
                  icon-label-position="left"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                />
                <span class="text-xs font-normal text-muted-foreground">O valor ficará preenchido no orçamento e no financeiro da OS.</span>
              </label>
              <div
                v-for="(piece, index) in draft.pecas"
                :key="index"
                class="space-y-3 rounded-xl border bg-muted/20 p-4"
              >
                <div class="flex items-center justify-between">
                  <p class="font-semibold">Peça recebida {{ index + 1 }}</p>
                  <Button
                    v-if="draft.pecas.length > 1"
                    size="sm"
                    variant="ghost"
                    @click="draft.pecas.splice(index, 1)"
                    ><Trash2 class="h-4 w-4"
                  /></Button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="flex gap-2">
                    <Input v-model="piece.descricao" list="ourive-piece-presets" placeholder="Descrição da peça" />
                    <Button type="button" size="icon" variant="outline" title="Salvar tipo de peça" @click="savePreset('PECA', piece.descricao)"><Plus class="h-4 w-4" /></Button>
                  </div>
                  <div class="flex gap-2">
                    <Input v-model="piece.metal" list="ourive-metal-presets" placeholder="Metal (ex.: ouro 18k)" />
                    <Button type="button" size="icon" variant="outline" title="Salvar metal" @click="savePreset('METAL', piece.metal)"><Plus class="h-4 w-4" /></Button>
                  </div>
                  <Input v-model="piece.pedras" placeholder="Pedras" />
                  <Input
                    v-model.number="piece.pesoInformado"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Peso recebido (g)"
                  />
                </div>
                <textarea
                  v-model="piece.estadoConservacao"
                  class="min-h-16 w-full rounded-md border bg-background p-3 text-sm"
                  placeholder="Estado de conservação ao receber"
                />
                <textarea
                  v-model="piece.checklist"
                  class="min-h-16 w-full rounded-md border bg-background p-3 text-sm"
                  placeholder="Checklist de recebimento (um item por linha)"
                />
              </div>
              <Button type="button" variant="outline" class="w-fit" @click="addPiece"
                ><Plus class="mr-2 h-4 w-4" />Adicionar peça</Button
              >
            </template>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="updateNewOrderModal(false)">Cancelar</Button>
            <Button :disabled="saving" @click="save">
              {{ selectedOrderType === 'ENCOMENDA' ? 'Criar encomenda' : 'Registrar recebimento' }}
            </Button>
          </DialogFooter>
        </template>
      </DialogContent>
    </Dialog>
    <ClientesModal />
    <datalist id="ourive-piece-presets"><option v-for="piece in predefinicoes.pecas" :key="piece.id" :value="piece.nome" /></datalist>
    <datalist id="ourive-metal-presets"><option v-for="metal in predefinicoes.metais" :key="metal.id" :value="metal.nome" /></datalist>
  </section>
</template>
