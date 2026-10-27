<script setup lang="ts">
import FormSelect from '../components/FormSelect.vue'
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { useConfirmation } from '../application/confirmation'
import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { CaixaRepository } from '../adapters/domain'
import { decimal, errorMessage, money } from '../application/format'
import Feedback from '../components/Feedback.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageControls from '../components/PageControls.vue'
import FormSection from '../components/FormSection.vue'
import StatusBadge from '../components/StatusBadge.vue'
import {
  Banknote,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  LockKeyhole,
  RefreshCw,
  Store,
  Clock3,
} from 'lucide-vue-next'
import { paymentLabel } from '../application/financeDetail'
import { detailSearch } from '../application/detailRecords'
import type { Row } from '../adapters/domain'
const editorOpen = ref(false)
const context = ref<Awaited<ReturnType<typeof CaixaRepository.contexto>> | null>(null),
  action = ref('REFORCO'),
  value = ref('0'),
  description = ref(''),
  pdvId = ref<number | null>(null),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  summary = ref<any>(null),
  uncertain = ref(false)
const search = ref(''),
  movementType = ref('TODOS'),
  page = ref(1)
const activeCash = computed(() => context.value?.caixaAtivo)
const movementLabels: Record<string, string> = {
  ABERTURA: 'Abertura',
  VENDA: 'Venda',
  REFORCO: 'Reforço',
  SANGRIA: 'Retirada',
  ESTORNO: 'Estorno',
  FECHAMENTO: 'Fechamento',
}
const movementTone = (type: string) =>
  ['VENDA', 'REFORCO'].includes(type)
    ? 'ENTRADA'
    : ['SANGRIA', 'ESTORNO'].includes(type)
      ? 'SAIDA'
      : type
function dateTime(value: string | Date | null | undefined) {
  if (!value) return 'Não informado'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Não informado'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
const movements = computed<Row[]>(() =>
  [...(summary.value?.movimentos || [])].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() || b.id - a.id,
  ),
)
const filteredMovements = computed(() =>
  movements.value.filter(
    (row) =>
      (movementType.value === 'TODOS' || row.tipo === movementType.value) &&
      detailSearch(
        `${row.descricao || ''} ${movementLabels[row.tipo] || row.tipo} ${row.vendaId || ''}`,
      ).includes(detailSearch(search.value)),
  ),
)
const pages = computed(() => Math.max(1, Math.ceil(filteredMovements.value.length / 10)))
const visibleMovements = computed(() =>
  filteredMovements.value.slice((page.value - 1) * 10, page.value * 10),
)
watch([search, movementType], () => (page.value = 1))
watch(pages, (count) => (page.value = Math.min(page.value, count)))
const methods = computed<Row[]>(() =>
  Object.entries(summary.value?.resumo?.porMetodo || {}).map(([method, amount], index) => ({
    id: index,
    method,
    amount,
  })),
)
const metrics = computed(() => [
  {
    label: 'Saldo esperado',
    value: money(summary.value?.resumo?.saldoEsperado ?? activeCash.value?.saldoEsperado),
    hint: 'Saldo previsto para o fechamento',
    tone: 'text-primary',
  },
  {
    label: 'Vendas no turno',
    value: money(summary.value?.resumo?.totalVendido),
    hint:
      summary.value?.resumo?.totalVendas != null
        ? `${summary.value.resumo.totalVendas} venda(s) registrada(s)`
        : 'Total vendido neste caixa',
  },
  {
    label: 'Reforços',
    value: money(summary.value?.resumo?.totalReforcos),
    hint: 'Dinheiro adicionado ao caixa',
    tone: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Retiradas',
    value: money(summary.value?.resumo?.totalSangrias),
    hint: 'Sangrias registradas no turno',
    tone: 'text-orange-700 dark:text-orange-300',
  },
])
const difference = computed(() => {
  if (!value.value.trim()) return null
  const expected = summary.value?.resumo?.saldoEsperado ?? activeCash.value?.saldoEsperado
  if (expected == null) return null
  try {
    return Math.round((decimal(value.value) - Number(expected)) * 100) / 100
  } catch {
    return null
  }
})
function openEditor(operation = 'REFORCO') {
  action.value = operation
  value.value = activeCash.value ? '' : '0'
  description.value = ''
  editorOpen.value = true
}
const editorTitle = computed(() =>
  !activeCash.value
    ? 'Abrir caixa'
    : action.value === 'fechar'
      ? 'Fechar caixa'
      : action.value === 'SANGRIA'
        ? 'Retirar dinheiro'
        : 'Adicionar dinheiro',
)
async function load() {
  busy.value = true
  error.value = ''
  try {
    summary.value = null
    context.value = await CaixaRepository.contexto()
    if (context.value.caixaAtivo)
      summary.value = await CaixaRepository.resumoCaixa(context.value.caixaAtivo.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
async function enter(id: number) {
  if (busy.value || uncertain.value) return
  error.value = ''
  busy.value = true
  try {
    await CaixaRepository.entrarCaixa({ caixaId: id })
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
const confirmOperation = useConfirmation()
async function save() {
  if (busy.value || uncertain.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  let sent = false
  try {
    const valor = decimal(value.value)
    if (context.value?.caixaAtivo && action.value !== 'fechar' && valor <= 0)
      throw new Error('Informe um valor maior que zero para movimentar o caixa.')
    if (
      !(await confirmOperation({
        title: !context.value?.caixaAtivo
          ? 'Confirmar abertura do caixa?'
          : action.value === 'fechar'
            ? 'Confirmar fechamento do caixa?'
            : 'Confirmar movimento de caixa?',
        description: `${!context.value?.caixaAtivo ? 'Saldo inicial' : action.value === 'fechar' ? 'Valor contado' : action.value === 'SANGRIA' ? 'Retirada' : 'Reforço'}: ${money(valor)}. ${description.value || 'Confira o valor antes de registrar.'}`,
        confirmLabel: !context.value?.caixaAtivo
          ? 'Confirmar abertura'
          : action.value === 'fechar'
            ? 'Confirmar fechamento'
            : 'Confirmar movimento',
        danger: !!context.value?.caixaAtivo && ['fechar', 'SANGRIA'].includes(action.value),
      }))
    )
      return
    sent = true
    if (!context.value?.caixaAtivo)
      await CaixaRepository.abrirCaixa({
        pdvId: pdvId.value,
        valorInicial: valor,
        observacao: description.value,
      })
    else if (action.value === 'fechar')
      await CaixaRepository.fecharCaixa({
        caixaId: context.value.caixaAtivo.id,
        valorFechamento: valor,
        descricao: description.value,
      })
    else
      await CaixaRepository.movimentarCaixa({
        caixaId: context.value.caixaAtivo.id,
        tipoMovimento: action.value === 'SANGRIA' ? 'SANGRIA' : 'REFORCO',
        descricao: description.value,
        valor,
      })
    message.value = 'Operação de caixa registrada.'
    editorOpen.value = false
    await load()
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && (!(e as any).response || (e as any).response.status >= 500)) {
      uncertain.value = true
      error.value += ' Confira o estado do caixa antes de repetir.'
    }
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PageFrame>
    <PageHeader
      title="Caixa"
      description="Acompanhe o turno, registre movimentações e confira o fechamento."
      eyebrow="Operação"
      back="/modofacil/vendas"
      back-label="Vendas"
    >
      <template #actions>
        <button :disabled="busy" @click="load">
          <RefreshCw :size="15" :class="busy ? 'animate-spin' : ''" />Atualizar
        </button>
        <ModalAction
          v-if="activeCash"
          :disabled="busy || uncertain"
          class="!border-primary !bg-primary !text-primary-foreground"
          form="venda-nova"
          ><Plus :size="16" />Fazer venda neste caixa</ModalAction
        >
      </template>
    </PageHeader>
    <Feedback :loading="busy" :error="error" :message="message" @retry="load" />
    <template v-if="context">
      <template v-if="activeCash">
        <section
          class="rounded-lg border border-border bg-card p-4 sm:p-5"
          aria-label="Turno atual"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                ><Banknote :size="23"
              /></span>
              <div class="min-w-0">
                <small>Turno em andamento</small>
                <h2 class="!mb-0 break-words">
                  {{ activeCash.codigo || `Caixa #${activeCash.id}` }}
                </h2>
              </div>
            </div>
            <StatusBadge
              :value="
                activeCash.status === 'ABERTO' || !activeCash.status ? 'ATIVO' : activeCash.status
              "
              label="Caixa aberto"
            />
          </div>
          <dl class="mf-info-grid border-t border-border pt-4">
            <div>
              <dt>Terminal</dt>
              <dd>{{ activeCash.pdv?.nome || 'Sem terminal específico' }}</dd>
            </div>
            <div>
              <dt>Aberto por</dt>
              <dd>{{ activeCash.abertoPor?.nome || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>Início do turno</dt>
              <dd>{{ dateTime(activeCash.abertoEm) }}</dd>
            </div>
            <div>
              <dt>Saldo inicial</dt>
              <dd>{{ money(summary?.resumo?.saldoInicial ?? activeCash.saldoInicial) }}</dd>
            </div>
          </dl>
        </section>
        <DetailMetrics label="Resumo do turno" :metrics="metrics" />
        <div class="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section
            class="self-start rounded-lg border border-border bg-card p-4 sm:p-5 xl:col-start-2 xl:row-start-1"
            aria-labelledby="cash-actions-title"
          >
            <h2 id="cash-actions-title">Operações do turno</h2>
            <div class="grid grid-cols-3 gap-2 xl:grid-cols-1">
              <button
                class="w-full !flex-col !justify-start !gap-2 !px-2 !py-3 !text-center !text-xs sm:!flex-row sm:!gap-3 sm:!p-3 sm:!text-left xl:!text-sm"
                :disabled="busy || uncertain"
                aria-label="Adicionar dinheiro"
                @click="openEditor('REFORCO')"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  ><ArrowDownLeft :size="19" /></span
                ><span
                  ><span class="block">Adicionar dinheiro</span
                  ><small class="!hidden sm:!block">Reforço para o caixa</small></span
                >
              </button>
              <button
                class="w-full !flex-col !justify-start !gap-2 !px-2 !py-3 !text-center !text-xs sm:!flex-row sm:!gap-3 sm:!p-3 sm:!text-left xl:!text-sm"
                :disabled="busy || uncertain"
                aria-label="Retirar dinheiro"
                @click="openEditor('SANGRIA')"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-300"
                  ><ArrowUpRight :size="19" /></span
                ><span
                  ><span class="block">Retirar dinheiro</span
                  ><small class="!hidden sm:!block">Registrar uma sangria</small></span
                >
              </button>
              <button
                class="w-full !flex-col !justify-start !gap-2 !px-2 !py-3 !text-center !text-xs sm:!flex-row sm:!gap-3 sm:!p-3 sm:!text-left xl:!text-sm"
                :disabled="busy || uncertain"
                aria-label="Fechar caixa"
                @click="openEditor('fechar')"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                  ><LockKeyhole :size="18" /></span
                ><span
                  ><span class="block">Fechar caixa</span
                  ><small class="!hidden sm:!block">Conferir e encerrar o turno</small></span
                >
              </button>
            </div>
          </section>
          <section
            class="min-w-0 self-start space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5 xl:col-start-1 xl:row-start-1 xl:row-span-2"
            aria-labelledby="cash-movements-title"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="cash-movements-title" class="!mb-0">Movimentações do turno</h2>
                <small>{{ movements.length }} registro(s) · mais recentes primeiro</small>
              </div>
              <Clock3 :size="18" class="text-muted-foreground" aria-hidden="true" />
            </div>
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px]">
              <label
                ><span class="sr-only">Buscar movimentações</span
                ><Input
                  v-model="search"
                  type="search"
                  placeholder="Buscar descrição ou venda"
                  aria-label="Buscar movimentações" /></label
              ><label
                ><span class="sr-only">Tipo de movimento</span
                ><FormSelect
                  v-model="movementType"
                  aria-label="Tipo de movimento"
                  :options="[
                    { value: 'TODOS', label: 'Todos os tipos' },
                    ...Object.entries(movementLabels).map(([value, label]) => ({ value, label })),
                  ]"
              /></label>
            </div>
            <RecordsTable
              :rows="visibleMovements"
              :loading="busy"
              :failed="!!error && !summary"
              caption="Movimentações do caixa"
              empty="Nenhuma movimentação encontrada."
              :min-width="560"
              :columns="[
                { key: 'date', label: 'Data e hora' },
                { key: 'description', label: 'Descrição' },
                { key: 'type', label: 'Tipo' },
                { key: 'value', label: 'Valor', right: true },
              ]"
              ><template #date="{ row }"
                ><span class="text-xs text-muted-foreground">{{
                  dateTime(row.createdAt)
                }}</span></template
              ><template #description="{ row }"
                ><strong>{{ row.descricao || movementLabels[row.tipo] || 'Movimentação' }}</strong
                ><small v-if="row.metodoPagamento">{{ paymentLabel(row.metodoPagamento) }}</small
                ><RouterLink
                  v-if="row.vendaId"
                  :to="`/modofacil/vendas/${row.vendaId}`"
                  class="block text-xs"
                  >Venda #{{ row.vendaId }}</RouterLink
                ></template
              ><template #type="{ row }"
                ><StatusBadge
                  :value="movementTone(row.tipo)"
                  :label="movementLabels[row.tipo] || row.tipo" /></template
              ><template #value="{ row }"
                ><strong
                  :class="row.tipo === 'SANGRIA' ? 'text-orange-700 dark:text-orange-300' : ''"
                  >{{ money(row.valor) }}</strong
                ></template
              ></RecordsTable
            >
            <PageControls
              v-if="filteredMovements.length > 10"
              :page="page"
              :pages="pages"
              :total="filteredMovements.length"
              :loading="busy"
              @change="page = $event"
            />
          </section>
          <div class="contents">
            <section
              class="min-w-0 self-start space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5 xl:col-start-2 xl:row-start-2"
              aria-labelledby="cash-methods-title"
            >
              <h2 id="cash-methods-title" class="!mb-0">Vendas por pagamento</h2>
              <RecordsTable
                v-if="methods.length"
                :rows="methods"
                caption="Vendas por forma de pagamento"
                :min-width="200"
                :columns="[
                  { key: 'method', label: 'Forma' },
                  { key: 'amount', label: 'Valor', right: true },
                ]"
                ><template #method="{ row }">{{
                  row.method === 'CREDIARIO' ? 'A prazo / crediário' : paymentLabel(row.method)
                }}</template
                ><template #amount="{ row }"
                  ><strong>{{ money(row.amount) }}</strong></template
                ></RecordsTable
              >
              <p v-else class="!mb-0 text-xs text-muted-foreground">
                {{
                  summary
                    ? 'Nenhuma forma de pagamento registrada no turno.'
                    : 'Resumo de pagamentos indisponível. Atualize a consulta.'
                }}
              </p>
              <small
                >Totais das vendas por forma de pagamento. O saldo esperado considera a movimentação
                do caixa.</small
              >
            </section>
          </div>
        </div>
      </template>
      <template v-else>
        <section
          v-if="!context.caixasAbertos.length"
          class="flex flex-col items-center rounded-lg border border-border bg-card px-5 py-12 text-center"
        >
          <span
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            ><Store :size="30" :stroke-width="1.5"
          /></span>
          <h2>Nenhum caixa em uso</h2>
          <p class="max-w-md text-muted-foreground">
            Abra um turno com o saldo inicial para começar a vender e acompanhar as entradas e
            retiradas.
          </p>
          <button
            class="mt-3 !border-primary !bg-primary !text-primary-foreground"
            :disabled="busy || uncertain"
            @click="openEditor()"
          >
            <Plus :size="16" />Abrir caixa
          </button>
        </section>
        <section
          v-else
          class="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="!mb-0">Caixas disponíveis</h2>
              <small>Entre em um turno aberto ou inicie um novo caixa.</small>
            </div>
            <button :disabled="busy || uncertain" @click="openEditor()">
              <Plus :size="15" />Abrir novo caixa
            </button>
          </div>
          <RecordsTable
            :rows="context.caixasAbertos"
            caption="Caixas abertos"
            :columns="[
              { key: 'code', label: 'Caixa' },
              { key: 'operator', label: 'Responsável' },
              { key: 'opened', label: 'Abertura' },
              { key: 'actions', label: 'Ações', right: true },
            ]"
            ><template #code="{ row }"
              ><strong>{{ row.codigo }}</strong
              ><small>{{ row.pdv?.nome || 'Sem terminal específico' }}</small></template
            ><template #operator="{ row }">{{ row.abertoPor?.nome || 'Não informado' }}</template
            ><template #opened="{ row }">{{ dateTime(row.abertoEm) }}</template
            ><template #actions="{ row }"
              ><button
                :disabled="busy || uncertain"
                :aria-label="`Entrar no caixa ${row.codigo}`"
                @click="enter(row.id)"
              >
                Entrar neste caixa
              </button></template
            ></RecordsTable
          >
        </section>
      </template>
      <ModalDialog
        v-if="editorOpen"
        :title="editorTitle"
        :description="
          activeCash
            ? `${activeCash.codigo} · Confira os dados antes de confirmar.`
            : 'Informe o terminal e o saldo para iniciar o turno.'
        "
        :busy="busy"
        :error="error"
        :uncertain="uncertain"
        @close="editorOpen = false"
      >
        <form class="space-y-4" @submit.prevent="save">
          <fieldset :disabled="busy || uncertain" class="space-y-4">
            <FormSection
              :title="activeCash ? 'Movimentação do caixa' : 'Abertura do turno'"
              :description="
                activeCash
                  ? 'Escolha a operação e informe o valor.'
                  : 'O saldo inicial será usado como ponto de partida do caixa.'
              "
            >
              <label v-if="activeCash"
                >Operação<FormSelect
                  v-model="action"
                  :options="[
                    { value: 'REFORCO', label: 'Reforço de dinheiro' },
                    { value: 'SANGRIA', label: 'Retirada / sangria' },
                    { value: 'fechar', label: 'Fechar caixa' },
                  ]"
              /></label>
              <label v-else
                >Terminal<FormSelect
                  v-model="pdvId"
                  :options="[
                    { value: null, label: 'Sem terminal específico' },
                    ...context.pdvs.flatMap((pdv) =>
                      pdv.id == null ? [] : [{ value: pdv.id, label: pdv.nome }],
                    ),
                  ]"
              /></label>
              <label
                >{{
                  !activeCash
                    ? 'Saldo inicial'
                    : action === 'fechar'
                      ? 'Valor contado no fechamento'
                      : 'Valor'
                }}<Input v-model="value" placeholder="0,00" inputmode="decimal" required
              /></label>
              <label class="sm:col-span-2"
                >Observação<Input
                  v-model="description"
                  :placeholder="
                    !activeCash
                      ? 'Ex.: fundo de troco para o turno'
                      : action === 'fechar'
                        ? 'Ex.: observações sobre a conferência'
                        : 'Informe o motivo da movimentação'
                  "
              /></label>
            </FormSection>
            <div
              v-if="activeCash && action === 'fechar'"
              class="space-y-2 rounded-lg border border-border bg-muted/40 p-4"
            >
              <div class="flex flex-wrap justify-between gap-2 text-sm">
                <span class="text-muted-foreground">Saldo esperado</span
                ><strong>{{
                  money(summary?.resumo?.saldoEsperado ?? activeCash.saldoEsperado)
                }}</strong>
              </div>
              <div
                v-if="difference !== null"
                class="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-sm"
              >
                <span class="text-muted-foreground">Diferença na conferência</span
                ><strong
                  :class="
                    difference === 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-orange-700 dark:text-orange-300'
                  "
                  >{{ money(difference) }}</strong
                >
              </div>
              <small>Confira o valor contado antes de encerrar o turno.</small>
            </div>
            <div class="mf-form-actions">
              <button type="button" :disabled="busy" @click="editorOpen = false">Cancelar</button
              ><button
                :class="
                  activeCash && action === 'fechar'
                    ? '!border-red-600 !bg-red-600 !text-white'
                    : '!border-primary !bg-primary !text-primary-foreground'
                "
              >
                Confirmar
                {{ !activeCash ? 'abertura' : action === 'fechar' ? 'fechamento' : 'movimento' }}
              </button>
            </div>
          </fieldset>
        </form>
      </ModalDialog>
    </template>
  </PageFrame>
</template>
