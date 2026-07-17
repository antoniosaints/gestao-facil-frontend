<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Activity,
  Bot,
  Calculator,
  Coins,
  Cpu,
  FilterX,
  Gauge,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-vue-next'
import PieChart from '@/components/graficos/PieChart.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { IaAdminRepository, type IaUsoResumo } from '@/repositories/ia-admin-repository'

const toast = useToast()
const loading = ref(false)
const uso = ref<IaUsoResumo | null>(null)
const calculadoraOpen = ref(false)

// Filtros do painel.
const filtroPeriodo = ref<[Date, Date] | []>([])
const filtroContaId = ref<number | null>(null)

const MOEDA_TOKENS = 'USD'
const moedaComparacao = ref('BRL')
const valorBaseMoedaTokens = ref(1)
const valorMoedaComparacao = ref(1)
const tokensCalculadora = ref(1000000)
const custoMilhaoCalculadora = ref(0)

// Rótulos amigáveis para as features (o "local de uso" da IA).
const FEATURE_LABELS: Record<string, string> = {
  core_chat: 'Assistente Core IA',
  atendimento_agente: 'Agente de atendimento',
  produto_descricao: 'Descrição de produto',
  texto_assistente: 'Assistente de texto',
  os_redigir: 'Redação de O.S.',
  atendimento_sugestao: 'Sugestão de resposta',
  atendimento_resumo: 'Resumo de conversa',
  insights_dashboard: 'Análise do dashboard',
  financeiro_categorizar: 'Categorização financeira',
  estoque_reposicao: 'Sugestão de reposição',
}
const featureLabel = (f: string) => FEATURE_LABELS[f] || f

// Paleta usada nos gráficos e barras (violeta/índigo → tons de apoio).
const PALETTE = [
  '#8b5cf6',
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#a855f7',
  '#64748b',
]
const colorAt = (i: number) => PALETTE[i % PALETTE.length]

// Opções do gráfico de pizza. Sem `scales` (arco não usa e o PieChart não registra
// escala linear) e sem manter proporção, para preencher o container fixo.
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${(ctx.raw ?? 0).toLocaleString('pt-BR')} tokens`,
      },
    },
  },
}

const nf = (v: number) => (v ?? 0).toLocaleString('pt-BR')
const nfDecimal = (v: number, max = 6) =>
  (Number.isFinite(Number(v)) ? Number(v) : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: max,
  })
const fmtCustoMoeda = (v: number, moeda = MOEDA_TOKENS) => {
  const valor = Number.isFinite(Number(v)) ? Number(v) : 0
  const currency = moeda.trim().toUpperCase()
  if (!currency) return nfDecimal(valor, 4)

  try {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  } catch {
    return `${currency} ${nfDecimal(valor, 4)}`
  }
}
const fmtCusto = (v: number) => fmtCustoMoeda(v, MOEDA_TOKENS)

const mesLabel = computed(() => {
  const i = uso.value?.mesInicio ? new Date(uso.value.mesInicio) : null
  const f = uso.value?.mesFim ? new Date(uso.value.mesFim) : null
  if (!i) return ''
  if (f) return `${i.toLocaleDateString('pt-BR')} — ${f.toLocaleDateString('pt-BR')}`
  return i.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const assinanteSelecionado = computed(
  () => uso.value?.assinantes.find((a) => a.contaId === filtroContaId.value) || null,
)
const temFiltro = computed(
  () => filtroContaId.value != null || (Array.isArray(filtroPeriodo.value) && filtroPeriodo.value.length === 2),
)

function limparFiltros() {
  filtroContaId.value = null
  filtroPeriodo.value = []
}

const modeloMaisUsado = computed(() => uso.value?.porModelo?.[0] || null)
const funcaoMaisUsada = computed(() => uso.value?.porFeature?.[0] || null)
const custoPorAssinante = computed(() => {
  const n = uso.value?.assinantesAtivos || 0
  if (!n) return 0
  return (uso.value?.custoEstimado || 0) / n
})
const moedaComparacaoNormalizada = computed(() => moedaComparacao.value.trim().toUpperCase() || 'BRL')
const taxaComparacao = computed(() => {
  const base = Number(valorBaseMoedaTokens.value) || 0
  const comparacao = Number(valorMoedaComparacao.value) || 0
  if (base <= 0 || comparacao < 0) return 0
  return comparacao / base
})
const custoMedioMilhaoPeriodo = computed(() => {
  const tokens = uso.value?.totalTokens || 0
  if (!tokens) return 0
  return ((uso.value?.custoEstimado || 0) / tokens) * 1_000_000
})
const custoTokensCalculado = computed(() => {
  const tokens = Math.max(0, Number(tokensCalculadora.value) || 0)
  const custoMilhao = Math.max(0, Number(custoMilhaoCalculadora.value) || 0)
  return (tokens / 1_000_000) * custoMilhao
})
const custoTokensComparacao = computed(() => custoTokensCalculado.value * taxaComparacao.value)
const custoPeriodoComparacao = computed(() => (uso.value?.custoEstimado || 0) * taxaComparacao.value)

const maxTokensConta = computed(() =>
  Math.max(1, ...(uso.value?.porConta || []).map((c) => c.tokens)),
)

function usarCustoMedioPeriodo() {
  if (!custoMedioMilhaoPeriodo.value) return
  custoMilhaoCalculadora.value = Number(custoMedioMilhaoPeriodo.value.toFixed(6))
}

// Dados dos gráficos de pizza (participação de tokens).
const modeloPieData = computed(() => {
  const list = uso.value?.porModelo || []
  return {
    labels: list.map((m) => m.nome),
    datasets: [
      {
        data: list.map((m) => m.tokens),
        backgroundColor: list.map((_, i) => colorAt(i)),
        borderWidth: 0,
      },
    ],
  }
})
const featurePieData = computed(() => {
  const list = uso.value?.porFeature || []
  return {
    labels: list.map((f) => featureLabel(f.feature)),
    datasets: [
      {
        data: list.map((f) => f.tokens),
        backgroundColor: list.map((_, i) => colorAt(i)),
        borderWidth: 0,
      },
    ],
  }
})

async function load() {
  try {
    loading.value = true
    const periodo = Array.isArray(filtroPeriodo.value) ? filtroPeriodo.value : []
    uso.value = await IaAdminRepository.getUso({
      inicio: periodo[0] ? periodo[0].toISOString() : null,
      fim: periodo[1] ? periodo[1].toISOString() : null,
      contaId: filtroContaId.value,
    })
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar o consumo de IA.')
  } finally {
    loading.value = false
  }
}

watch([filtroContaId, filtroPeriodo], load, { deep: true })
watch(custoMedioMilhaoPeriodo, (value) => {
  if (value > 0 && custoMilhaoCalculadora.value === 0) usarCustoMedioPeriodo()
})

onMounted(load)
</script>

<template>
  <div class="container mx-auto flex w-full flex-col gap-4 py-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Gauge class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Consumo de IA</h1>
          <p class="text-sm text-muted-foreground">
            Uso de tokens, chamadas e custo estimado da plataforma
            <span v-if="mesLabel"> — <strong class="capitalize text-foreground">{{ mesLabel }}</strong></span>
            <span v-if="assinanteSelecionado"> · <strong class="text-foreground">{{ assinanteSelecionado.nome }}</strong></span>
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" class="gap-2" :disabled="loading" @click="load">
        <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
        <RotateCcw v-else class="h-4 w-4" />
        Atualizar
      </Button>
    </header>

    <!-- Filtros -->
    <Card class="border-border/70">
      <CardContent class="flex flex-col gap-3 p-3 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Período</label>
          <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" :teleport="true" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Assinante</label>
          <select v-model="filtroContaId"
            class="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40">
            <option :value="null">Todos os assinantes</option>
            <option v-for="a in uso?.assinantes || []" :key="a.contaId" :value="a.contaId">{{ a.nome }}</option>
          </select>
        </div>
        <Button v-if="temFiltro" variant="outline" size="sm" class="gap-2" :disabled="loading" @click="limparFiltros">
          <FilterX class="h-4 w-4" /> Limpar
        </Button>
      </CardContent>
    </Card>

    <div v-if="loading && !uso" class="flex items-center justify-center p-16 text-sm text-muted-foreground">
      <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando...
    </div>

    <template v-else-if="uso">
      <!-- KPIs principais -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card class="border-border/70">
          <CardContent class="flex flex-col gap-1 p-4">
            <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Zap class="h-4 w-4 text-violet-500" /> Tokens no mês
            </div>
            <div class="text-2xl font-semibold tracking-tight">{{ nf(uso.totalTokens) }}</div>
            <div class="text-[11px] text-muted-foreground">
              {{ nf(uso.promptTokens) }} entrada · {{ nf(uso.completionTokens) }} saída
            </div>
          </CardContent>
        </Card>
        <Card class="border-border/70">
          <CardContent class="flex flex-col gap-1 p-4">
            <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Activity class="h-4 w-4 text-sky-500" /> Chamadas
            </div>
            <div class="text-2xl font-semibold tracking-tight">{{ nf(uso.chamadas) }}</div>
            <div class="text-[11px] text-muted-foreground">requisições de IA processadas</div>
          </CardContent>
        </Card>
        <Card class="border-border/70">
          <CardContent class="flex flex-col gap-1 p-4">
            <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Coins class="h-4 w-4 text-emerald-500" /> Custo estimado
            </div>
            <div class="text-2xl font-semibold tracking-tight">{{ fmtCusto(uso.custoEstimado) }}</div>
            <div class="text-[11px] text-muted-foreground">com base nos custos por modelo</div>
          </CardContent>
        </Card>
        <Card class="border-border/70">
          <CardContent class="flex flex-col gap-1 p-4">
            <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Users class="h-4 w-4 text-amber-500" /> Assinantes ativos
            </div>
            <div class="text-2xl font-semibold tracking-tight">{{ nf(uso.assinantesAtivos) }}</div>
            <div class="text-[11px] text-muted-foreground">
              custo médio {{ fmtCusto(custoPorAssinante) }} / assinante
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Destaques -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card class="border-border/70">
          <CardContent class="flex items-center gap-3 p-4">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <Cpu class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-medium text-muted-foreground">Modelo mais usado</div>
              <div class="truncate text-base font-semibold">{{ modeloMaisUsado?.nome || '—' }}</div>
              <div v-if="modeloMaisUsado" class="text-[11px] text-muted-foreground">
                {{ nf(modeloMaisUsado.tokens) }} tokens · {{ nf(modeloMaisUsado.chamadas) }} chamadas
              </div>
            </div>
          </CardContent>
        </Card>
        <Card class="border-border/70">
          <CardContent class="flex items-center gap-3 p-4">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <Sparkles class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-medium text-muted-foreground">Função de IA mais usada</div>
              <div class="truncate text-base font-semibold">{{ funcaoMaisUsada ? featureLabel(funcaoMaisUsada.feature) : '—' }}</div>
              <div v-if="funcaoMaisUsada" class="text-[11px] text-muted-foreground">
                {{ nf(funcaoMaisUsada.tokens) }} tokens · {{ nf(funcaoMaisUsada.chamadas) }} chamadas
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Gráficos: por modelo e por função -->
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card class="border-border/70">
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-base">
              <Cpu class="h-4 w-4 text-violet-500" /> Consumo por modelo
            </CardTitle>
            <CardDescription>Participação de tokens por modelo de IA.</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="uso.porModelo.length" class="flex flex-col items-center gap-4 sm:flex-row">
              <div class="h-44 w-44 shrink-0">
                <PieChart :data="modeloPieData" :options="pieOptions" />
              </div>
              <ul class="flex-1 space-y-2 self-stretch">
                <li v-for="(m, i) in uso.porModelo" :key="m.modelId" class="flex items-center gap-2 text-sm">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: colorAt(i) }" />
                  <span class="min-w-0 flex-1 truncate">{{ m.nome }}</span>
                  <span class="text-muted-foreground">{{ nf(m.tokens) }} tok</span>
                  <span class="w-16 text-right font-medium">{{ fmtCusto(m.custoEstimado) }}</span>
                </li>
              </ul>
            </div>
            <p v-else class="py-8 text-center text-sm text-muted-foreground">Sem consumo no período.</p>
          </CardContent>
        </Card>

        <Card class="border-border/70">
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-base">
              <Sparkles class="h-4 w-4 text-sky-500" /> Consumo por função
            </CardTitle>
            <CardDescription>Onde a IA é usada no sistema (local de uso).</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="uso.porFeature.length" class="flex flex-col items-center gap-4 sm:flex-row">
              <div class="h-44 w-44 shrink-0">
                <PieChart :data="featurePieData" :options="pieOptions" />
              </div>
              <ul class="flex-1 space-y-2 self-stretch">
                <li v-for="(f, i) in uso.porFeature" :key="f.feature" class="flex items-center gap-2 text-sm">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: colorAt(i) }" />
                  <span class="min-w-0 flex-1 truncate">{{ featureLabel(f.feature) }}</span>
                  <span class="text-muted-foreground">{{ nf(f.chamadas) }} ch.</span>
                  <span class="w-16 text-right font-medium">{{ nf(f.tokens) }}</span>
                </li>
              </ul>
            </div>
            <p v-else class="py-8 text-center text-sm text-muted-foreground">Sem consumo no período.</p>
          </CardContent>
        </Card>
      </div>

      <!-- Ranking de assinantes -->
      <Card class="border-border/70">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Users class="h-4 w-4 text-amber-500" /> Consumo por assinante
          </CardTitle>
          <CardDescription>Ranking de contas por tokens consumidos e custo estimado no mês.</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="uso.porConta.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border/70 text-left text-xs uppercase text-muted-foreground">
                  <th class="py-2 pr-3 font-medium">#</th>
                  <th class="py-2 pr-3 font-medium">Assinante</th>
                  <th class="py-2 pr-3 text-right font-medium">Tokens</th>
                  <th class="py-2 pr-3 text-right font-medium">Chamadas</th>
                  <th class="py-2 pl-3 text-right font-medium">Custo est.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(c, i) in uso.porConta" :key="c.contaId" class="border-b border-border/40 last:border-0">
                  <td class="py-2 pr-3 text-muted-foreground">{{ i + 1 }}</td>
                  <td class="py-2 pr-3">
                    <div class="truncate font-medium">{{ c.nome }}</div>
                    <div class="mt-1 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full bg-violet-500"
                        :style="{ width: `${Math.max(4, (c.tokens / maxTokensConta) * 100)}%` }"
                      />
                    </div>
                  </td>
                  <td class="py-2 pr-3 text-right tabular-nums">{{ nf(c.tokens) }}</td>
                  <td class="py-2 pr-3 text-right tabular-nums text-muted-foreground">{{ nf(c.chamadas) }}</td>
                  <td class="py-2 pl-3 text-right font-medium tabular-nums">{{ fmtCusto(c.custoEstimado) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="py-8 text-center text-sm text-muted-foreground">
            <Bot class="mx-auto mb-2 h-6 w-6 opacity-50" />
            Nenhum assinante consumiu IA neste mês.
          </p>
        </CardContent>
      </Card>
    </template>

    <Button
      class="fixed bottom-5 right-5 z-40 h-12 rounded-full px-4 text-white shadow-lg shadow-primary/25"
      @click="calculadoraOpen = true"
    >
      <Calculator class="mr-2 h-4 w-4" />
      Calculadora de tokens
    </Button>

    <Dialog v-model:open="calculadoraOpen">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Calculator class="h-5 w-5 text-primary" />
            Calculadora de tokens
          </DialogTitle>
          <DialogDescription>
            Converta o custo configurado em {{ MOEDA_TOKENS }} para outra moeda e estime o valor de uma quantidade de tokens.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4">
          <section class="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold text-foreground">Conversão de moeda</h2>
                <p class="text-xs text-muted-foreground">Informe quanto a moeda de comparação vale em relação à moeda dos tokens.</p>
              </div>
              <div class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Moeda dos tokens: {{ MOEDA_TOKENS }}
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1">
                <Label>Valor base em {{ MOEDA_TOKENS }}</Label>
                <Input v-model.number="valorBaseMoedaTokens" type="number" min="0.000001" step="0.000001" />
              </div>
              <div class="space-y-1">
                <Label>Moeda de comparação</Label>
                <Input v-model="moedaComparacao" maxlength="8" placeholder="BRL" />
              </div>
              <div class="space-y-1 sm:col-span-2">
                <Label>Valor na moeda de comparação</Label>
                <Input v-model.number="valorMoedaComparacao" type="number" min="0" step="0.000001" placeholder="Ex.: 5.50" />
              </div>
            </div>

            <div class="mt-3 rounded-md border border-dashed bg-background p-3 text-sm">
              <template v-if="taxaComparacao > 0">
                {{ nfDecimal(valorBaseMoedaTokens, 6) }} {{ MOEDA_TOKENS }} =
                {{ nfDecimal(valorMoedaComparacao, 6) }} {{ moedaComparacaoNormalizada }}
                <span class="text-muted-foreground">
                  · 1 {{ MOEDA_TOKENS }} = {{ fmtCustoMoeda(taxaComparacao, moedaComparacaoNormalizada) }}
                </span>
              </template>
              <template v-else>
                Informe um valor base maior que zero para calcular a taxa de comparação.
              </template>
            </div>
          </section>

          <section class="rounded-lg border border-border/70 p-4">
            <div class="mb-3">
              <h2 class="text-sm font-semibold text-foreground">Custo de X tokens</h2>
              <p class="text-xs text-muted-foreground">Use um custo por 1 milhão de tokens para estimar o valor na moeda configurada e na comparação.</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1">
                <Label>Quantidade de tokens</Label>
                <Input v-model.number="tokensCalculadora" type="number" min="0" step="1" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-2 pt-2">
                  <Label>Custo / 1M tokens ({{ MOEDA_TOKENS }})</Label>
                  <button
                    type="button"
                    class="text-xs font-medium text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!custoMedioMilhaoPeriodo"
                    @click="usarCustoMedioPeriodo"
                  >
                    Usar média
                  </button>
                </div>
                <Input v-model.number="custoMilhaoCalculadora" type="number" min="0" step="0.000001" />
              </div>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border bg-card p-3">
                <p class="text-xs text-muted-foreground">Valor em {{ MOEDA_TOKENS }}</p>
                <p class="mt-1 text-lg font-semibold tabular-nums">{{ fmtCusto(custoTokensCalculado) }}</p>
              </div>
              <div class="rounded-lg border bg-card p-3">
                <p class="text-xs text-muted-foreground">Valor em {{ moedaComparacaoNormalizada }}</p>
                <p class="mt-1 text-lg font-semibold tabular-nums">
                  {{ fmtCustoMoeda(custoTokensComparacao, moedaComparacaoNormalizada) }}
                </p>
              </div>
              <div class="rounded-lg border bg-card p-3">
                <p class="text-xs text-muted-foreground">Média do período / 1M</p>
                <p class="mt-1 text-lg font-semibold tabular-nums">{{ fmtCusto(custoMedioMilhaoPeriodo) }}</p>
              </div>
            </div>
          </section>

          <section v-if="uso" class="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm font-semibold text-foreground">Custo estimado do período</p>
                <p class="text-xs text-muted-foreground">Conversão do total carregado na tela com a taxa informada acima.</p>
              </div>
              <div class="text-left sm:text-right">
                <p class="text-sm font-semibold tabular-nums">{{ fmtCusto(uso.custoEstimado) }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ fmtCustoMoeda(custoPeriodoComparacao, moedaComparacaoNormalizada) }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
