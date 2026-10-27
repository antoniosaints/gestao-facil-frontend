<script setup lang="ts">
import { financialPaymentOptions } from '../application/payments'
import { useLookupOptions } from '../adapters/lookups'
import FormSelect from '../components/FormSelect.vue'
import FormBack from '../components/FormBack.vue'
import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted, computed } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, type Row } from '../adapters/domain'
import { decimal, today, errorMessage, money } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const route = useFormContext(),
  record = ref<any>(null),
  part = ref<Row | null>(null),
  value = ref(''),
  date = ref(today()),
  description = ref(''),
  account = ref<number | null>(null),
  method = ref('PIX'),
  scope = ref('ATUAL'),
  review = ref(false),
  loading = ref(false),
  validation = ref(''),
  loadError = ref(''),
  dirty = ref(false),
  done = ref(false)
const { load: loadAccounts, rows: accounts } = useLookupOptions('finance-accounts')
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
const base = computed(() => `/modofacil/financeiro/lancamentos/${Number(route.params.id)}`)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    record.value = await api.read(base.value)
    if (route.params.parcelaId) {
      part.value = record.value.parcelas.find((p: Row) => p.id === Number(route.params.parcelaId))
      if (!part.value) throw new Error('Parcela não pertence a este lançamento.')
      value.value = String(part.value.valor)
      date.value = part.value.vencimento.slice(0, 10)
    }
    account.value = record.value.contasFinanceiroId || null
  } catch (e) {
    loadError.value = errorMessage(e)
    record.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)
function body() {
  const amount = decimal(value.value)
  if (amount <= 0) throw new Error('Informe um valor positivo.')
  const shared = { valor: amount, vencimento: new Date(date.value + 'T12:00:00').toISOString() }
  return part.value
    ? { ...shared, escopo: scope.value }
    : {
        ...shared,
        descricao: description.value.trim() || null,
        contaFinanceira: account.value,
        formaPagamento: method.value,
      }
}
function next() {
  try {
    body()
    review.value = true
    validation.value = ''
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  let payload
  try {
    payload = body()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const path = part.value
    ? `/modofacil/financeiro/parcelas/${part.value.id}/atualizar`
    : base.value + '/parcelas'
  const result = await run(() => api.post(path, payload), 'Parcela registrada pelo domínio.')
  if (result) {
    done.value = true
    dirty.value = false
  }
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>{{ part ? 'Editar parcela' : 'Adicionar parcela' }}</template
      ><template #back><FormBack :to="base">← Lançamento</FormBack></template></PageHeader
    >

    <Feedback
      :loading="loading"
      :error="loadError || validation || error"
      :message="message"
      @retry="loadError ? load() : (validation = '')"
    />
    <form
      v-if="record && !done"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
      @input="dirty = true"
    >
      <h2>{{ record.descricao }}</h2>
      <fieldset class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2" :disabled="busy || uncertain">
        <template v-if="!review"
          ><label
            >Valor da parcela<Input
              placeholder="0,00"
              v-model="value"
              inputmode="decimal"
              required /></label
          ><label
            >Vencimento<Input placeholder="dd/mm/aaaa" v-model="date" type="date" required /></label
          ><label v-if="part"
            >Aplicar alteração a<FormSelect
              v-model="scope"
              :options="[
                { value: 'ATUAL', label: 'Somente esta parcela' },
                { value: 'PENDENTES', label: 'Todas as pendentes' },
                { value: 'PAGAS', label: 'Todas as pagas' },
                { value: 'TODAS', label: 'Todas as parcelas' },
                { value: 'ATUAL_EM_DIANTE', label: 'Esta e as seguintes' },
                { value: 'ATUAL_PARA_TRAS', label: 'Esta e as anteriores' },
              ]" /></label
          ><template v-else
            ><label
              >Descrição opcional<Input
                placeholder="Ex.: Parcela referente ao serviço"
                v-model="description"
                maxlength="191" /></label
            ><label
              >Conta<FormSelect
                v-model="account"
                :load-options="loadAccounts"
                :options="[{ value: null, label: 'Padrão do lançamento' }]" /></label
            ><label
              >Forma de pagamento<FormSelect
                v-model="method"
                :options="financialPaymentOptions" /></label></template
        ></template>
        <ReviewPanel v-else>
          <template #title>Confira a parcela</template>
          <p>{{ value }} · {{ date }} · {{ part ? `Escopo: ${scope}` : description }}</p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            {{
              part
                ? 'Alterações também podem atingir parcelas pagas conforme o escopo escolhido; confira os efeitos no financeiro.'
                : 'Adicionar parcela aumenta o valor previsto neste lançamento. Esta ação não registra um pagamento nem gera um lançamento paralelo.'
            }}
          </p>
        </ReviewPanel>
        <div
          class="mf-form-actions mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <button v-if="review" type="button" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Salvando…' : review ? 'Confirmar parcela' : 'Conferir parcela' }}
          </button>
        </div>
      </fieldset>
    </form>
    <SuccessPanel v-if="done" title="Parcela registrada" :to="base" label="Voltar ao lançamento" />
  </PageFrame>
</template>
