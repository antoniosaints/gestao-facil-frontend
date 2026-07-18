<script setup lang="ts">
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'
import { Info, Send } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrencyBR } from '@/utils/formatters'

const props = defineProps<{
  open: boolean
  cliente?: string | null
  descricao?: string | null
  valor?: number | null
  mensagemInicial?: string | null
  sending?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'enviar', mensagem?: string): void
}>()

const mensagem = ref('')
const mensagemTextarea = ref<ComponentPublicInstance | null>(null)

const templateVariables = [
  { token: '{cliente}', label: 'Cliente' },
  { token: '{descricao}', label: 'Descrição' },
  { token: '{valor}', label: 'Total pendente' },
  { token: '{valorParcela}', label: 'Próxima parcela' },
  { token: '{vencimento}', label: 'Vencimento' },
  { token: '{parcela}', label: 'Nº parcela' },
  { token: '{totalParcelas}', label: 'Total parcelas' },
  { token: '{situacao}', label: 'Situação' },
]

watch(
  () => props.open,
  (open) => {
    if (open) mensagem.value = props.mensagemInicial || ''
  },
  { immediate: true },
)

const resumo = computed(() =>
  [props.cliente, props.descricao, props.valor != null ? formatCurrencyBR(props.valor) : null]
    .filter(Boolean)
    .join(' • '),
)

function insertVariable(token: string) {
  const textarea = mensagemTextarea.value?.$el as HTMLTextAreaElement | undefined
  const start = textarea?.selectionStart ?? mensagem.value.length
  const end = textarea?.selectionEnd ?? start
  mensagem.value = `${mensagem.value.slice(0, start)}${token}${mensagem.value.slice(end)}`

  requestAnimationFrame(() => {
    textarea?.focus()
    textarea?.setSelectionRange(start + token.length, start + token.length)
  })
}

function enviar() {
  emit('enviar', mensagem.value.trim() || undefined)
}
</script>

<template>
  <ModalView
    :open="open"
    :icon="Send"
    title="Enviar cobrança pelo WhatsApp"
    description="A cobrança será colocada na fila para envio imediato."
    size="2xl"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-5 px-4">
      <div v-if="resumo" class="rounded-xl border bg-muted/20 p-4">
        <p class="text-xs uppercase tracking-wide text-muted-foreground">Destinatário e lançamento</p>
        <p class="mt-1 text-sm font-medium text-foreground">{{ resumo }}</p>
      </div>

      <div>
        <Label for="mensagem-cobranca-rapida" class="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
          Mensagem personalizada (opcional)
        </Label>
        <Textarea
          id="mensagem-cobranca-rapida"
          ref="mensagemTextarea"
          v-model="mensagem"
          rows="5"
          placeholder="Olá {cliente}, sua parcela de {valorParcela} vence em {vencimento}."
        />
        <div class="mt-2 flex flex-wrap gap-1.5">
          <Button
            v-for="variable in templateVariables"
            :key="variable.token"
            type="button"
            size="sm"
            variant="outline"
            class="h-7 px-2 text-[11px]"
            @mousedown.prevent="insertVariable(variable.token)"
          >
            {{ variable.label }}
          </Button>
        </div>
        <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Info class="h-3 w-3" />
          Se a mensagem ficar vazia, será usado o modelo configurado para a inadimplência.
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" :disabled="sending" @click="emit('update:open', false)">
          Cancelar
        </Button>
        <Button type="button" :disabled="sending" @click="enviar">
          <Send class="h-4 w-4" :class="{ 'animate-pulse': sending }" />
          {{ sending ? 'Enfileirando...' : 'Enviar agora' }}
        </Button>
      </div>
    </div>
  </ModalView>
</template>
