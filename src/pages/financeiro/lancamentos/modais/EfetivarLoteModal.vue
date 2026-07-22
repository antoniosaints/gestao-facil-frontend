<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LancamentosRepository, type ParcelaIgnoradaLote } from '@/repositories/lancamento-repository'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'

const props = defineProps<{
  open: boolean
  parcelasIds: number[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [resultado: { efetivadas: number; ignoradas: ParcelaIgnoradaLote[] }]
}>()

const toast = useToast()
const salvando = ref(false)

const form = ref<{
  dataPagamento: Date
  metodoPagamento: MetodoPagamentoFinanceiro
  contaPagamento: number | null
}>({
  dataPagamento: new Date(),
  metodoPagamento: 'PIX',
  contaPagamento: null,
})

watch(
  () => props.open,
  (aberto) => {
    if (!aberto) return
    form.value = {
      dataPagamento: new Date(),
      metodoPagamento: 'PIX',
      contaPagamento: null,
    }
  },
)

async function submit() {
  if (!props.parcelasIds.length) {
    toast.error('Nenhuma parcela selecionada')
    return
  }

  try {
    salvando.value = true
    const response = await LancamentosRepository.pagarMultiplasParcelas(props.parcelasIds, {
      dataPagamento: form.value.dataPagamento.toISOString(),
      metodoPagamento: form.value.metodoPagamento,
      contaPagamento: form.value.contaPagamento,
    })

    emit('saved', {
      efetivadas: response.data?.efetivadas ?? 0,
      ignoradas: response.data?.ignoradas ?? [],
    })
    emit('update:open', false)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao efetivar as parcelas')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <ModalView
    :open="open"
    size="sm"
    title="Efetivar parcelas"
    :description="`Registre o pagamento de ${parcelasIds.length} parcela(s) selecionada(s).`"
    @update:open="emit('update:open', $event)"
  >
    <form class="grid grid-cols-1 gap-2 px-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">Data efetivação</label>
        <Calendarpicker :required="true" :teleport="true" v-model="form.dataPagamento" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Conta</label>
        <Select2Ajax id="contaPagamentoLote" v-model="form.contaPagamento" url="lancamentos/contas/select2" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Método de pagamento</label>
        <Select v-model="form.metodoPagamento">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o metodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="BOLETO">Boleto</SelectItem>
            <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
            <SelectItem value="DEBITO">Débito</SelectItem>
            <SelectItem value="CREDITO">Crédito</SelectItem>
            <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
            <SelectItem value="CHEQUE">Cheque</SelectItem>
            <SelectItem value="GATEWAY">Gateway</SelectItem>
            <SelectItem value="OUTRO">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p class="text-xs text-muted-foreground">
        Os mesmos dados serão aplicados a todas as parcelas. Parcelas já efetivadas são ignoradas.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" :disabled="salvando" @click="emit('update:open', false)">
          Fechar
        </Button>
        <Button type="submit" class="text-white" :disabled="salvando">
          {{ salvando ? 'Registrando...' : 'Registrar' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
