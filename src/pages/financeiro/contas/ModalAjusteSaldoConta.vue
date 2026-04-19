<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'
import type { ContaFinanceiraSaldoAtualResponse, ContasFinanceiro } from '@/types/schemas'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  conta: ContasFinanceiro | null
}>()

const emit = defineEmits<{
  completed: []
}>()

const toast = useToast()
const contasStore = useContasFinanceirasStore()
const loading = ref(false)
const loadingContext = ref(false)
const contexto = ref<ContaFinanceiraSaldoAtualResponse | null>(null)
const form = ref({
  saldoInformado: '',
  modo: 'LANCAR_FINANCEIRO' as 'LANCAR_FINANCEIRO' | 'AJUSTE_INTERNO',
  data: new Date() as Date | string,
  descricao: '',
})

const title = computed(() => `Ajustar saldo • ${props.conta?.nome || 'Conta financeira'}`)
const saldoAtualSistema = computed(() => Number(contexto.value?.resumo.saldoAtual || 0))
const saldoInformado = computed(() => formatToNumberValue(form.value.saldoInformado))
const diferenca = computed(() => saldoInformado.value - saldoAtualSistema.value)
const tipoAjuste = computed<'RECEITA' | 'DESPESA' | 'NEUTRO'>(() => {
  if (diferenca.value > 0) return 'RECEITA'
  if (diferenca.value < 0) return 'DESPESA'
  return 'NEUTRO'
})
const valorAjuste = computed(() => Math.abs(diferenca.value))

async function loadContexto() {
  if (!props.conta?.id) return

  try {
    loadingContext.value = true
    const response = await LancamentosRepository.getContaFinanceiraSaldoAtual(props.conta.id)
    contexto.value = response.data
    form.value.saldoInformado = String(response.data.resumo.saldoAtual ?? 0)
    form.value.data = new Date()
    form.value.descricao = ''
    form.value.modo = 'LANCAR_FINANCEIRO'
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Não foi possível carregar o saldo atual da conta.')
  } finally {
    loadingContext.value = false
  }
}

async function submit() {
  if (!props.conta?.id) {
    toast.error('Conta financeira não informada.')
    return
  }

  if (saldoInformado.value < 0) {
    toast.error('Informe um saldo válido.')
    return
  }

  if (!valorAjuste.value) {
    toast.error('O saldo informado já é igual ao saldo atual da conta.')
    return
  }

  try {
    loading.value = true
    await LancamentosRepository.ajustarSaldoContaFinanceira({
      contaFinanceiraId: Number(props.conta.id),
      saldoInformado: saldoInformado.value,
      modo: form.value.modo,
      data: form.value.modo === 'LANCAR_FINANCEIRO' ? new Date(form.value.data).toISOString() : undefined,
      descricao: form.value.descricao.trim() || undefined,
    })

    toast.success(
      form.value.modo === 'LANCAR_FINANCEIRO'
        ? 'Saldo ajustado com lançamento financeiro.'
        : 'Saldo ajustado internamente com sucesso.',
    )

    contasStore.updateTable()
    open.value = false
    emit('completed')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao ajustar o saldo da conta.')
  } finally {
    loading.value = false
  }
}

watch(
  () => open.value,
  async (value) => {
    if (!value) return
    await loadContexto()
  },
)
</script>

<template>
  <ModalView v-model:open="open" :title="title" description="Informe o saldo real que você tem na conta e o sistema calcula automaticamente a diferença para ajuste." size="lg">
    <div class="space-y-4 px-4">
      <div class="rounded-lg border border-border bg-card p-4 text-sm">
        <div class="font-medium text-foreground">Saldo atual apurado pelo sistema</div>
        <div v-if="loadingContext" class="mt-2 text-muted-foreground">Carregando saldo atual...</div>
        <template v-else>
          <div class="mt-2 text-lg font-semibold text-foreground">{{ formatCurrencyBR(saldoAtualSistema) }}</div>
          <div class="mt-1 text-xs text-muted-foreground">
            Entradas realizadas: {{ formatCurrencyBR(Number(contexto?.resumo.entradasRealizadas || 0)) }} •
            Saídas realizadas: {{ formatCurrencyBR(Number(contexto?.resumo.saidasRealizadas || 0)) }}
          </div>
        </template>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium">Saldo real informado</label>
          <Input v-model="form.saldoInformado" type="number" step="0.01" min="0" placeholder="0,00" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Modo do ajuste</label>
          <Select v-model="form.modo">
            <SelectTrigger>
              <SelectValue placeholder="Escolha o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LANCAR_FINANCEIRO">Lançar no financeiro</SelectItem>
              <SelectItem value="AJUSTE_INTERNO">Ajuste interno invisível</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="rounded-lg border border-border bg-card p-4 text-sm">
        <div class="font-medium text-foreground">Prévia do ajuste</div>
        <div class="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-border p-3">
            <div class="text-xs text-muted-foreground">Saldo informado</div>
            <div class="mt-1 text-base font-semibold text-foreground">{{ formatCurrencyBR(saldoInformado) }}</div>
          </div>
          <div class="rounded-lg border border-border p-3">
            <div class="text-xs text-muted-foreground">Diferença</div>
            <div class="mt-1 text-base font-semibold text-foreground">{{ formatCurrencyBR(valorAjuste) }}</div>
          </div>
          <div class="rounded-lg border border-border p-3">
            <div class="text-xs text-muted-foreground">Ação gerada</div>
            <div
              class="mt-1 text-base font-semibold"
              :class="tipoAjuste === 'RECEITA' ? 'text-green-600' : tipoAjuste === 'DESPESA' ? 'text-red-600' : 'text-muted-foreground'"
            >
              {{ tipoAjuste === 'RECEITA' ? 'Receita de ajuste' : tipoAjuste === 'DESPESA' ? 'Despesa de ajuste' : 'Sem ajuste' }}
            </div>
          </div>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          No modo interno, o sistema ajusta o saldo base da conta sem criar lançamentos nas listagens financeiras.
        </p>
      </div>

      <template v-if="form.modo === 'LANCAR_FINANCEIRO'">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium">Data do ajuste</label>
            <Calendarpicker v-model="form.data" :teleport="true" :required="false" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Descrição</label>
            <Input v-model="form.descricao" placeholder="Ex: Conferência de caixa / banco" />
          </div>
        </div>
      </template>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">Cancelar</Button>
        <Button class="text-white" :disabled="loading || loadingContext" @click="submit">
          {{ loading ? 'Ajustando...' : 'Confirmar ajuste' }}
        </Button>
      </div>
    </div>
  </ModalView>
</template>
