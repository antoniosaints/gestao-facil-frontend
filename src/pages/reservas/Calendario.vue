<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, CalendarPlus, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import Calendario from '@/components/calendario/Calendario.vue'
import type { CalendarEvent } from '@/components/calendario/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ReservationsRepository,
  type ReservationBooking,
  type ReservationStatus,
} from '@/repositories/reservas-gerais-repository'
import { formatCurrencyBR } from '@/utils/formatters'

const router = useRouter()
const toast = useToast()
const selectedDate = ref(new Date())
const bookings = ref<ReservationBooking[]>([])
const selectedBooking = ref<ReservationBooking | null>(null)
const loading = ref(false)

const statusLabel: Record<ReservationStatus, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  CONFIRMADA: 'Confirmada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
}

const statusVariant: Record<ReservationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  AGUARDANDO_PAGAMENTO: 'secondary',
  CONFIRMADA: 'default',
  CONCLUIDA: 'outline',
  CANCELADA: 'destructive',
  EXPIRADA: 'destructive',
}

const calendarEvents = computed<CalendarEvent[]>(() =>
  bookings.value.map((booking) => ({
    id: booking.id,
    data: booking.inicio,
    descricao: `${booking.nomeCliente} · ${booking.servicoNome}`,
    detalhe: booking.recursoNome,
    status: booking.status,
    original: booking,
  })),
)

async function load() {
  loading.value = true
  try {
    const result = await ReservationsRepository.listBookings({
      page: 1,
      limit: 500,
      startAt: startOfWeek(startOfMonth(selectedDate.value)).toISOString(),
      endAt: endOfWeek(endOfMonth(selectedDate.value)).toISOString(),
    })
    bookings.value = result.items
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível carregar o calendário de reservas.')
  } finally {
    loading.value = false
  }
}

function openEvent(event: CalendarEvent) {
  selectedBooking.value = event.original as ReservationBooking
}

function createAt(date: Date = new Date()) {
  const localDate = new Date(date)
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset())
  void router.push({
    path: '/reservas/lista',
    query: { nova: '1', data: localDate.toISOString().slice(0, 16) },
  })
}

function openInList() {
  if (!selectedBooking.value) return
  void router.push({
    path: '/reservas/lista',
    query: { reserva: String(selectedBooking.value.id) },
  })
}

watch(selectedDate, load)
onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarDays class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Calendário de reservas
        </h2>
        <p class="text-sm text-muted-foreground">
          Navegue por mês, semana, dia ou agenda e abra qualquer reserva para consultar seus dados.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="loading" @click="load">
          <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <RefreshCw v-else class="mr-2 h-4 w-4" />
          Atualizar
        </Button>
        <Button @click="createAt()">
          <CalendarPlus class="mr-2 h-4 w-4" />
          Nova reserva
        </Button>
      </div>
    </header>

    <Calendario
      v-model:selected-date="selectedDate"
      :eventos="calendarEvents"
      title="Agenda de reservas"
      :description="loading ? 'Atualizando reservas…' : `${bookings.length} reserva(s) no mês selecionado`"
      @event-click="openEvent"
      @create-event="createAt"
    />

    <Dialog :open="!!selectedBooking" @update:open="!$event && (selectedBooking = null)">
      <DialogContent v-if="selectedBooking" class="max-w-xl">
        <DialogHeader>
          <DialogTitle>{{ selectedBooking.nomeCliente }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border p-4">
            <p class="text-xs text-muted-foreground">Data e horário</p>
            <p class="mt-1 font-semibold">
              {{ format(new Date(selectedBooking.inicio), "dd 'de' MMMM, HH:mm", { locale: ptBR }) }}
            </p>
          </div>
          <div class="rounded-xl border p-4">
            <p class="text-xs text-muted-foreground">Status</p>
            <Badge class="mt-1" :variant="statusVariant[selectedBooking.status]">
              {{ statusLabel[selectedBooking.status] }}
            </Badge>
          </div>
          <div class="rounded-xl border p-4">
            <p class="text-xs text-muted-foreground">Serviço</p>
            <p class="mt-1 font-semibold">{{ selectedBooking.servicoNome }}</p>
          </div>
          <div class="rounded-xl border p-4">
            <p class="text-xs text-muted-foreground">Profissional ou recurso</p>
            <p class="mt-1 font-semibold">{{ selectedBooking.recursoNome }}</p>
          </div>
        </div>

        <div class="rounded-xl bg-muted/40 p-4 text-sm">
          <p><strong>Contato:</strong> {{ selectedBooking.telefoneCliente }}</p>
          <p>
            <strong>Pagamento:</strong>
            {{ formatCurrencyBR(Number(selectedBooking.valorPago)) }} de
            {{ formatCurrencyBR(Number(selectedBooking.valorTotal)) }}
          </p>
          <p v-if="selectedBooking.observacoes" class="mt-2">
            <strong>Observações:</strong> {{ selectedBooking.observacoes }}
          </p>
        </div>

        <div class="flex justify-end">
          <Button @click="openInList">Abrir na lista de reservas</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
