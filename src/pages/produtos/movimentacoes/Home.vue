<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { columnsMovimentacoes } from './columnDef'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import router from '@/router'
import {
  ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, FileSearch, FilterX, RefreshCw, Trash2,
} from 'lucide-vue-next'

type ResumoTipo = { quantidade: number; valor: number; registros: number }
interface Resumo {
  totalRegistros: number
  valorTotal: number
  porTipo: Record<string, ResumoTipo>
}

// Rascunho: ligado aos inputs (não dispara busca enquanto o usuário digita/escolhe)
const form = reactive<Record<string, any>>({
  notaFiscal: '',
  fornecedorId: null,
  produtoId: null,
  tipo: 'TODOS',
  status: 'TODOS',
})
const periodo = ref<[Date, Date] | []>([])

// Aplicado: consumido pela tabela; só muda ao clicar em "Aplicar"
const filters = reactive<Record<string, any>>({
  notaFiscal: undefined,
  fornecedorId: undefined,
  produtoId: undefined,
  tipo: 'TODOS',
  status: 'TODOS',
  dataInicio: undefined,
  dataFim: undefined,
  update: false,
})

const resumo = ref<Resumo | null>(null)
const carregandoResumo = ref(false)

async function carregarResumo() {
  try {
    carregandoResumo.value = true
    resumo.value = await ProdutoRepository.getMovimentacoesResumo({
      notaFiscal: filters.notaFiscal,
      fornecedorId: filters.fornecedorId,
      produtoId: filters.produtoId,
      tipo: filters.tipo,
      status: filters.status,
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
    })
  } catch (error) {
    console.error(error)
  } finally {
    carregandoResumo.value = false
  }
}

function aplicarFiltros() {
  filters.notaFiscal = form.notaFiscal?.trim() || undefined
  filters.fornecedorId = form.fornecedorId || undefined
  filters.produtoId = form.produtoId || undefined
  filters.tipo = form.tipo
  filters.status = form.status
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
  form.tipo = 'TODOS'
  form.status = 'TODOS'
  periodo.value = []
  aplicarFiltros()
}

const cards = [
  { key: 'ENTRADA', titulo: 'Entradas', icone: ArrowDownToLine, cor: 'text-emerald-600 bg-emerald-500/10' },
  { key: 'SAIDA', titulo: 'Saídas', icone: ArrowUpFromLine, cor: 'text-orange-600 bg-orange-500/10' },
  { key: 'DESCARTE', titulo: 'Descartes', icone: Trash2, cor: 'text-rose-600 bg-rose-500/10' },
  { key: 'TRANSFERENCIA', titulo: 'Transferências', icone: ArrowLeftRight, cor: 'text-blue-600 bg-blue-500/10' },
]

onMounted(carregarResumo)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileSearch class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Movimentações de estoque
        </h2>
        <p class="text-sm text-muted-foreground">Controle e auditoria de entradas, saídas, descartes e transferências.</p>
      </div>
      <Button variant="outline" @click="router.push('/produtos')">Voltar aos produtos</Button>
    </div>

    <!-- Resumo -->
    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="card in cards" :key="card.key" class="rounded-xl">
        <CardContent class="p-4">
          <div class="flex items-center gap-2">
            <span class="rounded-lg p-2" :class="card.cor"><component :is="card.icone" class="h-5 w-5" /></span>
            <span class="text-sm text-muted-foreground">{{ card.titulo }}</span>
          </div>
          <p class="mt-3 text-xl font-bold text-foreground">{{ formatCurrencyBR(resumo?.porTipo?.[card.key]?.valor || 0) }}</p>
          <p class="text-xs text-muted-foreground">
            {{ resumo?.porTipo?.[card.key]?.registros || 0 }} registro(s) · {{ resumo?.porTipo?.[card.key]?.quantidade || 0 }} un
          </p>
        </CardContent>
      </Card>
    </section>

    <!-- Filtros de auditoria -->
    <Card class="rounded-xl">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Nota fiscal</label>
            <Input v-model="form.notaFiscal" placeholder="Nº da nota fiscal" @keyup.enter="aplicarFiltros" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Fornecedor / Cliente</label>
            <Select2Ajax v-model:model-value="form.fornecedorId" url="/clientes/select2"
              placeholder="Todos" :allow-clear="true" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Produto</label>
            <Select2Ajax v-model:model-value="form.produtoId" url="/produtos/select2"
              placeholder="Todos" :allow-clear="true" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select v-model="form.tipo">
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os tipos</SelectItem>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
                <SelectItem value="DESCARTE">Descarte</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">Status</label>
            <Select v-model="form.status">
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
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
  </div>
</template>
