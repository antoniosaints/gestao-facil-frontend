<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Eye, FileBarChart2, Funnel, RefreshCw, X } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/tabela/DataTable.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import FiscalDocumentDetails from './FiscalDocumentDetails.vue'
import { statuses, statusLabels, typeLabels, statusClass, formatFiscalDate as formatDate } from './fiscalPresentation'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrencyBR } from '@/utils/formatters'
import { hasPermission } from '@/hooks/authorize'
import { useUiStore } from '@/stores/ui/uiStore'
import { NotasFiscaisRepository, type FiscalDocument } from '@/repositories/notas-fiscais-repository'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const filters = reactive({ tipo: 'TODOS', status: 'TODOS', ambiente: 'TODOS', inicio: '', fim: '' })
const draft = reactive({ ...filters })
const draftPeriod = ref<Date[] | null>(null)
const tableVersion = ref(0)
const filterOpen = ref(false)
const detailOpen = ref(false)
const detailId = ref<number | null>(null)
const busyId = ref<number | null>(null)
const invalidPeriod = computed(() => Boolean(draftPeriod.value?.length === 2 && draftPeriod.value[0] > draftPeriod.value[1]))
const activeFilters = computed(() => [
  filters.tipo !== 'TODOS' ? { key: 'tipo', label: typeLabels[filters.tipo] || filters.tipo } : null,
  filters.status !== 'TODOS' ? { key: 'status', label: statusLabels[filters.status] || filters.status } : null,
  filters.ambiente !== 'TODOS' ? { key: 'ambiente', label: filters.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação' } : null,
  filters.inicio ? { key: 'inicio', label: `Desde ${new Date(`${filters.inicio}T12:00:00`).toLocaleDateString('pt-BR')}` } : null,
  filters.fim ? { key: 'fim', label: `Até ${new Date(`${filters.fim}T12:00:00`).toLocaleDateString('pt-BR')}` } : null,
].filter((item): item is { key: string; label: string } => Boolean(item)))

function canRetry(document: FiscalDocument) {
  return hasPermission(ui.usuarioLogged, 4) && ['NFE', 'NFCE'].includes(document.tipo) && ['PENDENTE', 'FALHA_REPROCESSAVEL'].includes(document.status)
}

function sortHeader(label: string, column: Column<FiscalDocument>) {
  return h(Button, { variant: 'ghost', size: 'sm', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') }, () => [label, h(ArrowUpDown, { class: 'ml-1 size-3.5' })])
}

watch(filterOpen, (open) => {
  if (!open) return
  Object.assign(draft, filters)
  draftPeriod.value = filters.inicio && filters.fim ? [new Date(`${filters.inicio}T12:00:00`), new Date(`${filters.fim}T12:00:00`)] : null
})

function applyFilters() {
  if (invalidPeriod.value) return
  draft.inicio = draftPeriod.value?.length === 2 ? format(draftPeriod.value[0], 'yyyy-MM-dd') : ''
  draft.fim = draftPeriod.value?.length === 2 ? format(draftPeriod.value[1], 'yyyy-MM-dd') : ''
  Object.assign(filters, draft)
  filterOpen.value = false
}

function clearFilters() {
  draftPeriod.value = null
  Object.assign(draft, { tipo: 'TODOS', status: 'TODOS', ambiente: 'TODOS', inicio: '', fim: '' })
  Object.assign(filters, draft)
  filterOpen.value = false
}

function removeFilter(key: string) {
  Object.assign(filters, { [key]: key === 'inicio' || key === 'fim' ? '' : 'TODOS' })
}

function refresh() {
  tableVersion.value += 1
}

function openDetailById(id: number) {
  detailId.value = id
  detailOpen.value = true
}

function openDetail(document: FiscalDocument) { void openDetailById(document.id) }
watch(() => route.query.nota, (value) => {
  const id = Number(value)
  if (value && Number.isSafeInteger(id) && id > 0) void openDetailById(id)
}, { immediate: true })
watch(detailOpen, (open) => {
  if (!open && route.query.nota) void router.replace({ query: { ...route.query, nota: undefined } })
})

async function retry(document: FiscalDocument) {
  if (!canRetry(document) || busyId.value) return
  busyId.value = document.id
  try {
    await NotasFiscaisRepository.retryDocument(document.id)
    toast.success('Nota reenfileirada. Acompanhe o novo status neste relatório.')
    refresh()
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível reenfileirar a nota.') }
  finally { busyId.value = null }
}

async function download(document: FiscalDocument, format: 'xml' | 'pdf') {
  if (busyId.value || !(format === 'xml' ? document.xmlDisponivel : document.pdfDisponivel)) return
  busyId.value = document.id
  try { await NotasFiscaisRepository.downloadDocument(document.id, format, `${document.tipo}-${document.serie || 1}-${document.numero || document.id}.${format}`) }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || `Não foi possível baixar o ${format.toUpperCase()}.`) }
  finally { busyId.value = null }
}

const columns: ColumnDef<FiscalDocument>[] = [
  { accessorKey: 'criadoEm', header: ({ column }) => sortHeader('Criada em', column), cell: ({ row }) => h('span', { class: 'whitespace-nowrap text-xs' }, formatDate(row.original.criadoEm)) },
  { accessorKey: 'tipo', header: ({ column }) => sortHeader('Tipo', column), cell: ({ row }) => h('span', { class: 'font-semibold' }, typeLabels[row.original.tipo] || row.original.tipo) },
  { accessorKey: 'numero', header: ({ column }) => sortHeader('Número', column), cell: ({ row }) => h('div', { class: 'min-w-28' }, [h('p', { class: 'font-medium' }, row.original.numero ? `${row.original.serie || 1}/${row.original.numero}` : row.original.rpsNumero ? `RPS ${row.original.rpsNumero}` : `#${row.original.id}`), h('p', { class: 'text-xs text-muted-foreground' }, row.original.vendaUid || (row.original.vendaId ? `Venda #${row.original.vendaId}` : 'Avulsa'))]) },
  { id: 'cliente', header: 'Cliente / tomador', cell: ({ row }) => h('div', { class: 'min-w-36' }, [h('p', { class: 'font-medium' }, row.original.cliente?.nome || 'Consumidor final'), h('p', { class: 'text-xs text-muted-foreground' }, row.original.cliente?.documento || 'Sem documento')]) },
  { accessorKey: 'status', header: ({ column }) => sortHeader('Status', column), cell: ({ row }) => h('div', { class: 'min-w-36 space-y-1' }, [h(Badge, { variant: 'outline', class: statusClass(row.original.status) }, () => statusLabels[row.original.status] || row.original.status), ...(row.original.erroMensagem ? [h('p', { class: 'max-w-52 truncate text-xs text-destructive', title: row.original.erroMensagem }, row.original.erroMensagem)] : [])]) },
  { accessorKey: 'valorTotal', header: ({ column }) => sortHeader('Valor', column), cell: ({ row }) => h('strong', { class: 'whitespace-nowrap' }, formatCurrencyBR(row.original.valorTotal)) },
  { id: 'ambiente', header: 'Ambiente', cell: ({ row }) => h('span', { class: 'text-xs' }, row.original.ambiente === 'HOMOLOGACAO' ? 'Homologação' : row.original.ambiente === 'PRODUCAO' ? 'Produção' : '—') },
  { id: 'acoes', header: 'Ações', enableSorting: false, enableHiding: false, cell: ({ row }) => h('div', { class: 'flex items-center gap-1' }, [
    h(Button, { size: 'sm', variant: 'outline', title: 'Ver detalhes', 'aria-label': `Ver detalhes da nota ${row.original.id}`, onClick: () => openDetail(row.original) }, () => h(Eye, { class: 'size-4' })),
    ...(canRetry(row.original) ? [h(Button, { size: 'sm', variant: 'outline', title: 'Tentar novamente', 'aria-label': `Tentar novamente a nota ${row.original.id}`, disabled: busyId.value === row.original.id, onClick: () => retry(row.original) }, () => h(RefreshCw, { class: 'size-4' }))] : []),
    ...(row.original.xmlDisponivel ? [h(Button, { size: 'sm', variant: 'outline', title: 'Baixar XML', 'aria-label': `Baixar XML da nota ${row.original.id}`, disabled: busyId.value === row.original.id, onClick: () => download(row.original, 'xml') }, () => 'XML')] : []),
    ...(row.original.pdfDisponivel ? [h(Button, { size: 'sm', variant: 'outline', title: 'Baixar PDF', 'aria-label': `Baixar PDF da nota ${row.original.id}`, disabled: busyId.value === row.original.id, onClick: () => download(row.original, 'pdf') }, () => 'PDF')] : []),
  ]) },
]
</script>

<template>
  <div class="space-y-4 pb-10">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div><h1 class="flex items-center gap-2 text-2xl font-bold text-foreground"><FileBarChart2 class="size-6 text-primary" />Relatório de notas fiscais</h1><p class="text-sm text-muted-foreground">Consulte as emissões, acompanhe pendências e baixe XML ou PDF.</p></div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" @click="filterOpen = true"><Funnel class="size-4" />Filtros <span v-if="activeFilters.length" class="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{{ activeFilters.length }}</span></Button>
        <Button variant="outline" size="sm" @click="refresh"><RefreshCw class="size-4" />Atualizar</Button>
      </div>
    </header>
    <div v-if="activeFilters.length" class="flex flex-wrap items-center gap-2 text-xs" aria-label="Filtros aplicados">
      <span class="text-muted-foreground">Filtros ativos:</span>
      <button v-for="filter in activeFilters" :key="filter.key" type="button" class="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-medium hover:bg-muted" :aria-label="`Remover filtro ${filter.label}`" @click="removeFilter(filter.key)">{{ filter.label }}<X class="size-3" /></button>
      <button type="button" class="text-primary underline-offset-2 hover:underline" @click="clearFilters">Limpar todos</button>
    </div>

    <DataTable :key="tableVersion" :columns="columns" api="/v1/notas-fiscais/documentos" :filters="filters" state-key="relatorio-notas-fiscais" empty-title="Nenhuma nota encontrada" empty-description="Ajuste os filtros ou emita uma nota para acompanhá-la aqui." />
  

    <ModalView v-model:open="filterOpen" title="Filtrar notas fiscais" description="Refine a listagem por tipo, status, ambiente e período de criação." size="lg" desktop-variant="sheet">
      <div class="space-y-4 px-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5"><Label>Tipo de nota</Label><Select v-model="draft.tipo"><SelectTrigger class="w-full"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="NFE">NF-e</SelectItem><SelectItem value="NFCE">NFC-e</SelectItem><SelectItem value="NFSE">NFS-e</SelectItem></SelectContent></Select></div>
        <div class="space-y-1.5"><Label>Status</Label><Select v-model="draft.status"><SelectTrigger class="w-full"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem v-for="[value, label] in statuses" :key="value" :value="value">{{ label }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-1.5"><Label>Ambiente</Label><Select v-model="draft.ambiente"><SelectTrigger class="w-full"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="HOMOLOGACAO">Homologação</SelectItem><SelectItem value="PRODUCAO">Produção</SelectItem></SelectContent></Select></div>
        <div class="space-y-1.5 sm:col-span-2"><Label>Período de criação</Label><Calendarpicker v-model="draftPeriod" class="w-full" placeholder="Selecione o período" :range="true" :teleport="true" /></div>
      </div>
      <p v-if="invalidPeriod" class="text-xs text-destructive" role="alert">A data final deve ser igual ou posterior à inicial.</p>
      <div class="flex flex-wrap justify-end gap-2"><Button variant="outline" @click="clearFilters">Limpar</Button><Button :disabled="invalidPeriod" @click="applyFilters"><Funnel class="size-4" />Filtrar</Button></div>
      </div>
    </ModalView>

    <FiscalDocumentDetails v-model:open="detailOpen" :document-id="detailId" @changed="refresh" />
  </div>
</template>
