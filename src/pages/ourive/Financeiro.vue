<template>
  <section class="space-y-6 [&_.text-muted-foreground]:text-foreground/70">
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold">
          <WalletCards class="h-6 w-6 text-primary" />Financeiro da ourivesaria
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Controle repasses, pagamentos e pró-labore em uma visão financeira organizada.
        </p>
      </div>
      <Button variant="outline" :disabled="loading" @click="refresh">
        <RefreshCw class="mr-2 h-4 w-4" :class="loading && 'animate-spin'" />Atualizar
      </Button>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Repasses pendentes
          </p>
          <p class="mt-1 text-2xl font-bold">{{ money(totalPending) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ourives com saldo
          </p>
          <p class="mt-1 text-2xl font-bold">{{ goldsmithsWithBalance }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pró-labore pendente
          </p>
          <p class="mt-1 text-2xl font-bold">{{ money(totalProLaborePending) }}</p>
        </CardContent>
      </Card>
    </div>

    <div class="flex flex-wrap gap-2 border-b pb-4">
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
      <Card>
        <CardHeader
          class="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <CardTitle class="text-base">Repasses pendentes</CardTitle>
            <CardDescription
              >Selecione somente ordens do mesmo ourives para gerar um pagamento
              agrupado.</CardDescription
            >
          </div>
          <Button :disabled="!selectedTransfers.length || paying" @click="paySelectedTransfers">
            <HandCoins class="mr-2 h-4 w-4" />
            {{ paying ? 'Consolidando…' : `Consolidar ${selectedTransfers.length} selecionado(s)` }}
          </Button>
        </CardHeader>
        <CardContent class="pt-4">
          <DataTable
            :key="tableUpdate"
            :columns="transferColumns"
            api="/v1/ourive/repasses"
            :filters="{ status: 'PENDENTE', update: tableUpdate }"
          />
        </CardContent>
      </Card>
    </template>

    <template v-else-if="tab === 'historico'">
      <Card>
        <CardHeader class="border-b pb-4">
          <CardTitle class="text-base">Histórico de pagamentos</CardTitle>
          <CardDescription
            >Todos os pagamentos agrupados já registrados no financeiro.</CardDescription
          >
        </CardHeader>
        <CardContent class="pt-4">
          <DataTable
            :key="tableUpdate"
            :columns="paymentColumns"
            api="/v1/ourive/pagamentos"
            :filters="{ update: tableUpdate }"
          />
        </CardContent>
      </Card>
    </template>

    <template v-else>
      <Card>
        <CardHeader
          class="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <CardTitle class="text-base">Pró-labore</CardTitle>
            <CardDescription
              >Consulte competências, valores e situação de pagamento.</CardDescription
            >
          </div>
          <Button @click="openProLaboreModal">
            <WalletCards class="mr-2 h-4 w-4" />Novo pró-labore
          </Button>
        </CardHeader>
        <CardContent class="pt-4">
          <DataTable
            :key="tableUpdate"
            :columns="proLaboreColumns"
            api="/v1/ourive/pro-labore"
            :filters="{ update: tableUpdate }"
          />
        </CardContent>
      </Card>
    </template>

    <Dialog v-model:open="proLaboreModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo pró-labore</DialogTitle>
          <DialogDescription>
            Informe o beneficiário, a competência e o valor. O lançamento será criado em Contas a
            pagar.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2">
          <label class="grid gap-1 text-sm font-medium">
            Beneficiário
            <Select2Ajax
              v-model="proForm.beneficiarioId"
              url="/usuarios/select2"
              placeholder="Selecione o beneficiário"
            />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-medium">
              Competência
              <Input v-model="proForm.competencia" type="month" />
            </label>
            <label class="grid gap-1 text-sm font-medium">
              Valor (R$)
              <Input
                v-model="proForm.valor"
                v-maska="moneyMaskOptions"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
              />
            </label>
          </div>
          <label class="grid gap-1 text-sm font-medium">
            Observação <span class="font-normal text-muted-foreground">(opcional)</span>
            <Input v-model="proForm.observacao" placeholder="Ex.: retirada mensal" />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="proLaboreModalOpen = false">Cancelar</Button>
          <Button @click="createProLabore">Consolidar pró-labore</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { HandCoins, RefreshCw, WalletCards } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/tabela/DataTable.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { moneyMaskOptions } from '@/lib/imaska'
import { OuriveRepository } from '@/repositories/ourive-repository'
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
const proLaboreRows = ref<any[]>([])
const selectedTransfers = ref<number[]>([])
const tableUpdate = ref(0)
const loading = ref(false)
const paying = ref(false)
const proLaboreModalOpen = ref(false)
const proForm = reactive({
  beneficiarioId: null as number | string | null,
  competencia: new Date().toISOString().slice(0, 7),
  valor: '',
  observacao: '',
})
const money = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR')
const formatMonth = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
const totalPending = computed(() =>
  transfers.value.reduce((total, item) => total + Number(item.valor || 0), 0),
)
const goldsmithsWithBalance = computed(
  () => new Set(transfers.value.map((item) => item.usuarioId)).size,
)
const totalProLaborePending = computed(() =>
  proLaboreRows.value
    .filter((item) => item.status === 'PENDENTE')
    .reduce((total, item) => total + Number(item.valor || 0), 0),
)

function toggleTransfer(id: number, checked: boolean) {
  selectedTransfers.value = checked
    ? [...new Set([...selectedTransfers.value, id])]
    : selectedTransfers.value.filter((selectedId) => selectedId !== id)
}

const transferColumns: ColumnDef<any>[] = [
  {
    id: 'selecionar',
    header: 'Selecionar',
    enableHiding: false,
    cell: ({ row }) =>
      h('input', {
        type: 'checkbox',
        checked: selectedTransfers.value.includes(row.original.id),
        class: 'h-4 w-4 accent-primary',
        'aria-label': `Selecionar repasse ${row.original.id}`,
        onChange: (event: Event) =>
          toggleTransfer(row.original.id, (event.target as HTMLInputElement).checked),
      }),
  },
  {
    id: 'ourive',
    header: 'Ourive',
    cell: ({ row }) => h('p', { class: 'font-medium' }, row.original.usuario?.nome || 'Ourive'),
  },
  {
    id: 'ordem',
    header: 'Ordem e cliente',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, row.original.ordem?.codigoRastreio || 'OS não disponível'),
        h(
          'p',
          { class: 'text-xs text-muted-foreground' },
          row.original.ordem?.cliente?.nome || 'Cliente não informado',
        ),
      ]),
  },
  { id: 'valor', header: 'Valor do repasse', cell: ({ row }) => money(row.original.valor) },
  {
    id: 'status',
    header: 'Situação',
    cell: () => h(Badge, { variant: 'outline' }, () => 'Pendente'),
  },
]
const paymentColumns: ColumnDef<any>[] = [
  {
    id: 'ourive',
    header: 'Ourive',
    cell: ({ row }) => h('p', { class: 'font-medium' }, row.original.usuario?.nome || 'Ourive'),
  },
  {
    id: 'data',
    header: 'Data do pagamento',
    cell: ({ row }) => formatDate(row.original.dataPagamento),
  },
  {
    id: 'ordens',
    header: 'Ordens incluídas',
    cell: ({ row }) => `${row.original.itens?.length || 0} OS`,
  },
  {
    id: 'observacao',
    header: 'Observação',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground' }, row.original.observacao || '—'),
  },
  { id: 'valor', header: 'Total pago', cell: ({ row }) => money(row.original.valorTotal) },
  { id: 'status', header: 'Situação', cell: () => h(Badge, () => 'Pago') },
]
const proLaboreColumns: ColumnDef<any>[] = [
  {
    id: 'beneficiario',
    header: 'Beneficiário',
    cell: ({ row }) =>
      h('p', { class: 'font-medium' }, row.original.beneficiario?.nome || 'Beneficiário'),
  },
  {
    id: 'competencia',
    header: 'Competência',
    cell: ({ row }) => formatMonth(row.original.competencia),
  },
  {
    id: 'observacao',
    header: 'Observação',
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground' }, row.original.observacao || '—'),
  },
  { id: 'valor', header: 'Valor', cell: ({ row }) => money(row.original.valor) },
  {
    id: 'status',
    header: 'Situação',
    cell: ({ row }) =>
      h(Badge, { variant: row.original.status === 'PAGO' ? 'default' : 'outline' }, () =>
        row.original.status === 'PAGO' ? 'Pago' : 'Pendente',
      ),
  },
  {
    id: 'acoes',
    header: 'Ações',
    enableHiding: false,
    cell: ({ row }) =>
      row.original.status === 'PENDENTE'
        ? h(Button, { size: 'sm', onClick: () => payProLabore(row.original) }, () => 'Pagar')
        : h('span', { class: 'text-muted-foreground' }, '—'),
  },
]

async function loadSummary() {
  loading.value = true
  try {
    const [transferData, proData] = await Promise.all([
      OuriveRepository.repasses('PENDENTE'),
      OuriveRepository.proLabore(),
    ])
    transfers.value = transferData
    proLaboreRows.value = proData
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o financeiro.')
  } finally {
    loading.value = false
  }
}
async function refresh() {
  await loadSummary()
  tableUpdate.value += 1
}
function openProLaboreModal() {
  proForm.beneficiarioId = null
  proForm.competencia = new Date().toISOString().slice(0, 7)
  proForm.valor = ''
  proForm.observacao = ''
  proLaboreModalOpen.value = true
}
async function paySelectedTransfers() {
  const selectedItems = transfers.value.filter((item) => selectedTransfers.value.includes(item.id))
  if (!selectedItems.length) return toast.info('Selecione ao menos um repasse.')
  if (new Set(selectedItems.map((item) => item.usuarioId)).size !== 1)
    return toast.info('Selecione repasses de apenas um ourives por vez.')
  paying.value = true
  try {
    await OuriveRepository.consolidarPagamento({
      repasseIds: selectedItems.map((item) => item.id),
      dataPagamento: new Date(),
      observacao: `Pagamento agrupado de ${selectedItems.length} OS`,
    })
    selectedTransfers.value = []
    toast.success('Pagamento consolidado e registrado no financeiro.')
    await refresh()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível consolidar o pagamento.')
  } finally {
    paying.value = false
  }
}
async function createProLabore() {
  const valor = formatToNumberValue(proForm.valor || 0)
  if (!proForm.beneficiarioId || valor <= 0 || !proForm.competencia)
    return toast.info('Complete beneficiário, competência e valor.')
  try {
    await OuriveRepository.criarProLabore({
      ...proForm,
      beneficiarioId: Number(proForm.beneficiarioId),
      valor,
      competencia: `${proForm.competencia}-01T12:00:00`,
    })
    proForm.valor = ''
    proForm.observacao = ''
    proLaboreModalOpen.value = false
    toast.success('Pró-labore consolidado em Contas a pagar.')
    await refresh()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível criar o pró-labore.')
  }
}
async function payProLabore(item: any) {
  try {
    await OuriveRepository.pagarProLabore(item.id)
    toast.success('Pró-labore pago.')
    await refresh()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível pagar o pró-labore.')
  }
}
onMounted(loadSummary)
</script>
