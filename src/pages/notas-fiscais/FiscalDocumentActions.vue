<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, RefreshCw, XCircle } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import ModalView from '@/components/formulario/ModalView.vue'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { hasPermission } from '@/hooks/authorize'
import { useUiStore } from '@/stores/ui/uiStore'
import {
  NotasFiscaisRepository,
  type FiscalDocument,
} from '@/repositories/notas-fiscais-repository'
import { isRetryable, typeLabels } from './fiscalPresentation'

const props = defineProps<{ document: FiscalDocument }>()
const emit = defineEmits<{ changed: [] }>()
const ui = useUiStore()
const toast = useToast()
const busy = ref(false)
const cancelOpen = ref(false)
const reason = ref('')
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

function openCancellation() {
  reason.value = ''
  cancelOpen.value = true
}

async function cancel() {
  if (busy.value || !canCancel.value || reason.value.trim().length < 15) return
  busy.value = true
  try {
    const result = await NotasFiscaisRepository.cancelDocument(
      props.document.id,
      reason.value.trim(),
    )
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
  <div v-if="canRead" class="flex flex-wrap items-center gap-2">
    <Button
      v-if="canManage && isRetryable(document)"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="retry"
      ><RefreshCw :class="{ 'animate-spin': busy }" />Tentar novamente</Button
    >
    <Button
      v-if="document.pdfDisponivel"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="download('pdf')"
      ><Download />{{ document.tipo === 'NFSE' ? 'PDF' : 'DANFE' }}</Button
    >
    <Button
      v-if="document.xmlDisponivel"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="download('xml')"
      ><Download />XML</Button
    >
    <Button
      v-if="canCancel"
      size="sm"
      variant="destructive"
      :disabled="busy"
      @click="openCancellation"
      ><XCircle />Cancelar nota</Button
    >
  </div>
  <ModalView
    v-model:open="cancelOpen"
    size="lg"
    :title="`Cancelar ${typeLabels[document.tipo]}`"
    description="Informe a justificativa para solicitar o cancelamento desta nota fiscal."
  >
    <form class="space-y-4 px-4 pb-4" @submit.prevent="cancel">
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
</template>
