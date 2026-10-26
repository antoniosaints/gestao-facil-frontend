<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, reactive, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, type Row } from '../adapters/domain'
import { errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
import ItemSearch from '../components/ItemSearch.vue'
const route = useFormContext(),
  id = Number(route.params.id),
  record = ref<Row | null>(null),
  accounts = ref<Row[]>([]),
  categories = ref<Row[]>([]),
  loading = ref(false),
  loadError = ref(''),
  validation = ref(''),
  dirty = ref(false),
  done = ref(false),
  review = ref(false),
  personLabel = ref('')
const form = reactive({
  descricao: '',
  data: '',
  categoriaId: null as number | null,
  contasFinanceiroId: null as number | null,
  clienteId: null as number | null,
  formaPagamento: 'PIX',
})
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    ;[record.value, accounts.value, categories.value] = await Promise.all([
      api.read(`/modofacil/financeiro/lancamentos/${id}`),
      api.read('/modofacil/financeiro/contas'),
      api.read('/modofacil/financeiro/categorias'),
    ])
    const row = record.value!
    Object.assign(form, {
      descricao: row.descricao,
      data: String(row.dataLancamento).slice(0, 10),
      categoriaId: row.categoriaId,
      contasFinanceiroId: row.contasFinanceiroId,
      clienteId: row.clienteId ?? null,
      formaPagamento: row.formaPagamento || 'PIX',
    })
    personLabel.value = row.cliente?.nome || 'Não informada'
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function save() {
  validation.value = ''
  if (!form.categoriaId || !form.contasFinanceiroId) {
    validation.value = 'Escolha a categoria e a conta financeira.'
    return
  }
  const result = await run(
    () =>
      api.post(`/modofacil/financeiro/lancamentos/${id}/atualizar-basico`, {
        descricao: form.descricao.trim(),
        dataLancamento:
          form.data === String(record.value!.dataLancamento).slice(0, 10)
            ? record.value!.dataLancamento
            : new Date(form.data + 'T12:00:00').toISOString(),
        categoriaId: form.categoriaId,
        contasFinanceiroId: form.contasFinanceiroId,
        clienteId: form.clienteId,
        formaPagamento: form.formaPagamento,
      }),
    'Dados do lançamento atualizados; valores, parcelas e origem foram preservados.',
  )
  if (result) {
    done.value = true
    dirty.value = false
  }
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Editar informações do lançamento</template
      ><template #back
        ><FormBack :to="`/modofacil/financeiro/lancamentos/${id}`"
          >← Voltar ao lançamento</FormBack
        ></template
      ></PageHeader
    >
    <Feedback
      :loading="loading"
      :error="validation || loadError || error"
      :message="message"
      @retry="loadError ? load() : (validation = '')"
    />
    <form
      v-if="record && !loading && !done"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : (review = true)"
      @input="dirty = true"
    >
      <fieldset :disabled="busy || uncertain" class="mf-stack grid gap-4">
        <section v-if="!review" class="mf-stack grid gap-4">
          <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>Descrição<Input v-model="form.descricao" required maxlength="191" /></label
            ><label>Data de lançamento<Input v-model="form.data" type="date" required /></label
            ><label
              >Categoria<select v-model="form.categoriaId" required>
                <option v-for="row in categories" :key="row.id" :value="row.id">
                  {{ row.nome }}
                </option>
              </select></label
            ><label
              >Conta financeira<select v-model="form.contasFinanceiroId" required>
                <option v-for="row in accounts" :key="row.id" :value="row.id">
                  {{ row.nome }}
                </option>
              </select></label
            ><label
              >Forma de pagamento<select v-model="form.formaPagamento">
                <option
                  v-for="m in [
                    'PIX',
                    'DINHEIRO',
                    'DEBITO',
                    'CREDITO',
                    'BOLETO',
                    'DEPOSITO',
                    'TRANSFERENCIA',
                    'CHEQUE',
                  ]"
                  :key="m"
                >
                  {{ m }}
                </option>
              </select></label
            >
          </div>
          <p>Pessoa vinculada: {{ personLabel }}</p>
          <ItemSearch
            kind="PESSOA"
            @select="
              (row) => {
                form.clienteId = row.id
                personLabel = row.nome || ''
                dirty = true
              }
            "
          /><button
            type="button"
            @click="
              () => {
                form.clienteId = null
                personLabel = 'Não informada'
                dirty = true
              }
            "
          >
            Remover vínculo com a pessoa
          </button>
        </section>
        <ReviewPanel v-else>
          <template #title>Confira as informações</template>
          <p>{{ form.descricao }} · {{ form.data }} · {{ form.formaPagamento }}</p>
          <p>Pessoa: {{ personLabel }}</p>
          <p>
            Conta: {{ accounts.find((a) => a.id === form.contasFinanceiroId)?.nome }} · Categoria:
            {{ categories.find((a) => a.id === form.categoriaId)?.nome }}
          </p>
          <p
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
          >
            O salvamento envia explicitamente os seis campos básicos exigidos pelo contrato. Valor,
            parcelas, situação e vínculo de origem não são reenviados.
          </p>
        </ReviewPanel>
        <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
          <button type="button" v-if="review" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Salvando…' : review ? 'Salvar informações básicas' : 'Conferir' }}
          </button>
        </div>
      </fieldset>
    </form>
    <SuccessPanel
      v-if="done"
      title="Informações atualizadas"
      :to="`/modofacil/financeiro/lancamentos/${id}`"
      label="Voltar ao lançamento"
    />
  </PageFrame>
</template>
