<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Download,
  FileCode2,
  FilePlus2,
  Printer,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import ModalView from '@/components/formulario/ModalView.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { hasPermission } from '@/hooks/authorize'
import { useUiStore } from '@/stores/ui/uiStore'
import {
  NotasFiscaisRepository,
  type FiscalDocument,
} from '@/repositories/notas-fiscais-repository'
import { isRetryable, typeLabels } from './fiscalPresentation'

const props = withDefaults(
  defineProps<{
    document: FiscalDocument
    section?: 'all' | 'processing' | 'files' | 'management'
    fileCards?: boolean
    retryLabel?: string
  }>(),
  { section: 'all', retryLabel: 'Tentar novamente' },
)
const emit = defineEmits<{ changed: []; deleted: [id: number] }>()
const ui = useUiStore()
const toast = useToast()
const busy = ref(false)
const cancelOpen = ref(false)
const deleteOpen = ref(false)
const canDelete = computed(() => canManage.value && props.document.exclusaoPermitida === true)
const showProcessing = computed(() => ['all', 'processing'].includes(props.section))
const showFiles = computed(() => ['all', 'files'].includes(props.section))
const showManagement = computed(() => ['all', 'management'].includes(props.section))
const reason = ref('')
const cancellationCode = ref('2')
const canRead = computed(
  () => ui.hasActiveModule('notas-fiscais') && hasPermission(ui.usuarioLogged, 3),
)
const canManage = computed(() => canRead.value && hasPermission(ui.usuarioLogged, 4))
const canCancel = computed(
  () =>
    canManage.value &&
    props.document.status === 'AUTORIZADA' &&
    !props.document.eventos?.some(
      (event) => event.tipo === 'CANCELAMENTO' && event.status === 'PROCESSANDO',
    ),
)

async function removeDocument() {
  if (busy.value || !canDelete.value) return
  busy.value = true
  try {
    await NotasFiscaisRepository.deleteDocument(props.document.id)
    deleteOpen.value = false
    toast.success(
      props.document.vendaId
        ? 'Nota excluída. O vínculo com a venda foi removido.'
        : 'Nota excluída.',
    )
    emit('deleted', props.document.id)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível excluir a nota.')
    deleteOpen.value = false
    emit('changed')
  } finally {
    busy.value = false
  }
}

async function retry() {
  if (busy.value || !canManage.value || !isRetryable(props.document)) return
  busy.value = true
  try {
    await NotasFiscaisRepository.retryDocument(props.document.id)
    toast.success('Nota reenfileirada para emissão.')
    emit('changed')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível reenfileirar a nota.')
  } finally {
    busy.value = false
  }
}

async function download(format: 'xml' | 'pdf') {
  if (
    busy.value ||
    !canRead.value ||
    !(format === 'xml' ? props.document.xmlDisponivel : props.document.pdfDisponivel)
  )
    return
  busy.value = true
  try {
    await NotasFiscaisRepository.downloadDocument(
      props.document.id,
      format,
      `${props.document.tipo}-${props.document.serie || 1}-${props.document.numero || props.document.id}.${format}`,
    )
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || `Não foi possível baixar o ${format.toUpperCase()}.`,
    )
  } finally {
    busy.value = false
  }
}

async function generatePdf() {
  if (busy.value || !canRead.value || !props.document.pdfGeravel) return
  busy.value = true
  try {
    await NotasFiscaisRepository.gerarPdfNfse(props.document.id)
    emit('changed')
    await NotasFiscaisRepository.downloadDocument(
      props.document.id,
      'pdf',
      `NFSE-${props.document.numero || props.document.id}.pdf`,
    )
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível gerar o PDF da NFS-e.')
  } finally {
    busy.value = false
  }
}

function openCancellation() {
  reason.value = ''
  cancellationCode.value = '2'
  cancelOpen.value = true
}

async function cancel() {
  if (
    busy.value ||
    !canCancel.value ||
    reason.value.trim().length < 15 ||
    (props.document.tipo === 'NFSE' && !/^\d{1,10}$/.test(cancellationCode.value))
  )
    return
  busy.value = true
  try {
    const result =
      props.document.tipo === 'NFSE'
        ? await NotasFiscaisRepository.cancelDocument(
            props.document.id,
            reason.value.trim(),
            cancellationCode.value,
          )
        : await NotasFiscaisRepository.cancelDocument(props.document.id, reason.value.trim())
    toast.success(
      result.status === 'CONCLUIDO'
        ? 'Nota cancelada.'
        : 'Cancelamento enviado para processamento.',
    )
    cancelOpen.value = false
    emit('changed')
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível solicitar o cancelamento.',
    )
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div
    v-if="canRead"
    :class="fileCards ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-wrap items-center gap-2'"
  >
    <Button
      v-if="showProcessing && canManage && isRetryable(document)"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="retry"
      ><RefreshCw :class="{ 'animate-spin': busy }" />{{ retryLabel }}</Button
    >
    <template v-if="showFiles && fileCards">
      <Button
        variant="outline"
        class="h-auto justify-between rounded-xl p-4 text-left whitespace-normal"
        :disabled="busy || !document.xmlDisponivel"
        @click="download('xml')"
      >
        <span
          ><span class="block font-medium">XML da nota</span
          ><span class="mt-1 block text-xs font-normal text-muted-foreground">{{
            document.xmlDisponivel ? 'Disponível para download' : 'Aguardando disponibilização'
          }}</span></span
        ><FileCode2 class="ml-3 shrink-0" />
      </Button>
      <Button
        variant="outline"
        class="h-auto justify-between rounded-xl p-4 text-left whitespace-normal"
        :disabled="busy || (!document.pdfDisponivel && !document.pdfGeravel)"
        @click="document.pdfDisponivel ? download('pdf') : generatePdf()"
      >
        <span
          ><span class="block font-medium">{{
            document.tipo === 'NFSE' ? 'PDF da NFS-e' : 'DANFE'
          }}</span
          ><span class="mt-1 block text-xs font-normal text-muted-foreground">{{
            document.pdfDisponivel
              ? 'Disponível para download'
              : document.pdfGeravel
                ? 'Gerar e baixar PDF'
                : 'Aguardando disponibilização'
          }}</span></span
        ><Printer class="ml-3 shrink-0" />
      </Button>
    </template>
    <Button
      v-if="showFiles && !fileCards && document.pdfGeravel"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="generatePdf"
      ><FilePlus2 />Gerar PDF</Button
    >
    <Button
      v-if="showFiles && !fileCards && document.pdfDisponivel"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="download('pdf')"
      ><Download />{{ document.tipo === 'NFSE' ? 'PDF' : 'DANFE' }}</Button
    >
    <Button
      v-if="showFiles && !fileCards && document.xmlDisponivel"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="download('xml')"
      ><Download />XML</Button
    >
    <Button
      v-if="showManagement && canCancel"
      size="sm"
      variant="destructive"
      :disabled="busy"
      @click="openCancellation"
      ><XCircle />Cancelar nota</Button
    >
    <Button
      v-if="showManagement && canDelete"
      size="sm"
      variant="destructive"
      :disabled="busy"
      @click="deleteOpen = true"
      ><Trash2 />Excluir nota</Button
    >
  </div>
  <ModalView
    v-model:open="cancelOpen"
    size="lg"
    :title="`Cancelar ${typeLabels[document.tipo]}`"
    description="Informe a justificativa para solicitar o cancelamento desta nota fiscal."
  >
    <form class="space-y-4 px-4 pb-4" @submit.prevent="cancel">
      <div v-if="document.tipo === 'NFSE'" class="space-y-2">
        <Label :for="`cancel-code-${document.id}`">Código de cancelamento</Label
        ><Input
          :id="`cancel-code-${document.id}`"
          v-model="cancellationCode"
          inputmode="numeric"
          pattern="[0-9]{1,10}"
          maxlength="10"
          required
          :disabled="busy"
        />
        <p class="text-xs text-muted-foreground">
          Use o código aceito pelo município para este motivo de cancelamento.
        </p>
      </div>
      <div class="space-y-2">
        <Label :for="`cancel-reason-${document.id}`">Justificativa</Label
        ><Textarea
          :id="`cancel-reason-${document.id}`"
          v-model="reason"
          minlength="15"
          maxlength="500"
          required
          :disabled="busy"
        />
        <p class="text-xs text-muted-foreground">Mínimo de 15 caracteres.</p>
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" :disabled="busy" @click="cancelOpen = false"
          >Voltar</Button
        ><Button
          type="submit"
          variant="destructive"
          :disabled="busy || reason.trim().length < 15"
          >{{ busy ? 'Solicitando...' : 'Solicitar cancelamento' }}</Button
        >
      </div>
    </form>
  </ModalView>
  <ModalView
    v-model:open="deleteOpen"
    size="lg"
    title="Excluir registro da nota"
    description="Confirme a exclusão deste registro fiscal."
  >
    <div class="space-y-4 px-4 pb-4">
      <p class="text-sm">
        O registro sairá das listagens. A numeração e a auditoria serão preservadas.
      </p>
      <p v-if="document.vendaId" class="text-sm">
        A nota será desvinculada da venda {{ document.vendaUid || `#${document.vendaId}` }},
        permitindo uma nova emissão se não houver outra nota ativa.
      </p>
      <div class="flex justify-end gap-2">
        <Button variant="outline" :disabled="busy" @click="deleteOpen = false">Voltar</Button
        ><Button variant="destructive" :disabled="busy || !canDelete" @click="removeDocument">{{
          busy ? 'Excluindo...' : 'Confirmar exclusão'
        }}</Button>
      </div>
    </div>
  </ModalView>
</template>
