<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Download, FileText, LoaderCircle, RefreshCw, Settings2, XCircle } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotasFiscaisRepository, type FiscalConfig, type FiscalDocument } from '@/repositories/notas-fiscais-repository'

const props = defineProps<{ tipo: 'NFE' | 'NFCE'; title: string; description: string }>()
const router = useRouter()
const toast = useToast()
const loading = ref(true)
const refreshingId = ref<number | null>(null)
const config = ref<FiscalConfig | null>(null)
const documents = ref<FiscalDocument[]>([])
const ready = computed(() => props.tipo === 'NFE' ? config.value?.emissaoNfePronta : config.value?.emissaoNfcePronta)
const label = computed(() => props.tipo === 'NFE' ? 'NF-e' : 'NFC-e')

async function load() {
  try {
    const [fiscalConfig, response] = await Promise.all([NotasFiscaisRepository.getConfig(), NotasFiscaisRepository.listDocuments(props.tipo)])
    config.value = fiscalConfig
    documents.value = response.data
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
      <Card><CardHeader><CardTitle>Histórico de {{ label }}</CardTitle><CardDescription>Emissões vinculadas às vendas desta conta.</CardDescription></CardHeader><CardContent><div v-if="!documents.length" class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground"><FileText class="size-7" />Nenhum documento emitido ainda.</div><div v-else class="divide-y rounded-xl border"><div v-for="document in documents" :key="document.id" class="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"><div><p class="font-semibold">{{ document.numero ? `${label} ${document.numero}` : `Venda #${document.vendaId || '-'}` }}</p><p class="text-xs text-muted-foreground">{{ document.cliente?.nome || 'Consumidor final' }} · {{ new Date(document.criadoEm).toLocaleString('pt-BR') }}</p><p v-if="document.erroMensagem" class="mt-1 text-xs text-destructive">{{ document.erroMensagem }}</p></div><div class="flex flex-wrap items-center gap-2"><strong>R$ {{ document.valorTotal.toFixed(2).replace('.', ',') }}</strong><Badge variant="secondary">{{ document.status }}</Badge><Button v-if="document.status === 'AUTORIZADA'" size="sm" variant="outline" @click="NotasFiscaisRepository.downloadDocument(document.id, 'pdf', `${label}-${document.numero || document.id}.pdf`)"><Download />DANFE</Button><Button v-if="document.status === 'AUTORIZADA'" size="sm" variant="outline" @click="NotasFiscaisRepository.downloadDocument(document.id, 'xml', `${label}-${document.numero || document.id}.xml`)"><Download />XML</Button><Button v-if="['PENDENTE', 'FALHA_REPROCESSAVEL'].includes(document.status)" size="sm" variant="outline" :disabled="refreshingId === document.id" @click="retry(document)"><RefreshCw :class="{ 'animate-spin': refreshingId === document.id }" />Tentar novamente</Button><Button v-if="document.status === 'AUTORIZADA'" size="sm" variant="destructive" :disabled="refreshingId === document.id" @click="cancel(document)"><XCircle />Cancelar</Button></div></div></div></CardContent></Card>
    </template>
  </div>
</template>
