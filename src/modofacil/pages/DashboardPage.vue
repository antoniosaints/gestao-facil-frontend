<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import ModalAction from '../components/ModalAction.vue'
import PageHeader from '../components/PageHeader.vue'
import { Input } from '@/components/ui/input'

import { ref, onMounted, computed } from 'vue'
import {
  DollarSign,
  Wallet,
  Clock3,
  CreditCard,
  ArrowUpRight,
  Plus,
  Package,
  AlertCircle,
  CalendarDays,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import {
  api,
  VendaRepository,
  LancamentosRepository,
  OrdensServicoRepository,
} from '../adapters/domain'
import { money, today, errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
import DashboardLoading from '../components/DashboardLoading.vue'
const ui = useUiStore(),
  start = ref(today().slice(0, 8) + '01'),
  end = ref(today()),
  loading = ref(true),
  error = ref(''),
  sales = ref<any>(null),
  finance = ref<any>(null),
  orders = ref<any>(null),
  stock = ref<any>(null),
  updated = ref('')
const can = (level: number) => hasPermission(ui.usuarioLogged, level)
const bars = computed(() => sales.value?.serieDiaria?.data || [])
const max = computed(() => Math.max(1, ...bars.value.map(Number)))
const firstName = computed(() => ui.usuarioLogged.nome?.split(' ')[0] || 'Administrador')
const metrics = computed(() => [
  ...(sales.value
    ? [
        {
          label: 'Vendas',
          value: money(sales.value.kpis.faturamento.atual),
          description: `${sales.value.kpis.vendas.atual} vendas no período`,
          icon: DollarSign,
          color: 'bg-emerald-500/100',
          path: '/modofacil/vendas',
        },
      ]
    : []),
  ...(finance.value
    ? [
        {
          label: 'Recebido',
          value: money(finance.value.cards.receitasRealizadas),
          description: 'Receitas pagas no período',
          icon: Wallet,
          color: 'bg-blue-500/100',
          path: '/modofacil/financeiro',
        },
        {
          label: 'A receber',
          value: money(finance.value.cards.aReceberPendente),
          description: 'Parcelas pendentes por vencimento',
          icon: Clock3,
          color: 'bg-orange-500/100',
          path: '/modofacil/financeiro',
          type: 'RECEITA',
        },
        {
          label: 'A pagar',
          value: money(finance.value.cards.aPagarPendente),
          description: 'Parcelas pendentes por vencimento',
          icon: CreditCard,
          color: 'bg-violet-500/100',
          path: '/modofacil/financeiro',
          type: 'DESPESA',
        },
      ]
    : []),
])
const orderTotal = computed(
  () =>
    Number(orders.value?.operacao.abertas || 0) + Number(orders.value?.operacao.emAndamento || 0),
)
const openPercent = computed(() =>
  orderTotal.value ? (Number(orders.value.operacao.abertas) / orderTotal.value) * 100 : 0,
)
const tickLabel = (value: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
async function load() {
  loading.value = true
  error.value = ''
  sales.value = finance.value = orders.value = stock.value = null
  const failures: string[] = []
  const tasks: Promise<void>[] = []
  const read = async (label: string, action: () => Promise<any>, set: (value: any) => void) => {
    try {
      set(await action())
    } catch (e) {
      failures.push(`${label}: ${errorMessage(e)}`)
    }
  }
  if (can(3)) {
    tasks.push(
      read(
        'Vendas',
        () => VendaRepository.painel(start.value, end.value),
        (v) => (sales.value = v),
      ),
    )
    tasks.push(
      read(
        'Dinheiro',
        () => LancamentosRepository.getDashboardVisaoGeral({ inicio: start.value, fim: end.value }),
        (v) => (finance.value = v.data),
      ),
    )
  }
  if (can(4))
    tasks.push(
      read(
        'Estoque',
        () => api.page('/modofacil/produtos', { estoqueBaixo: 'SIM', pageSize: 5 }),
        (v) => (stock.value = v),
      ),
    )
  if (can(2))
    tasks.push(
      read(
        'Serviços',
        () => OrdensServicoRepository.getPainel(start.value, end.value),
        (v) => (orders.value = v),
      ),
    )
  await Promise.all(tasks)
  error.value = failures.join(' • ')
  updated.value = new Date().toLocaleString('pt-BR')
  loading.value = false
}
onMounted(load)
</script>
<template>
  <section aria-label="Dashboard" :aria-busy="loading">
    <DashboardLoading v-if="loading" />
    <template v-else>
      <PageHeader
        class="mb-6"
        title="Dashboard"
        eyebrow="Visão geral"
        :description="`Olá, ${firstName}! Acompanhe os indicadores e a rotina do seu negócio.`"
      >
        <template #actions>
          <form class="flex w-full flex-wrap items-end gap-2 sm:w-auto" @submit.prevent="load">
            <CalendarDays
              :size="18"
              class="mb-3 hidden text-muted-foreground xl:block"
              aria-hidden="true"
            />
            <label class="min-w-0 flex-1 sm:flex-none"
              >De<Input placeholder="dd/mm/aaaa" v-model="start" type="date" required :max="end"
            /></label>
            <label class="min-w-0 flex-1 sm:flex-none"
              >Até<Input placeholder="dd/mm/aaaa" v-model="end" type="date" required :min="start"
            /></label>
            <button
              :disabled="loading"
              class="!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
            >
              Atualizar<span class="sr-only"> período</span>
            </button>
          </form>
        </template>
      </PageHeader>
      <Feedback :error="error" @retry="load" />
      <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RouterLink
          v-for="metric in metrics"
          :key="metric.label"
          :to="{ path: metric.path, query: { inicio: start, fim: end, tipo: metric.type } }"
          class="mf-card group min-w-0 rounded-lg border border-border bg-card p-5 !text-foreground transition-colors hover:border-primary/50"
        >
          <div class="mb-2 flex items-center justify-between gap-3">
            <p
              class="!mb-0 !text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              {{ metric.label }}
            </p>
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
              ><component :is="metric.icon" :size="17" :stroke-width="1.7" aria-hidden="true"
            /></span>
          </div>
          <p class="mf-metric-value !mb-0">
            {{ metric.value }}
          </p>
          <div class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpRight :size="13" class="shrink-0 text-primary" aria-hidden="true" />{{
              metric.description
            }}
          </div>
        </RouterLink>
      </div>
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section
          v-if="sales"
          class="min-w-0 rounded-[8px] border border-border bg-card p-5 xl:col-span-2"
        >
          <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 class="!mb-0">Vendas no período</h2>
            <span
              class="rounded-[5px] border border-border px-2.5 py-1 text-xs text-muted-foreground"
              >Por dia · R$</span
            >
          </div>
          <svg
            v-if="bars.length"
            viewBox="0 0 680 240"
            class="h-auto w-full"
            role="img"
            aria-label="Vendas diárias em reais. Os valores também estão disponíveis na tabela abaixo."
          >
            <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
              <line
                x1="58"
                x2="670"
                :y1="20 + step * 44"
                :y2="20 + step * 44"
                class="stroke-border"
              />
              <text x="47" :y="24 + step * 44" text-anchor="end" class="fill-slate-400 text-[11px]">
                {{ tickLabel((max * (4 - step)) / 4) }}
              </text>
            </g>
            <g v-for="(bar, index) in bars" :key="index">
              <rect
                :x="62 + Number(index) * (604 / bars.length)"
                :y="196 - (Number(bar) / max) * 176"
                :width="Math.max(2, 604 / bars.length - 9)"
                :height="Math.max(1, (Number(bar) / max) * 176)"
                rx="3"
                class="fill-primary/70 transition-colors hover:fill-primary"
              >
                <title>{{ sales.serieDiaria.labels[index] }}: {{ money(bar) }}</title>
              </rect>
              <text
                v-if="Number(index) % Math.ceil(bars.length / 8) === 0"
                :x="
                  62 + Number(index) * (604 / bars.length) + Math.max(2, 604 / bars.length - 9) / 2
                "
                y="219"
                text-anchor="middle"
                class="fill-slate-500 text-[10px]"
              >
                {{ sales.serieDiaria.labels[index] }}
              </text>
            </g>
          </svg>
          <p v-else class="flex min-h-48 items-center justify-center text-muted-foreground">
            Nenhuma venda no período selecionado.
          </p>
          <details class="mt-2 text-xs text-muted-foreground">
            <summary>Consultar valores do gráfico</summary>
            <div class="mt-3 max-h-48 overflow-auto">
              <Table class="w-full text-left">
                <TableCaption class="sr-only"> Vendas por dia </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead class="py-2">Dia</TableHead>
                    <TableHead class="py-2 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(value, index) in bars"
                    :key="index"
                    class="border-t border-border"
                  >
                    <TableCell class="py-2">{{ sales.serieDiaria.labels[index] }}</TableCell>
                    <TableCell class="py-2 text-right">{{ money(value) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </details>
        </section>
        <section v-if="orders" class="min-w-0 rounded-[8px] border border-border bg-card p-5">
          <div class="flex items-center justify-between gap-2">
            <h2 class="!mb-0">Ordens de serviço</h2>
            <RouterLink to="/modofacil/servicos/ordens" class="mf-button shrink-0"
              >Ver todas</RouterLink
            >
          </div>
          <div class="relative mx-auto my-4 h-44 w-44" aria-hidden="true">
            <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="46" fill="none" stroke-width="15" class="stroke-muted" />
              <template v-if="orderTotal">
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke-width="15"
                  class="stroke-blue-500"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke-width="15"
                  pathLength="100"
                  :stroke-dasharray="`${openPercent} ${100 - openPercent}`"
                  class="stroke-orange-400"
                />
              </template>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <strong class="text-3xl font-bold">{{ orderTotal }}</strong
              ><span class="text-xs text-muted-foreground">em aberto</span>
            </div>
          </div>
          <ul class="space-y-3 text-xs">
            <li class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full bg-orange-400" />Abertas<strong
                class="ml-auto"
                >{{ orders.operacao.abertas }}</strong
              >
            </li>
            <li class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full bg-blue-500/100" />Em andamento<strong
                class="ml-auto"
                >{{ orders.operacao.emAndamento }}</strong
              >
            </li>
          </ul>
          <p v-if="!orderTotal" class="mt-4 text-center text-muted-foreground">
            Nenhuma ordem em aberto.
          </p>
        </section>
        <section
          class="rounded-[8px] border border-border bg-card p-5"
          :class="sales && orders ? 'xl:col-span-3' : 'xl:col-span-1'"
        >
          <h2 class="flex items-center gap-2">
            <AlertCircle :size="17" class="text-muted-foreground" aria-hidden="true" />Precisa da
            sua atenção
          </h2>
          <div class="grid gap-4 md:grid-cols-3">
            <RouterLink
              v-if="stock"
              to="/modofacil/produtos?estoqueBaixo=SIM"
              class="flex items-center gap-3 rounded-[6px] border border-border p-3 !text-foreground/90 hover:bg-muted/50"
              ><Package :size="20" class="shrink-0 text-orange-500" /><span
                ><strong class="block text-sm"
                  >{{ stock.total }}
                  {{
                    stock.total === 1 ? 'produto com estoque baixo' : 'produtos com estoque baixo'
                  }}</strong
                ><span class="text-xs text-muted-foreground"
                  >Consultar estoque <span aria-hidden="true">→</span></span
                ></span
              ></RouterLink
            >
            <div v-if="finance" class="rounded-[6px] border border-border p-3">
              <p class="!mb-1 !text-xs text-muted-foreground">Valores em atraso</p>
              <span class="text-xs"
                >A receber: <strong>{{ money(finance.cards.atrasadoReceber) }}</strong> · A pagar:
                <strong>{{ money(finance.cards.atrasadoPagar) }}</strong></span
              >
            </div>
            <div v-if="finance" class="rounded-[6px] border border-border p-3">
              <p class="!mb-1 !text-xs text-muted-foreground">Assinaturas a pagar previstas</p>
              <strong>{{ money(finance.assinaturasPagar.totalPrevistoPeriodo) }}</strong
              ><small>Previsão separada das parcelas a pagar.</small>
            </div>
            <p v-if="!stock && !finance && !orders" class="text-muted-foreground md:col-span-3">
              Os indicadores aparecem conforme suas permissões e a disponibilidade dos dados.
            </p>
          </div>
        </section>
      </div>
      <div class="my-5 flex flex-wrap gap-3">
        <ModalAction
          v-if="can(2)"
          class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
          form="venda-nova"
          ><Plus :size="16" />Fazer uma venda</ModalAction
        >
        <ModalAction v-if="can(4)" class="mf-button" form="produto-novo"
          ><Package :size="16" />Cadastrar produto</ModalAction
        >
        <ModalAction
          v-if="can(3)"
          class="mf-button"
          form="lancamento-novo"
          :query="{ tipo: 'DESPESA' }"
          ><Wallet :size="16" />Registrar despesa</ModalAction
        >
      </div>
      <p v-if="updated" class="!text-xs text-muted-foreground">
        Atualizado em {{ updated }}. Vendas e recebimentos seguem suas respectivas datas.
      </p>
    </template>
  </section>
</template>
