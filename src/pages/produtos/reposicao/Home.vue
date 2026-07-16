<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsMovimentacoes } from '../movimentacoes/columnDef'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ModalReposicaoLote from '../formulario/ModalReposicaoLote.vue'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { IaRepository, isIaQuotaError, type IaReposicaoSugestao } from '@/repositories/ia-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import { useToast } from 'vue-toastification'
import router from '@/router'
import { ArrowDownToLine, FilterX, PackagePlus, Package, RefreshCw, Boxes, Sparkles, LoaderCircle, ClipboardList } from 'lucide-vue-next'

type ResumoTipo = { quantidade: number; valor: number; registros: number }
interface Resumo {
  totalRegistros: number
  valorTotal: number
  porTipo: Record<string, ResumoTipo>
}

const openModal = ref(false)
const toast = useToast()
const storeUi = useUiStore()

// ---- Fase 4: sugestão de reposição por IA (só com o app core-ia ativo) ----
const iaReposicaoAtivo = computed(() => storeUi.hasActiveModule('core-ia'))
const reposicaoModal = ref<InstanceType<typeof ModalReposicaoLote> | null>(null)
const iaLoading = ref(false)
const sugestoesIa = ref<IaReposicaoSugestao[]>([])
const iaAnalisado = ref(false)

async function analisarReposicaoIa() {
  try {
    iaLoading.value = true
    iaAnalisado.value = false
    const r = await IaRepository.reposicaoSugestao()
    sugestoesIa.value = r.sugestoes || []
    iaAnalisado.value = true
    if (!sugestoesIa.value.length) {
      toast.info('Nenhum produto precisa de reposição no momento.')
    }
  } catch (error: any) {
    if (isIaQuotaError(error)) {
      toast.error('Limite mensal de IA do plano atingido. Fale com o administrador.')
    } else {
      toast.error(error?.response?.data?.message || 'Não foi possível gerar as sugestões.')
    }
  } finally {
    iaLoading.value = false
  }
}

function preencherComSugestoes() {
  if (!sugestoesIa.value.length) return
  reposicaoModal.value?.carregarSugestoes(
    sugestoesIa.value.map((s) => ({ produtoId: s.produtoId, quantidade: s.quantidade })),
  )
}

// Rascunho ligado aos inputs
const form = reactive<Record<string, any>>({
  notaFiscal: '',
  fornecedorId: null,
  produtoId: null,
})
const periodo = ref<[Date, Date] | []>([])

// Filtros aplicados (tipo fixo em ENTRADA — reposições)
const filters = reactive<Record<string, any>>({
  tipo: 'ENTRADA',
  status: 'TODOS',
  notaFiscal: undefined,
  fornecedorId: undefined,
  produtoId: undefined,
  dataInicio: undefined,
  dataFim: undefined,
  update: false,
})

const resumo = ref<Resumo | null>(null)

async function carregarResumo() {
  try {
    resumo.value = await ProdutoRepository.getMovimentacoesResumo({
      tipo: 'ENTRADA',
      notaFiscal: filters.notaFiscal,
      fornecedorId: filters.fornecedorId,
      produtoId: filters.produtoId,
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
    })
  } catch (error) {
    console.error(error)
  }
}

function aplicarFiltros() {
  filters.notaFiscal = form.notaFiscal?.trim() || undefined
  filters.fornecedorId = form.fornecedorId || undefined
  filters.produtoId = form.produtoId || undefined
  if (Array.isArray(periodo.value) && periodo.value.length === 2) {
    filters.dataInicio = periodo.value[0].toISOString()
    filters.dataFim = periodo.value[1].toISOString()
  } else {
    filters.dataInicio = undefined
    filters.dataFim = undefined
  }
  filters.update = !filters.update
  carregarResumo()
}

function limparFiltros() {
  form.notaFiscal = ''
  form.fornecedorId = null
  form.produtoId = null
  periodo.value = []
  aplicarFiltros()
}

function onReposicaoSalva() {
  filters.update = !filters.update
  carregarResumo()
}

const entrada = () => resumo.value?.porTipo?.ENTRADA

onMounted(carregarResumo)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <PackagePlus class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Reposição de estoque
        </h2>
        <p class="text-sm text-muted-foreground">
          Registre entradas de estoque em massa e acompanhe o histórico de reposições.
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="router.push('/produtos')">
          <Boxes class="h-4 w-4" /> Produtos
        </Button>
        <Button v-if="iaReposicaoAtivo" variant="outline" class="gap-2 text-violet-600 dark:text-violet-400"
          :disabled="iaLoading" @click="analisarReposicaoIa">
          <LoaderCircle v-if="iaLoading" class="h-4 w-4 animate-spin" />
          <Sparkles v-else class="h-4 w-4" />
          Sugerir reposição (IA)
        </Button>
        <Button class="text-white" @click="openModal = true">
          <PackagePlus class="h-4 w-4" /> Nova reposição
        </Button>
      </div>
    </div>

    <!-- Sugestões da IA -->
    <Card v-if="iaReposicaoAtivo && (iaLoading || iaAnalisado)" class="rounded-xl border-violet-200 dark:border-violet-900/50">
      <CardContent class="p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-violet-500/10 p-2 text-violet-600"><Sparkles class="h-5 w-5" /></span>
            <div>
              <p class="text-sm font-semibold text-foreground">Sugestões da IA</p>
              <p class="text-xs text-muted-foreground">Baseado na velocidade de venda e na cobertura de estoque.</p>
            </div>
          </div>
          <Button v-if="sugestoesIa.length" size="sm" class="gap-2 text-white" @click="preencherComSugestoes">
            <ClipboardList class="h-4 w-4" /> Preencher reposição
          </Button>
        </div>

        <div v-if="iaLoading" class="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <LoaderCircle class="h-4 w-4 animate-spin" /> Analisando estoque e vendas...
        </div>

        <div v-else-if="sugestoesIa.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border/70 text-left text-xs uppercase text-muted-foreground">
                <th class="py-2 pr-3 font-medium">Produto</th>
                <th class="py-2 pr-3 text-right font-medium">Estoque</th>
                <th class="py-2 pr-3 text-right font-medium">Cobertura</th>
                <th class="py-2 pr-3 text-right font-medium">Sugerido</th>
                <th class="py-2 pl-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sugestoesIa" :key="s.produtoId" class="border-b border-border/40 last:border-0">
                <td class="py-2 pr-3 font-medium">{{ s.nome }}</td>
                <td class="py-2 pr-3 text-right tabular-nums text-muted-foreground">{{ s.estoqueAtual }}</td>
                <td class="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                  {{ s.coberturaDias == null ? '—' : `${s.coberturaDias}d` }}
                </td>
                <td class="py-2 pr-3 text-right font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                  +{{ s.quantidade }}
                </td>
                <td class="py-2 pl-3 text-muted-foreground">{{ s.justificativa }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-else class="py-4 text-center text-sm text-muted-foreground">
          Nenhum produto precisa de reposição no momento.
        </p>
      </CardContent>
    </Card>

    <!-- Resumo -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card class="rounded-xl">
        <CardContent class="p-4">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><ArrowDownToLine class="h-5 w-5" /></span>
            <span class="text-sm text-muted-foreground">Valor reposto</span>
          </div>
          <p class="mt-3 text-xl font-bold text-foreground">{{ formatCurrencyBR(entrada()?.valor || 0) }}</p>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardContent class="p-4">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Package class="h-5 w-5" /></span>
            <span class="text-sm text-muted-foreground">Unidades repostas</span>
          </div>
          <p class="mt-3 text-xl font-bold text-foreground">{{ entrada()?.quantidade || 0 }}</p>
        </CardContent>
      </Card>
      <Card class="rounded-xl">
        <CardContent class="p-4">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-violet-500/10 p-2 text-violet-600"><RefreshCw class="h-5 w-5" /></span>
            <span class="text-sm text-muted-foreground">Reposições registradas</span>
          </div>
          <p class="mt-3 text-xl font-bold text-foreground">{{ entrada()?.registros || 0 }}</p>
        </CardContent>
      </Card>
    </section>

    <!-- Filtros -->
    <Card class="rounded-xl">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Nota fiscal</label>
            <Input v-model="form.notaFiscal" placeholder="Nº da nota fiscal" @keyup.enter="aplicarFiltros" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Fornecedor</label>
            <Select2Ajax v-model:model-value="form.fornecedorId" url="/clientes/select2"
              :params="[{ key: 'fornecedor', value: true }]" placeholder="Todos" :allow-clear="true" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Produto</label>
            <Select2Ajax v-model:model-value="form.produtoId" url="/produtos/select2"
              placeholder="Todos" :allow-clear="true" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Período</label>
            <Calendarpicker class="w-full" :range="true" v-model="periodo" :teleport="true" />
          </div>
        </div>

        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" @click="limparFiltros">
            <FilterX class="h-4 w-4" /> Limpar
          </Button>
          <Button @click="aplicarFiltros">
            <RefreshCw class="h-4 w-4" /> Aplicar filtros
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Tabela -->
    <DataTable :columns="columnsMovimentacoes" :filters="filters" api="/produtos/movimentacoes" />

    <ModalReposicaoLote ref="reposicaoModal" v-model:open="openModal" @saved="onReposicaoSalva" />
  </div>
</template>
