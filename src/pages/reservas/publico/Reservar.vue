<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  Sparkles,
  UserRound,
} from 'lucide-vue-next'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { randomUUID } from '@/utils/uuid'
import {
  ReservationsRepository,
  type AvailabilitySlot,
  type ReservationService,
} from '@/repositories/reservas-gerais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import { FONT_OPTIONS } from '@/utils/themeCustomization'

const route = useRoute()
const toast = useToast()
const slug = String(route.params.slug)
const loading = ref(true)
const sending = ref(false)
const store = ref<any>(null)
const services = ref<ReservationService[]>([])
const slots = ref<AvailabilitySlot[]>([])
const selectedService = ref<ReservationService | null>(null)
const selectedResourceId = ref<number | null>(null)
const selectedDate = ref(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
const selectedSlot = ref<AvailabilitySlot | null>(null)
const preview = ref<{ total: number; paymentAmount: number; paymentPolicy: string } | null>(null)
const step = ref(1)
const result = ref<any>(null)
const form = ref({
  name: '',
  phone: '',
  email: '',
  notes: '',
  acceptedTerms: false,
  operationalConsent: true,
  afterSalesConsent: false,
})

const accent = computed(() => store.value?.colors?.primary || '#0f766e')
const secondary = computed(() => store.value?.colors?.secondary || '#f59e0b')
const reservationFont = computed(() => {
  const selected = String(store.value?.theme?.font || 'Inter')
  return FONT_OPTIONS.some((option) => option.value === selected) ? selected : 'Inter'
})
const compatibleResources = computed(
  () => selectedService.value?.Recursos?.map((item) => item.Recurso) || [],
)
function sectionVisible(section: string) {
  return !Array.isArray(store.value?.sections) || store.value.sections.includes(section)
}
function sectionOrder(section: string) {
  const index = Array.isArray(store.value?.sections) ? store.value.sections.indexOf(section) : -1
  return index < 0 ? 0 : index
}
function paymentLabelFor(service: ReservationService | null) {
  if (!service) return ''
  if (service.politicaPagamento === 'NENHUM') return 'Sem pagamento online'
  if (service.politicaPagamento === 'INTEGRAL') return 'Pagamento integral'
  if (service.politicaPagamento === 'SINAL_FIXO')
    return `Sinal de ${formatCurrencyBR(Number(service.valorSinal || 0))}`
  return `Sinal de ${Number(service.percentualSinal || 0)}%`
}
const paymentLabel = computed(() => paymentLabelFor(selectedService.value))

function next() {
  if (step.value === 1 && !selectedService.value) return toast.error('Escolha um serviço.')
  if (step.value === 2 && !selectedSlot.value) return toast.error('Escolha um horário.')
  step.value = Math.min(3, step.value + 1)
}

async function loadSlots() {
  if (!selectedService.value || !selectedDate.value) return
  try {
    slots.value = await ReservationsRepository.publicAvailability(slug, {
      serviceConfigId: selectedService.value.id,
      resourceId: selectedResourceId.value || null,
      dateFrom: selectedDate.value,
      dateTo: selectedDate.value,
    })
    selectedSlot.value = null
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível consultar os horários.')
  }
}

function chooseService(service: ReservationService) {
  selectedService.value = service
  selectedResourceId.value = null
  selectedSlot.value = null
  step.value = 2
  void loadSlots()
}

async function chooseSlot(slot: AvailabilitySlot) {
  if (!selectedService.value) return
  selectedSlot.value = slot
  try {
    preview.value = await ReservationsRepository.preview(slug, {
      serviceConfigId: selectedService.value.id,
      resourceId: slot.resourceId,
      startAt: slot.startAt,
    })
  } catch (error: any) {
    selectedSlot.value = null
    toast.error(error?.response?.data?.message || 'Não foi possível validar este horário.')
  }
}

async function finish() {
  if (!selectedService.value || !selectedSlot.value) return
  if (!form.value.name.trim() || !form.value.phone.trim() || !form.value.acceptedTerms) {
    return toast.error('Preencha nome, telefone e aceite os termos.')
  }
  sending.value = true
  try {
    const key = randomUUID()
    const payload = {
      serviceConfigId: selectedService.value.id,
      resourceId: selectedSlot.value.resourceId,
      startAt: selectedSlot.value.startAt,
      customer: {
        name: form.value.name,
        phone: form.value.phone,
        email: form.value.email,
      },
      acceptedTerms: form.value.acceptedTerms,
      operationalConsent: form.value.operationalConsent,
      afterSalesConsent: form.value.afterSalesConsent,
      notes: form.value.notes,
    }
    result.value = await ReservationsRepository.createPublic(slug, payload, key)
    localStorage.setItem(
      `gestao-facil:reserva:${result.value.booking.publicId}`,
      result.value.managementToken,
    )
    toast.success('Sua reserva foi criada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível criar a reserva.')
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  try {
    ;[store.value, services.value] = await Promise.all([
      ReservationsRepository.getPublicStore(slug),
      ReservationsRepository.getPublicServices(slug),
    ])
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Página de reservas indisponível.')
  } finally {
    loading.value = false
  }
})

watch([selectedDate, selectedResourceId], () => {
  if (step.value === 2) void loadSlots()
})
</script>

<template>
  <main
    class="booking-shell min-h-screen text-slate-900"
    :style="{ '--booking-accent': accent, '--booking-secondary': secondary, '--app-font': reservationFont }"
  >
    <div class="booking-noise" />
    <div v-if="loading" class="min-h-screen grid place-items-center">
      <LoaderCircle class="size-9 animate-spin text-[var(--booking-accent)]" />
    </div>

    <div v-else-if="store" class="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="grid size-12 place-items-center overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm">
            <img
              v-if="store.identity.logo"
              :src="resolveFileUrl(store.identity.logo)"
              :alt="store.identity.name"
              class="size-full object-cover"
            />
            <Sparkles v-else class="size-5 text-[var(--booking-accent)]" />
          </div>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Agenda online</p>
            <h1 class="text-xl font-semibold">{{ store.identity.name }}</h1>
          </div>
        </div>
        <div v-if="!result" class="hidden items-center gap-2 md:flex">
          <span
            v-for="number in 3"
            :key="number"
            class="grid size-8 place-items-center rounded-full border text-xs font-bold transition"
            :class="number <= step ? 'border-transparent bg-[var(--booking-accent)] text-white' : 'border-slate-300 bg-white/60 text-slate-400'"
          >
            {{ number }}
          </span>
        </div>
      </header>

      <section v-if="result" class="mx-auto max-w-2xl py-12">
        <Card class="overflow-hidden border-0 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <CardContent class="p-0">
            <div class="bg-[var(--booking-accent)] px-6 py-10 text-center text-white">
              <BadgeCheck class="mx-auto mb-4 size-14" />
              <p class="text-xs font-semibold uppercase tracking-[0.24em]">Reserva criada</p>
              <h2 class="mt-2 text-3xl">{{ result.booking.service }}</h2>
              <p class="mt-2 text-white/80">{{ result.booking.resource }}</p>
            </div>
            <div class="grid gap-4 p-6 md:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-wider text-slate-500">Quando</p>
                <p class="mt-1 font-semibold">
                  {{ format(new Date(result.booking.startAt), "dd 'de' MMMM, HH:mm", { locale: ptBR }) }}
                </p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-wider text-slate-500">Status</p>
                <p class="mt-1 font-semibold">
                  {{ result.booking.status === 'AGUARDANDO_PAGAMENTO' ? 'Aguardando pagamento' : 'Confirmada' }}
                </p>
              </div>
              <div v-if="result.payment" class="md:col-span-2">
                <a
                  v-if="result.payment.link"
                  :href="result.payment.link"
                  target="_blank"
                  rel="noopener"
                  class="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--booking-secondary)] px-5 font-semibold text-slate-950 transition hover:brightness-95"
                >
                  <CreditCard class="size-4" />
                  Pagar {{ formatCurrencyBR(result.booking.paymentAmount) }}
                </a>
                <p v-if="result.payment.pixCopyPaste" class="mt-3 break-all rounded-xl border border-dashed p-3 text-xs text-slate-500">
                  {{ result.payment.pixCopyPaste }}
                </p>
              </div>
              <RouterLink
                :to="`/reservar/${slug}/reserva/${result.booking.publicId}`"
                class="md:col-span-2 flex h-11 items-center justify-center rounded-xl border font-medium"
              >
                Acompanhar ou remarcar
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      </section>

      <div v-else class="grid gap-8" :class="sectionVisible('apresentacao') ? 'lg:grid-cols-[0.78fr_1.22fr]' : 'mx-auto max-w-3xl'">
        <aside v-if="sectionVisible('apresentacao')" class="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl md:p-10" :style="{ order: sectionOrder('apresentacao') }">
          <div
            v-if="store.bannerUrl"
            class="absolute inset-0 bg-cover bg-center opacity-35"
            :style="{ backgroundImage: `url(${store.bannerUrl})` }"
          />
          <div class="absolute inset-0 bg-gradient-to-br from-slate-950/30 via-slate-950/80 to-slate-950" />
          <div class="relative flex min-h-[28rem] flex-col">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--booking-secondary)]">
              Um tempo reservado para você
            </p>
            <h2 class="mt-5 max-w-md text-4xl leading-tight md:text-5xl">
              {{ store.title || 'Escolha o melhor momento do seu dia.' }}
            </h2>
            <p class="mt-5 max-w-md text-sm leading-6 text-slate-300">
              {{ store.description || 'Selecione o serviço, encontre um horário livre e confirme em poucos passos.' }}
            </p>
            <div class="mt-auto grid gap-3 pt-10 text-sm text-slate-300">
              <div class="flex items-center gap-3"><Clock3 class="size-4 text-[var(--booking-secondary)]" /> Confirmação em tempo real</div>
              <div class="flex items-center gap-3"><CreditCard class="size-4 text-[var(--booking-secondary)]" /> Pagamento protegido</div>
              <div class="flex items-center gap-3"><CalendarDays class="size-4 text-[var(--booking-secondary)]" /> Remarcação pelo seu link</div>
            </div>
          </div>
        </aside>

        <Card class="border-white/70 bg-white/80 text-slate-900 shadow-xl shadow-slate-900/5 backdrop-blur" :style="{ order: Math.min(sectionOrder('servicos'), sectionOrder('agenda')) }">
          <CardContent class="p-5 md:p-8">
            <section v-if="step === 1">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--booking-accent)]">Passo 1</p>
              <h2 class="mt-2 text-3xl">O que você deseja reservar?</h2>
              <p class="mt-2 text-sm text-slate-500">Escolha um serviço para ver profissionais e horários.</p>
              <div class="mt-7 grid gap-3">
                <button
                  v-for="service in services"
                  :key="service.id"
                  type="button"
                  class="group rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--booking-accent)] hover:shadow-lg"
                  @click="chooseService(service)"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <h3 class="text-xl font-semibold text-slate-900">{{ service.Servico.nome }}</h3>
                      <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ service.Servico.descricao || 'Atendimento personalizado.' }}</p>
                      <div class="mt-4 flex flex-wrap gap-2 text-xs">
                        <span class="rounded-full bg-slate-100 px-3 py-1">{{ service.duracaoMinutos }} min</span>
                        <span class="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{{ paymentLabelFor(service) }}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold text-[var(--booking-accent)]">{{ formatCurrencyBR(Number(service.Servico.preco)) }}</p>
                      <ArrowRight class="ml-auto mt-5 size-5 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
                <div v-if="!services.length" class="rounded-2xl border border-dashed p-10 text-center text-slate-500">
                  Nenhum serviço disponível no momento.
                </div>
              </div>
            </section>

            <section v-else-if="step === 2">
              <button class="mb-5 flex items-center gap-2 text-sm text-slate-500" @click="step = 1">
                <ArrowLeft class="size-4" /> Trocar serviço
              </button>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--booking-accent)]">Passo 2</p>
              <h2 class="mt-2 text-3xl">Escolha seu horário</h2>
              <div class="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Profissional ou recurso</Label>
                  <Select v-model="selectedResourceId">
                    <SelectTrigger class="mt-1 h-11 rounded-xl bg-white"><SelectValue placeholder="Qualquer disponível" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="0">Qualquer disponível</SelectItem>
                      <SelectItem v-for="resource in compatibleResources" :key="resource.id" :value="resource.id">{{ resource.nome }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label for="reserva-data">Data</Label>
                  <Input id="reserva-data" v-model="selectedDate" name="data" type="date" class="mt-1 h-11 rounded-xl" />
                </div>
              </div>
              <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  v-for="slot in slots"
                  :key="`${slot.resourceId}-${slot.startAt}`"
                  type="button"
                  class="rounded-xl border p-3 text-left transition"
                  :class="selectedSlot?.startAt === slot.startAt && selectedSlot.resourceId === slot.resourceId
                    ? 'border-transparent bg-[var(--booking-accent)] text-white shadow-lg'
                    : 'bg-white hover:border-[var(--booking-accent)]'"
                  @click="chooseSlot(slot)"
                >
                  <p class="font-semibold">{{ format(new Date(slot.startAt), 'HH:mm') }}</p>
                  <p class="mt-0.5 truncate text-[11px] opacity-70">{{ slot.resourceName }}</p>
                </button>
                <p v-if="!slots.length" class="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
                  Não há horários livres para esta data.
                </p>
              </div>
              <Button class="mt-7 h-11 w-full text-white" :disabled="!selectedSlot" @click="next">
                Continuar <ArrowRight class="ml-2 size-4" />
              </Button>
            </section>

            <section v-else>
              <button class="mb-5 flex items-center gap-2 text-sm text-slate-500" @click="step = 2">
                <ArrowLeft class="size-4" /> Trocar horário
              </button>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--booking-accent)]">Passo 3</p>
              <h2 class="mt-2 text-3xl">Seus dados</h2>
              <div class="mt-6 grid gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                  <Label for="cliente-nome">Nome completo</Label>
                  <Input id="cliente-nome" v-model="form.name" name="nome" autocomplete="name" class="mt-1 h-11 rounded-xl" placeholder="Ex.: Maria da Silva…" />
                </div>
                <div>
                  <Label for="cliente-whatsapp">WhatsApp</Label>
                  <Input id="cliente-whatsapp" v-model="form.phone" name="telefone" type="tel" inputmode="tel" autocomplete="tel" class="mt-1 h-11 rounded-xl" placeholder="Ex.: (11) 99999-9999…" />
                </div>
                <div>
                  <Label for="cliente-email">E-mail</Label>
                  <Input id="cliente-email" v-model="form.email" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" class="mt-1 h-11 rounded-xl" placeholder="Ex.: cliente@empresa.com (opcional)…" />
                </div>
                <div class="md:col-span-2">
                  <Label for="cliente-observacoes">Observações</Label>
                  <Textarea id="cliente-observacoes" v-model="form.notes" name="observacoes" autocomplete="off" class="mt-1 rounded-xl" placeholder="Ex.: alguma necessidade ou preferência de atendimento…" />
                </div>
              </div>
              <div class="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                <p v-if="sectionVisible('termos') && store.terms?.text" class="max-h-28 overflow-y-auto whitespace-pre-line rounded-xl border bg-white p-3 text-xs leading-5 text-slate-500">{{ store.terms.text }}</p>
                <Label class="flex cursor-pointer items-start justify-between gap-4">
                  <span><strong class="block text-sm">Aceito os termos</strong><small class="text-slate-500">Obrigatório para reservar.</small></span>
                  <Switch v-model="form.acceptedTerms" />
                </Label>
                <Label class="flex cursor-pointer items-start justify-between gap-4">
                  <span><strong class="block text-sm">Avisos da reserva</strong><small class="text-slate-500">Confirmação e lembretes por WhatsApp.</small></span>
                  <Switch v-model="form.operationalConsent" />
                </Label>
                <Label class="flex cursor-pointer items-start justify-between gap-4">
                  <span><strong class="block text-sm">Pós-atendimento</strong><small class="text-slate-500">Mensagem após a conclusão.</small></span>
                  <Switch v-model="form.afterSalesConsent" />
                </Label>
              </div>
              <div class="mt-5 rounded-2xl border p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">{{ selectedService?.Servico.nome }}</p>
                    <p class="text-xs text-slate-500">
                      {{ selectedSlot && format(new Date(selectedSlot.startAt), "dd/MM 'às' HH:mm") }} · {{ selectedSlot?.resourceName }}
                    </p>
                  </div>
                  <div class="text-right"><p class="text-xl">{{ formatCurrencyBR(Number(preview?.total ?? selectedService?.Servico.preco ?? 0)) }}</p><p v-if="preview && preview.paymentAmount > 0" class="text-xs text-slate-500">Agora: {{ formatCurrencyBR(preview.paymentAmount) }}</p></div>
                </div>
              </div>
              <Button class="mt-5 h-12 w-full text-white" :disabled="sending" @click="finish">
                <LoaderCircle v-if="sending" class="mr-2 size-4 animate-spin" />
                <Check v-else class="mr-2 size-4" />
                {{ sending ? 'Reservando...' : 'Confirmar reserva' }}
              </Button>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  </main>
</template>

<style scoped>
.booking-shell {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--booking-secondary) 20%, transparent), transparent 28rem),
    radial-gradient(circle at 88% 70%, color-mix(in srgb, var(--booking-accent) 18%, transparent), transparent 30rem),
    #f5f4ef;
}
.booking-noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
