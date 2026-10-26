<script setup lang="ts">
import { Input } from '@/components/ui/input'

import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { reports, VendaRepository, OrdensServicoRepository, api } from '../adapters/domain'
import { today, money, quantity, errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
const ui = useUiStore(),
  kind = ref('vendas'),
  start = ref(today().slice(0, 8) + '01'),
  end = ref(today()),
  loading = ref(false),
  error = ref(''),
  result = ref<any>(null)
const options = computed(() =>
  [
    { code: 'vendas', label: 'Quanto vendi e o que mais vende?', level: 3 },
    { code: 'produtos', label: 'O que preciso repor?', level: 4 },
    { code: 'financeiro', label: 'Como estão as receitas e despesas?', level: 3 },
    { code: 'servicos', label: 'Como estão meus serviços?', level: 5 },
  ].filter((o) => hasPermission(ui.usuarioLogged, o.level)),
)
function allowed() {
  if (!options.value.some((o) => o.code === kind.value))
    throw new Error('Seu perfil não permite consultar este relatório.')
}
async function load() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    allowed()
    if (start.value > end.value) throw new Error('Confira o período.')
    result.value =
      kind.value === 'vendas'
        ? await VendaRepository.painel(start.value, end.value)
        : kind.value === 'produtos'
          ? await api.page('/modofacil/produtos', { estoqueBaixo: 'SIM', pageSize: 12 })
          : kind.value === 'financeiro'
            ? (await reports.finance({ inicio: start.value, fim: end.value, regime: 'CAIXA' })).data
            : await OrdensServicoRepository.getPainel(start.value, end.value)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function download() {
  loading.value = true
  error.value = ''
  try {
    allowed()
    if (kind.value === 'vendas') await reports.salesPdf(start.value, end.value)
    else if (kind.value === 'produtos')
      await reports.productPdf(undefined, undefined, 'nome', 'simples')
    else if (kind.value === 'financeiro')
      await reports.financeExport({ inicio: start.value, fim: end.value, regime: 'CAIXA' }, 'pdf')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>Respostas sobre seu negócio</template
      ><template #description
        >Escolha uma pergunta e consulte as mesmas fontes dos relatórios atuais.</template
      ></PageHeader
    >

    <form
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="load"
    >
      <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
        <label
          >Pergunta<select v-model="kind" @change="result = null">
            <option v-for="o in options" :key="o.code" :value="o.code">{{ o.label }}</option>
          </select></label
        ><template v-if="kind !== 'produtos'"
          ><label>De<Input v-model="start" type="date" required /></label
          ><label>Até<Input v-model="end" type="date" required /></label
        ></template>
      </div>
      <button
        :disabled="loading || !options.length"
        class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
      >
        Consultar relatório
      </button>
    </form>
    <Feedback :loading="loading" :error="error" @retry="load" />
    <section
      v-if="result"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <template v-if="kind === 'vendas'"
        ><h2>Vendas no período</h2>
        <p class="mf-value break-words text-2xl font-bold tracking-tight text-foreground">
          {{ money(result.kpis.faturamento.atual) }}
        </p>
        <p>
          {{ result.kpis.vendas.atual }} vendas reconhecidas · Ticket médio
          {{ money(result.kpis.ticketMedio.atual) }}
        </p>
        <h2>Produtos mais vendidos</h2>
        <ol>
          <li v-for="(item, i) in result.topProdutos" :key="i">
            {{ item.nome }} · {{ quantity(item.quantidade) }} ·
            {{ money(item.valor ?? item.total) }}
          </li>
        </ol>
        <RouterLink :to="{ path: '/modofacil/vendas', query: { inicio: start, fim: end } }"
          >Conferir vendas do período</RouterLink
        ></template
      ><template v-else-if="kind === 'produtos'"
        ><h2>{{ result.total }} produtos precisam de reposição</h2>
        <ul class="mf-list m-0 grid list-none gap-3 p-0">
          <li
            v-for="row in result.rows"
            :key="row.id"
            class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
          >
            <RouterLink :to="`/modofacil/produtos/${row.id}`">{{ row.nome }}</RouterLink
            ><span
              >Estoque {{ quantity(row.estoqueTotal) }} · Mínimo {{ quantity(row.minimo) }}</span
            >
          </li>
        </ul>
        <RouterLink to="/modofacil/produtos?estoqueBaixo=SIM"
          >Ver lista completa dos produtos com estoque baixo</RouterLink
        >
        <p>
          O PDF abaixo exporta o catálogo geral. A lista de reposição filtrada permanece disponível
          no link.
        </p></template
      ><template v-else-if="kind === 'financeiro'"
        ><h2>Receitas e despesas pelo regime de caixa</h2>
        <dl>
          <dt>Receitas</dt>
          <dd>{{ money(result.resumo.receitas) }}</dd>
          <dt>Despesas</dt>
          <dd>{{ money(result.resumo.despesas) }}</dd>
          <dt>Resultado</dt>
          <dd>{{ money(result.resumo.resultado) }}</dd>
        </dl>
        <p>Resultado do demonstrativo; não é saldo bancário nem lucro líquido contábil.</p>
        <ul>
          <li v-for="group in result.grupos.receitas" :key="group.categoriaId">
            Receita · {{ group.nome }}: {{ money(group.valor) }}
          </li>
          <li v-for="group in result.grupos.despesas" :key="group.categoriaId">
            Despesa · {{ group.nome }}: {{ money(group.valor) }}
          </li>
        </ul></template
      ><template v-else
        ><h2>Ordens de serviço no período</h2>
        <p>
          {{ result.kpis.quantidade.atual }} ordens · Faturado
          {{ money(result.kpis.faturado.atual) }}
        </p>
        <ul>
          <li v-for="row in result.distribuicaoStatus" :key="row.status">
            {{ row.status }}: {{ row.total }}
          </li>
        </ul>
        <RouterLink to="/modofacil/servicos/ordens">Conferir ordens</RouterLink></template
      ><button v-if="kind !== 'servicos'" :disabled="loading" @click="download">
        Baixar PDF {{ kind === 'produtos' ? 'do catálogo geral' : 'do período' }}
      </button>
    </section>
  </PageFrame>
</template>
