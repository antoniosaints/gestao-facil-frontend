<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ReservationsRepository, type ReservationBooking } from '@/repositories/reservas-gerais-repository'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const anchor = ref(new Date())
const view = ref<'dia' | 'semana' | 'mes' | 'agenda'>('semana')
const bookings = ref<ReservationBooking[]>([])
const loading = ref(false)
const range = computed(() => {
  const start = new Date(anchor.value)
  const end = new Date(anchor.value)
  if (view.value === 'dia') end.setDate(end.getDate() + 1)
  else if (view.value === 'semana' || view.value === 'agenda') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    end.setTime(start.getTime())
    end.setDate(end.getDate() + (view.value === 'agenda' ? 31 : 7))
  } else {
    start.setDate(1)
    end.setMonth(end.getMonth() + 1, 1)
  }
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return { start, end }
})
const groups = computed(() => {
  const result = new Map<string, ReservationBooking[]>()
  for (const booking of bookings.value) {
    const key = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(booking.inicio))
    result.set(key, [...(result.get(key) || []), booking])
  }
  return [...result.entries()]
})
async function load() {
  loading.value = true
  try {
    const result = await ReservationsRepository.listBookings({
      page: 1,
      limit: 500,
      startAt: range.value.start.toISOString(),
      endAt: range.value.end.toISOString(),
    })
    bookings.value = result.items
  } finally { loading.value = false }
}
function move(direction: number) {
  const date = new Date(anchor.value)
  date.setDate(date.getDate() + direction * (view.value === 'dia' ? 1 : view.value === 'mes' ? 30 : 7))
  anchor.value = date
  load()
}
function time(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-col gap-2 lg:flex-row lg:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarDays class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Calendário
        </h2>
        <p class="text-sm text-muted-foreground">Visualize e acompanhe as reservas por período.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button v-for="option in ['dia','semana','mes','agenda']" :key="option" size="sm" :variant="view === option ? 'default' : 'outline'" @click="view = option as any; load()">{{ option }}</Button>
        <Button size="icon" variant="outline" aria-label="Período anterior" @click="move(-1)"><ChevronLeft /></Button><Button size="icon" variant="outline" aria-label="Próximo período" @click="move(1)"><ChevronRight /></Button>
      </div>
    </header>
    <div class="rounded-2xl border bg-card p-4">
      <div class="mb-4 flex items-center justify-between"><strong>{{ range.start.toLocaleDateString('pt-BR') }} — {{ new Date(range.end.getTime() - 1).toLocaleDateString('pt-BR') }}</strong><span class="text-sm text-muted-foreground">{{ bookings.length }} reservas</span></div>
      <div v-if="loading" class="py-20 text-center text-muted-foreground">Carregando agenda…</div>
      <div v-else class="space-y-6">
        <section v-for="[day, items] in groups" :key="day"><h2 class="mb-2 capitalize text-sm font-bold text-muted-foreground">{{ day }}</h2><div class="grid gap-2 md:grid-cols-2 xl:grid-cols-3"><article v-for="booking in items" :key="booking.id" class="rounded-xl border-l-4 border-l-primary bg-muted/30 p-4"><div class="flex min-w-0 justify-between gap-2"><b class="min-w-0 truncate tabular-nums">{{ time(booking.inicio) }} · {{ booking.nomeCliente }}</b><Badge class="shrink-0" variant="outline">{{ booking.status.replace(/_/g, ' ') }}</Badge></div><p class="mt-1 truncate text-sm text-muted-foreground">{{ booking.servicoNome }} · {{ booking.recursoNome }}</p></article></div></section>
        <p v-if="!groups.length" class="py-20 text-center text-muted-foreground">Nenhuma reserva neste período.</p>
      </div>
    </div>
  </div>
</template>
