<script setup lang="ts">
import DeleteRecord from '../components/DeleteRecord.vue'
import { financialPaymentOptions } from '../application/payments'
import { useLookupOptions } from '../adapters/lookups'
import FormSelect from '../components/FormSelect.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageControls from '../components/PageControls.vue'
import RecordActions from '../components/RecordActions.vue'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Pencil, Plus, RefreshCw, Receipt, Undo2 } from 'lucide-vue-next'
import { financeSummary, parcelStatus, paymentLabel } from '../application/financeDetail'
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import ModalDialog from '../components/ModalDialog.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, type Row, LancamentosRepository } from '../adapters/domain'
import { money, dateLabel, today, decimal, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
const route = useRoute(),
  record = ref<Row | null>(null),
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
const parcelSearch = ref(''),
  parcelFilter = ref('TODAS'),
  parcelPage = ref(1)
const parcels = computed<Row[]>(() =>
  [...(record.value?.parcelas || [])].sort((a, b) => a.numero - b.numero || a.id - b.id),
)
const summary = computed(() => financeSummary(record.value || {}))
const filteredParcels = computed(() =>
  parcels.value.filter(
    (part) =>
      (parcelFilter.value === 'TODAS' ||
        (parcelFilter.value === 'PENDENTE'
          ? !part.pago
          : parcelStatus(part) === parcelFilter.value)) &&
      `${part.numero} ${part.Uid || ''} ${part.descricao || ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(parcelSearch.value.toLocaleLowerCase('pt-BR').trim()),
  ),
)
const parcelPages = computed(() => Math.max(1, Math.ceil(filteredParcels.value.length / 10)))
const visibleParcels = computed(() =>
  filteredParcels.value.slice((parcelPage.value - 1) * 10, parcelPage.value * 10),
)
const charges = computed<Row[]>(() =>
  parcels.value.flatMap((part) =>
    (part.CobrancasFinanceiras || []).map((charge: Row) => ({
      ...charge,
      parcelaNumero: part.numero,
    })),
  ),
)
const frequencyLabels: Record<string, string> = {
  DIARIO: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PERSONALIZADO: 'Personalizada',
}
watch([parcelSearch, parcelFilter], () => (parcelPage.value = 1))
watch(parcelPages, (pages) => (parcelPage.value = Math.min(parcelPage.value, pages)))
const { load: loadAccounts, rows: accounts } = useLookupOptions('finance-accounts')
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
    const result = await api.read(`/modofacil/financeiro/lancamentos/${Number(route.params.id)}`)
    if (!result?.id) throw new Error('Lançamento não encontrado.')
    record.value = result
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
function choose(row: Row, next: 'pagar' | 'estornar') {
  if (busy.value || uncertain.value || loading.value) return
  selected.value = row
  action.value = next
  value.value = String(row.valor)
  account.value = row.contaFinanceira || record.value?.contasFinanceiroId || null
  date.value = today()
  due.value = today()
  const preferred = row.formaPagamento || record.value?.formaPagamento
  method.value = financialPaymentOptions.some((option) => option.value === preferred)
    ? preferred
    : 'PIX'
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
    <Feedback :loading="loading" :error="loadError" :message="message" @retry="load" />
    <template v-if="record">
      <PageHeader
        :title="record.descricao"
        :description="`${record.Uid || `Lançamento #${record.id}`} · ${dateLabel(record.dataLancamento)}`"
        back="/modofacil/financeiro"
        back-label="Financeiro"
      >
        <template #actions>
          <ModalAction form="lancamento-editar" :params="{ id: record.id }"
            ><Pencil :size="15" />Editar informações</ModalAction
          >
          <DeleteRecord
            kind="finance"
            :record="record"
            :disabled="loading || busy || uncertain"
            redirect="/modofacil/financeiro"
        /></template>
      </PageHeader>
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :value="record.tipo" /><StatusBadge :value="record.status" />
        <StatusBadge v-if="record.ignorado" value="IGNORADO" label="Fora dos resumos" />
        <span v-if="record.recorrencia" class="text-xs text-muted-foreground"
          >Lançamento recorrente</span
        >
      </div>
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumo das parcelas">
        <section
          v-for="metric in [
            {
              label: 'Valor do lançamento',
              value: record.valorTotal,
              hint: 'Total registrado',
              tone: '',
            },
            {
              label: record.tipo === 'DESPESA' ? 'Pago' : 'Recebido',
              value: summary.paid,
              hint: `${summary.paidCount} parcela(s) quitada(s)`,
              tone: 'text-emerald-700 dark:text-emerald-300',
            },
            {
              label: record.tipo === 'DESPESA' ? 'A pagar' : 'A receber',
              value: summary.pending,
              hint: `${summary.pendingCount} parcela(s) em aberto`,
              tone: '',
            },
            {
              label: 'Em atraso',
              value: summary.overdue,
              hint: `${summary.overdueCount} parcela(s) vencida(s)`,
              tone: summary.overdueCount ? 'text-destructive' : '',
            },
          ]"
          :key="metric.label"
          class="mf-card min-w-0 rounded-lg border border-border bg-card p-4"
        >
          <p
            class="!mb-2 !text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
          >
            {{ metric.label }}
          </p>
          <p class="!mb-1 !text-xl font-semibold tracking-tight" :class="metric.tone">
            {{ money(metric.value) }}
          </p>
          <small>{{ metric.hint }}</small>
        </section>
      </div>
      <section
        class="mf-card rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="finance-info-title"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="finance-info-title" class="!mb-0">Informações do lançamento</h2>
          <span class="text-xs text-muted-foreground"
            >{{ summary.paidCount }} de {{ parcels.length - summary.ignoredCount }} parcelas
            quitadas · {{ summary.progress }}%</span
          >
        </div>
        <div
          role="progressbar"
          aria-label="Quitação das parcelas"
          :aria-valuenow="summary.progress"
          :aria-valuemin="0"
          :aria-valuemax="100"
          class="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div class="h-full rounded-full bg-primary" :style="{ width: `${summary.progress}%` }" />
        </div>
        <dl class="mf-info-grid">
          <div>
            <dt>Conta financeira</dt>
            <dd>{{ record.ContasFinanceiro?.nome || 'Não informada' }}</dd>
          </div>
          <div>
            <dt>Categoria</dt>
            <dd>{{ record.categoria?.nome || 'Não informada' }}</dd>
          </div>
          <div>
            <dt>{{ record.tipo === 'DESPESA' ? 'Fornecedor / pessoa' : 'Cliente / pessoa' }}</dt>
            <dd>
              <RouterLink
                v-if="record.clienteId && record.cliente?.nome"
                :to="`/modofacil/pessoas/${record.clienteId}`"
                >{{ record.cliente.nome }}</RouterLink
              ><span v-else>{{ record.cliente?.nome || 'Não vinculada' }}</span>
            </dd>
          </div>
          <div>
            <dt>Forma de pagamento prevista</dt>
            <dd>{{ paymentLabel(record.formaPagamento) }}</dd>
          </div>
          <div>
            <dt>Data do lançamento</dt>
            <dd>{{ dateLabel(record.dataLancamento) }}</dd>
          </div>
          <div>
            <dt>Próximo vencimento em aberto</dt>
            <dd>
              {{ summary.next ? dateLabel(summary.next.vencimento) : 'Sem parcelas em aberto' }}
            </dd>
          </div>
          <div v-if="record.valorBruto != null">
            <dt>Valor bruto</dt>
            <dd>{{ money(record.valorBruto) }}</dd>
          </div>
          <div v-if="Number(record.desconto) > 0">
            <dt>Desconto</dt>
            <dd>{{ money(record.desconto) }}</dd>
          </div>
          <div v-if="Number(record.valorEntrada) > 0">
            <dt>Entrada registrada</dt>
            <dd>
              {{ money(record.valorEntrada)
              }}<small v-if="record.dataEntrada">{{ dateLabel(record.dataEntrada) }}</small>
            </dd>
          </div>
          <div v-if="record.createdAt">
            <dt>Criado em</dt>
            <dd>{{ dateLabel(record.createdAt) }}</dd>
          </div>
          <div v-if="record.vendaId">
            <dt>Venda vinculada</dt>
            <dd>
              <RouterLink :to="`/modofacil/vendas/${record.vendaId}`"
                >Ver venda #{{ record.vendaId }}</RouterLink
              >
            </dd>
          </div>
          <div v-if="record.ordemServicoId">
            <dt>Ordem de serviço vinculada</dt>
            <dd>
              <RouterLink :to="`/modofacil/servicos/ordens/${record.ordemServicoId}`"
                >Ver OS #{{ record.ordemServicoId }}</RouterLink
              >
            </dd>
          </div>
          <div v-if="record.assinaturaPagar">
            <dt>Assinatura vinculada</dt>
            <dd>
              {{ record.assinaturaPagar.nomeServico
              }}<small>{{ record.assinaturaPagar.Uid }}</small>
            </dd>
          </div>
        </dl>
        <p
          v-if="record.vendaId || record.ordemServicoId"
          class="mf-notice mt-4 !mb-0 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"
        >
          Este lançamento está vinculado a uma operação. Registre o pagamento nas parcelas
          existentes para manter o vínculo.
        </p>
        <p v-if="summary.ignoredCount" class="mt-4 !mb-0 text-xs text-muted-foreground">
          {{ summary.ignoredCount }} parcela(s) fora dos resumos financeiros. Elas continuam
          visíveis na lista abaixo.
        </p>
      </section>
      <section
        v-if="record.recorrencia"
        class="mf-card rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="finance-recurrence-title"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="finance-recurrence-title" class="!mb-0">Recorrência</h2>
          <StatusBadge
            :value="record.recorrencia.encerradaEm ? 'INATIVO' : record.recorrencia.ativo"
            :label="
              record.recorrencia.encerradaEm
                ? 'Encerrada'
                : record.recorrencia.ativo
                  ? 'Ativa'
                  : 'Pausada'
            "
          />
        </div>
        <dl class="mf-info-grid">
          <div>
            <dt>Frequência</dt>
            <dd>
              {{ frequencyLabels[record.recorrencia.frequencia] || record.recorrencia.frequencia
              }}<small v-if="record.recorrencia.intervaloDias"
                >A cada {{ record.recorrencia.intervaloDias }} dias</small
              >
            </dd>
          </div>
          <div>
            <dt>Valor por ocorrência</dt>
            <dd>{{ money(record.recorrencia.valorParcela) }}</dd>
          </div>
          <div>
            <dt>Próximo vencimento</dt>
            <dd>{{ dateLabel(record.recorrencia.proximoVencimento) }}</dd>
          </div>
          <div>
            <dt>Geração automática</dt>
            <dd>{{ record.recorrencia.geracaoAutomatica ? 'Ativada' : 'Desativada' }}</dd>
          </div>
        </dl>
      </section>
      <section
        class="mf-card min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="finance-parcels-title"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="finance-parcels-title" class="!mb-1">Parcelas</h2>
            <p class="!mb-0 !text-xs text-muted-foreground">
              {{ parcels.length }} parcela(s) · valores, vencimentos e pagamentos
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <ModalAction form="financeiro-parcela" :params="{ id: record.id }"
              ><Plus :size="15" />Adicionar parcela</ModalAction
            >
            <ModalAction form="financeiro-recorrencia" :params="{ id: record.id }"
              ><RefreshCw :size="15" />{{
                record.recorrencia ? 'Organizar recorrência' : 'Criar recorrência'
              }}</ModalAction
            >
          </div>
        </div>
        <div class="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label
            >Buscar parcela<Input
              type="search"
              v-model="parcelSearch"
              placeholder="Buscar por número, código ou descrição"
          /></label>
          <label
            >Situação<FormSelect
              v-model="parcelFilter"
              :options="[
                { value: 'TODAS', label: 'Todas as parcelas' },
                { value: 'PENDENTE', label: 'Em aberto' },
                { value: 'PAGO', label: 'Pagas' },
                { value: 'ATRASADO', label: 'Em atraso' },
              ]"
          /></label>
        </div>
        <RecordsTable
          :rows="visibleParcels"
          :loading="loading"
          :failed="!!loadError"
          :min-width="1000"
          caption="Parcelas do lançamento"
          empty="Nenhuma parcela encontrada."
          :columns="[
            { key: 'number', label: 'Parcela' },
            { key: 'due', label: 'Vencimento' },
            { key: 'amount', label: 'Valor', right: true },
            { key: 'status', label: 'Situação' },
            { key: 'payment', label: 'Pagamento' },
            { key: 'account', label: 'Conta financeira' },
            { key: 'actions', label: 'Ações', right: true },
          ]"
        >
          <template #number="{ row }"
            ><strong>Parcela {{ row.numero }}</strong
            ><small v-if="row.descricao">{{ row.descricao }}</small
            ><small v-if="row.Uid">{{ row.Uid }}</small></template
          >
          <template #due="{ row }">{{ dateLabel(row.vencimento) }}</template>
          <template #amount="{ row }"
            ><strong class="whitespace-nowrap">{{ money(row.valor) }}</strong></template
          >
          <template #status="{ row }"
            ><StatusBadge :value="parcelStatus(row)" /><small v-if="row.ignorado || record.ignorado"
              >Fora dos resumos</small
            ></template
          >
          <template #payment="{ row }"
            ><template v-if="row.pago"
              >{{ dateLabel(row.dataPagamento)
              }}<small
                >{{ paymentLabel(row.formaPagamento) }} ·
                {{ money(row.valorPago ?? row.valor) }}</small
              ></template
            ><span v-else class="text-muted-foreground">Não registrado</span></template
          >
          <template #account="{ row }">{{
            row.ContaFinanceira?.nome ||
            (row.contaFinanceira && row.contaFinanceira !== record.contasFinanceiroId
              ? `Conta #${row.contaFinanceira}`
              : record.ContasFinanceiro?.nome || 'Não informada')
          }}</template>
          <template #actions="{ row }">
            <div class="flex flex-wrap items-center gap-2 md:justify-end">
              <button
                v-if="!row.pago"
                :disabled="busy || uncertain || loading"
                class="mf-primary !min-h-8 !px-2.5 !py-1 !text-xs"
                @click="choose(row, 'pagar')"
              >
                Registrar pagamento
              </button>
              <RecordActions
                :label="`Ações da parcela ${row.numero}`"
                :disabled="busy || uncertain || loading"
              >
                <DropdownMenuItem as-child
                  ><ModalAction
                    form="financeiro-parcela"
                    :params="{ id: record.id, parcelaId: row.id }"
                    ><Pencil :size="15" />Editar parcela</ModalAction
                  ></DropdownMenuItem
                >
                <DropdownMenuItem v-if="!row.pago" as-child
                  ><ModalAction
                    form="financeiro-cobranca-nova"
                    :query="{ tipo: 'parcela', origem: row.id, lancamento: record.id }"
                    ><Receipt :size="15" />Criar cobrança</ModalAction
                  ></DropdownMenuItem
                >
                <DropdownMenuItem
                  v-if="row.pago"
                  class="text-destructive focus:text-destructive"
                  @select="choose(row, 'estornar')"
                  ><Undo2 :size="15" />Estornar pagamento</DropdownMenuItem
                >
              </RecordActions>
            </div>
          </template>
        </RecordsTable>
        <PageControls
          v-if="filteredParcels.length"
          :page="parcelPage"
          :pages="parcelPages"
          :total="filteredParcels.length"
          :loading="loading"
          @change="parcelPage = $event"
        />
      </section>
      <section
        v-if="charges.length"
        class="mf-card min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="!mb-0">Cobranças vinculadas</h2>
          <RouterLink to="/modofacil/financeiro/cobrancas" class="mf-button"
            >Ver cobranças</RouterLink
          >
        </div>
        <RecordsTable
          :rows="charges"
          caption="Cobranças vinculadas às parcelas"
          :columns="[
            { key: 'code', label: 'Código / parcela' },
            { key: 'status', label: 'Situação' },
            { key: 'value', label: 'Valor', right: true },
            { key: 'due', label: 'Vencimento' },
            { key: 'link', label: 'Link', right: true },
          ]"
        >
          <template #code="{ row }"
            ><strong>{{ row.Uid || `Cobrança #${row.id}` }}</strong
            ><small>Parcela {{ row.parcelaNumero }}</small></template
          >
          <template #status="{ row }"><StatusBadge :value="row.status" /></template>
          <template #value="{ row }">{{ money(row.valor) }}</template>
          <template #due="{ row }">{{ dateLabel(row.dataVencimento) }}</template>
          <template #link="{ row }"
            ><a
              v-if="row.externalLink && /^https?:\/\//.test(row.externalLink)"
              :href="row.externalLink"
              target="_blank"
              rel="noopener noreferrer"
              class="mf-button"
              >Abrir cobrança</a
            ><span v-else class="text-muted-foreground">Não disponível</span></template
          >
        </RecordsTable>
      </section>
    </template>
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
              >Valor recebido / pago<Input
                placeholder="0,00"
                v-model="value"
                inputmode="decimal"
                required /></label
            ><label
              >Data de pagamento<Input
                placeholder="dd/mm/aaaa"
                v-model="date"
                type="date"
                required /></label
            ><label
              >Conta financeira<FormSelect
                v-model="account"
                required
                :load-options="loadAccounts"
                placeholder="Escolha a conta" /></label
            ><label>Método<FormSelect v-model="method" :options="financialPaymentOptions" /></label
            ><label v-if="remaining > 0"
              >Vencimento do saldo pendente<Input
                placeholder="dd/mm/aaaa"
                v-model="due"
                type="date"
                required
              /><small>O domínio criará uma nova parcela de {{ money(remaining) }}.</small></label
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
            class="mf-form-actions mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
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
