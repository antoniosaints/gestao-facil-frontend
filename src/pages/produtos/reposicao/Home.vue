<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsMovimentacoes } from '../movimentacoes/columnDef'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ModalReposicaoLote from '../formulario/ModalReposicaoLote.vue'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import router from '@/router'
import { ArrowDownToLine, FilterX, PackagePlus, Package, RefreshCw, Boxes } from 'lucide-vue-next'

type ResumoTipo = { quantidade: number; valor: number; registros: number }
interface Resumo {
  totalRegistros: number
  valorTotal: number
  porTipo: Record<string, ResumoTipo>
}

const openModal = ref(false)

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
        <Button class="text-white" @click="openModal = true">
          <PackagePlus class="h-4 w-4" /> Nova reposição
        </Button>
      </div>
    </div>

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

    <ModalReposicaoLote v-model:open="openModal" @saved="onReposicaoSalva" />
  </div>
</template>
