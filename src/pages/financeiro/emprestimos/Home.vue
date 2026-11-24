<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  CalendarRange,
  Filter,
  FilterX,
  Plus,
  RefreshCw,
  Settings2,
  WalletCards,
} from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useLinkedRecordModal } from '@/composables/useLinkedRecordModal'
import FormSelect from '@/modofacil/components/FormSelect.vue'
import type { EmprestimoSituacao } from '@/repositories/emprestimo-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import Cadastro from './Cadastro.vue'
import Config from './Config.vue'
import Detalhe from './Detalhe.vue'
import { columnsEmprestimos } from './columnDef'
import { diaDoCalendario, situacoesEmprestimo } from './format'

type SituacaoFiltro = EmprestimoSituacao | 'TODOS'
const situacoes: { value: SituacaoFiltro; label: string }[] = [
  { value: 'TODOS', label: 'Todas as situações' },
  ...Object.entries(situacoesEmprestimo).map(([value, { label }]) => ({
    value: value as EmprestimoSituacao,
    label,
  })),
]
const filtrosIniciais = {
  situacao: 'TODOS' as SituacaoFiltro,
  inicioVencimento: '',
  fimVencimento: '',
}

const ui = useUiStore()
const route = useRoute()
const emprestimoId = ref<number>()
const cadastroAberto = ref(false)
const detalheAberto = ref(false)
const configAberta = ref(false)
const filtrosAbertos = ref(false)
const erroFiltros = ref('')
const filters = reactive({ ...filtrosIniciais, update: 0 })
const rascunho = reactive({ ...filtrosIniciais })
const columns = columnsEmprestimos(abrir)
const situacaoAtiva = computed(() =>
  filters.situacao === 'TODOS' ? '' : situacoesEmprestimo[filters.situacao]?.label,
)
const periodoAtivo = computed(() => {
  const inicio =
    filters.inicioVencimento && format(parseISO(filters.inicioVencimento), 'dd/MM/yyyy')
  const fim = filters.fimVencimento && format(parseISO(filters.fimVencimento), 'dd/MM/yyyy')
  if (inicio && fim) return `${inicio} a ${fim}`
  if (inicio) return `A partir de ${inicio}`
  if (fim) return `Até ${fim}`
  return ''
})
const temFiltros = computed(() => Boolean(situacaoAtiva.value || periodoAtivo.value))

function atualizarTabela() {
  filters.update++
}
function abrirFiltros() {
  Object.assign(rascunho, {
    situacao: filters.situacao,
    inicioVencimento: filters.inicioVencimento,
    fimVencimento: filters.fimVencimento,
  })
  erroFiltros.value = ''
  filtrosAbertos.value = true
}
function aplicarFiltros() {
  if (
    rascunho.inicioVencimento &&
    rascunho.fimVencimento &&
    rascunho.inicioVencimento > rascunho.fimVencimento
  ) {
    erroFiltros.value = 'O vencimento final deve ser a partir do inicial.'
    return
  }
  Object.assign(filters, rascunho)
  filtrosAbertos.value = false
}
function limparFiltros() {
  Object.assign(filters, filtrosIniciais)
  filtrosAbertos.value = false
}
function abrir(id: number) {
  emprestimoId.value = id
  detalheAberto.value = true
}
function aoCadastrar(id: number) {
  atualizarTabela()
  abrir(id)
}
useLinkedRecordModal({
  getId: () => route.query.emprestimo,
  isOpen: () => detalheAberto.value,
  show: abrir,
  close: () => {
    detalheAberto.value = false
  },
  returnTo: () => ({ query: { ...route.query, emprestimo: undefined } }),
})
</script>

<template>
  <section class="min-w-0 space-y-4">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <WalletCards class="size-6 text-primary" /> Empréstimos
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Acompanhe parcelas, pagamentos e movimentações no Financeiro.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button :variant="temFiltros ? 'secondary' : 'outline'" @click="abrirFiltros">
          <Filter class="size-4" /> Filtros
        </Button>
        <Button v-if="ui.permissoes.admin" variant="outline" @click="configAberta = true">
          <Settings2 class="size-4" /> Configurações
        </Button>
        <Button @click="cadastroAberto = true"><Plus class="size-4" /> Novo empréstimo</Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Atualizar empréstimos"
          @click="atualizarTabela"
        >
          <RefreshCw class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </header>

    <div v-if="temFiltros" class="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      <Badge v-if="situacaoAtiva" variant="secondary">{{ situacaoAtiva }}</Badge>
      <Badge v-if="periodoAtivo" variant="secondary" class="gap-1.5">
        <CalendarRange class="size-3.5" aria-hidden="true" /> Vencimento {{ periodoAtivo }}
      </Badge>
      <Button variant="ghost" size="sm" @click="limparFiltros">
        <FilterX class="size-4" /> Limpar filtros
      </Button>
    </div>
    <DataTable
      state-key="financeiro-emprestimos"
      :columns="columns"
      :filters="filters"
      api="/emprestimos"
      search-placeholder="Buscar por cliente ou número"
      :empty-title="
        temFiltros ? 'Nenhum empréstimo para os filtros aplicados' : 'Nenhum empréstimo cadastrado'
      "
      :empty-description="
        temFiltros
          ? 'Altere ou limpe os filtros para ver outros empréstimos.'
          : 'Use Novo empréstimo para registrar a primeira operação.'
      "
    />

    <ModalView
      v-model:open="filtrosAbertos"
      title="Filtros de empréstimos"
      :icon="Filter"
      size="lg"
      desktop-variant="sheet"
    >
      <form id="emprestimos-filtros" class="space-y-4 p-4" @submit.prevent="aplicarFiltros">
        <div class="space-y-2">
          <Label for="emprestimos-filtro-situacao">Situação</Label>
          <FormSelect
            id="emprestimos-filtro-situacao"
            v-model="rascunho.situacao"
            :options="situacoes"
            aria-label="Situação"
            required
          />
        </div>
        <fieldset class="space-y-3 rounded-lg border p-3">
          <legend class="px-1 text-sm font-medium">Período de vencimento</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="min-w-0 space-y-2">
              <Label for="dp-input-emprestimos-vencimento-inicio">Vencimento inicial</Label>
              <Calendarpicker
                uid="emprestimos-vencimento-inicio"
                :aria-labels="{ input: 'Vencimento inicial' }"
                :model-value="rascunho.inicioVencimento || null"
                :max-date="rascunho.fimVencimento ? parseISO(rascunho.fimVencimento) : null"
                placeholder="Data inicial"
                :required="false"
                teleport
                @update:model-value="rascunho.inicioVencimento = diaDoCalendario($event)"
              />
            </div>
            <div class="min-w-0 space-y-2">
              <Label for="dp-input-emprestimos-vencimento-fim">Vencimento final</Label>
              <Calendarpicker
                uid="emprestimos-vencimento-fim"
                :aria-labels="{ input: 'Vencimento final' }"
                :model-value="rascunho.fimVencimento || null"
                :min-date="rascunho.inicioVencimento ? parseISO(rascunho.inicioVencimento) : null"
                placeholder="Data final"
                :required="false"
                teleport
                @update:model-value="rascunho.fimVencimento = diaDoCalendario($event)"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Inclui empréstimos com pelo menos uma parcela que vence no período, mesmo se já foi
            paga.
          </p>
        </fieldset>
        <p v-if="erroFiltros" role="alert" class="text-sm text-destructive">{{ erroFiltros }}</p>
      </form>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button variant="outline" @click="limparFiltros">Limpar filtros</Button>
          <Button type="submit" form="emprestimos-filtros">Aplicar filtros</Button>
        </div>
      </template>
    </ModalView>

    <Cadastro v-model:open="cadastroAberto" @salvo="aoCadastrar" />
    <Config v-if="ui.permissoes.admin" v-model:open="configAberta" />
    <Detalhe
      v-model:open="detalheAberto"
      :id="emprestimoId"
      :pode-excluir="ui.permissoes.admin"
      @alterado="atualizarTabela"
    />
  </section>
</template>
