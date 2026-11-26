<script setup lang="ts">
import { computed, ref, useId, watch, type ComponentPublicInstance } from 'vue'
import { AlarmClock, Info, Trash2 } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { LembreteConfigPayload } from '@/repositories/inadimplencia-repository'
import DiasLembreteEditor from './DiasLembreteEditor.vue'

const props = defineProps<{
  open: boolean
  titulo: string
  descricao?: string
  config: LembreteConfigPayload
  showRemover?: boolean
  saving?: boolean
  indisponivel?: boolean
  bloqueioAtivo?: boolean
  mensagemPadrao?: string
  textoDesativado?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'salvar', payload: LembreteConfigPayload): void
  (e: 'remover'): void
}>()

const ativo = ref(true)
const dias = ref<number[]>([])
const canalWhatsapp = ref(true)
const canalEmail = ref(false)
const canalSms = ref(false)
const mensagemCustom = ref('')
const mensagemTextarea = ref<ComponentPublicInstance | null>(null)
const agendaId = useId()
const mensagemId = useId()

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
  [() => props.open, () => props.config],
  ([open]) => {
    if (!open) return
    ativo.value = props.config.ativo
    dias.value = [...(props.config.dias || [])].sort((a, b) => a - b)
    canalWhatsapp.value = props.config.canalWhatsapp
    canalEmail.value = props.config.canalEmail
    canalSms.value = props.config.canalSms
    mensagemCustom.value = props.config.mensagemCustom || ''
  },
  { immediate: true },
)

const podeSalvar = computed(
  () =>
    !props.indisponivel &&
    mensagemCustom.value.length <= 1000 &&
    (!ativo.value || (dias.value.length > 0 && !props.bloqueioAtivo)),
)

function salvar() {
  if (!podeSalvar.value || props.saving) return
  emit('salvar', {
    ativo: ativo.value,
    dias: dias.value,
    canalWhatsapp: canalWhatsapp.value,
    canalEmail: canalEmail.value,
    canalSms: canalSms.value,
    mensagemCustom: mensagemCustom.value.trim() || null,
  })
}

function insertVariable(token: string) {
  const textarea = mensagemTextarea.value?.$el as HTMLTextAreaElement | undefined
  const start = textarea?.selectionStart ?? mensagemCustom.value.length
  const end = textarea?.selectionEnd ?? start
  mensagemCustom.value = `${mensagemCustom.value.slice(0, start)}${token}${mensagemCustom.value.slice(end)}`

  requestAnimationFrame(() => {
    textarea?.focus()
    textarea?.setSelectionRange(start + token.length, start + token.length)
  })
}
</script>

<template>
  <ModalView
    :open="open"
    :icon="AlarmClock"
    :title="titulo"
    :description="descricao"
    size="3xl"
    content-class="max-h-[92dvh] gap-0 overflow-hidden"
    header-class="shrink-0 border-b px-4 pb-3 pt-4 text-left sm:px-6"
    body-class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6"
    @update:open="emit('update:open', $event)"
  >
    <slot name="estado" />
    <div v-if="!indisponivel" class="space-y-5">
      <!-- Ativar / desativar -->
      <div class="flex items-center justify-between rounded-xl border p-4">
        <div>
          <Label class="text-sm font-semibold" :for="agendaId">Enviar lembretes ao cliente</Label>
          <p class="text-xs text-muted-foreground">
            {{
              textoDesativado ||
              'Quando desligado, os lançamentos afetados não recebem lembrete automático.'
            }}
          </p>
        </div>
        <Switch
          :id="agendaId"
          :model-value="ativo"
          :disabled="saving"
          @update:model-value="ativo = $event"
        />
      </div>

      <template v-if="ativo">
        <slot name="entrega" />
        <!-- Dias de lembrete -->
        <div>
          <Label class="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
            Dias de lembrete ({{ dias.length }})
          </Label>
          <DiasLembreteEditor v-model="dias" />
        </div>

        <!-- Canais -->
        <div v-if="!$slots.entrega">
          <Label class="mb-2 block text-xs uppercase tracking-wide text-muted-foreground"
            >Canais</Label
          >
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div class="flex items-center justify-between rounded-lg border p-3">
              <span class="text-sm font-medium">WhatsApp</span>
              <Switch :model-value="canalWhatsapp" @update:model-value="canalWhatsapp = $event" />
            </div>
            <div
              class="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-70"
            >
              <span class="flex items-center gap-2 text-sm"
                >E-mail <Badge variant="outline" class="text-[10px]">em breve</Badge></span
              >
              <Switch :model-value="canalEmail" disabled />
            </div>
            <div
              class="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-70"
            >
              <span class="flex items-center gap-2 text-sm"
                >SMS <Badge variant="outline" class="text-[10px]">em breve</Badge></span
              >
              <Switch :model-value="canalSms" disabled />
            </div>
          </div>
        </div>

        <!-- Mensagem custom -->
        <div>
          <Label
            :for="mensagemId"
            class="mb-1 block text-xs uppercase tracking-wide text-muted-foreground"
            >Mensagem personalizada (opcional)</Label
          >
          <Textarea
            :id="mensagemId"
            ref="mensagemTextarea"
            v-model="mensagemCustom"
            rows="3"
            maxlength="1000"
            :placeholder="
              mensagemPadrao ||
              'Olá {cliente}, sua parcela de {valorParcela} vence em {vencimento}.'
            "
          />
          <div class="mt-2 flex flex-wrap gap-1.5">
            <Button
              v-for="variable in templateVariables"
              :key="variable.token"
              type="button"
              size="sm"
              variant="outline"
              class="h-7 px-2 text-[11px]"
              @mousedown.prevent
              @click="insertVariable(variable.token)"
            >
              {{ variable.label }}
            </Button>
          </div>
          <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Info class="h-3 w-3" />
            Clique em uma variável para inserir no texto.
          </p>
        </div>
      </template>
    </div>
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button
          v-if="showRemover"
          type="button"
          variant="ghost"
          class="text-destructive"
          :disabled="saving"
          @click="emit('remover')"
        >
          <Trash2 class="mr-2 h-4 w-4" /> Remover override
        </Button>
        <div class="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            :disabled="saving"
            @click="emit('update:open', false)"
            >Cancelar</Button
          >
          <Button type="button" :disabled="!podeSalvar || saving" @click="salvar">{{
            saving ? 'Salvando…' : 'Salvar'
          }}</Button>
        </div>
      </div>
    </template>
  </ModalView>
</template>
