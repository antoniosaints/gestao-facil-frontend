<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays } from 'date-fns'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  ArrowRight,
  BanknoteArrowDown,
  CalendarDays,
  Eye,
  HandCoins,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-vue-next'
import RestaurantCashDetailsDialog from '@/components/restaurante/RestaurantCashDetailsDialog.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  RestauranteRepository,
  type RestauranteCaixaContexto,
  type RestauranteCaixaRelatorio,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'

type StatusFiltro = 'TODOS' | 'ABERTO' | 'FECHADO' | 'CANCELADO'

const toast = useToast()
const loading = ref(false)
const page = ref(1)
const status = ref<StatusFiltro>('TODOS')
const inicio = ref(startOfMonth(new Date()).toISOString().slice(0, 10))
const fim = ref(endOfMonth(new Date()).toISOString().slice(0, 10))
const relatorio = ref<RestauranteCaixaRelatorio | null>(null)
const detalhesAbertos = ref(false)
const caixaSelecionado = ref<RestauranteCaixaContexto | null>(null)

const presets = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: 'month', label: 'Este mês' },
]
const presetAtivo = ref('month')

const indicadores = computed(() => {
  const resumo = relatorio.value?.resumo
  return [
    {
      titulo: 'Caixas',
      valor: String(resumo?.caixas || 0),
      detalhe: 'turnos encontrados',
      icon: HandCoins,
      classe: 'bg-primary/10 text-primary',
    },
    {
      titulo: 'Pedidos',
      valor: String(resumo?.pedidos || 0),
      detalhe: 'vinculados aos turnos',
      icon: ShoppingCart,
      classe: 'bg-sky-500/10 text-sky-600',
    },
    {
      titulo: 'Entradas em pedidos',
      valor: formatCurrencyBR(resumo?.totalPedidos || 0),
      detalhe: 'total recebido no período',
      icon: TrendingUp,
      classe: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      titulo: 'Sangrias e reforços',
      valor: formatCurrencyBR((resumo?.totalReforcos || 0) - (resumo?.totalSangrias || 0)),
      detalhe: `${formatCurrencyBR(resumo?.totalReforcos || 0)} reforços · ${formatCurrencyBR(resumo?.totalSangrias || 0)} sangrias`,
      icon: BanknoteArrowDown,
      classe: 'bg-amber-500/10 text-amber-600',
    },
  ]
})

function periodoIso(data: string, fimDoDia = false) {
  if (!data) return undefined
  const valor = new Date(`${data}T${fimDoDia ? '23:59:59.999' : '00:00:00.000'}`)
  return Number.isNaN(valor.getTime()) ? undefined : valor.toISOString()
}

async function carregar() {
  try {
    loading.value = true
    relatorio.value = await RestauranteRepository.relatorioCaixas({
      inicio: periodoIso(inicio.value),
      fim: periodoIso(fim.value, true),
      status: status.value === 'TODOS' ? undefined : status.value,
      page: page.value,
      limit: 10,
    })
    page.value = relatorio.value.pagination.page
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Não foi possível carregar os caixas.')
  } finally {
    loading.value = false
  }
}

function aplicarFiltros() {
  presetAtivo.value = ''
  page.value = 1
  carregar()
}

function aplicarPreset(key: string) {
  const hoje = new Date()
  if (key === 'today') {
    inicio.value = startOfDay(hoje).toISOString().slice(0, 10)
    fim.value = endOfDay(hoje).toISOString().slice(0, 10)
  } else if (key === '7d') {
    inicio.value = startOfDay(subDays(hoje, 6)).toISOString().slice(0, 10)
    fim.value = endOfDay(hoje).toISOString().slice(0, 10)
  } else {
    inicio.value = startOfMonth(hoje).toISOString().slice(0, 10)
    fim.value = endOfMonth(hoje).toISOString().slice(0, 10)
  }
  presetAtivo.value = key
  page.value = 1
  carregar()
}

function trocarPagina(proxima: number) {
  const totalPages = relatorio.value?.pagination.totalPages || 1
  if (proxima < 1 || proxima > totalPages || proxima === page.value) return
  page.value = proxima
  carregar()
}

function abrirDetalhes(contexto: RestauranteCaixaContexto) {
  caixaSelecionado.value = contexto
  detalhesAbertos.value = true
}

function classeStatus(valor: string) {
  if (valor === 'ABERTO')
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  if (valor === 'FECHADO') return 'border-muted-foreground/30 bg-muted text-muted-foreground'
  return 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return '—'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleString('pt-BR')
}

onMounted(carregar)
</script>

<template>
  <main class="mx-auto w-full space-y-5">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-border text-foreground"
          >
            <HandCoins class="h-5 w-5" />
          </span>
          <div>
            <h1 class="text-xl font-bold tracking-tight">Caixas do Restaurante</h1>
            <p class="text-sm text-muted-foreground">
              Histórico, conferência e movimentações dos turnos.
            </p>
          </div>
        </div>
      </div>
      <Button variant="outline" :disabled="loading" @click="carregar">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar
      </Button>
    </header>

    <section class="rounded-md border bg-card p-3 md:p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="preset in presets"
            :key="preset.key"
            size="sm"
            :variant="presetAtivo === preset.key ? 'default' : 'outline'"
            @click="aplicarPreset(preset.key)"
          >
            {{ preset.label }}
          </Button>
        </div>
        <div class="grid flex-1 gap-2 sm:grid-cols-3 lg:max-w-2xl lg:ml-auto">
          <label class="grid gap-1 text-xs font-medium text-muted-foreground">
            <span>De</span>
            <Input v-model="inicio" type="date" @change="aplicarFiltros" />
          </label>
          <label class="grid gap-1 text-xs font-medium text-muted-foreground">
            <span>Até</span>
            <Input v-model="fim" type="date" @change="aplicarFiltros" />
          </label>
          <label class="grid gap-1 text-xs font-medium text-muted-foreground">
            <span>Status</span>
            <select
              v-model="status"
              class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
              @change="aplicarFiltros"
            >
              <option value="TODOS">Todos</option>
              <option value="ABERTO">Abertos</option>
              <option value="FECHADO">Fechados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="indicador in indicadores"
        :key="indicador.titulo"
        class="rounded-xl border bg-card p-4"
      >
        <div class="flex items-center gap-2">
          <span class="grid h-9 w-9 place-items-center rounded-lg" :class="indicador.classe">
            <component :is="indicador.icon" class="h-4 w-4" />
          </span>
          <p class="text-xs font-medium text-muted-foreground">{{ indicador.titulo }}</p>
        </div>
        <p class="mt-3 text-xl font-bold tabular-nums">{{ indicador.valor }}</p>
        <p class="mt-1 truncate text-xs text-muted-foreground">{{ indicador.detalhe }}</p>
      </article>
    </section>

    <section class="overflow-hidden rounded-xl border bg-card">
      <div class="flex items-center gap-2 border-b px-4 py-3">
        <CalendarDays class="h-4 w-4 text-primary" />
        <h2 class="font-semibold">Turnos de caixa</h2>
        <span class="ml-auto text-xs text-muted-foreground">
          {{ relatorio?.pagination.total || 0 }} registro(s)
        </span>
      </div>
      <div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">
        Carregando caixas…
      </div>
      <div
        v-else-if="!relatorio?.caixas.length"
        class="py-12 text-center text-sm text-muted-foreground"
      >
        Nenhum caixa encontrado para os filtros selecionados.
      </div>
      <div v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[850px] text-sm">
            <thead class="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th class="px-4 py-3 font-medium">Caixa</th>
                <th class="px-4 py-3 font-medium">Operador</th>
                <th class="px-4 py-3 font-medium">Abertura</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 text-right font-medium">Pedidos</th>
                <th class="px-4 py-3 text-right font-medium">Entradas</th>
                <th class="px-4 py-3 text-right font-medium">Esperado</th>
                <th class="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in relatorio.caixas"
                :key="item.caixa.id"
                class="border-b last:border-0 hover:bg-muted/30"
              >
                <td class="px-4 py-3 font-semibold">{{ item.caixa.codigo }}</td>
                <td class="px-4 py-3">{{ item.caixa.abertoPor?.nome || '—' }}</td>
                <td class="px-4 py-3 text-muted-foreground">
                  {{ formatarDataHora(item.caixa.abertoEm) }}
                </td>
                <td class="px-4 py-3">
                  <Badge :class="classeStatus(item.caixa.status)">{{ item.caixa.status }}</Badge>
                </td>
                <td class="px-4 py-3 text-right tabular-nums">{{ item.resumo.pedidos }}</td>
                <td class="px-4 py-3 text-right font-medium tabular-nums">
                  {{ formatCurrencyBR(item.resumo.totalPedidos) }}
                </td>
                <td class="px-4 py-3 text-right font-semibold tabular-nums">
                  {{ formatCurrencyBR(item.caixa.saldoEsperado) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" @click="abrirDetalhes(item)"
                    ><Eye class="h-4 w-4" />Detalhes</Button
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="divide-y md:hidden">
          <article v-for="item in relatorio.caixas" :key="item.caixa.id" class="space-y-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold">{{ item.caixa.codigo }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatarDataHora(item.caixa.abertoEm) }}
                </p>
              </div>
              <Badge :class="classeStatus(item.caixa.status)">{{ item.caixa.status }}</Badge>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <p class="text-muted-foreground">{{ item.caixa.abertoPor?.nome || '—' }}</p>
              <p class="text-right">
                <strong>{{ item.resumo.pedidos }}</strong> pedido(s)
              </p>
              <p class="text-muted-foreground">Entradas</p>
              <p class="text-right font-semibold tabular-nums">
                {{ formatCurrencyBR(item.resumo.totalPedidos) }}
              </p>
            </div>
            <Button class="w-full" size="sm" variant="outline" @click="abrirDetalhes(item)"
              ><Eye class="h-4 w-4" />Ver detalhes</Button
            >
          </article>
        </div>
      </div>
      <footer
        v-if="relatorio?.pagination.totalPages && relatorio.pagination.totalPages > 1"
        class="flex items-center justify-between border-t px-4 py-3"
      >
        <Button
          size="sm"
          variant="outline"
          :disabled="page <= 1 || loading"
          @click="trocarPagina(page - 1)"
          ><ArrowLeft class="h-4 w-4" />Anterior</Button
        >
        <span class="text-xs text-muted-foreground"
          >Página {{ page }} de {{ relatorio.pagination.totalPages }}</span
        >
        <Button
          size="sm"
          variant="outline"
          :disabled="page >= relatorio.pagination.totalPages || loading"
          @click="trocarPagina(page + 1)"
          >Próxima<ArrowRight class="h-4 w-4"
        /></Button>
      </footer>
    </section>

    <RestaurantCashDetailsDialog
      v-if="caixaSelecionado"
      v-model:open="detalhesAbertos"
      :contexto="caixaSelecionado"
      :pode-operar="false"
    />
  </main>
</template>
