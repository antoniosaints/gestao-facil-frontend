<script setup lang="ts">
import { useLookupOptions } from '../adapters/lookups'
import FormSwitch from './FormSwitch.vue'
import FormSelect from './FormSelect.vue'
import { Input } from '@/components/ui/input'

import { ref, computed } from 'vue'
import ModalDialog from './ModalDialog.vue'
import ReviewPanel from './ReviewPanel.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { today, errorMessage, money } from '../application/format'
import { preparePayments, type PaymentDraft } from '../application/payments'
import { useFlow } from '../application/useFlow'
import PaymentComposer from './PaymentComposer.vue'
const props = defineProps<{
  kind: 'VENDA' | 'OS'
  total: number
  busy: boolean
  uncertain: boolean
  operationError?: string
}>()
const emit = defineEmits<{ confirm: [payload: Record<string, unknown>]; cancel: [] }>()
const ui = useUiStore(),
  method = ref('PIX'),
  compound = ref(false),
  payments = ref<PaymentDraft[]>([
    { metodo: 'PIX', valor: '' },
    { metodo: 'DINHEIRO', valor: '' },
  ]),
  received = ref(''),
  date = ref(today()),
  generate = ref(false),
  cancelCharge = ref(false),
  category = ref<number | null>(null),
  account = ref<number | null>(null),
  error = ref(''),
  review = ref(false)
const dirty = ref(false)
useFlow(
  dirty,
  computed(() => !!props.busy),
)
const automatic = computed(() =>
  props.kind === 'OS' ? ui.osLancamentoAutomatico : ui.vendaLancamentoAutomatico,
)
const canFinance = computed(() => hasPermission(ui.usuarioLogged, 3))
const { load: loadAccounts, rows: accounts } = useLookupOptions('finance-accounts')
const { load: loadCategories, rows: categories } = useLookupOptions('finance-categories')
function payload() {
  const payment = preparePayments(
    props.total,
    method.value,
    props.kind === 'VENDA' && compound.value,
    payments.value,
    received.value,
  )
  if (payment.crediario) throw new Error('Receba as parcelas de crediário no financeiro vinculado.')
  if (props.kind === 'OS' && !category.value)
    throw new Error(
      'O contrato atual de faturamento de OS exige categoria financeira. Escolha o destino ou peça ao administrador para configurar.',
    )
  if (generate.value && (!category.value || !account.value))
    throw new Error('Escolha a conta e a categoria para gerar o lançamento.')
  return {
    pagamento: payment.pagamento,
    ...(props.kind === 'VENDA' && compound.value ? { pagamentos: payment.pagamentos } : {}),
    dataPagamento: new Date(date.value + 'T12:00:00').toISOString(),
    lancamentoManual: !generate.value,
    categoria: category.value,
    ...(props.kind === 'VENDA'
      ? { conta: account.value }
      : account.value
        ? { conta: account.value }
        : {}),
    cancelarCobrancaExterna: cancelCharge.value,
  }
}
function next() {
  error.value = ''
  try {
    payload()
    review.value = true
  } catch (e) {
    error.value = errorMessage(e)
  }
}
function confirm() {
  error.value = ''
  try {
    emit('confirm', payload())
  } catch (e) {
    error.value = errorMessage(e)
  }
}
</script>
<template>
  <ModalDialog
    title="Registrar recebimento e faturar"
    :description="`Valor da operação: ${money(total)}. Confira o destino financeiro.`"
    :busy="busy"
    :error="error || operationError"
    :uncertain="uncertain"
    @close="emit('cancel')"
  >
    <form
      class="min-w-0 space-y-4"
      @submit.prevent="review ? confirm() : next()"
      @input="dirty = true"
    >
      <fieldset :disabled="busy || uncertain" class="mf-stack grid gap-4">
        <section v-if="!review" class="mf-stack grid gap-4">
          <label
            >Data do recebimento<Input
              placeholder="dd/mm/aaaa"
              v-model="date"
              type="date"
              required /></label
          ><PaymentComposer
            :total="total"
            :allow-credit="false"
            :allow-compound="kind === 'VENDA'"
            v-model:method="method"
            v-model:compound="compound"
            v-model:payments="payments"
            v-model:received="received"
          />
          <p
            v-if="automatic"
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            O financeiro automático da conta está ativo e será respeitado pelo servidor.
          </p>
          <label
            v-else
            class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-500/10"
            ><FormSwitch v-model="generate" :disabled="!canFinance" />Gerar o lançamento financeiro
            junto com o faturamento</label
          >
          <div v-if="canFinance" class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <label
              >Categoria financeira<FormSelect
                v-model="category"
                :load-options="loadCategories"
                :options="[{ value: null, label: 'Usar padrão, quando permitido' }]" /></label
            ><label
              >Conta financeira<FormSelect
                v-model="account"
                :load-options="loadAccounts"
                :options="[{ value: null, label: 'Usar padrão da conta' }]"
            /></label>
          </div>
          <p
            v-else-if="kind === 'OS'"
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            O contrato atual exige categoria para faturar OS. A seleção de destino para este perfil
            depende da fronteira de configuração operacional.
          </p>
          <label
            class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-500/10"
            ><FormSwitch v-model="cancelCharge" />Cancelar cobranças externas pendentes após
            registrar este recebimento</label
          >
        </section>
        <ReviewPanel v-else title="Confira o recebimento"
          ><p class="!text-2xl font-bold text-foreground">{{ money(total) }}</p>
          <p>Recebimento em {{ date }} · {{ method }}</p>
          <dl v-if="account || category">
            <dt>Conta financeira</dt>
            <dd>{{ accounts.find((row) => row.id === account)?.nome || 'Padrão da conta' }}</dd>
            <dt>Categoria financeira</dt>
            <dd>{{ categories.find((row) => row.id === category)?.nome || 'Padrão da conta' }}</dd>
          </dl>
          <p>
            Financeiro:
            {{
              automatic
                ? 'automático da conta'
                : generate
                  ? 'gerado junto com o faturamento'
                  : 'sem lançamento adicional solicitado pela tela'
            }}.
          </p>
          <p>
            Cancelamento de cobrança externa: {{ cancelCharge ? 'solicitado' : 'não solicitado' }}.
          </p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            Confirme apenas um recebimento já realizado. A operação de faturamento executa os
            efeitos financeiros existentes; não registre outra receita manual para o mesmo
            recebimento.
          </p>
        </ReviewPanel>
        <div class="mf-form-actions mf-actions my-4 flex flex-wrap items-end gap-3">
          <button type="button" @click="review ? (review = false) : emit('cancel')">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{
              busy
                ? 'Faturando…'
                : review
                  ? 'Confirmar recebimento e faturamento'
                  : 'Conferir faturamento'
            }}
          </button>
        </div>
      </fieldset>
    </form>
  </ModalDialog>
</template>
