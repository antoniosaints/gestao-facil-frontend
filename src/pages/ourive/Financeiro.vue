<template>
  <section class="space-y-6 [&_.text-muted-foreground]:text-foreground/70">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-bold">
        <WalletCards class="h-6 w-6 text-primary" />Financeiro da ourivesaria
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Repasses agrupados, histórico de pagamentos e pró-labore integrados ao financeiro.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button
        v-for="item in tabs"
        :key="item.key"
        :variant="tab === item.key ? 'default' : 'outline'"
        @click="tab = item.key"
      >
        {{ item.label }}
      </Button>
    </div>

    <template v-if="tab === 'repasses'">
      <div class="grid gap-3 sm:grid-cols-3">
        <Card
          ><CardContent class="p-4"
            ><p class="text-xs text-muted-foreground">Pendente</p>
            <p class="mt-1 text-2xl font-bold">{{ money(totalPending) }}</p></CardContent
          ></Card
        >
        <Card
          ><CardContent class="p-4"
            ><p class="text-xs text-muted-foreground">Ourives com saldo</p>
            <p class="mt-1 text-2xl font-bold">{{ groupedTransfers.length }}</p></CardContent
          ></Card
        >
        <Card
          ><CardContent class="p-4"
            ><p class="text-xs text-muted-foreground">OS pendentes</p>
            <p class="mt-1 text-2xl font-bold">{{ transfers.length }}</p></CardContent
          ></Card
        >
      </div>
      <div v-if="groupedTransfers.length" class="space-y-4">
        <Card v-for="group in groupedTransfers" :key="group.usuarioId">
          <CardHeader>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle class="text-base">{{ group.nome }}</CardTitle
                ><CardDescription
                  >{{ group.items.length }} repasse(s) · {{ money(group.total) }}</CardDescription
                >
              </div>
              <Button @click="payGroup(group)">Consolidar selecionados</Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-2">
            <label
              v-for="item in group.items"
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
            >
              <input v-model="selectedTransfers" type="checkbox" :value="item.id" class="h-4 w-4" />
              <div class="min-w-0 flex-1">
                <p class="font-medium">{{ item.ordem?.codigoRastreio }}</p>
                <p class="truncate text-xs text-muted-foreground">
                  {{ item.ordem?.cliente?.nome || 'Cliente não informado' }}
                </p>
              </div>
              <strong>{{ money(item.valor) }}</strong>
            </label>
          </CardContent>
        </Card>
      </div>
      <div
        v-else
        class="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground"
      >
        Nenhum repasse pendente.
      </div>
    </template>

    <template v-else-if="tab === 'historico'">
      <div class="space-y-3">
        <Card v-for="payment in payments" :key="payment.id">
          <CardContent class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div>
              <p class="font-semibold">
                {{ payment.usuario?.nome || `Ourives #${payment.usuarioId}` }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ formatDate(payment.dataPagamento) }} · {{ payment.itens?.length || 0 }} OS ·
                {{ payment.observacao || 'Sem observação' }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-bold">{{ money(payment.valorTotal) }}</p>
              <Badge>Pago</Badge>
            </div>
          </CardContent>
        </Card>
        <p
          v-if="!payments.length"
          class="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground"
        >
          Nenhum pagamento consolidado.
        </p>
      </div>
    </template>

    <template v-else>
      <Card>
        <CardHeader
          ><CardTitle class="text-base">Novo pró-labore</CardTitle
          ><CardDescription
            >O lançamento será criado em Contas a pagar.</CardDescription
          ></CardHeader
        >
        <CardContent class="grid gap-3 md:grid-cols-[1fr_10rem_10rem_1fr_auto]">
          <select
            v-model.number="proForm.beneficiarioId"
            class="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option :value="undefined">Beneficiário</option>
            <option v-for="user in team" :key="user.id" :value="user.id">{{ user.nome }}</option>
          </select>
          <Input v-model="proForm.competencia" type="month" />
          <Input
            v-model="proForm.valor"
            v-maska="moneyMaskOptions"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
          />
          <Input v-model="proForm.observacao" placeholder="Observação" />
          <Button @click="createProLabore">Consolidar</Button>
        </CardContent>
      </Card>
      <div class="space-y-3">
        <Card v-for="item in proLaboreRows" :key="item.id"
          ><CardContent class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
            ><div>
              <p class="font-semibold">
                {{ item.beneficiario?.nome || `Beneficiário #${item.beneficiarioId}` }}
              </p>
              <p class="text-sm text-muted-foreground">
                Competência {{ formatMonth(item.competencia) }} ·
                {{ item.observacao || 'Sem observação' }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="font-bold">{{ money(item.valor) }}</p>
                <Badge :variant="item.status === 'PAGO' ? 'default' : 'outline'">{{
                  item.status === 'PAGO' ? 'Pago' : 'Pendente'
                }}</Badge>
              </div>
              <Button v-if="item.status === 'PENDENTE'" size="sm" @click="payProLabore(item)"
                >Pagar</Button
              >
            </div></CardContent
          ></Card
        >
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { WalletCards } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'

const toast = useToast()
const tab = ref<'repasses' | 'historico' | 'prolabore'>('repasses')
const tabs = [
  { key: 'repasses' as const, label: 'Pagamentos aos ourives' },
  { key: 'historico' as const, label: 'Histórico' },
  { key: 'prolabore' as const, label: 'Pró-labore' },
]
const transfers = ref<any[]>([])
const payments = ref<any[]>([])
const proLaboreRows = ref<any[]>([])
const team = ref<any[]>([])
const selectedTransfers = ref<number[]>([])
const proForm = reactive<any>({
  beneficiarioId: undefined,
  competencia: new Date().toISOString().slice(0, 7),
  valor: 0,
  observacao: '',
})
const money = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR')
const formatMonth = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
const groupedTransfers = computed(() => {
  const groups = new Map<number, any>()
  transfers.value.forEach((item) => {
    const group = groups.get(item.usuarioId) || {
      usuarioId: item.usuarioId,
      nome: item.usuario?.nome || `Ourives #${item.usuarioId}`,
      items: [],
      total: 0,
    }
    group.items.push(item)
    group.total += Number(item.valor || 0)
    groups.set(item.usuarioId, group)
  })
  return [...groups.values()]
})
const totalPending = computed(() =>
  transfers.value.reduce((total, item) => total + Number(item.valor || 0), 0),
)
async function load() {
  try {
    const [transferData, paymentData, proData, teamData] = await Promise.all([
      OuriveRepository.repasses('PENDENTE'),
      OuriveRepository.pagamentos(),
      OuriveRepository.proLabore(),
      OuriveRepository.equipe(),
    ])
    transfers.value = transferData
    payments.value = paymentData
    proLaboreRows.value = proData
    team.value = teamData
    selectedTransfers.value = transferData.map((item: any) => item.id)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o financeiro.')
  }
}
async function payGroup(group: any) {
  const ids = group.items
    .filter((item: any) => selectedTransfers.value.includes(item.id))
    .map((item: any) => item.id)
  if (!ids.length) return toast.info('Selecione ao menos um repasse desse ourives.')
  try {
    await OuriveRepository.consolidarPagamento({
      repasseIds: ids,
      dataPagamento: new Date(),
      observacao: `Pagamento agrupado de ${ids.length} OS`,
    })
    toast.success('Pagamento consolidado e registrado no financeiro.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível consolidar o pagamento.')
  }
}
async function createProLabore() {
  const valor = formatToNumberValue(proForm.valor || 0)
  if (!proForm.beneficiarioId || valor <= 0 || !proForm.competencia)
    return toast.info('Complete beneficiário, competência e valor.')
  try {
    await OuriveRepository.criarProLabore({
      ...proForm,
      valor,
      competencia: `${proForm.competencia}-01T12:00:00`,
    })
    proForm.valor = 0
    proForm.observacao = ''
    toast.success('Pró-labore consolidado em Contas a pagar.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível criar o pró-labore.')
  }
}
async function payProLabore(item: any) {
  try {
    await OuriveRepository.pagarProLabore(item.id)
    toast.success('Pró-labore pago.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível pagar o pró-labore.')
  }
}
onMounted(load)
</script>
