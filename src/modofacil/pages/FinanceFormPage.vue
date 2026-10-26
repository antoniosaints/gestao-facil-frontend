<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
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
  categories = ref<Row[]>([]),
  accounts = ref<Row[]>([]),
  busy = ref(false),
  loading = ref(false),
  error = ref(''),
  message = ref(''),
  dirty = ref(false),
  done = ref(false),
  uncertain = ref(false),
  review = ref(false)
useFlow(dirty, busy)
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[categories.value, accounts.value] = await Promise.all([
      api.read('/modofacil/financeiro/categorias'),
      api.read('/modofacil/financeiro/contas'),
    ])
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function save() {
  busy.value = true
  error.value = ''
  let sent = false
  try {
    const amount = decimal(value.value)
    if (amount <= 0) throw new Error('Informe um valor maior que zero.')
    if (!account.value || !category.value)
      throw new Error('Escolha a conta financeira e a categoria.')
    const recurring = mode.value === 'RECORRENTE' ? recurrencePayload(recurrence.value) : null
    const entryValue = decimal(entry.value),
      discountValue = decimal(discount.value)
    sent = true
    await api.post('/modofacil/financeiro/lancamentos', {
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
            valorEntrada: entryValue,
            dataEntrada: new Date(entryDate.value + 'T12:00:00').toISOString(),
            desconto: discountValue,
          }
        : {}),
      ...(mode.value === 'RECORRENTE' ? { recorrencia: recurring } : {}),
    })
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
    <Feedback :error="error" :loading="loading" :message="message" @retry="error = ''" />
    <form
      v-if="!done"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : (review = true)"
      @input="dirty = true"
    >
      <fieldset
        :disabled="busy || uncertain"
        class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
        v-show="!review"
      >
        <label
          >Como será o lançamento?<select v-model="mode">
            <option value="AVISTA">Uma parcela</option>
            <option value="PARCELADO">Parcelado</option>
            <option value="RECORRENTE">Recorrente</option>
          </select></label
        ><label>Descrição<Input v-model="description" required /></label
        ><label
          >{{
            mode === 'PARCELADO' && valueMode === 'FIXO_PARCELA'
              ? 'Valor de cada parcela'
              : 'Valor'
          }}<Input v-model="value" inputmode="decimal" required /></label
        ><label>Data de lançamento / vencimento<Input v-model="date" type="date" required /></label
        ><label
          >Categoria<select v-model="category" required>
            <option :value="null" disabled>Escolha uma categoria</option>
            <option v-for="row in categories" :key="row.id" :value="row.id">{{ row.nome }}</option>
          </select></label
        ><label
          >Conta financeira<select v-model="account" required>
            <option :value="null" disabled>Escolha a conta</option>
            <option v-for="row in accounts" :key="row.id" :value="row.id">{{ row.nome }}</option>
          </select></label
        ><label
          >Forma de pagamento<select v-model="method">
            <option
              v-for="item in [
                'PIX',
                'DINHEIRO',
                'DEBITO',
                'CREDITO',
                'BOLETO',
                'TRANSFERENCIA',
                'CHEQUE',
              ]"
              :key="item"
            >
              {{ item }}
            </option>
          </select></label
        >
        <section
          v-if="mode === 'PARCELADO'"
          class="mf-full col-span-full mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <label
            >Quantidade de parcelas<Input
              v-model.number="installments"
              type="number"
              min="1"
              max="360"
              required /></label
          ><label
            >O valor informado é<select v-model="valueMode">
              <option value="TOTAL">Total a distribuir</option>
              <option value="FIXO_PARCELA">Valor fixo de cada parcela</option>
            </select></label
          ><label
            >Intervalo<select v-model="period">
              <option
                v-for="p in ['MENSAL', 'SEMANAL', 'DIARIO', 'QUINZENAL', 'PERSONALIZADO']"
                :key="p"
              >
                {{ p }}
              </option>
            </select></label
          ><label v-if="period === 'PERSONALIZADO'"
            >Dias de intervalo<Input
              v-model.number="interval"
              type="number"
              min="1"
              required /></label
          ><label>Entrada<Input v-model="entry" inputmode="decimal" required /></label
          ><label>Data da entrada<Input v-model="entryDate" type="date" required /></label
          ><label>Desconto<Input v-model="discount" inputmode="decimal" required /></label>
          <p>
            Parcelas e arredondamento são calculados pelo domínio. A entrada pode registrar
            recebimento na mesma operação.
          </p>
        </section>
        <RecurrenceFields
          v-if="mode === 'RECORRENTE'"
          class="mf-full col-span-full"
          v-model="recurrence"
        />
        <section class="mf-full col-span-full">
          <h2>Pessoa vinculada (opcional)</h2>
          <p v-if="person">
            {{ person.nome }} <button type="button" @click="person = null">Remover vínculo</button>
          </p>
          <ItemSearch kind="PESSOA" @select="person = $event" />
        </section>
        <label
          v-if="mode === 'AVISTA'"
          class="mf-choice mb-3 !flex items-center gap-3 rounded-[6px] border border-border p-4 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10"
          ><input v-model="paid" type="checkbox" />Já
          {{ type === 'RECEITA' ? 'recebi' : 'paguei' }}</label
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
      <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
        <button type="button" v-if="review" @click="review = false">Voltar</button
        ><button
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          :disabled="busy || uncertain || !accounts.length || !categories.length"
        >
          {{ busy ? 'Registrando…' : review ? 'Confirmar lançamento' : 'Conferir' }}
        </button>
      </div>
      <p v-if="!loading && (!accounts.length || !categories.length)" role="alert">
        Peça ao administrador para cadastrar conta financeira e categoria antes de registrar.
      </p>
    </form>
    <SuccessPanel
      v-if="done"
      title="Lançamento registrado"
      :to="formDestination('/modofacil/financeiro')"
      label="Ver lançamentos"
    />
  </PageFrame>
</template>
