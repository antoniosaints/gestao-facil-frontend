<script setup lang="ts">
import { ref, watch } from 'vue'
import { LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ModalView from '@/components/formulario/ModalView.vue'
import {
  NotasFiscaisRepository,
  type FiscalDocument,
} from '@/repositories/notas-fiscais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import FiscalDocumentActions from './FiscalDocumentActions.vue'
import {
  typeLabels,
  statusLabels,
  statusClass,
  formatFiscalDate as formatDate,
} from './fiscalPresentation'

const props = defineProps<{ open: boolean; documentId: number | null }>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  changed: []
  refreshed: [document: FiscalDocument]
}>()
const detail = ref<FiscalDocument | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
let requestVersion = 0

async function load() {
  const version = ++requestVersion
  if (!props.open || !props.documentId) {
    detailLoading.value = false
    return
  }
  detailLoading.value = true
  detailError.value = ''
  try {
    const document = await NotasFiscaisRepository.getDocument(props.documentId)
    if (version === requestVersion) {
      detail.value = document
      emit('refreshed', document)
    }
  } catch (error: any) {
    if (version === requestVersion)
      detailError.value =
        error?.response?.data?.error?.message || 'Não foi possível carregar os detalhes da nota.'
  } finally {
    if (version === requestVersion) detailLoading.value = false
  }
}

async function refresh() {
  await load()
  emit('changed')
}
function changed() {
  void refresh()
}
watch(
  () => [props.open, props.documentId],
  () => {
    detail.value = null
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <ModalView
    :open="open"
    @update:open="emit('update:open', $event)"
    size="3xl"
    title="Detalhes da nota fiscal"
    description="Dados do processamento e arquivos disponíveis."
  >
    <div class="px-4 pb-4">
      <div
        v-if="detailLoading"
        class="flex min-h-36 items-center justify-center text-muted-foreground"
      >
        <LoaderCircle class="mr-2 size-4 animate-spin" />Carregando nota...
      </div>
      <div v-else-if="detailError" class="space-y-3">
        <p
          class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {{ detailError }}
        </p>
        <Button variant="outline" @click="refresh">Tentar novamente</Button>
      </div>
      <div v-else-if="detail" class="space-y-4 text-sm">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ typeLabels[detail.tipo] || detail.tipo }}</Badge
          ><Badge variant="outline" :class="statusClass(detail.status)">{{
            statusLabels[detail.status] || detail.status
          }}</Badge
          ><Badge variant="outline">{{
            detail.ambiente === 'HOMOLOGACAO'
              ? 'Homologação'
              : detail.ambiente === 'PRODUCAO'
                ? 'Produção'
                : '—'
          }}</Badge>
        </div>
        <div class="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <p>
            <span class="text-muted-foreground">Número:</span>
            {{
              detail.numero
                ? `${detail.serie || 1}/${detail.numero}`
                : detail.rpsNumero
                  ? `RPS ${detail.rpsNumero}`
                  : 'Ainda não atribuído'
            }}
          </p>
          <p>
            <span class="text-muted-foreground">Valor:</span>
            {{ formatCurrencyBR(detail.valorTotal) }}
          </p>
          <p>
            <span class="text-muted-foreground">Cliente:</span>
            {{ detail.cliente?.nome || 'Consumidor final' }}
          </p>
          <p>
            <span class="text-muted-foreground">Venda:</span>
            {{ detail.vendaUid || (detail.vendaId ? `#${detail.vendaId}` : 'Nota avulsa') }}
          </p>
          <p>
            <span class="text-muted-foreground">Criada em:</span> {{ formatDate(detail.criadoEm) }}
          </p>
          <p>
            <span class="text-muted-foreground">Atualizada em:</span>
            {{ formatDate(detail.atualizadaEm) }}
          </p>
          <p v-if="detail.emitidaEm">
            <span class="text-muted-foreground">Emitida em:</span>
            {{ formatDate(detail.emitidaEm) }}
          </p>
          <p v-if="detail.canceladaEm">
            <span class="text-muted-foreground">Cancelada em:</span>
            {{ formatDate(detail.canceladaEm) }}
          </p>
        </div>
        <div
          v-if="detail.erroMensagem"
          class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"
        >
          <strong>Ocorrência:</strong> {{ detail.erroMensagem }}
        </div>
        <p
          v-if="['RESULTADO_INCERTO', 'EMISSAO_INCERTA'].includes(detail.status)"
          class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200"
        >
          O resultado ainda não foi confirmado. Consulte o portal do provedor antes de iniciar outra
          emissão para evitar duplicidade.
        </p>
        <div v-if="detail.chaveAcesso || detail.protocolo" class="space-y-1 rounded-lg border p-3">
          <p v-if="detail.chaveAcesso" class="break-all">
            <span class="text-muted-foreground">Chave de acesso:</span> {{ detail.chaveAcesso }}
          </p>
          <p v-if="detail.protocolo">
            <span class="text-muted-foreground">Protocolo:</span> {{ detail.protocolo }}
          </p>
        </div>
        <p v-if="detail.discriminacao" class="rounded-lg border p-3">
          <span class="text-muted-foreground">Serviço:</span> {{ detail.discriminacao }}
        </p>
        <div v-if="detail.itens?.length">
          <p class="mb-2 font-semibold">Itens</p>
          <div class="divide-y rounded-lg border">
            <div v-for="item in detail.itens" :key="item.id" class="flex justify-between gap-3 p-2">
              <span>{{ item.quantidade }} × {{ item.descricao }}</span
              ><span class="whitespace-nowrap">{{ formatCurrencyBR(item.valorTotal) }}</span>
            </div>
          </div>
        </div>
        <div v-if="detail.eventos?.length">
          <p class="mb-2 font-semibold">Eventos</p>
          <div class="space-y-2">
            <div v-for="event in detail.eventos" :key="event.id" class="rounded-lg border p-2">
              <strong>{{ event.tipo }}</strong> · {{ event.status }}
              <span class="text-muted-foreground">· {{ formatDate(event.createdAt) }}</span>
              <p v-if="event.motivo" class="mt-1 text-muted-foreground">{{ event.motivo }}</p>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="outline" :disabled="detailLoading" @click="refresh"
            ><RefreshCw class="size-4" />Atualizar status</Button
          ><FiscalDocumentActions :document="detail" @changed="changed" />
        </div>
      </div>
    </div>
  </ModalView>
</template>
