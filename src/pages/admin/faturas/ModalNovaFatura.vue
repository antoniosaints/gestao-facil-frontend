<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CirclePlus } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContaRepository } from '@/repositories/conta-repository'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()

const contaId = ref<number | null>(null)
const contaLabel = ref('')
const valor = ref<number | null>(null)
const descricao = ref('')
const vencimento = ref('')
const status = ref<'PAGO' | 'PENDENTE'>('PAGO')
const renovarConta = ref(true)
const saving = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    contaId.value = null
    contaLabel.value = ''
    valor.value = null
    descricao.value = ''
    vencimento.value = ''
    status.value = 'PAGO'
    renovarConta.value = true
  },
)

const podeSalvar = computed(() => !!contaId.value && !!valor.value && Number(valor.value) > 0)

async function salvar() {
  if (!podeSalvar.value) {
    toast.error('Selecione o assinante e informe um valor válido.')
    return
  }
  try {
    saving.value = true
    const res = await ContaRepository.criarFaturaManualAdmin({
      contaId: Number(contaId.value),
      valor: Number(valor.value),
      descricao: descricao.value.trim() || undefined,
      vencimento: vencimento.value || undefined,
      status: status.value,
      renovarConta: status.value === 'PAGO' ? renovarConta.value : false,
    })
    toast.success(res.message || 'Fatura lançada com sucesso.')
    emit('saved')
    emit('update:open', false)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível lançar a fatura.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalView
    :open="open"
    :icon="CirclePlus"
    title="Nova fatura manual"
    description="Registre um pagamento feito por fora do sistema para um assinante."
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4 px-4">
      <div class="space-y-1.5">
        <Label>Assinante</Label>
        <Select2Ajax
          v-model="contaId"
          v-model:label="contaLabel"
          url="/admin/faturas/contas/select2"
          placeholder="Buscar assinante por nome ou e-mail..."
          allow-clear
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input v-model.number="valor" type="number" min="0" step="0.01" placeholder="0,00" />
        </div>
        <div class="space-y-1.5">
          <Label>Data do pagamento / vencimento</Label>
          <Input v-model="vencimento" type="date" />
        </div>
      </div>

      <div class="space-y-1.5">
        <Label>Descrição (opcional)</Label>
        <Input v-model="descricao" placeholder="Ex.: Mensalidade paga via PIX direto" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <Label>Status</Label>
          <Select v-model="status">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PAGO">Paga (registra ganho)</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="status === 'PAGO'" class="flex items-end justify-between rounded-lg border p-3">
          <div>
            <Label class="text-sm">Renovar assinatura</Label>
            <p class="text-xs text-muted-foreground">Estende o vencimento (+1 ciclo).</p>
          </div>
          <Switch :model-value="renovarConta" @update:model-value="renovarConta = $event" />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" @click="emit('update:open', false)">Cancelar</Button>
        <Button :disabled="!podeSalvar || saving" @click="salvar">Lançar fatura</Button>
      </div>
    </div>
  </ModalView>
</template>
