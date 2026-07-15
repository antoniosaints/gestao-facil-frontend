<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from 'vue-toastification'
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import {
  WhatsAppRepository,
  type ResumoRelatorioAtendimento,
} from '@/repositories/whatsapp-repository'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import { formatDuracaoMs } from '@/utils/formatters'
import { columnsRelatorioAtendimentos } from './relatorios/columnDef'
import {
  CalendarRange, CheckCheck, FileDigit, Filter, Hourglass, LoaderCircle, RefreshCw, Timer, Users,
} from 'lucide-vue-next'

const toast = useToast()
const loadingResumo = ref(true)
const openModalFiltros = ref(false)
const filtroPeriodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const presetAtivo = ref<string>('month')
const atendenteId = ref<number | null>(null)
const resumo = ref<ResumoRelatorioAtendimento | null>(null)
const atendentes = ref<{ id: number; label: string }[]>([])

// Filtros repassados ao DataTable: ele já cuida de busca, ordenação e paginação contra
// /whatsapp/relatorios/atendimentos. `update` é o gatilho de refetch que o DataTable observa.
const filtrosTabela = reactive({
  inicio: filtroPeriodo.value[0].toISOString(),
  fim: filtroPeriodo.value[1].toISOString(),
  atendenteId: undefined as number | undefined,
  update: 0,
})

const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]

const filtroLabel = computed(() => {
  const [i, f] = filtroPeriodo.value
  return `${i.toLocaleDateString('pt-BR')} — ${f.toLocaleDateString('pt-BR')}`
})

const cards = computed(() => {
  const t = resumo.value?.totais
  if (!t) return []
  return [
    {
      titulo: 'Atendimentos finalizados',
      valor: String(t.finalizados),
      detalhe: `${t.atendimentos} ciclos no período`,
      icone: CheckCheck,
      cor: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      titulo: 'Tempo médio de espera',
      valor: formatDuracaoMs(t.tempoMedioEsperaMs),
      detalhe: 'da fila até alguém assumir',
      icone: Hourglass,
      cor: 'bg-amber-500/10 text-amber-600',
    },
    {
      titulo: 'Tempo médio de resolução',
      valor: formatDuracaoMs(t.tempoMedioResolucaoMs),
      detalhe: 'de assumir até finalizar',
      icone: Timer,
      cor: 'bg-violet-500/10 text-violet-600',
    },
    {
      titulo: 'Ainda abertos',
      valor: String(t.emAndamento + t.naFila),
      detalhe: `${t.naFila} na fila · ${t.emAndamento} em andamento`,
      icone: Users,
      cor: 'bg-blue-500/10 text-blue-600',
    },
  ]
})

const maxFinalizados = computed(() =>
  Math.max(1, ...(resumo.value?.porAtendente ?? []).map((a) => a.finalizados)),
)

async function carregarResumo() {
  try {
    loadingResumo.value = true
    resumo.value = await WhatsAppRepository.getRelatorioResumo({
      inicio: filtrosTabela.inicio,
      fim: filtrosTabela.fim,
      atendenteId: filtrosTabela.atendenteId,
    })
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o resumo do relatório')
  } finally {
    loadingResumo.value = false
  }
}

// Sincroniza os filtros da tabela com o período/atendente e dispara o refetch dos dois lados.
function aplicarFiltros() {
  const [inicio, fim] = filtroPeriodo.value
  filtrosTabela.inicio = inicio.toISOString()
  filtrosTabela.fim = fim.toISOString()
  filtrosTabela.atendenteId = atendenteId.value ?? undefined
  filtrosTabela.update++
  carregarResumo()
}

function applyPreset(preset: string) {
  presetAtivo.value = preset
  const now = new Date()
  if (preset === 'today') filtroPeriodo.value = [startOfDay(now), endOfDay(now)]
  else if (preset === '7d') filtroPeriodo.value = [startOfDay(subDays(now, 6)), endOfDay(now)]
  else if (preset === '30d') filtroPeriodo.value = [startOfDay(subDays(now, 29)), endOfDay(now)]
  else if (preset === 'month') filtroPeriodo.value = [startOfMonth(now), endOfMonth(now)]
  else if (preset === 'last-month') {
    const lm = subMonths(now, 1)
    filtroPeriodo.value = [startOfMonth(lm), endOfMonth(lm)]
  }
  aplicarFiltros()
}

function aplicarCustom() {
  presetAtivo.value = 'custom'
  openModalFiltros.value = false
  aplicarFiltros()
}

watch(atendenteId, aplicarFiltros)

onMounted(async () => {
  carregarResumo()
  try {
    atendentes.value = await UsuarioRepository.select2()
  } catch (error) {
    // O filtro por atendente é um extra: sem a lista, o relatório continua utilizável.
    console.error(error)
  }
})
</script>

<template>
  <div class="space-y-4 pb-24 md:pb-4">
    <!-- Cabeçalho -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileDigit class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Relatórios de atendimento
        </h2>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarRange class="h-3.5 w-3.5" /> {{ filtroLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex flex-wrap items-center rounded-lg border border-border bg-card p-1">
          <button v-for="p in presets" :key="p.key" type="button" @click="applyPreset(p.key)"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="presetAtivo === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'">
            {{ p.label }}
          </button>
        </div>
        <select v-model="atendenteId"
          class="h-9 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none">
          <option :value="null">Todos os atendentes</option>
          <option v-for="a in atendentes" :key="a.id" :value="a.id">{{ a.label }}</option>
        </select>
        <Button variant="outline" size="sm" @click="openModalFiltros = true">
          <Filter class="h-4 w-4" /> Período
        </Button>
        <Button variant="outline" size="icon" class="h-9 w-9" :disabled="loadingResumo" @click="aplicarFiltros">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loadingResumo }" />
        </Button>
      </div>
    </div>

    <!-- Totais do período -->
    <section v-if="loadingResumo" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-[112px] rounded-xl" />
    </section>
    <section v-else-if="resumo" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="(c, i) in cards" :key="i" class="rounded-xl">
        <CardContent class="p-4">
          <div class="rounded-lg p-2 w-fit" :class="c.cor">
            <component :is="c.icone" class="h-5 w-5" />
          </div>
          <p class="mt-3 text-sm text-muted-foreground">{{ c.titulo }}</p>
          <p class="text-2xl font-bold tracking-tight text-foreground">{{ c.valor }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ c.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <!-- Desempenho por atendente -->
    <Card v-if="!loadingResumo && resumo" class="rounded-xl">
      <CardContent class="p-4">
        <p class="text-sm font-semibold text-foreground">Desempenho por atendente</p>
        <p class="mb-3 text-xs text-muted-foreground">Atendimentos e tempos médios no período</p>

        <div v-if="!resumo.porAtendente.length" class="flex flex-col items-center gap-2 py-8 text-center">
          <Users class="h-8 w-8 text-muted-foreground" />
          <p class="text-sm font-medium">Nenhum atendimento com atendente no período</p>
          <p class="max-w-md text-xs text-muted-foreground">
            Só aparecem aqui atendimentos assumidos por um usuário pelo sistema.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-border text-xs text-muted-foreground">
                <th class="py-2 text-left font-medium">Atendente</th>
                <th class="py-2 text-left font-medium">Volume</th>
                <th class="py-2 text-right font-medium">Finalizados</th>
                <th class="py-2 text-right font-medium">Em andamento</th>
                <th class="py-2 text-right font-medium">Espera média</th>
                <th class="py-2 text-right font-medium">Resolução média</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in resumo.porAtendente" :key="a.atendenteId" class="border-b border-border/50 last:border-0">
                <td class="py-2 pr-3">
                  <span class="truncate font-medium text-foreground">{{ a.nome }}</span>
                </td>
                <td class="w-[28%] py-2 pr-3">
                  <div class="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full bg-primary"
                      :style="{ width: `${(a.finalizados / maxFinalizados) * 100}%` }" />
                  </div>
                </td>
                <td class="py-2 text-right font-semibold text-foreground">{{ a.finalizados }}</td>
                <td class="py-2 text-right text-muted-foreground">{{ a.emAndamento }}</td>
                <td class="py-2 text-right text-muted-foreground">{{ formatDuracaoMs(a.tempoMedioEsperaMs) }}</td>
                <td class="py-2 text-right text-muted-foreground">{{ formatDuracaoMs(a.tempoMedioResolucaoMs) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Detalhamento: um registro por ciclo de atendimento -->
    <Card class="rounded-xl">
      <CardContent class="p-4">
        <p class="text-sm font-semibold text-foreground">Atendimentos do período</p>
        <p class="text-xs text-muted-foreground">
          Cada linha é um ciclo de atendimento — a mesma conversa aparece uma vez por retorno do cliente.
        </p>
        <DataTable :columns="columnsRelatorioAtendimentos" api="/whatsapp/relatorios/atendimentos"
          :filters="filtrosTabela" />
      </CardContent>
    </Card>

    <!-- Filtro de período customizado -->
    <ModalView v-model:open="openModalFiltros" title="Período personalizado" size="lg">
      <div class="space-y-4">
        <Calendarpicker class="w-full" :range="true" v-model="filtroPeriodo" />
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="openModalFiltros = false">Cancelar</Button>
          <Button size="sm" @click="aplicarCustom">
            <LoaderCircle v-if="loadingResumo" class="h-4 w-4 animate-spin" />
            Aplicar
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
