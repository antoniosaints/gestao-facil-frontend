<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { AlertTriangle, BadgeCheck, CalendarDays, Clock3, CreditCard, LoaderCircle, XCircle } from 'lucide-vue-next'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ReservationsRepository, type AvailabilitySlot } from '@/repositories/reservas-gerais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { FONT_OPTIONS } from '@/utils/themeCustomization'

const route = useRoute()
const toast = useToast()
const slug = String(route.params.slug)
const publicId = String(route.params.publicId)
const token = ref('')
const loading = ref(true)
const booking = ref<any>(null)
const store = ref<any>(null)
const date = ref(format(new Date(), 'yyyy-MM-dd'))
const slots = ref<AvailabilitySlot[]>([])
const selected = ref<AvailabilitySlot | null>(null)
const reservationFont = computed(() => {
  const selectedFont = String(store.value?.theme?.font || 'Inter')
  return FONT_OPTIONS.some((option) => option.value === selectedFont) ? selectedFont : 'Inter'
})

const statusLabel = computed(() => ({
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  CONFIRMADA: 'Confirmada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
}[booking.value?.booking?.status as string] || booking.value?.booking?.status))

async function load() {
  token.value =
    new URLSearchParams(location.hash.replace(/^#/, '')).get('token') ||
    localStorage.getItem(`gestao-facil:reserva:${publicId}`) ||
    ''
  if (!token.value) {
    loading.value = false
    return toast.error('O token seguro desta reserva não foi encontrado.')
  }
  try {
    booking.value = await ReservationsRepository.getPublicBooking(slug, publicId, token.value)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível abrir a reserva.')
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!booking.value) return
  try {
    const storeServices = await ReservationsRepository.getPublicServices(slug)
    const service = storeServices.find((item) => item.Servico.nome === booking.value.booking.service)
    if (!service) return
    slots.value = await ReservationsRepository.publicAvailability(slug, {
      serviceConfigId: service.id,
      dateFrom: date.value,
      dateTo: date.value,
    })
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Falha ao consultar horários.')
  }
}

async function reschedule() {
  if (!selected.value) return
  try {
    booking.value = await ReservationsRepository.reschedulePublic(slug, publicId, token.value, {
      startAt: selected.value.startAt,
      resourceId: selected.value.resourceId,
      version: booking.value.booking.version,
    })
    selected.value = null
    toast.success('Reserva remarcada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remarcar.')
  }
}

async function cancel() {
  if (!confirm('Deseja cancelar esta reserva? Pagamentos feitos serão analisados para estorno.')) return
  try {
    booking.value = await ReservationsRepository.cancelPublic(
      slug,
      publicId,
      token.value,
      booking.value.booking.version,
    )
    toast.success('Reserva cancelada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível cancelar.')
  }
}

async function retryPayment() {
  try {
    const payment = await ReservationsRepository.retryPublicPayment(slug, publicId, token.value)
    if (payment.link) window.open(payment.link, '_blank', 'noopener')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível retomar o pagamento.')
  }
}

onMounted(async () => {
  await Promise.all([
    load(),
    ReservationsRepository.getPublicStore(slug).then((result) => { store.value = result }).catch(() => undefined),
  ])
})
</script>

<template>
  <main class="min-h-screen bg-[#f5f4ef] px-4 py-10 text-slate-900" :style="{ '--app-font': reservationFont }">
    <div v-if="loading" class="grid min-h-[70vh] place-items-center">
      <LoaderCircle class="size-8 animate-spin text-emerald-700" />
    </div>
    <div v-else-if="booking" class="mx-auto max-w-3xl">
      <p class="text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">Sua reserva</p>
      <h1 class="mt-2 text-center text-4xl">{{ booking.booking.service }}</h1>
      <Card class="mt-8 overflow-hidden border-0 shadow-xl">
        <div
          class="p-6 text-white"
          :class="booking.booking.status === 'CANCELADA' || booking.booking.status === 'EXPIRADA' ? 'bg-slate-700' : 'bg-emerald-800'"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-wider text-white/70">Status</p>
              <p class="mt-1 text-xl font-semibold">{{ statusLabel }}</p>
            </div>
            <BadgeCheck v-if="booking.booking.status === 'CONFIRMADA'" class="size-10" />
            <XCircle v-else-if="booking.booking.status === 'CANCELADA'" class="size-10" />
            <Clock3 v-else class="size-10" />
          </div>
        </div>
        <CardContent class="grid gap-4 p-6 md:grid-cols-3">
          <div class="rounded-xl bg-slate-50 p-4">
            <CalendarDays class="mb-3 size-5 text-emerald-700" />
            <p class="text-xs text-slate-500">Data e hora</p>
            <p class="mt-1 font-semibold">
              {{ format(new Date(booking.booking.startAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <Clock3 class="mb-3 size-5 text-emerald-700" />
            <p class="text-xs text-slate-500">Recurso</p>
            <p class="mt-1 font-semibold">{{ booking.booking.resource }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <CreditCard class="mb-3 size-5 text-emerald-700" />
            <p class="text-xs text-slate-500">Valor</p>
            <p class="mt-1 font-semibold">{{ formatCurrencyBR(booking.booking.total) }}</p>
          </div>

          <div v-if="booking.payment?.link && booking.booking.status === 'AGUARDANDO_PAGAMENTO'" class="md:col-span-3">
            <Button class="w-full bg-amber-500 text-slate-950 hover:bg-amber-400" @click="retryPayment">
              Retomar pagamento
            </Button>
          </div>

          <section
            v-if="['AGUARDANDO_PAGAMENTO', 'CONFIRMADA'].includes(booking.booking.status)"
            class="md:col-span-3 rounded-2xl border p-5"
          >
            <h2 class="text-2xl">Precisa de outro horário?</h2>
            <div class="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input v-model="date" type="date" class="h-11" />
              <Button variant="outline" @click="loadSlots">Ver horários</Button>
            </div>
            <div v-if="slots.length" class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                v-for="slot in slots"
                :key="`${slot.resourceId}-${slot.startAt}`"
                class="rounded-xl border p-3 text-left text-sm"
                :class="selected?.startAt === slot.startAt ? 'border-emerald-700 bg-emerald-50' : ''"
                @click="selected = slot"
              >
                <strong>{{ format(new Date(slot.startAt), 'HH:mm') }}</strong>
                <span class="block truncate text-xs text-slate-500">{{ slot.resourceName }}</span>
              </button>
            </div>
            <Button v-if="selected" class="mt-4 bg-emerald-700 text-white" @click="reschedule">
              Confirmar remarcação
            </Button>
          </section>

          <div
            v-if="['AGUARDANDO_PAGAMENTO', 'CONFIRMADA'].includes(booking.booking.status)"
            class="md:col-span-3 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertTriangle class="mt-0.5 size-4 shrink-0" />
            <p>O cancelamento libera o horário. Se houver pagamento, o estorno será analisado pela equipe.</p>
          </div>
          <Button
            v-if="['AGUARDANDO_PAGAMENTO', 'CONFIRMADA'].includes(booking.booking.status)"
            variant="outline"
            class="md:col-span-3 border-red-200 text-red-600 hover:bg-red-50"
            @click="cancel"
          >
            Cancelar reserva
          </Button>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
