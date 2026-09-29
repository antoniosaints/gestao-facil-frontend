<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Download, Eye, FileBarChart2, Funnel, LoaderCircle, RefreshCw, X } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useRoute, useRouter } from 'vue-router'
import DataTable from '@/components/tabela/DataTable.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
const detailLoading = ref(false)
const detail = ref<FiscalDocument | null>(null)
const detailError = ref('')
const busyId = ref<number | null>(null)
const invalidPeriod = computed(() => Boolean(draftPeriod.value?.length === 2 && draftPeriod.value[0] > draftPeriod.value[1]))
const activeFilters = computed(() => [
  filters.tipo !== 'TODOS' ? { key: 'tipo', label: typeLabels[filters.tipo] || filters.tipo } : null,
  filters.status !== 'TODOS' ? { key: 'status', label: statusLabels[filters.status] || filters.status } : null,
  filters.ambiente !== 'TODOS' ? { key: 'ambiente', label: filters.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação' } : null,
  filters.inicio ? { key: 'inicio', label: `Desde ${new Date(`${filters.inicio}T12:00:00`).toLocaleDateString('pt-BR')}` } : null,
  filters.fim ? { key: 'fim', label: `Até ${new Date(`${filters.fim}T12:00:00`).toLocaleDateString('pt-BR')}` } : null,
].filter((item): item is { key: string; label: string } => Boolean(item)))

const statuses = [
  ['PENDENTE', 'Pendente'], ['PRONTA_PARA_EMISSAO', 'Pronta para emissão'], ['EMITINDO', 'Emitindo'],
  ['EM_PROCESSAMENTO', 'Em processamento'], ['AUTORIZADA', 'Autorizada'], ['HOMOLOGADA', 'Homologada'],
  ['FALHA_REPROCESSAVEL', 'Falha reprocessável'], ['REJEITADA', 'Rejeitada'],
  ['RESULTADO_INCERTO', 'Resultado incerto'], ['EMISSAO_INCERTA', 'Emissão incerta'], ['CANCELADA', 'Cancelada'],
] as const
const statusLabels = Object.fromEntries(statuses) as Record<string, string>
const typeLabels: Record<string, string> = { NFE: 'NF-e', NFCE: 'NFC-e', NFSE: 'NFS-e' }

function statusClass(status: string) {
  if (['AUTORIZADA', 'HOMOLOGADA'].includes(status)) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (['REJEITADA', 'FALHA_REPROCESSAVEL'].includes(status)) return 'border-destructive/40 bg-destructive/10 text-destructive'
  if (status === 'CANCELADA') return 'border-muted-foreground/40 bg-muted text-muted-foreground'
  if (['RESULTADO_INCERTO', 'EMISSAO_INCERTA'].includes(status)) return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR')
}

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

async function openDetailById(id: number) {
  detailOpen.value = true
  detail.value = null
  detailError.value = ''
  detailLoading.value = true
  try { detail.value = await NotasFiscaisRepository.getDocument(id) }
  catch (error: any) { detailError.value = error?.response?.data?.error?.message || 'Não foi possível carregar os detalhes da nota.' }
  finally { detailLoading.value = false }
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
    if (detailOpen.value && detail.value?.id === document.id) {
      try { detail.value = await NotasFiscaisRepository.getDocument(document.id) }
      catch { detailError.value = 'A nota foi reenfileirada, mas não foi possível atualizar os detalhes. Abra a nota novamente.' }
    }
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

    <div class="rounded-lg border bg-card p-3 sm:p-4">
      <DataTable :key="tableVersion" :columns="columns" api="/v1/notas-fiscais/documentos" :filters="filters" state-key="relatorio-notas-fiscais" empty-title="Nenhuma nota encontrada" empty-description="Ajuste os filtros ou emita uma nota para acompanhá-la aqui." />
    </div>

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

    <Dialog v-model:open="detailOpen"><DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Detalhes da nota fiscal</DialogTitle><DialogDescription>Dados do processamento e arquivos disponíveis.</DialogDescription></DialogHeader>
      <div v-if="detailLoading" class="flex min-h-36 items-center justify-center text-muted-foreground"><LoaderCircle class="mr-2 size-4 animate-spin" />Carregando nota...</div>
      <p v-else-if="detailError" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{{ detailError }}</p>
      <div v-else-if="detail" class="space-y-4 text-sm">
        <div class="flex flex-wrap items-center gap-2"><Badge variant="outline">{{ typeLabels[detail.tipo] || detail.tipo }}</Badge><Badge variant="outline" :class="statusClass(detail.status)">{{ statusLabels[detail.status] || detail.status }}</Badge><Badge variant="outline">{{ detail.ambiente === 'HOMOLOGACAO' ? 'Homologação' : 'Produção' }}</Badge></div>
        <div class="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"><p><span class="text-muted-foreground">Número:</span> {{ detail.numero ? `${detail.serie || 1}/${detail.numero}` : detail.rpsNumero ? `RPS ${detail.rpsNumero}` : 'Ainda não atribuído' }}</p><p><span class="text-muted-foreground">Valor:</span> {{ formatCurrencyBR(detail.valorTotal) }}</p><p><span class="text-muted-foreground">Cliente:</span> {{ detail.cliente?.nome || 'Consumidor final' }}</p><p><span class="text-muted-foreground">Venda:</span> {{ detail.vendaUid || (detail.vendaId ? `#${detail.vendaId}` : 'Nota avulsa') }}</p><p><span class="text-muted-foreground">Criada em:</span> {{ formatDate(detail.criadoEm) }}</p><p><span class="text-muted-foreground">Atualizada em:</span> {{ formatDate(detail.atualizadaEm) }}</p><p v-if="detail.emitidaEm"><span class="text-muted-foreground">Emitida em:</span> {{ formatDate(detail.emitidaEm) }}</p><p v-if="detail.canceladaEm"><span class="text-muted-foreground">Cancelada em:</span> {{ formatDate(detail.canceladaEm) }}</p></div>
        <div v-if="detail.erroMensagem" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"><strong>Ocorrência:</strong> {{ detail.erroMensagem }}</div>
        <p v-if="['RESULTADO_INCERTO', 'EMISSAO_INCERTA'].includes(detail.status)" class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">O resultado ainda não foi confirmado. Consulte o portal do provedor antes de iniciar outra emissão para evitar duplicidade.</p>
        <div v-if="detail.chaveAcesso || detail.protocolo" class="space-y-1 rounded-lg border p-3"><p v-if="detail.chaveAcesso" class="break-all"><span class="text-muted-foreground">Chave de acesso:</span> {{ detail.chaveAcesso }}</p><p v-if="detail.protocolo"><span class="text-muted-foreground">Protocolo:</span> {{ detail.protocolo }}</p></div>
        <p v-if="detail.discriminacao" class="rounded-lg border p-3"><span class="text-muted-foreground">Serviço:</span> {{ detail.discriminacao }}</p>
        <div v-if="detail.itens?.length"><p class="mb-2 font-semibold">Itens</p><div class="divide-y rounded-lg border"><div v-for="item in detail.itens" :key="item.id" class="flex justify-between gap-3 p-2"><span>{{ item.quantidade }} × {{ item.descricao }}</span><span class="whitespace-nowrap">{{ formatCurrencyBR(item.valorTotal) }}</span></div></div></div>
        <div v-if="detail.eventos?.length"><p class="mb-2 font-semibold">Eventos</p><div class="space-y-2"><div v-for="event in detail.eventos" :key="event.id" class="rounded-lg border p-2"><strong>{{ event.tipo }}</strong> · {{ event.status }} <span class="text-muted-foreground">· {{ formatDate(event.createdAt) }}</span><p v-if="event.motivo" class="mt-1 text-muted-foreground">{{ event.motivo }}</p></div></div></div>
        <div class="flex flex-wrap gap-2 border-t pt-3"><Button v-if="canRetry(detail)" size="sm" variant="outline" :disabled="busyId === detail.id" @click="retry(detail)"><RefreshCw class="size-4" />Tentar novamente</Button><Button v-if="detail.xmlDisponivel" size="sm" variant="outline" :disabled="busyId === detail.id" @click="download(detail, 'xml')"><Download class="size-4" />Baixar XML</Button><Button v-if="detail.pdfDisponivel" size="sm" variant="outline" :disabled="busyId === detail.id" @click="download(detail, 'pdf')"><Download class="size-4" />Baixar PDF</Button></div>
      </div>
    </DialogContent></Dialog>
  </div>
</template>
