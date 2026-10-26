<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import ModalDialog from '../components/ModalDialog.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api, type Row, LancamentosRepository } from '../adapters/domain'
import { money, dateLabel, today, decimal, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
const route = useRoute(),
  record = ref<Row | null>(null),
  accounts = ref<Row[]>([]),
  selected = ref<Row | null>(null),
  action = ref<'pagar' | 'estornar' | null>(null),
  date = ref(today()),
  method = ref('PIX'),
  account = ref<number | null>(null),
  value = ref(''),
  due = ref(today()),
  loading = ref(false),
  loadError = ref(''),
  validation = ref(''),
  review = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(computed(() => selected.value !== null))
const remaining = computed(
  () =>
    Math.round((Number(selected.value?.valor || 0) - Number(value.value.replace(',', '.'))) * 100) /
    100,
)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    ;[record.value, accounts.value] = await Promise.all([
      api.read(`/modofacil/financeiro/lancamentos/${Number(route.params.id)}`),
      api.read('/modofacil/financeiro/contas'),
    ])
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
function choose(row: Row, next: 'pagar' | 'estornar') {
  selected.value = row
  action.value = next
  value.value = String(row.valor)
  account.value = row.contaFinanceira || record.value?.contasFinanceiroId || null
  review.value = false
  validation.value = ''
}
function payload() {
  if (!selected.value || !account.value) throw new Error('Escolha a parcela e a conta de destino.')
  const amount = decimal(value.value)
  if (amount <= 0 || amount > Number(selected.value.valor))
    throw new Error('Informe um valor maior que zero e até o valor da parcela.')
  if (remaining.value > 0 && !due.value) throw new Error('Informe o vencimento do saldo pendente.')
  return {
    dataPagamento: new Date(date.value + 'T12:00:00').toISOString(),
    metodoPagamento: method.value as any,
    contaPagamento: account.value,
    valorRecebido: amount,
    ...(remaining.value > 0
      ? {
          criarSaldoPendente: true,
          novoVencimento: new Date(due.value + 'T12:00:00').toISOString(),
        }
      : { criarSaldoPendente: false }),
  }
}
function next() {
  validation.value = ''
  try {
    payload()
    review.value = true
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function settle() {
  validation.value = ''
  let body
  try {
    body = payload()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(
    () => LancamentosRepository.pagarParcela(selected.value!.id, body),
    remaining.value > 0
      ? 'Pagamento parcial registrado e saldo reagendado.'
      : 'Pagamento integral registrado.',
  )
  if (result) {
    selected.value = null
    action.value = null
    await load()
  }
}
async function reverse() {
  const result = await run(
    () => LancamentosRepository.reverse(selected.value!.id),
    'Pagamento estornado.',
  )
  if (result) {
    selected.value = null
    action.value = null
    await load()
  }
}
</script>
<template>
  <PageFrame>
    <RouterLink to="/modofacil/financeiro">← Dinheiro</RouterLink
    ><Feedback
      :loading="loading"
      :error="validation || loadError || error"
      :message="message"
      @retry="load"
    />
    <section
      v-if="record"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <div class="space-y-3 border-b border-border pb-4">
        <PageHeader
          ><template #title>{{ record.descricao }}</template></PageHeader
        >
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge :value="record.tipo" /><StatusBadge :value="record.status" /><strong
            class="text-xl text-foreground"
            >{{ money(record.valorTotal) }}</strong
          >
        </div>
      </div>

      <p>Conta: {{ record.ContasFinanceiro?.nome }} · Categoria: {{ record.categoria?.nome }}</p>
      <p
        v-if="record.vendaId || record.ordemServicoId"
        class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
      >
        Lançamento vinculado à venda/OS. Receba pelas parcelas existentes, sem criar outra receita.
      </p>
      <ModalAction form="lancamento-editar" :params="{ id: record.id }"
        >Editar informações básicas</ModalAction
      >
      <nav class="mf-actions my-4 flex flex-wrap items-end gap-3">
        <ModalAction form="financeiro-parcela" :params="{ id: record.id }"
          >Adicionar parcela</ModalAction
        ><ModalAction form="financeiro-recorrencia" :params="{ id: record.id }"
          >Organizar recorrência</ModalAction
        >
      </nav>
      <h2>Parcelas</h2>
      <ul class="mf-list m-0 grid list-none gap-3 p-0">
        <li
          v-for="part in record.parcelas"
          :key="part.id"
          class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
        >
          <div>
            <strong>Parcela {{ part.numero }} · {{ money(part.valor) }}</strong>
            <p>
              Vencimento {{ dateLabel(part.vencimento) }} · {{ part.pago ? 'Paga' : 'Pendente' }}
            </p>
            <small v-if="part.dataPagamento"
              >Pagamento {{ dateLabel(part.dataPagamento) }} ·
              {{ part.ContaFinanceira?.nome }}</small
            >
          </div>
          <div
            class="flex w-full flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:justify-end"
          >
            <ModalAction form="financeiro-parcela" :params="{ id: record.id, parcelaId: part.id }"
              >Editar parcela</ModalAction
            ><ModalAction
              v-if="!part.pago"
              form="financeiro-cobranca-nova"
              :query="{ tipo: 'parcela', origem: part.id, lancamento: record.id }"
              >Criar cobrança</ModalAction
            ><button
              v-if="!part.pago"
              :disabled="busy || uncertain"
              class="!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
              @click="choose(part, 'pagar')"
            >
              Registrar pagamento</button
            ><button
              v-else
              class="mf-danger !border-red-500/30 !bg-red-500/10 !text-red-600 dark:!text-red-300 hover:!bg-red-500/15"
              :disabled="busy || uncertain"
              @click="choose(part, 'estornar')"
            >
              Estornar pagamento
            </button>
          </div>
        </li>
      </ul>
    </section>
    <ModalDialog
      v-if="selected && action === 'pagar'"
      title="Registrar pagamento"
      :description="`Parcela ${selected.numero} · ${money(selected.valor)}`"
      :busy="busy"
      :error="validation || error"
      :uncertain="uncertain"
      @close="selected = null"
      ><form
        v-if="selected && action === 'pagar'"
        class="space-y-4"
        @submit.prevent="review ? settle() : next()"
      >
        <fieldset
          class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
          :disabled="busy || uncertain"
        >
          <template v-if="!review"
            ><label
              >Valor recebido / pago<Input v-model="value" inputmode="decimal" required /></label
            ><label>Data de pagamento<Input v-model="date" type="date" required /></label
            ><label
              >Conta financeira<select v-model="account" required>
                <option :value="null" disabled>Escolha a conta</option>
                <option v-for="row in accounts" :key="row.id" :value="row.id">
                  {{ row.nome }}
                </option>
              </select></label
            ><label
              >Método<select v-model="method">
                <option
                  v-for="m in [
                    'PIX',
                    'DINHEIRO',
                    'DEBITO',
                    'CREDITO',
                    'BOLETO',
                    'TRANSFERENCIA',
                    'CHEQUE',
                  ]"
                  :key="m"
                >
                  {{ m }}
                </option>
              </select></label
            ><label v-if="remaining > 0"
              >Vencimento do saldo pendente<Input v-model="due" type="date" required /><small
                >O domínio criará uma nova parcela de {{ money(remaining) }}.</small
              ></label
            ></template
          >
          <ReviewPanel v-else title="Confira o pagamento">
            <p>Valor agora: {{ value }} · {{ date }} · {{ method }}</p>
            <p>Conta: {{ accounts.find((a) => a.id === account)?.nome }}</p>
            <p v-if="remaining > 0">
              Saldo pendente: {{ money(remaining) }} · novo vencimento {{ due }}.
            </p>
            <p v-else>Parcela quitada integralmente.</p>
          </ReviewPanel>
          <div
            class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
          >
            <button type="button" @click="review ? (review = false) : (selected = null)">
              Voltar</button
            ><button
              class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
            >
              {{ busy ? 'Registrando…' : review ? 'Confirmar pagamento' : 'Conferir pagamento' }}
            </button>
          </div>
        </fieldset>
      </form></ModalDialog
    >
    <ModalDialog
      v-if="selected && action === 'estornar'"
      title="Confirmar estorno do pagamento"
      :busy="busy"
      :error="error"
      :uncertain="uncertain"
      danger
      @close="selected = null"
    >
      <p>Parcela {{ selected.numero }} · {{ money(selected.valor) }}.</p>
      <p
        class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
      >
        A parcela volta a pendente e o domínio atualiza os vínculos financeiros existentes. Uma
        parcela de saldo criada anteriormente não é removida por este estorno.
      </p>
      <template #footer>
        <button :disabled="busy" @click="selected = null">Voltar</button
        ><button
          class="!border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
          :disabled="busy || uncertain"
          @click="reverse"
        >
          Confirmar estorno do pagamento
        </button>
      </template>
    </ModalDialog>
  </PageFrame>
</template>
