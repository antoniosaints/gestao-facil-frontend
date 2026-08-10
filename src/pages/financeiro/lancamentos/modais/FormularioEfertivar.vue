<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'

const store = useLancamentosStore()
const toast = useToast()

interface pagarParcela {
  dataPagamento: Date
  metodoPagamento: MetodoPagamentoFinanceiro
  contaPagamento: number | null
  valorRecebido: string
  novoVencimento: Date | null
  criarSaldoPendente: boolean
}

const data = ref<pagarParcela>({
  dataPagamento: new Date(),
  metodoPagamento: 'PIX',
  contaPagamento: null,
  valorRecebido: '',
  novoVencimento: null,
  criarSaldoPendente: false,
})

const valorOriginal = computed(() => Number(store.valorParcelaEfetivar || 0))
const valorRecebido = computed(() => formatToNumberValue(data.value.valorRecebido || 0))
const saldoPendente = computed(() => Math.max(0, valorOriginal.value - valorRecebido.value))
const pagamentoParcial = computed(() => saldoPendente.value > 0.004)

watch(
  () => store.openModalEfetivar,
  (open) => {
    if (!open) return
    data.value = {
      dataPagamento: new Date(),
      metodoPagamento: 'PIX',
      contaPagamento: null,
      valorRecebido: valorOriginal.value.toFixed(2).replace('.', ','),
      novoVencimento: null,
      criarSaldoPendente: false,
    }
  },
)

const emit = defineEmits(['success'])

async function submit() {
  try {
    if (!store.idMutation) return toast.error('Nenhuma parcela selecionada')
    await LancamentosRepository.pagarParcela(store.idMutation, {
      dataPagamento: data.value.dataPagamento.toISOString(),
      metodoPagamento: data.value.metodoPagamento,
      contaPagamento: data.value.contaPagamento,
      valorRecebido: valorRecebido.value,
      criarSaldoPendente: data.value.criarSaldoPendente,
      novoVencimento: data.value.criarSaldoPendente
        ? data.value.novoVencimento?.toISOString()
        : undefined,
    })
    toast.success('Parcela efetivada com sucesso!')
    store.openModalEfetivar = false
    store.idMutation = null
    store.valorParcelaEfetivar = null
    store.updateTable()
    emit('success', true)
  } catch (error: any) {
    console.log(error)
    toast.error(error.response.data.message || 'Erro ao efetivar a parcela')
  }
}

function closeModal() {
  store.idMutation = null
  store.valorParcelaEfetivar = null
  store.openModalEfetivar = false
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalEfetivar"
    title="Efetivar parcela"
    description="Registre o recebimento integral ou parcial da parcela"
    size="md"
  >
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-2 px-4">
        <div>
          <label class="block text-sm font-medium mb-1">Valor recebido</label>
          <div class="flex gap-2">
            <Input
              v-model="data.valorRecebido"
              v-maska="moneyMaskOptions"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
            />
            <Button
              v-if="pagamentoParcial"
              type="button"
              variant="outline"
              class="shrink-0"
              :class="
                data.criarSaldoPendente ? 'border-amber-500 text-amber-700 dark:text-amber-300' : ''
              "
              @click="data.criarSaldoPendente = !data.criarSaldoPendente"
            >
              {{ data.criarSaldoPendente ? 'Saldo pendente' : 'Lançar restante' }}
            </Button>
          </div>
          <div class="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Valor da parcela: {{ formatCurrencyBR(valorOriginal) }}</span>
            <span :class="pagamentoParcial ? 'text-amber-600 dark:text-amber-400 font-medium' : ''">
              {{
                pagamentoParcial
                  ? `Parcial · saldo ${formatCurrencyBR(saldoPendente)}`
                  : 'Quitação total'
              }}
            </span>
          </div>
        </div>
        <div
          v-if="pagamentoParcial && data.criarSaldoPendente"
          class="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20"
        >
          <label class="block text-sm font-medium mb-1">Vencimento do saldo pendente</label>
          <Calendarpicker :required="true" :teleport="true" v-model="data.novoVencimento" />
          <p class="mt-1 text-xs text-muted-foreground">
            Será criada uma nova parcela de {{ formatCurrencyBR(saldoPendente) }}.
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1"> Data efetivação </label>
          <Calendarpicker :required="true" :teleport="true" v-model="data.dataPagamento" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1"> Conta </label>
          <Select2Ajax
            id="contasFinanceiroId"
            v-model="data.contaPagamento"
            url="lancamentos/contas/select2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1"> Método de pagamento </label>
          <Select v-model="data.metodoPagamento">
            <SelectTrigger>
              <SelectValue placeholder="Selecione o metodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PIX"> PIX </SelectItem>
              <SelectItem value="BOLETO"> Boleto </SelectItem>
              <SelectItem value="DINHEIRO"> Dinheiro </SelectItem>
              <SelectItem value="DEBITO"> Débito </SelectItem>
              <SelectItem value="CREDITO"> Crédito </SelectItem>
              <SelectItem value="TRANSFERENCIA"> Transferência </SelectItem>
              <SelectItem value="CHEQUE"> Cheque </SelectItem>
              <SelectItem value="GATEWAY"> Gateway </SelectItem>
              <SelectItem value="OUTRO"> Outro </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <Button type="button" @click="closeModal" variant="secondary"> Fechar </Button>
          <Button class="bg-blue-500 dark:bg-blue-900 hover:bg-blue-700 dark:text-white">
            Registrar
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
