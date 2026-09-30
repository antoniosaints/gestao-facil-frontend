<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, LoaderCircle, Settings2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FiscalHistoryTable from './FiscalHistoryTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  NotasFiscaisRepository,
  type FiscalBatchResult,
  type FiscalConfig,
} from '@/repositories/notas-fiscais-repository'
import PendingSalesTable from './PendingSalesTable.vue'

const props = defineProps<{ tipo: 'NFE' | 'NFCE'; title: string; description: string }>()
const router = useRouter()
const toast = useToast()
const loading = ref(true)
const config = ref<FiscalConfig | null>(null)
const emittingSales = ref(false)
const pendingTableVersion = ref(0)
const batchResult = ref<FiscalBatchResult | null>(null)
const ready = computed(() =>
  props.tipo === 'NFE' ? config.value?.emissaoNfePronta : config.value?.emissaoNfcePronta,
)
const label = computed(() => (props.tipo === 'NFE' ? 'NF-e' : 'NFC-e'))

async function load() {
  try {
    config.value = await NotasFiscaisRepository.getConfig()
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || `Não foi possível carregar ${label.value}.`,
    )
  } finally {
    loading.value = false
  }
}

function formatBatchIssue(issue: FiscalBatchResult['pendencias'][number]) {
  const items = issue.detalhes?.itens || []
  if (!items.length) return issue.mensagem
  return items.map((item) => `${item.descricao}: ${item.campos.join(', ')}`).join(' · ')
}

async function emitPendingSales(ids: number[]) {
  if (!ids.length || emittingSales.value) return
  try {
    emittingSales.value = true
    batchResult.value = await NotasFiscaisRepository.createSaleDocumentsBatch(ids, props.tipo)
    if (batchResult.value.emitidas.length)
      toast.success(
        `${batchResult.value.emitidas.length} documento(s) enfileirado(s) para emissão.`,
      )
    if (batchResult.value.pendencias.length)
      toast.warning(`${batchResult.value.pendencias.length} venda(s) precisam de correção fiscal.`)
    await load()
    pendingTableVersion.value += 1
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível preparar as emissões.')
  } finally {
    emittingSales.value = false
  }
}

onMounted(load)
watch(
  () => props.tipo,
  () => {
    batchResult.value = null
  },
)
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 pb-10">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FileText class="size-6 text-primary" />{{ title }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
      </div>
      <Button variant="outline" @click="router.push({ name: 'notas-fiscais-configuracoes' })"
        ><Settings2 />Configurar emissor</Button
      >
    </header>
    <div v-if="loading" class="flex min-h-60 items-center justify-center text-muted-foreground">
      <LoaderCircle class="mr-2 animate-spin" />Carregando documentos...
    </div>
    <template v-else>
      <Card v-if="!ready" class="border-amber-500/35">
        <CardHeader
          ><CardTitle>Configuração da {{ label }} pendente</CardTitle
          ><CardDescription
            >Ative o documento e preencha os dados do emissor, certificado e, para NFC-e, o
            CSC.</CardDescription
          ></CardHeader
        >
        <CardContent
          ><Button @click="router.push({ name: 'notas-fiscais-configuracoes' })"
            ><Settings2 />Abrir configurações</Button
          ></CardContent
        >
      </Card>
      <Tabs :key="tipo" default-value="emissao" class="space-y-2">
        <TabsList
          ><TabsTrigger value="emissao">Vendas sem {{ label }}</TabsTrigger
          ><TabsTrigger value="historico">Histórico de {{ label }}</TabsTrigger></TabsList
        >
        <TabsContent value="emissao" class="space-y-3">
          <PendingSalesTable
            :tipo="tipo"
            :ready="Boolean(ready)"
            :emitting="emittingSales"
            :refresh-token="pendingTableVersion"
            @emit-sales="emitPendingSales"
          />
          <div
            v-if="batchResult?.pendencias.length"
            class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30"
          >
            <p class="font-semibold">Pendências encontradas no último lote</p>
            <ul class="mt-2 space-y-1">
              <li v-for="issue in batchResult.pendencias" :key="issue.vendaId">
                Venda #{{ issue.vendaId }}: {{ formatBatchIssue(issue) }}
              </li>
            </ul>
          </div>
        </TabsContent>
        <TabsContent value="historico"
          ><FiscalHistoryTable :tipo="tipo" :refresh-token="pendingTableVersion"
        /></TabsContent>
      </Tabs>
    </template>
  </div>
</template>
