<script setup lang="ts">
import { financialPaymentOptions } from '../application/payments'
import { useLookupOptions } from '../adapters/lookups'
import FormSwitch from '../components/FormSwitch.vue'
import FormSection from '../components/FormSection.vue'
import FormSelect from '../components/FormSelect.vue'
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, type Row } from '../adapters/domain'
import { decimal, today, errorMessage, money } from '../application/format'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
import RecurrenceFields from '../components/RecurrenceFields.vue'
import { recurrenceDraft, recurrencePayload } from '../application/recurrence'
import ItemSearch from '../components/ItemSearch.vue'
const mode = ref('AVISTA'),
  installments = ref(2),
  period = ref('MENSAL'),
  interval = ref(30),
  entry = ref('0'),
  entryDate = ref(today()),
  discount = ref('0'),
  valueMode = ref('TOTAL'),
  recurrence = ref(recurrenceDraft()),
  person = ref<Row | null>(null)
const key = crypto.randomUUID()
const route = useFormContext(),
  type = ref(route.query.tipo === 'RECEITA' ? 'RECEITA' : 'DESPESA'),
  description = ref(''),
  value = ref(''),
  date = ref(today()),
  paid = ref(false),
  paidDate = ref(today()),
  category = ref<number | null>(null),
  account = ref<number | null>(null),
  method = ref('PIX'),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  dirty = ref(false),
  done = ref(false),
  uncertain = ref(false),
  review = ref(false)
const { load: loadAccounts, rows: accounts } = useLookupOptions('finance-accounts')
const { load: loadCategories, rows: categories } = useLookupOptions('finance-categories')
useFlow(dirty, busy)
function payload() {
  const amount = decimal(value.value)
  if (amount <= 0) throw new Error('Informe um valor maior que zero.')
  if (!description.value.trim()) throw new Error('Informe a descrição do lançamento.')
  if (!date.value) throw new Error('Informe a data do lançamento.')
  if (!account.value || !category.value)
    throw new Error('Escolha a conta financeira e a categoria.')
  if (mode.value === 'PARCELADO') {
    if (!Number.isInteger(installments.value) || installments.value < 1 || installments.value > 360)
      throw new Error('Informe de 1 a 360 parcelas.')
    if (
      period.value === 'PERSONALIZADO' &&
      (!Number.isInteger(interval.value) || interval.value < 1)
    )
      throw new Error('Informe um intervalo de dias inteiro e maior que zero.')
  }
  return {
    chaveOperacao: key,
    descricao: description.value.trim(),
    valorTotal: amount,
    lancamentoEfetivado: mode.value === 'AVISTA' && paid.value,
    tipo: type.value,
    formaPagamento: method.value,
    categoriaId: category.value,
    contasFinanceiroId: account.value,
    dataLancamento: new Date(date.value + 'T12:00:00').toISOString(),
    clienteId: person.value?.id || null,
    tipoLancamentoModo: mode.value,
    ...(mode.value === 'PARCELADO'
      ? {
          parcelas: installments.value,
          periodoParcelamento: period.value,
          intervaloDiasPersonalizado: period.value === 'PERSONALIZADO' ? interval.value : null,
          modoValorParcelamento: valueMode.value,
          valorEntrada: decimal(entry.value),
          dataEntrada: new Date(entryDate.value + 'T12:00:00').toISOString(),
          desconto: decimal(discount.value),
        }
      : {}),
    ...(mode.value === 'RECORRENTE' ? { recorrencia: recurrencePayload(recurrence.value) } : {}),
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
async function save() {
  if (busy.value || uncertain.value || done.value) return
  busy.value = true
  error.value = ''
  let sent = false
  try {
    const body = payload()
    sent = true
    await api.post('/modofacil/financeiro/lancamentos', body)
    message.value = 'Lançamento registrado.'
    dirty.value = false
    done.value = true
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && (!(e as any).response || (e as any).response.status >= 500)) {
      uncertain.value = true
      error.value += ' Confira os lançamentos antes de repetir o envio.'
    }
  } finally {
    busy.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Registrar {{ type === 'RECEITA' ? 'receita' : 'despesa' }}</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/financeiro')">← Dinheiro</FormBack></template
      ></PageHeader
    >

    <p
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
    >
      Use para operações independentes. Vendas e OS faturadas já podem gerar financeiro
      automaticamente; consulte o vínculo antes de criar outro registro.
    </p>
    <Feedback :error="error" :message="message" @retry="error = ''" />
    <form
      v-if="!done"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
      @input="dirty = true"
    >
      <fieldset
        :disabled="busy || uncertain"
        class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
        v-show="!review"
      >
        <FormSection
          title="Dados do lançamento"
          description="Identifique a operação, o valor e o vencimento."
        >
          <label
            >Como será o lançamento?<FormSelect
              v-model="mode"
              :options="[
                { value: 'AVISTA', label: 'Uma parcela' },
                { value: 'PARCELADO', label: 'Parcelado' },
                { value: 'RECORRENTE', label: 'Recorrente' },
              ]" /></label
          ><label
            >Descrição<Input
              :placeholder="
                type === 'RECEITA'
                  ? 'Ex.: Recebimento de serviço'
                  : 'Ex.: Aluguel do estabelecimento'
              "
              v-model="description"
              required /></label
          ><label
            >{{
              mode === 'PARCELADO' && valueMode === 'FIXO_PARCELA'
                ? 'Valor de cada parcela'
                : 'Valor'
            }}<Input placeholder="0,00" v-model="value" inputmode="decimal" required /></label
          ><label
            >Data de lançamento / vencimento<Input
              placeholder="dd/mm/aaaa"
              v-model="date"
              type="date"
              required /></label
        ></FormSection>
        <FormSection
          title="Organização financeira"
          description="Escolha onde registrar e como classificar esta operação."
        >
          <label
            >Categoria<FormSelect
              v-model="category"
              required
              :load-options="loadCategories"
              placeholder="Escolha uma categoria" /></label
          ><label
            >Conta financeira<FormSelect
              v-model="account"
              required
              :load-options="loadAccounts"
              placeholder="Escolha a conta" /></label
          ><label
            >Forma de pagamento<FormSelect v-model="method" :options="financialPaymentOptions"
          /></label>
        </FormSection>
        <FormSection
          v-if="mode === 'PARCELADO'"
          title="Parcelamento"
          description="Defina as parcelas, o intervalo e os valores de entrada."
        >
          <label
            >Quantidade de parcelas<Input
              placeholder="Ex.: 3"
              v-model.number="installments"
              type="number"
              min="1"
              max="360"
              required /></label
          ><label
            >O valor informado é<FormSelect
              v-model="valueMode"
              :options="[
                { value: 'TOTAL', label: 'Total a distribuir' },
                { value: 'FIXO_PARCELA', label: 'Valor fixo de cada parcela' },
              ]" /></label
          ><label
            >Intervalo<FormSelect
              v-model="period"
              :options="[
                ...['MENSAL', 'SEMANAL', 'DIARIO', 'QUINZENAL', 'PERSONALIZADO'].map((p) => ({
                  value: p,
                  label: p,
                })),
              ]" /></label
          ><label v-if="period === 'PERSONALIZADO'"
            >Dias de intervalo<Input
              placeholder="Ex.: 30"
              v-model.number="interval"
              type="number"
              min="1"
              required /></label
          ><label
            >Entrada<Input placeholder="0,00" v-model="entry" inputmode="decimal" required /></label
          ><label
            >Data da entrada<Input
              placeholder="dd/mm/aaaa"
              v-model="entryDate"
              type="date"
              required /></label
          ><label
            >Desconto<Input placeholder="0,00" v-model="discount" inputmode="decimal" required
          /></label>
          <p>
            Parcelas e arredondamento são calculados pelo domínio. A entrada pode registrar
            recebimento na mesma operação.
          </p>
        </FormSection>
        <FormSection
          v-if="mode === 'RECORRENTE'"
          title="Recorrência"
          description="Defina a frequência e as regras das próximas ocorrências."
        >
          <RecurrenceFields
            v-if="mode === 'RECORRENTE'"
            class="mf-full col-span-full"
            v-model="recurrence"
          />
        </FormSection>
        <FormSection
          title="Pessoa vinculada"
          description="Opcional. Selecione o cliente ou fornecedor relacionado."
        >
          <div class="col-span-full">
            <p v-if="person">
              {{ person.nome }}
              <button type="button" @click="person = null">Remover vínculo</button>
            </p>
            <ItemSearch kind="PESSOA" @select="person = $event" />
          </div>
        </FormSection>
        <label
          v-if="mode === 'AVISTA'"
          class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-500/10"
          ><FormSwitch v-model="paid" />Já {{ type === 'RECEITA' ? 'recebi' : 'paguei' }}</label
        >
        <p v-if="paid && mode === 'AVISTA'" class="mf-muted text-sm text-muted-foreground">
          O pagamento será registrado na mesma data do lançamento. Para outra data, registre
          pendente e pague pelos detalhes.
        </p>
      </fieldset>
      <ReviewPanel v-if="review">
        <template #title>Confira o lançamento</template>
        <p>{{ description }} · {{ value }} · {{ type }}</p>
        <p>
          {{ mode === 'AVISTA' && paid ? 'Já realizado' : 'Pendente' }} · {{ date }} · {{ mode }}
        </p>
        <p v-if="mode === 'PARCELADO'">
          {{ installments }} parcelas · {{ period }} · {{ valueMode }} · entrada {{ entry }} em
          {{ entryDate }} · desconto {{ discount }}.
        </p>
        <p v-if="mode === 'RECORRENTE'">
          {{ recurrence.frequencia }} · {{ recurrence.valorParcela }} por ocorrência · de
          {{ recurrence.dataInicio }} até {{ recurrence.dataFim || 'sem fim' }}.
        </p>
        <p>Pessoa: {{ person?.nome || 'Sem vínculo' }}.</p>
        <p>
          Conta: {{ accounts.find((a) => a.id === account)?.nome }} · Categoria:
          {{ categories.find((a) => a.id === category)?.nome }}
        </p>
      </ReviewPanel>
      <div class="mf-form-actions mf-actions my-4 flex flex-wrap items-end gap-3">
        <button type="button" v-if="review" @click="review = false">Voltar</button
        ><button
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          :disabled="busy || uncertain"
        >
          {{ busy ? 'Registrando…' : review ? 'Confirmar lançamento' : 'Conferir' }}
        </button>
      </div>
    </form>
    <SuccessPanel
      v-if="done"
      title="Lançamento registrado"
      :to="formDestination('/modofacil/financeiro')"
      label="Ver lançamentos"
    />
  </PageFrame>
</template>
