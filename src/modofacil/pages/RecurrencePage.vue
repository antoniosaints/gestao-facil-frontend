<script setup lang="ts">
import FormSelect from '../components/FormSelect.vue'
import FormBack from '../components/FormBack.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api } from '../adapters/domain'
import { recurrenceDraft, recurrencePayload } from '../application/recurrence'
import { errorMessage, dateLabel } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import RecurrenceFields from '../components/RecurrenceFields.vue'
import Feedback from '../components/Feedback.vue'
const route = useFormContext(),
  record = ref<any>(null),
  draft = ref(recurrenceDraft()),
  action = ref('configurar'),
  review = ref(false),
  loading = ref(false),
  validation = ref(''),
  dirty = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
const base = computed(() => `/modofacil/financeiro/lancamentos/${Number(route.params.id)}`)
async function load() {
  loading.value = true
  validation.value = ''
  try {
    record.value = await api.read(base.value)
    draft.value = recurrenceDraft(
      record.value.recorrencia || { valorParcela: record.value.valorTotal },
    )
    dirty.value = false
  } catch (e) {
    validation.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
function request() {
  if (action.value === 'configurar')
    return { path: base.value + '/recorrencia', body: recurrencePayload(draft.value) }
  if (action.value === 'gerar') return { path: base.value + '/recorrencia/gerar', body: {} }
  return {
    path: base.value + '/recorrencia/status',
    body: { ativo: action.value === 'retomar', encerrar: action.value === 'encerrar' },
  }
}
function next() {
  validation.value = ''
  try {
    request()
    review.value = true
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  let req
  try {
    req = request()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(
    () => api.post(req.path, req.body),
    'Operação de recorrência registrada.',
  )
  if (result) {
    review.value = false
    dirty.value = false
    await load()
  }
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Organizar recorrência</template
      ><template #back><FormBack :to="base">← Lançamento</FormBack></template></PageHeader
    >

    <Feedback :loading="loading" :error="validation || error" :message="message" @retry="load" />
    <form
      v-if="record"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
      @input="dirty = true"
    >
      <h2>{{ record.descricao }}</h2>
      <p v-if="record.recorrencia">
        {{ record.recorrencia.ativo ? 'Ativa' : 'Pausada / encerrada' }} · Próxima ocorrência
        {{ dateLabel(record.recorrencia.proximoVencimento) }}
      </p>
      <fieldset :disabled="busy || uncertain || loading" class="mf-stack grid gap-4">
        <template v-if="!review"
          ><label
            >O que deseja fazer?<FormSelect
              v-model="action"
              :options="[
                {
                  value: 'configurar',
                  label: `${record.recorrencia ? 'Alterar' : 'Criar'} configuração`,
                },
                ...(record.recorrencia
                  ? [
                      { value: 'gerar', label: 'Gerar a próxima ocorrência' },
                      {
                        value: record.recorrencia.ativo ? 'pausar' : 'retomar',
                        label: `${record.recorrencia.ativo ? 'Pausar' : 'Retomar'} geração`,
                      },
                      { value: 'encerrar', label: 'Encerrar recorrência' },
                    ]
                  : []),
              ]" /></label
          ><RecurrenceFields v-if="action === 'configurar'" v-model="draft"
        /></template>
        <ReviewPanel v-else>
          <template #title>Confira a ação: {{ action }}</template>
          <p v-if="action === 'configurar'">
            {{ draft.frequencia }} · {{ draft.valorParcela }} por ocorrência · de
            {{ draft.dataInicio }} até {{ draft.dataFim || 'sem data final' }} · mínimo
            {{ draft.minimoGerado }}, máximo em aberto {{ draft.maximoEmAberto }} · geração
            automática {{ draft.geracaoAutomatica ? 'sim' : 'não' }} · antecedência
            {{ draft.diasAntecedencia }} dias.
          </p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            O domínio controla cursor, limites e parcelas. Pausar ou encerrar mantém parcelas
            existentes. Alterar a configuração não retoma uma recorrência pausada automaticamente.
            Não crie receitas ou despesas paralelas.
          </p>
        </ReviewPanel>
        <div class="mf-form-actions mf-actions my-4 flex flex-wrap items-end gap-3">
          <button v-if="review" type="button" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Registrando…' : review ? 'Confirmar operação' : 'Conferir operação' }}
          </button>
        </div>
      </fieldset>
    </form>
  </PageFrame>
</template>
