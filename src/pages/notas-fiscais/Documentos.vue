<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Download, FileText, LoaderCircle, RefreshCw, Send, Settings2, XCircle } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotasFiscaisRepository, type FiscalBatchResult, type FiscalConfig, type FiscalDocument, type UninvoicedSale } from '@/repositories/notas-fiscais-repository'

const props = defineProps<{ tipo: 'NFE' | 'NFCE'; title: string; description: string }>()
const router = useRouter()
const toast = useToast()
const loading = ref(true)
const refreshingId = ref<number | null>(null)
const config = ref<FiscalConfig | null>(null)
const documents = ref<FiscalDocument[]>([])
const uninvoicedSales = ref<UninvoicedSale[]>([])
const selectedSaleIds = ref<number[]>([])
const emittingSales = ref(false)
const batchResult = ref<FiscalBatchResult | null>(null)
const ready = computed(() => props.tipo === 'NFE' ? config.value?.emissaoNfePronta : config.value?.emissaoNfcePronta)
const label = computed(() => props.tipo === 'NFE' ? 'NF-e' : 'NFC-e')

async function load() {
  try {
    const [fiscalConfig, response, pending] = await Promise.all([NotasFiscaisRepository.getConfig(), NotasFiscaisRepository.listDocuments(props.tipo), NotasFiscaisRepository.listUninvoicedSales()])
    config.value = fiscalConfig
    documents.value = response.data
    uninvoicedSales.value = pending
    selectedSaleIds.value = selectedSaleIds.value.filter((id) => pending.some((sale) => sale.id === id))
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || `Não foi possível carregar ${label.value}.`) }
  finally { loading.value = false }
}

async function retry(document: FiscalDocument) {
  try { refreshingId.value = document.id; await NotasFiscaisRepository.retryDocument(document.id); toast.success('Documento reenfileirado para emissão.'); await load() }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível reenfileirar o documento.') }
  finally { refreshingId.value = null }
}

async function cancel(document: FiscalDocument) {
  const motivo = window.prompt(`Justificativa do cancelamento da ${label.value}:`)
  if (!motivo) return
  try { refreshingId.value = document.id; await NotasFiscaisRepository.cancelDocument(document.id, motivo); toast.success('Cancelamento enviado para processamento.'); await load() }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível solicitar o cancelamento.') }
  finally { refreshingId.value = null }
}

const allPendingSelected = computed(() => uninvoicedSales.value.length > 0 && selectedSaleIds.value.length === uninvoicedSales.value.length)

function toggleSale(id: number) {
  selectedSaleIds.value = selectedSaleIds.value.includes(id) ? selectedSaleIds.value.filter((saleId) => saleId !== id) : [...selectedSaleIds.value, id]
}

function toggleAllPendingSales() {
  selectedSaleIds.value = allPendingSelected.value ? [] : uninvoicedSales.value.map((sale) => sale.id)
}

function formatBatchIssue(issue: FiscalBatchResult['pendencias'][number]) {
  const items = issue.detalhes?.itens || []
  if (!items.length) return issue.mensagem
  return items.map((item) => `${item.descricao}: ${item.campos.join(', ')}`).join(' · ')
}

async function emitPendingSales(ids: number[]) {
  if (!ids.length) return
  try {
    emittingSales.value = true
    batchResult.value = await NotasFiscaisRepository.createSaleDocumentsBatch(ids, props.tipo)
    if (batchResult.value.emitidas.length) toast.success(`${batchResult.value.emitidas.length} documento(s) enfileirado(s) para emissão.`)
    if (batchResult.value.pendencias.length) toast.warning(`${batchResult.value.pendencias.length} venda(s) precisam de correção fiscal.`)
    await load()
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível preparar as emissões.') }
  finally { emittingSales.value = false }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><FileText class="size-6 text-primary" />{{ title }}</h1><p class="mt-1 text-sm text-muted-foreground">{{ description }}</p></div>
      <Button variant="outline" @click="router.push({ name: 'notas-fiscais-configuracoes' })"><Settings2 />Configurar emissor</Button>
    </header>
    <div v-if="loading" class="flex min-h-60 items-center justify-center text-muted-foreground"><LoaderCircle class="mr-2 animate-spin" />Carregando documentos...</div>
    <template v-else>
      <Card :class="ready ? 'border-emerald-500/35' : 'border-amber-500/35'"><CardHeader><CardTitle>{{ ready ? `${label} pronta para venda` : `Configuração da ${label} pendente` }}</CardTitle><CardDescription>{{ ready ? 'A venda registra a intenção e a autorização é processada em segundo plano, sem travar o PDV.' : 'Ative o documento, preencha os dados do emissor, certificado e, para NFC-e, o CSC.' }}</CardDescription></CardHeader><CardContent><Button v-if="!ready" @click="router.push({ name: 'notas-fiscais-configuracoes' })"><Settings2 />Abrir configurações</Button></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Vendas faturadas sem {{ label }}</CardTitle><CardDescription>Selecione vendas já concluídas para validar e enfileirar a emissão posterior. As pendências não impedem as demais emissões do lote.</CardDescription></CardHeader>
        <CardContent class="space-y-3">
          <div v-if="!uninvoicedSales.length" class="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Não há vendas faturadas aguardando emissão.</div>
          <template v-else>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="allPendingSelected" @change="toggleAllPendingSales" />Selecionar todas ({{ uninvoicedSales.length }})</label><Button size="sm" :disabled="!ready || !selectedSaleIds.length || emittingSales" @click="emitPendingSales(selectedSaleIds)"><Send :class="{ 'animate-pulse': emittingSales }" />Emitir selecionadas ({{ selectedSaleIds.length }})</Button></div>
            <div class="divide-y rounded-xl border"><div v-for="sale in uninvoicedSales" :key="sale.id" class="flex items-center gap-3 p-3"><input type="checkbox" :checked="selectedSaleIds.includes(sale.id)" @change="toggleSale(sale.id)" /><div class="min-w-0 flex-1"><p class="font-medium">Venda {{ sale.uid }}</p><p class="text-xs text-muted-foreground">{{ sale.cliente?.nome || 'Consumidor final' }} · {{ new Date(sale.data).toLocaleDateString('pt-BR') }}</p></div><strong class="text-sm">R$ {{ sale.valorTotal.toFixed(2).replace('.', ',') }}</strong><Button size="sm" variant="outline" :disabled="!ready || emittingSales" @click="emitPendingSales([sale.id])">Emitir</Button></div></div>
          </template>
          <div v-if="batchResult?.pendencias.length" class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30"><p class="font-semibold">Pendências encontradas no último lote</p><ul class="mt-2 space-y-1"><li v-for="issue in batchResult.pendencias" :key="issue.vendaId">Venda #{{ issue.vendaId }}: {{ formatBatchIssue(issue) }}</li></ul></div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Histórico de {{ label }}</CardTitle><CardDescription>Emissões vinculadas às vendas desta conta.</CardDescription></CardHeader><CardContent><div v-if="!documents.length" class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground"><FileText class="size-7" />Nenhum documento emitido ainda.</div><div v-else class="divide-y rounded-xl border"><div v-for="document in documents" :key="document.id" class="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"><div><p class="font-semibold">{{ document.numero ? `${label} ${document.numero}` : `Venda #${document.vendaId || '-'}` }}</p><p class="text-xs text-muted-foreground">{{ document.cliente?.nome || 'Consumidor final' }} · {{ new Date(document.criadoEm).toLocaleString('pt-BR') }}</p><p v-if="document.erroMensagem" class="mt-1 text-xs text-destructive">{{ document.erroMensagem }}</p></div><div class="flex flex-wrap items-center gap-2"><strong>R$ {{ document.valorTotal.toFixed(2).replace('.', ',') }}</strong><Badge variant="secondary">{{ document.status }}</Badge><Button v-if="document.status === 'AUTORIZADA'" size="sm" variant="outline" @click="NotasFiscaisRepository.downloadDocument(document.id, 'pdf', `${label}-${document.numero || document.id}.pdf`)"><Download />DANFE</Button><Button v-if="document.status === 'AUTORIZADA'" size="sm" variant="outline" @click="NotasFiscaisRepository.downloadDocument(document.id, 'xml', `${label}-${document.numero || document.id}.xml`)"><Download />XML</Button><Button v-if="['PENDENTE', 'FALHA_REPROCESSAVEL'].includes(document.status)" size="sm" variant="outline" :disabled="refreshingId === document.id" @click="retry(document)"><RefreshCw :class="{ 'animate-spin': refreshingId === document.id }" />Tentar novamente</Button><Button v-if="document.status === 'AUTORIZADA'" size="sm" variant="destructive" :disabled="refreshingId === document.id" @click="cancel(document)"><XCircle />Cancelar</Button></div></div></div></CardContent></Card>
    </template>
  </div>
</template>
