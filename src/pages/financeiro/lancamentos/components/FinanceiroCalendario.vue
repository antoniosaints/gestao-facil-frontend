<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrencyBR, formatToCapitalize } from '@/utils/formatters'

type CalendarEvent = {
  id: string
  data: string | Date
  descricao: string
  valor: number
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO'
  subtitulo?: string
  payload?: unknown
}

const props = defineProps<{
  eventos: CalendarEvent[]
  title: string
  description?: string
}>()

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEvent): void
}>()

const visualizacao = ref<'mes' | 'semana' | 'dia'>('mes')
const selectedDate = defineModel<Date>('selectedDate', {
  default: new Date(),
})

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const monthStart = computed(() => startOfMonth(selectedDate.value))
const monthEnd = computed(() => endOfMonth(selectedDate.value))
const startDate = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 0 }))
const endDate = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 0 }))
const days = computed(() => eachDayOfInterval({ start: startDate.value, end: endDate.value }))

const inicioSemana = computed(() => startOfWeek(selectedDate.value, { weekStartsOn: 0 }))
const diasSemanaAtual = computed(() => Array.from({ length: 7 }, (_, index) => addDays(inicioSemana.value, index)))
const eventosDiaSelecionado = computed(() => eventosDoDia(selectedDate.value))

function eventosDoDia(data: Date) {
  const dataStr = format(data, 'yyyy-MM-dd')
  return props.eventos
    .filter((evento) => format(new Date(evento.data), 'yyyy-MM-dd') === dataStr)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
}

function navigateMonth(direction: 'prev' | 'next') {
  selectedDate.value = direction === 'prev' ? subMonths(selectedDate.value, 1) : addMonths(selectedDate.value, 1)
}

function navigateWeek(direction: 'prev' | 'next') {
  selectedDate.value = direction === 'prev' ? addDays(selectedDate.value, -7) : addDays(selectedDate.value, 7)
}

function navigateDay(direction: 'prev' | 'next') {
  selectedDate.value = direction === 'prev' ? subDays(selectedDate.value, 1) : addDays(selectedDate.value, 1)
}

function selectDay(dia: Date) {
  selectedDate.value = dia
  if (visualizacao.value === 'mes') {
    visualizacao.value = 'dia'
  }
}

function getEventTone(evento: CalendarEvent) {
  if (evento.tipo === 'RECEITA') {
    return evento.status === 'PAGO'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
  }

  return evento.status === 'PAGO'
    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
    : 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
}

function getStatusTone(evento: CalendarEvent) {
  if (evento.status === 'PAGO') return 'text-blue-600 dark:text-blue-300'
  if (evento.status === 'ATRASADO') return 'text-rose-600 dark:text-rose-300'
  return 'text-amber-600 dark:text-amber-300'
}
</script>

<template>
  <Card class="rounded-2xl border bg-card shadow-sm">
    <CardHeader class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <CardTitle class="text-lg font-semibold text-foreground">
        <div class="flex flex-col">
          <span>{{ title }}</span>
          <span v-if="description" class="text-sm font-normal text-muted-foreground">{{ description }}</span>
        </div>
      </CardTitle>

      <Select v-model="visualizacao">
        <SelectTrigger class="w-full md:w-[180px]">
          <SelectValue placeholder="Visualização" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mes">Mês</SelectItem>
          <SelectItem value="semana">Semana</SelectItem>
          <SelectItem value="dia">Dia</SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>

    <CardContent class="space-y-4">
      <template v-if="visualizacao === 'mes'">
        <div class="flex items-center justify-between">
          <button type="button" @click="navigateMonth('prev')">
            <ArrowBigLeft class="h-5 w-5" />
          </button>
          <h2 class="font-semibold text-foreground">
            {{ formatToCapitalize(format(selectedDate, 'MMMM yyyy', { locale: ptBR })) }}
          </h2>
          <button type="button" @click="navigateMonth('next')">
            <ArrowBigRight class="h-5 w-5" />
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground md:text-sm">
          <div v-for="diaSemana in diasSemana" :key="diaSemana">{{ diaSemana }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1 text-xs md:gap-2">
          <button
            v-for="dia in days"
            :key="dia.toISOString()"
            type="button"
            class="min-h-[110px] rounded-xl border p-2 text-left transition hover:border-primary/40 hover:bg-muted/40"
            :class="{
              'bg-muted/30': !isSameMonth(dia, selectedDate),
              'border-primary bg-primary/5': isSameDay(dia, new Date()),
            }"
            @click="selectDay(dia)"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-semibold text-foreground">{{ format(dia, 'dd') }}</span>
              <span class="text-[10px] text-muted-foreground">{{ eventosDoDia(dia).length }}</span>
            </div>

            <div class="space-y-1">
              <button
                v-for="evento in eventosDoDia(dia).slice(0, 3)"
                :key="evento.id"
                type="button"
                class="w-full rounded-md px-2 py-1 text-left text-[10px] transition hover:opacity-90"
                :class="getEventTone(evento)"
                @click.stop="emit('event-click', evento)"
              >
                <div class="truncate font-medium">{{ evento.descricao }}</div>
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate">{{ formatCurrencyBR(evento.valor) }}</span>
                  <span :class="getStatusTone(evento)">{{ evento.status }}</span>
                </div>
              </button>

              <div v-if="eventosDoDia(dia).length > 3" class="px-1 text-[10px] text-muted-foreground">
                + {{ eventosDoDia(dia).length - 3 }} lançamento(s)
              </div>
            </div>
          </button>
        </div>
      </template>

      <template v-else-if="visualizacao === 'semana'">
        <div class="flex items-center justify-between">
          <button type="button" @click="navigateWeek('prev')">
            <ArrowBigLeft class="h-5 w-5" />
          </button>
          <h2 class="text-center font-semibold text-foreground">
            {{ format(inicioSemana, 'dd/MM/yyyy') }} até {{ format(addDays(inicioSemana, 6), 'dd/MM/yyyy') }}
          </h2>
          <button type="button" @click="navigateWeek('next')">
            <ArrowBigRight class="h-5 w-5" />
          </button>
        </div>

        <div class="grid grid-cols-1 gap-2 lg:grid-cols-7">
          <div
            v-for="dia in diasSemanaAtual"
            :key="dia.toISOString()"
            class="space-y-2 rounded-xl border p-3"
            :class="{ 'border-primary bg-primary/5': isSameDay(dia, selectedDate) }"
          >
            <button type="button" class="w-full text-left" @click="selectedDate = dia">
              <p class="text-sm font-semibold capitalize text-foreground">
                {{ formatToCapitalize(format(dia, 'EEE', { locale: ptBR })) }}
              </p>
              <p class="text-xs text-muted-foreground">{{ format(dia, 'dd/MM/yyyy') }}</p>
            </button>

            <div v-if="eventosDoDia(dia).length" class="space-y-2">
              <button
                v-for="evento in eventosDoDia(dia)"
                :key="evento.id"
                type="button"
                class="w-full rounded-lg px-2 py-2 text-left text-xs transition hover:opacity-90"
                :class="getEventTone(evento)"
                @click="emit('event-click', evento)"
              >
                <div class="font-medium">{{ evento.descricao }}</div>
                <div class="mt-1 flex items-center justify-between gap-2">
                  <span class="truncate">{{ formatCurrencyBR(evento.valor) }}</span>
                  <span :class="getStatusTone(evento)">{{ evento.status }}</span>
                </div>
              </button>
            </div>

            <div v-else class="rounded-lg bg-muted/40 px-2 py-3 text-xs text-muted-foreground">
              Sem lançamentos
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center justify-between">
          <button type="button" @click="navigateDay('prev')">
            <ArrowBigLeft class="h-5 w-5" />
          </button>
          <div class="text-center">
            <p class="text-sm font-medium capitalize text-muted-foreground">
              {{ formatToCapitalize(format(selectedDate, 'EEEE', { locale: ptBR })) }}
            </p>
            <h2 class="font-semibold text-foreground">{{ format(selectedDate, 'dd/MM/yyyy') }}</h2>
          </div>
          <button type="button" @click="navigateDay('next')">
            <ArrowBigRight class="h-5 w-5" />
          </button>
        </div>

        <div v-if="eventosDiaSelecionado.length" class="space-y-3">
          <button
            v-for="evento in eventosDiaSelecionado"
            :key="evento.id"
            type="button"
            class="w-full rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-muted/40"
            @click="emit('event-click', evento)"
          >
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <p class="truncate font-semibold text-foreground">{{ evento.descricao }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ evento.subtitulo || 'Sem observações adicionais' }}</p>
              </div>
              <div class="text-left md:text-right">
                <p class="text-sm font-semibold" :class="evento.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'">
                  {{ evento.tipo === 'RECEITA' ? '+' : '-' }}{{ formatCurrencyBR(evento.valor) }}
                </p>
                <p class="text-xs" :class="getStatusTone(evento)">{{ evento.status }}</p>
              </div>
            </div>
          </button>
        </div>

        <div v-else class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum lançamento encontrado para o dia selecionado.
        </div>
      </template>
    </CardContent>
  </Card>
</template>
