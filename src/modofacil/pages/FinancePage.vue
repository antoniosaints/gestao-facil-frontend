<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { Plus, Eye, Search } from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import RecordsTable from '../components/RecordsTable.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePage } from '../application/usePage'
import { LancamentosRepository } from '../adapters/domain'
import { money, today, errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute(),
  type = ref(String(route.query.tipo || '')),
  status = ref(String(route.query.status || '')),
  start = ref(String(route.query.inicio || today().slice(0, 8) + '01')),
  end = ref(String(route.query.fim || today())),
  summary = ref<any>(null),
  summaryError = ref('')
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/financeiro/lancamentos',
  () => ({
    tipo: type.value || undefined,
    status: status.value || undefined,
    inicio: start.value,
    fim: end.value,
  }),
  loadSummary,
)
async function loadSummary() {
  summaryError.value = ''
  try {
    const response = await LancamentosRepository.getDashboardVisaoGeral({
      inicio: start.value,
      fim: end.value,
    })
    summary.value = response.data
  } catch (e) {
    summaryError.value = errorMessage(e)
  }
}
async function refresh() {
  await Promise.all([load(true), loadSummary()])
}
onMounted(refresh)
</script>
<template>
  <PageFrame
    ><PageHeader
      title="Financeiro"
      description="Recebimentos, pagamentos e pendências do seu negócio."
      ><template #actions
        ><ModalAction class="mf-button" form="lancamento-novo" :query="{ tipo: 'RECEITA' }"
          ><Plus :size="16" />Registrar receita</ModalAction
        ><ModalAction
          class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
          form="lancamento-novo"
          :query="{ tipo: 'DESPESA' }"
          ><Plus :size="16" />Registrar despesa</ModalAction
        ></template
      ></PageHeader
    >
    <div v-if="summary" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <section
        v-for="metric in [
          {
            label: 'Recebido',
            value: summary.cards.receitasRealizadas,
            hint: 'Por data de pagamento',
            tone: 'text-emerald-600 dark:text-emerald-300',
          },
          {
            label: 'Pago',
            value: summary.cards.despesasRealizadas,
            hint: 'Por data de pagamento',
            tone: 'text-blue-600 dark:text-blue-300',
          },
          {
            label: 'A receber',
            value: summary.cards.aReceberPendente,
            hint: 'Por vencimento no período',
            tone: 'text-orange-500',
          },
          {
            label: 'A pagar',
            value: summary.cards.aPagarPendente,
            hint: 'Por vencimento no período',
            tone: 'text-violet-500',
          },
        ]"
        :key="metric.label"
        class="min-w-0 rounded-[8px] border border-border bg-card p-5"
      >
        <p class="!mb-1 !text-xs text-muted-foreground">{{ metric.label }}</p>
        <strong class="block break-words text-2xl font-bold tracking-tight" :class="metric.tone">{{
          money(metric.value)
        }}</strong
        ><small class="mt-2">{{ metric.hint }}</small>
      </section>
    </div>
    <section class="min-w-0 space-y-5 rounded-[8px] border border-border bg-card p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="!mb-0">Lançamentos</h2>
        <nav
          class="flex flex-wrap gap-x-4 gap-y-2 text-xs"
          aria-label="Outras operações financeiras"
        >
          <RouterLink to="/modofacil/financeiro/cadastros">Contas e categorias</RouterLink
          ><ModalAction form="financeiro-transferir">Transferir entre contas</ModalAction
          ><RouterLink to="/modofacil/financeiro/cobrancas">Cobranças</RouterLink
          ><RouterLink to="/modofacil/relatorios">Relatórios</RouterLink>
        </nav>
      </div>
      <form
        class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-3"
        @submit.prevent="refresh"
      >
        <label>De<Input v-model="start" type="date" /></label
        ><label>Até<Input v-model="end" type="date" /></label
        ><label
          >Tipo<select v-model="type">
            <option value="">Todos</option>
            <option value="RECEITA">A receber / receitas</option>
            <option value="DESPESA">A pagar / despesas</option>
          </select></label
        ><label
          >Situação<select v-model="status">
            <option value="">Todas</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="ATRASADO">Atrasado</option>
          </select></label
        ><label
          >Buscar<Input
            v-model="search"
            type="search"
            placeholder="Descrição do lançamento" /></label
        ><button :disabled="loading"><Search :size="15" />Aplicar filtros</button>
      </form>
      <Feedback :error="error || summaryError" @retry="refresh" />
      <RecordsTable
        :failed="!!error"
        :rows="rows"
        :loading="loading"
        caption="Lançamentos por data de lançamento"
        empty="Nenhum lançamento encontrado."
        :columns="[
          { key: 'description', label: 'Descrição' },
          { key: 'type', label: 'Tipo' },
          { key: 'category', label: 'Categoria' },
          { key: 'status', label: 'Status' },
          { key: 'value', label: 'Total', right: true },
          { key: 'actions', label: 'Ações', right: true },
        ]"
        ><template #description="{ row }"
          ><strong>{{ row.descricao }}</strong
          ><small v-if="row.vendaId || row.ordemServicoId"
            >Vinculado à operação de origem</small
          ></template
        ><template #type="{ row }"><StatusBadge :value="row.tipo" /></template
        ><template #category="{ row }">{{ row.categoria?.nome || '—' }}</template
        ><template #status="{ row }"><StatusBadge :value="row.status" /></template
        ><template #value="{ row }"
          ><strong>{{ money(row.valorTotal) }}</strong></template
        ><template #actions="{ row }"
          ><RouterLink
            :to="`/modofacil/financeiro/lancamentos/${row.id}`"
            class="inline-flex min-h-10 items-center gap-1 text-xs"
            ><Eye :size="15" />Ver detalhes</RouterLink
          ></template
        ></RecordsTable
      >
      <PageControls
        :page="page"
        :pages="pages"
        :total="total"
        :loading="loading"
        @change="
          ($event) => {
            page = $event
            load()
          }
        "
      />
    </section>
    <details v-if="summary" class="!bg-card">
      <summary>
        Assinaturas a pagar previstas · {{ money(summary.assinaturasPagar.totalPrevistoPeriodo) }}
      </summary>
      <p class="text-muted-foreground">
        Estes compromissos são apresentados separadamente das parcelas.
      </p>
      <ul class="divide-y divide-border">
        <li
          v-for="item in summary.assinaturasPagar.proximas"
          :key="item.id"
          class="flex flex-wrap justify-between gap-3 py-3"
        >
          <span>{{ item.nomeServico }}</span
          ><strong>{{ money(item.valor) }}</strong>
        </li>
      </ul>
    </details>
  </PageFrame>
</template>
