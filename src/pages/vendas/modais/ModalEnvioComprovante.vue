<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Link2, MessageCircleMore, Send } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { formatCurrencyBR } from '@/utils/formatters'

const props = defineProps<{
  open: boolean
  vendaId?: number | null
  uid?: string | null
  total?: number | null
  clienteId?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const clienteEnvio = ref<number | string | null>(null)
const numeroPreview = ref('')
const sending = ref(false)

const numeroEnvioValido = computed(() => {
  const numeroLimpo = numeroPreview.value.replace(/\D/g, '')
  return numeroLimpo.length >= 10 && numeroLimpo.length <= 13
})

async function atualizarNumeroPreview(id: number | string | null) {
  const clienteIdNum = id ? Number(id) : null
  if (!clienteIdNum) {
    numeroPreview.value = ''
    return
  }
  try {
    const response = await ClienteRepository.get(clienteIdNum)
    const dadosCliente = response.data
    numeroPreview.value = dadosCliente?.whastapp || dadosCliente?.telefone || ''
  } catch (error) {
    console.log(error)
    numeroPreview.value = ''
  }
}

// Ao abrir, inicializa cliente e telefone a partir da venda informada.
watch(
  () => props.open,
  (aberto) => {
    if (!aberto) return
    clienteEnvio.value = props.clienteId ?? null
    atualizarNumeroPreview(clienteEnvio.value)
  },
)

// Troca de cliente re-resolve o telefone.
watch(clienteEnvio, (id) => {
  atualizarNumeroPreview(id)
})

function enviarComprovanteViaLink() {
  if (!numeroEnvioValido.value) {
    toast.error('Informe um telefone ou WhatsApp válido para enviar o comprovante')
    return
  }
  const numeroLimpo = numeroPreview.value.replace(/\D/g, '')
  if (!numeroLimpo) {
    toast.error('Número inválido para envio')
    return
  }
  const identificadorVenda = props.uid || `#${props.vendaId}`
  const valorFormatado = formatCurrencyBR(props.total || 0)
  const mensagem = encodeURIComponent(
    `Olá! Segue o comprovante da venda ${identificadorVenda} no valor de ${valorFormatado}.`,
  )
  const url = `https://wa.me/${numeroLimpo}?text=${mensagem}`
  window.open(url, '_blank')
  open.value = false
  toast.success('Link de envio aberto com sucesso!')
}

async function enviarComprovanteViaApi() {
  if (!props.vendaId) {
    toast.error('Nenhum comprovante disponivel para envio')
    return
  }
  if (!clienteEnvio.value) {
    toast.error('Selecione um cliente para enviar o comprovante')
    return
  }
  if (!numeroEnvioValido.value) {
    toast.error('Informe um telefone ou WhatsApp válido para enviar o comprovante')
    return
  }

  try {
    sending.value = true
    await ClienteRepository.enviarWhatsapp(Number(clienteEnvio.value), {
      tipo: 'COMPROVANTE_VENDA',
      vendaId: props.vendaId,
      telefone: numeroPreview.value,
    })
    toast.success('Comprovante enviado pelo WhatsApp')
    open.value = false
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao enviar comprovante pelo WhatsApp')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <ModalView v-model:open="open" title="Enviar comprovante"
    description="Escolha como deseja compartilhar o comprovante com o cliente." size="md">
    <div class="p-4 space-y-4">
      <div class="rounded-xl border border-border bg-background p-3 text-sm space-y-3">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Cliente (envio via API)</label>
          <Select2Ajax placeholder="Selecione o cliente" :url="'/clientes/select2'"
            v-model:model-value="clienteEnvio" :allowClear="true" />
        </div>

        <div class="space-y-1.5">
          <label for="whatsapp-comprovante" class="text-xs font-medium text-foreground">
            WhatsApp para envio
          </label>
          <Input id="whatsapp-comprovante" v-model="numeroPreview" type="tel" inputmode="tel"
            autocomplete="tel" maxlength="20" placeholder="(00) 00000-0000"
            :aria-invalid="Boolean(numeroPreview) && !numeroEnvioValido" />
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-muted-foreground">
              O número pode ser informado manualmente e não altera o cadastro do cliente.
            </p>
            <BadgeCell :label="numeroEnvioValido ? 'Pronto' : 'Pendente'"
              :color="numeroEnvioValido ? 'green' : 'orange'" :icon="MessageCircleMore" :capitalize="false"
              size="sm" />
          </div>
        </div>
      </div>

      <div class="grid gap-3">
        <button type="button" @click="enviarComprovanteViaLink"
          class="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-muted/40"
          :disabled="!numeroEnvioValido">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-medium text-foreground flex items-center gap-2">
                <Link2 class="w-4 h-4 text-primary" />
                Enviar via link
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
                Abre o WhatsApp com a mensagem pronta para você concluir o envio.
              </p>
            </div>
            <BadgeCell label="Disponível" color="green" :icon="Send" :capitalize="false" size="sm" />
          </div>
        </button>

        <button type="button" @click="enviarComprovanteViaApi"
          class="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-muted/30"
          :disabled="!numeroEnvioValido || sending">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-medium text-foreground flex items-center gap-2">
                <Send class="w-4 h-4 text-primary" />
                Enviar via API
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
                Envia o comprovante direto pela instancia principal configurada.
              </p>
            </div>
            <BadgeCell :label="sending ? 'Enviando' : 'Disponivel'" color="green" :icon="Send" :capitalize="false"
              size="sm" />
          </div>
        </button>
      </div>

      <Separator />

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">
          Fechar
        </Button>
      </div>
    </div>
  </ModalView>
</template>
