<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import DataTable from '@/components/tabela/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import {
  ReservationsRepository,
  type ReservationBooking,
  type ReservationStatus,
} from '@/repositories/reservas-gerais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { CalendarPlus, CircleCheck, Clock3, LoaderCircle, RefreshCw, Trash2, WalletCards } from 'lucide-vue-next'

const toast = useToast()
const confirm = useConfirm()
const filters = reactive({ update: 0, status: '' })
const mobileBookings = ref<ReservationBooking[]>([])
const selected = ref<ReservationBooking | null>(null)
const loading = ref(false)
const createOpen = ref(false)
const rescheduleAt = ref('')
const clientToLink = ref<number | null>(null)
const form = reactive({
  serviceConfigId: null as number | null,
  resourceId: null as number | null,
  startAt: '',
  name: '',
  phone: '',
  email: '',
  notes: '',
})

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
const resourceParams = computed(() => [
  { key: 'serviceConfigId', value: form.serviceConfigId || '' },
])
const confirmedToday = computed(() => mobileBookings.value.filter((item) => item.status === 'CONFIRMADA').length)
const pendingTotal = computed(() =>
  mobileBookings.value
    .filter((item) => item.status === 'AGUARDANDO_PAGAMENTO')
    .reduce((sum, item) => sum + Number(item.valorPagamento), 0),
)
const statusFilter = computed({
  get: () => filters.status || 'TODOS',
  set: (value: string) => {
    filters.status = value === 'TODOS' ? '' : value
    filters.update += 1
    void load()
  },
})

function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
function selectBooking(booking: ReservationBooking) {
  selected.value = booking
  clientToLink.value = null
  const local = new Date(booking.inicio)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  rescheduleAt.value = local.toISOString().slice(0, 16)
}

const columns: ColumnDef<ReservationBooking>[] = [
  { accessorKey: 'inicio', header: 'Horário', cell: ({ row }) => dateTime(row.original.inicio) },
  { accessorKey: 'nomeCliente', header: 'Cliente' },
  { accessorKey: 'servicoNome', header: 'Serviço' },
  { accessorKey: 'recursoNome', header: 'Recurso' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(Badge, { variant: statusVariant[row.original.status] }, () => statusLabel[row.original.status]),
  },
  { accessorKey: 'valorTotal', header: 'Valor', cell: ({ row }) => formatCurrencyBR(Number(row.original.valorTotal)) },
  {
    id: 'acoes',
    header: () => h('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
      h(Button, { size: 'sm', variant: 'outline', onClick: () => selectBooking(row.original) }, () => 'Detalhes'),
    ]),
  },
]

async function load() {
  try {
    loading.value = true
    const bookingResult = await ReservationsRepository.listBookings({
      page: 1,
      limit: 100,
      status: filters.status || undefined,
    })
    mobileBookings.value = bookingResult.items
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível carregar as reservas.')
  } finally {
    loading.value = false
  }
}

async function createBooking() {
  if (!form.serviceConfigId) {
    toast.error('Selecione o serviço da reserva.')
    return
  }
  if (!form.startAt || Number.isNaN(new Date(form.startAt).getTime())) {
    toast.error('Informe uma data e um horário válidos.')
    return
  }
  if (!form.name.trim() || !form.phone.trim()) {
    toast.error('Informe o nome e o telefone do cliente.')
    return
  }
  try {
    loading.value = true
    await ReservationsRepository.createBooking({
      serviceConfigId: Number(form.serviceConfigId),
      resourceId: form.resourceId,
      startAt: new Date(form.startAt).toISOString(),
      customer: { name: form.name, phone: form.phone, email: form.email },
      acceptedTerms: true,
      operationalConsent: true,
      afterSalesConsent: false,
      notes: form.notes,
    })
    toast.success('Reserva criada.')
    createOpen.value = false
    Object.assign(form, {
      serviceConfigId: null,
      resourceId: null,
      startAt: '',
      name: '',
      phone: '',
      email: '',
      notes: '',
    })
    filters.update += 1
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível criar a reserva.')
  } finally {
    loading.value = false
  }
}

async function linkCustomer() {
  if (!selected.value || !clientToLink.value) return
  const confirmed = await confirm.confirm({
    title: 'Vincular cliente',
    message: 'Deseja vincular o cliente selecionado a esta reserva?',
    confirmText: 'Sim, vincular',
    colorButton: 'primary',
  })
  if (!confirmed) return
  try {
    loading.value = true
    selected.value = await ReservationsRepository.linkCustomer(selected.value.id, clientToLink.value)
    clientToLink.value = null
    toast.success('Cliente vinculado à reserva.')
    filters.update += 1
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível vincular o cliente.')
  } finally {
    loading.value = false
  }
}

async function act(action: 'confirm' | 'complete' | 'cancel') {
  if (!selected.value) return
  const options = {
    confirm: {
      title: 'Confirmar reserva',
      message: 'Deseja confirmar esta reserva?',
      confirmText: 'Sim, confirmar',
      colorButton: 'success' as const,
    },
    complete: {
      title: 'Concluir reserva',
      message: 'Deseja marcar esta reserva como concluída?',
      confirmText: 'Sim, concluir',
      colorButton: 'success' as const,
    },
    cancel: {
      title: 'Cancelar reserva',
      message: 'Deseja cancelar esta reserva? O horário será liberado.',
      confirmText: 'Sim, cancelar',
      colorButton: 'danger' as const,
    },
  }
  if (!await confirm.confirm(options[action])) return
  try {
    loading.value = true
    selected.value = await ReservationsRepository.act(selected.value.id, action)
    toast.success('Reserva atualizada.')
    filters.update += 1
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível atualizar a reserva.')
  } finally {
    loading.value = false
  }
}

async function recordPayment() {
  if (!selected.value) return
  const amount = Math.max(0, Number(selected.value.valorTotal) - Number(selected.value.valorPago))
  if (!amount) return
  const confirmed = await confirm.confirm({
    title: 'Registrar pagamento',
    message: `Deseja registrar o recebimento de ${formatCurrencyBR(amount)} via PIX?`,
    confirmText: 'Sim, registrar',
    colorButton: 'success',
  })
  if (!confirmed) return
  try {
    loading.value = true
    await ReservationsRepository.recordPayment(selected.value.id, amount, 'PIX')
    toast.success('Recebimento registrado.')
    selected.value = null
    filters.update += 1
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível registrar o recebimento.')
  } finally {
    loading.value = false
  }
}

async function reschedule() {
  if (!selected.value || !rescheduleAt.value) return
  const targetDate = new Date(rescheduleAt.value)
  if (Number.isNaN(targetDate.getTime())) {
    toast.error('Informe uma data e um horário válidos para remarcar.')
    return
  }
  const confirmed = await confirm.confirm({
    title: 'Remarcar reserva',
    message: `Deseja remarcar esta reserva para ${dateTime(targetDate.toISOString())}?`,
    confirmText: 'Sim, remarcar',
    colorButton: 'warning',
  })
  if (!confirmed) return
  try {
    loading.value = true
    selected.value = await ReservationsRepository.reschedule(
      selected.value.id,
      targetDate.toISOString(),
      selected.value.recursoId,
      selected.value.version,
    )
    toast.success('Reserva remarcada.')
    filters.update += 1
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remarcar.')
  } finally {
    loading.value = false
  }
}

async function refund() {
  if (!selected.value) return
  const confirmed = await confirm.confirm({
    title: 'Estornar pagamento',
    message: 'Deseja solicitar o estorno dos pagamentos desta reserva?',
    confirmText: 'Sim, estornar',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    loading.value = true
    await ReservationsRepository.refund(selected.value.id)
    toast.success('Estorno processado.')
    selected.value = null
    filters.update += 1
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível processar o estorno.')
  } finally {
    loading.value = false
  }
}

async function deleteBooking() {
  if (!selected.value || selected.value.status !== 'CANCELADA') return
  const confirmed = await confirm.confirm({
    title: 'Excluir reserva cancelada',
    message: 'Deseja excluir permanentemente esta reserva? Esta ação não pode ser desfeita.',
    confirmText: 'Sim, excluir',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    loading.value = true
    await ReservationsRepository.deleteBooking(selected.value.id)
    selected.value = null
    filters.update += 1
    await load()
    toast.success('Reserva excluída.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível excluir a reserva.')
  } finally {
    loading.value = false
  }
}

watch(() => form.serviceConfigId, () => {
  form.resourceId = null
})

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarPlus class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Reservas
        </h2>
        <p class="text-sm text-muted-foreground">Acompanhe horários, pagamentos e atendimento em um só lugar.</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div class="w-full sm:w-52">
          <Label for="status" class="sr-only">Filtrar por status</Label>
          <Select v-model="statusFilter">
            <SelectTrigger id="status" class="bg-background">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              <SelectItem v-for="(label, value) in statusLabel" :key="value" :value="value">
                {{ label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" :disabled="loading" @click="load"><RefreshCw class="mr-2 h-4 w-4" />Atualizar</Button>
        <Button @click="createOpen = true"><CalendarPlus class="mr-2 h-4 w-4" />Nova reserva</Button>
      </div>
    </header>

    <section class="grid gap-3 sm:grid-cols-3">
      <Card><CardContent class="flex items-center gap-4 p-5"><span class="rounded-xl bg-primary/10 p-3 text-primary"><Clock3 /></span><div><p class="text-sm text-muted-foreground">Na agenda</p><p class="text-2xl font-bold">{{ mobileBookings.length }}</p></div></CardContent></Card>
      <Card><CardContent class="flex items-center gap-4 p-5"><span class="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><CircleCheck /></span><div><p class="text-sm text-muted-foreground">Confirmadas</p><p class="text-2xl font-bold">{{ confirmedToday }}</p></div></CardContent></Card>
      <Card><CardContent class="flex items-center gap-4 p-5"><span class="rounded-xl bg-amber-500/10 p-3 text-amber-600"><WalletCards /></span><div><p class="text-sm text-muted-foreground">A receber</p><p class="text-2xl font-bold">{{ formatCurrencyBR(pendingTotal) }}</p></div></CardContent></Card>
    </section>

    <div class="hidden md:block">
      <DataTable :columns="columns" api="/reservas" :filters="filters" />
    </div>
    <div class="space-y-3 md:hidden">
      <button
        v-for="booking in mobileBookings"
        :key="booking.id"
        type="button"
        class="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="selectBooking(booking)"
      >
        <Card class="transition-colors hover:border-primary/50">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate font-semibold">{{ booking.nomeCliente }}</p><p class="truncate text-sm text-muted-foreground">{{ booking.servicoNome }} · {{ booking.recursoNome }}</p></div><Badge :variant="statusVariant[booking.status]">{{ statusLabel[booking.status] }}</Badge></div>
            <div class="mt-4 flex justify-between text-sm"><span>{{ dateTime(booking.inicio) }}</span><strong class="tabular-nums">{{ formatCurrencyBR(Number(booking.valorTotal)) }}</strong></div>
          </CardContent>
        </Card>
      </button>
      <p v-if="!mobileBookings.length && !loading" class="py-16 text-center text-muted-foreground">Nenhuma reserva encontrada.</p>
    </div>

    <Dialog v-model:open="createOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova reserva</DialogTitle>
          <p class="text-sm text-muted-foreground">Informe o atendimento, o horário e os dados de contato do cliente.</p>
        </DialogHeader>
        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="createBooking">
          <div class="sm:col-span-2 space-y-1.5">
            <Label>Serviço</Label>
            <Select2Ajax v-model="form.serviceConfigId" url="/reservas/servicos/select2" required placeholder="Busque o serviço…" />
          </div>
          <div class="space-y-1.5">
            <Label>Recurso</Label>
            <Select2Ajax
              :key="form.serviceConfigId || 'sem-servico'"
              v-model="form.resourceId"
              url="/reservas/recursos/select2"
              :params="resourceParams"
              :disabled="!form.serviceConfigId"
              allow-clear
              placeholder="Qualquer disponível"
            />
            <p class="text-xs text-muted-foreground">Deixe vazio para atribuição automática.</p>
          </div>
          <div class="space-y-1.5"><Label for="reserva-inicio">Data e horário</Label><Input id="reserva-inicio" v-model="form.startAt" name="inicio" type="datetime-local" required /></div>
          <div class="space-y-1.5"><Label for="reserva-cliente">Nome do cliente</Label><Input id="reserva-cliente" v-model="form.name" name="cliente" autocomplete="name" placeholder="Ex.: Maria da Silva…" required /></div>
          <div class="space-y-1.5"><Label for="reserva-telefone">Telefone</Label><Input id="reserva-telefone" v-model="form.phone" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ex.: (11) 99999-9999…" required /></div>
          <div class="sm:col-span-2 space-y-1.5"><Label for="reserva-email">E-mail</Label><Input id="reserva-email" v-model="form.email" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" placeholder="Ex.: cliente@empresa.com…" /></div>
          <div class="sm:col-span-2 space-y-1.5"><Label for="reserva-observacoes">Observações</Label><Textarea id="reserva-observacoes" v-model="form.notes" name="observacoes" autocomplete="off" placeholder="Ex.: cliente prefere atendimento em sala silenciosa…" /></div>
          <div class="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" @click="createOpen = false">Cancelar</Button><Button type="submit" :disabled="loading"><LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />Criar reserva</Button></div>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog :open="!!selected" @update:open="!$event && (selected = null)">
      <DialogContent v-if="selected" class="max-w-2xl">
        <DialogHeader><DialogTitle>{{ selected.servicoNome }} · {{ selected.nomeCliente }}</DialogTitle></DialogHeader>
        <div class="grid gap-3 sm:grid-cols-3"><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Horário</p><b>{{ dateTime(selected.inicio) }}</b></div><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Recurso</p><b>{{ selected.recursoNome }}</b></div><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Status</p><Badge :variant="statusVariant[selected.status]">{{ statusLabel[selected.status] }}</Badge></div></div>
        <div class="rounded-lg border p-4 text-sm"><p><b>Contato:</b> {{ selected.telefoneCliente }} · {{ selected.emailCliente || 'sem e-mail' }}</p><p><b>Pagamento:</b> {{ formatCurrencyBR(Number(selected.valorPago)) }} de {{ formatCurrencyBR(Number(selected.valorTotal)) }}</p><p v-if="selected.observacoes"><b>Observações:</b> {{ selected.observacoes }}</p></div>
        <div v-if="!selected.Cliente" class="rounded-lg border p-3">
          <Label>Vincular cliente cadastrado</Label>
          <div class="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <Select2Ajax v-model="clientToLink" class="flex-1" url="/clientes/select2" allow-clear placeholder="Busque por nome, documento ou telefone…" />
            <Button variant="outline" :disabled="loading || !clientToLink" @click="linkCustomer">Vincular cliente</Button>
          </div>
        </div>
        <div v-if="!['CONCLUIDA','CANCELADA','EXPIRADA'].includes(selected.status)" class="flex items-end gap-2 rounded-lg border p-3"><div class="flex-1"><Label>Remarcar para</Label><Input v-model="rescheduleAt" type="datetime-local" class="mt-1" /></div><Button variant="outline" :disabled="loading" @click="reschedule">Remarcar</Button></div>
        <div v-if="selected.Historico?.length" class="max-h-36 space-y-2 overflow-y-auto rounded-lg bg-muted/40 p-3"><p class="text-xs font-bold uppercase tracking-wide text-muted-foreground">Histórico</p><div v-for="event in selected.Historico" :key="event.id" class="flex justify-between text-sm"><span>{{ event.evento.replace(/_/g, ' ') }}</span><span class="text-muted-foreground">{{ dateTime(event.createdAt) }}</span></div></div>
        <div class="flex flex-wrap justify-end gap-2">
          <Button v-if="selected.status === 'CANCELADA'" variant="destructive" :disabled="loading" @click="deleteBooking"><Trash2 class="mr-2 h-4 w-4" />Excluir reserva</Button>
          <Button v-if="Number(selected.valorPago) > 0" variant="destructive" :disabled="loading" @click="refund">Estornar</Button>
          <Button v-if="Number(selected.valorPago) < Number(selected.valorTotal) && !['CANCELADA','EXPIRADA'].includes(selected.status)" variant="outline" :disabled="loading" @click="recordPayment">Registrar pagamento</Button>
          <Button v-if="selected.status === 'AGUARDANDO_PAGAMENTO'" :disabled="loading" @click="act('confirm')">Confirmar</Button>
          <Button v-if="selected.status === 'CONFIRMADA'" :disabled="loading" @click="act('complete')">Concluir</Button>
          <Button v-if="!['CONCLUIDA','CANCELADA','EXPIRADA'].includes(selected.status)" variant="destructive" :disabled="loading" @click="act('cancel')">Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
