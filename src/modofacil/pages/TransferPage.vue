<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted, computed } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { api, type Row } from '../adapters/domain'
import { today, decimal, money, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const ui = useUiStore(),
  accounts = ref<Row[]>([]),
  mode = ref('GERAR_FINANCEIRO'),
  origin = ref<number | null>(null),
  destination = ref<number | null>(null),
  value = ref(''),
  date = ref(today()),
  description = ref('Transferência entre contas'),
  start = ref(''),
  end = ref(''),
  status = ref('TODOS'),
  type = ref('TODOS'),
  search = ref(''),
  review = ref(false),
  preview = ref<any>(null),
  loading = ref(false),
  validation = ref(''),
  done = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
const allowed = computed(() => ui.financeiroFlags.permitirTransferenciaContaFinanceira !== false)
useFlow(computed(() => !done.value && (!!origin.value || !!destination.value || !!value.value)))
onMounted(async () => {
  loading.value = true
  try {
    accounts.value = await api.read('/modofacil/financeiro/contas')
  } catch (e) {
    validation.value = errorMessage(e)
  } finally {
    loading.value = false
  }
})
function filters() {
  return {
    status: status.value,
    tipo: type.value,
    ...(search.value ? { search: search.value } : {}),
    ...(start.value ? { inicio: new Date(start.value + 'T00:00:00').toISOString() } : {}),
    ...(end.value ? { fim: new Date(end.value + 'T23:59:59').toISOString() } : {}),
  }
}
function body() {
  if (!allowed.value) throw new Error('As transferências estão desabilitadas na conta.')
  if (!origin.value || !destination.value || origin.value === destination.value)
    throw new Error('Escolha contas de origem e destino diferentes.')
  if (mode.value === 'MOVER_LANCAMENTOS')
    return {
      modo: mode.value,
      contaOrigemId: origin.value,
      contaDestinoId: destination.value,
      filtros: filters(),
    }
  const amount = decimal(value.value)
  if (amount <= 0) throw new Error('Informe um valor maior que zero.')
  return {
    modo: mode.value,
    contaOrigemId: origin.value,
    contaDestinoId: destination.value,
    valor: amount,
    data: new Date(date.value + 'T12:00:00').toISOString(),
    descricao: description.value.trim(),
  }
}
async function next() {
  validation.value = ''
  try {
    body()
    if (mode.value === 'MOVER_LANCAMENTOS') {
      loading.value = true
      preview.value = await api.post('/modofacil/financeiro/transferencias/preview', {
        contaOrigemId: origin.value,
        filtros: filters(),
      })
    }
    review.value = true
  } catch (e) {
    validation.value = errorMessage(e)
  } finally {
    loading.value = false
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
  const result = await run(
    () => api.post('/modofacil/financeiro/transferencias', payload),
    'Transferência registrada pelo domínio.',
  )
  if (result) done.value = true
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Transferir entre contas</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/financeiro')">← Dinheiro</FormBack></template
      ></PageHeader
    >
    <Feedback
      :loading="loading"
      :error="validation || error"
      :message="message"
      @retry="validation = ''"
    />
    <p
      v-if="!allowed"
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
    >
      Transferências estão desabilitadas pela configuração da conta.
    </p>
    <form
      v-if="!done && allowed"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
    >
      <fieldset
        class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
        :disabled="busy || uncertain || loading"
      >
        <template v-if="!review"
          ><label
            >Operação<select v-model="mode">
              <option value="GERAR_FINANCEIRO">
                Transferir um valor, gerando os vínculos financeiros
              </option>
              <option value="MOVER_LANCAMENTOS">Mover vínculos de lançamentos existentes</option>
            </select></label
          ><label
            >Conta de origem<select v-model="origin" required>
              <option :value="null" disabled>Escolha</option>
              <option v-for="row in accounts" :key="row.id" :value="row.id">{{ row.nome }}</option>
            </select></label
          ><label
            >Conta de destino<select v-model="destination" required>
              <option :value="null" disabled>Escolha</option>
              <option v-for="row in accounts" :key="row.id" :value="row.id">{{ row.nome }}</option>
            </select></label
          ><template v-if="mode === 'GERAR_FINANCEIRO'"
            ><label>Valor<Input v-model="value" inputmode="decimal" required /></label
            ><label>Data<Input v-model="date" type="date" required /></label
            ><label>Descrição<Input v-model="description" required /></label></template
          ><template v-else
            ><label>Vencimentos de<Input v-model="start" type="date" /></label
            ><label>Até<Input v-model="end" type="date" /></label
            ><label
              >Situação<select v-model="status">
                <option v-for="s in ['TODOS', 'PAGO', 'PENDENTE', 'ATRASADO']" :key="s">
                  {{ s }}
                </option>
              </select></label
            ><label
              >Tipo<select v-model="type">
                <option v-for="t in ['TODOS', 'RECEITA', 'DESPESA']" :key="t">{{ t }}</option>
              </select></label
            ><label>Busca<Input v-model="search" /></label></template
        ></template>
        <ReviewPanel v-else>
          <template #title>Confira a transferência</template>
          <p>
            {{ accounts.find((a) => a.id === origin)?.nome }} →
            {{ accounts.find((a) => a.id === destination)?.nome }}
          </p>
          <p v-if="mode === 'GERAR_FINANCEIRO'">{{ value }} · {{ date }} · {{ description }}.</p>
          <p v-else>
            {{ preview?.preview?.parcelasAfetadas }} parcela(s) e
            {{ preview?.preview?.lancamentosAfetados }} lançamento(s) nos filtros informados.
          </p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            {{
              mode === 'GERAR_FINANCEIRO'
                ? 'A operação de domínio gera os registros correspondentes na origem e no destino. Não registre lançamentos extras para esta transferência.'
                : 'Esta ação muda a vinculação financeira dos registros selecionados. Confira os filtros e a quantidade antes de confirmar.'
            }}
          </p>
        </ReviewPanel>
        <div
          class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <button type="button" v-if="review" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{
              busy ? 'Transferindo…' : review ? 'Confirmar transferência' : 'Conferir transferência'
            }}
          </button>
        </div>
      </fieldset>
    </form>
    <SuccessPanel
      v-if="done"
      title="Transferência registrada"
      :to="formDestination('/modofacil/financeiro')"
      label="Ver lançamentos"
    />
  </PageFrame>
</template>
