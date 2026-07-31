<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CircleDollarSign, FileText, LoaderCircle, PenLine, ReceiptText } from 'lucide-vue-next'
import { OrdensServicoRepository } from '@/repositories/os-repository'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  id: number
  uid: string
  // Id de uma cobrança PIX vinculada (com copia e cola) — habilita a opção
  // "PDF com cobrança vinculada". Quando ausente, a opção fica desabilitada.
  cobrancaId?: number | null
}>()

const toast = useToast()

type ExportKind = 'simples' | 'assinatura' | 'pix' | 'cobranca'
const exportingPdf = ref<ExportKind | null>(null)
// Aplica-se somente às exportações com PIX (sistema/cobrança vinculada).
const mostrarAssinaturaPix = ref(false)

async function gerarPdf(kind: ExportKind) {
  if (!props.id || !props.uid || exportingPdf.value) return

  const withPix = kind === 'pix'
  const cobrancaId = kind === 'cobranca' ? (props.cobrancaId ?? null) : null

  // Simples = sem assinatura; Com assinatura = com; PIX/cobrança seguem o checkbox.
  let semAssinatura: boolean
  if (kind === 'simples') semAssinatura = true
  else if (kind === 'assinatura') semAssinatura = false
  else semAssinatura = !mostrarAssinaturaPix.value

  if (kind === 'cobranca' && !cobrancaId) {
    toast.error('Nenhuma cobrança PIX com copia e cola disponível nesta OS.')
    return
  }

  try {
    exportingPdf.value = kind
    await OrdensServicoRepository.getOsPdf(props.id, props.uid, withPix, semAssinatura, cobrancaId)
    toast.success('PDF da OS gerado com sucesso.')
    open.value = false
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar o PDF da OS.')
  } finally {
    exportingPdf.value = null
  }
}
</script>

<template>
  <ModalView v-model:open="open" title="Exportar PDF da OS"
    description="Escolha o formato do documento que deseja gerar." size="lg">
    <div class="grid gap-2 px-2">
      <Button variant="outline" class="justify-start" :disabled="exportingPdf !== null" @click="gerarPdf('simples')">
        <LoaderCircle v-if="exportingPdf === 'simples'" class="mr-2 h-4 w-4 animate-spin" />
        <FileText v-else class="mr-2 h-4 w-4 text-zinc-500" />
        PDF simples <span class="ml-1 text-xs text-muted-foreground">(sem assinatura e sem PIX)</span>
      </Button>

      <Button variant="outline" class="justify-start" :disabled="exportingPdf !== null" @click="gerarPdf('assinatura')">
        <LoaderCircle v-if="exportingPdf === 'assinatura'" class="mr-2 h-4 w-4 animate-spin" />
        <PenLine v-else class="mr-2 h-4 w-4 text-blue-500" />
        PDF com assinatura
      </Button>

      <div class="mt-1 rounded-lg border bg-muted/30 p-3">
        <p class="mb-2 text-xs font-medium text-muted-foreground">Com pagamento PIX</p>
        <div class="grid gap-2">
          <Button variant="outline" class="justify-start" :disabled="exportingPdf !== null" @click="gerarPdf('pix')">
            <LoaderCircle v-if="exportingPdf === 'pix'" class="mr-2 h-4 w-4 animate-spin" />
            <CircleDollarSign v-else class="mr-2 h-4 w-4 text-emerald-500" />
            PDF com PIX do sistema
          </Button>
          <Button variant="outline" class="justify-start" :disabled="exportingPdf !== null || !cobrancaId"
            @click="gerarPdf('cobranca')">
            <LoaderCircle v-if="exportingPdf === 'cobranca'" class="mr-2 h-4 w-4 animate-spin" />
            <ReceiptText v-else class="mr-2 h-4 w-4 text-emerald-600" />
            PDF com cobrança vinculada
            <span v-if="!cobrancaId" class="ml-1 text-xs text-muted-foreground">(nenhuma cobrança PIX)</span>
          </Button>
        </div>
        <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox :checked="mostrarAssinaturaPix" @update:checked="(v: boolean) => mostrarAssinaturaPix = v" />
          Mostrar campos de assinatura
        </label>
      </div>
    </div>
  </ModalView>
</template>
