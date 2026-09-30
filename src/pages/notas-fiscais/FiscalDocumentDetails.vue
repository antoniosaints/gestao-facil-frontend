<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { Eye, FileText, LoaderCircle, ReceiptText, RefreshCw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ModalView from '@/components/formulario/ModalView.vue'
import {
  NotasFiscaisRepository,
  type FiscalDocument,
} from '@/repositories/notas-fiscais-repository'
import FiscalDocumentActions from './FiscalDocumentActions.vue'
import FiscalStatusBadge from './FiscalStatusBadge.vue'
import FiscalDocumentTracking from './FiscalDocumentTracking.vue'
import FiscalDocumentView from './FiscalDocumentView.vue'
import {
  hasFiscalDocumentsInProgress,
  typeLabels,
  formatFiscalDate as formatDate,
} from './fiscalPresentation'

const props = withDefaults(
  defineProps<{
    open: boolean
    documentId: number | null
    initialView?: 'acompanhamento' | 'nota'
  }>(),
  { initialView: 'acompanhamento' },
)
const emit = defineEmits<{
  'update:open': [open: boolean]
  changed: []
  refreshed: [document: FiscalDocument]
}>()
const detail = ref<FiscalDocument | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
const viewingNote = ref(props.initialView === 'nota')
const refreshing = ref(false)
const modalTitle = computed(() =>
  viewingNote.value
    ? detail.value
      ? `${typeLabels[detail.value.tipo]} ${detail.value.numero ? `#${detail.value.numero}` : detail.value.rpsNumero ? `· RPS ${detail.value.rpsNumero}` : `#${detail.value.id}`}`
      : 'Visualização da nota'
    : 'Acompanhamento da nota',
)
let requestVersion = 0

async function load(background = false) {
  const version = ++requestVersion
  if (!props.open || !props.documentId) {
    detailLoading.value = false
    refreshing.value = false
    return
  }
  if (!background) detailLoading.value = true
  refreshing.value = true
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
    if (version === requestVersion) {
      detailLoading.value = false
      refreshing.value = false
    }
  }
}

async function refresh() {
  await load(Boolean(detail.value))
  emit('changed')
}
function changed() {
  void refresh()
}
function deleted() {
  requestVersion++
  detail.value = null
  detailLoading.value = false
  emit('update:open', false)
  emit('changed')
}
watch(
  () => [props.open, props.documentId, props.initialView],
  () => {
    detail.value = null
    viewingNote.value = props.initialView === 'nota'
    void load()
  },
  { immediate: true },
)
useIntervalFn(() => {
  if (
    props.open &&
    detail.value &&
    !refreshing.value &&
    document.visibilityState === 'visible' &&
    hasFiscalDocumentsInProgress([detail.value])
  )
    void load(true)
}, 5000)
</script>

<template>
  <ModalView
    :open="open"
    @update:open="emit('update:open', $event)"
    :size="viewingNote ? '5xl' : '6xl'"
    :title="modalTitle"
    :description="
      viewingNote
        ? detail?.emitidaEm
          ? `Emitida em ${formatDate(detail.emitidaEm)}`
          : `Criada em ${formatDate(detail?.criadoEm)}`
        : 'Acompanhe o processamento, os eventos e os arquivos gerados da nota fiscal.'
    "
    content-class="mt-0 h-[94dvh] md:h-auto gap-0 overflow-hidden rounded-2xl sm:rounded-2xl max-h-[94dvh]"
    header-class="shrink-0 border-b px-4 py-5 text-left sm:px-6 [&_h2]:mb-0 [&_h2]:items-start [&_h2]:font-semibold [&_p]:mt-1 [&_p]:pl-[3.75rem]"
    body-class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
    :body-key="viewingNote ? 'nota' : 'acompanhamento'"
  >
    <template #title>
      <span class="flex flex-wrap items-center gap-2">
        <span
          class="mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl border bg-primary/5 text-primary"
          ><FileText v-if="viewingNote" class="size-5" /><ReceiptText v-else class="size-5"
        /></span>
        <span :class="viewingNote ? 'text-lg' : 'text-xl'">{{ modalTitle }}</span>
        <template v-if="detail">
          <FiscalStatusBadge v-if="viewingNote" :status="detail.status" />
          <Badge v-else variant="outline" class="rounded-full">{{ typeLabels[detail.tipo] }}</Badge>
          <Badge
            variant="outline"
            class="rounded-full"
            :class="
              detail.ambiente === 'HOMOLOGACAO'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : ''
            "
            >{{
              detail.ambiente === 'HOMOLOGACAO'
                ? 'Homologação'
                : detail.ambiente === 'PRODUCAO'
                  ? 'Produção'
                  : 'Ambiente não informado'
            }}</Badge
          >
        </template>
      </span>
    </template>
    <div
      v-if="detailLoading && !detail"
      class="flex min-h-36 items-center justify-center text-muted-foreground"
    >
      <LoaderCircle class="mr-2 size-4 animate-spin" />Carregando nota...
    </div>
    <div v-else class="space-y-4">
      <div v-if="detailError" class="space-y-3">
        <p
          class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {{ detailError }}
        </p>
        <Button variant="outline" :disabled="refreshing" @click="refresh">Tentar novamente</Button>
      </div>
      <template v-if="detail">
        <FiscalDocumentView v-if="viewingNote" :document="detail" />
        <FiscalDocumentTracking v-else :document="detail">
          <template #processing>
            <Button variant="outline" :disabled="refreshing" @click="refresh"
              ><RefreshCw :class="{ 'animate-spin': refreshing }" />Atualizar status</Button
            >
            <FiscalDocumentActions
              :document="detail"
              section="processing"
              :retry-label="
                detail.status === 'PENDENTE' ? 'Continuar processamento' : 'Tentar novamente'
              "
              @changed="changed"
            />
            <Button @click="viewingNote = true"><Eye />Visualizar nota</Button>
          </template>
          <template #files
            ><FiscalDocumentActions
              :document="detail"
              section="files"
              file-cards
              @changed="changed"
          /></template>
          <template #management
            ><FiscalDocumentActions
              :document="detail"
              section="management"
              @changed="changed"
              @deleted="deleted"
          /></template>
        </FiscalDocumentTracking>
      </template>
    </div>
    <template #footer>
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" @click="emit('update:open', false)">Fechar</Button>
        <div v-if="detail" class="flex flex-wrap items-center gap-2">
          <template v-if="viewingNote"
            ><FiscalDocumentActions :document="detail" section="files" @changed="changed" /><Button
              @click="viewingNote = false"
              ><ReceiptText />Ver acompanhamento</Button
            ></template
          >
          <Button v-else @click="viewingNote = true"><Eye />Visualizar nota</Button>
        </div>
      </div>
    </template>
  </ModalView>
</template>
