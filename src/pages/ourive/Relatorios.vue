<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfMonth, startOfMonth } from 'date-fns'
import {
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from 'lucide-vue-next'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { useToast } from 'vue-toastification'

const toast = useToast()
const loading = ref(true)
const periodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const report = ref<any>()
const team = ref<any[]>([])
const filters = ref<any>({ status: '', tipo: '', clienteId: null, ouriveId: null })
const statusFilter = computed({
  get: () => filters.value.status || 'TODOS',
  set: (value: string) => (filters.value.status = value === 'TODOS' ? '' : value),
})
const typeFilter = computed({
  get: () => filters.value.tipo || 'TODOS',
  set: (value: string) => (filters.value.tipo = value === 'TODOS' ? '' : value),
})
const goldsmithFilter = computed({
  get: () => (filters.value.ouriveId == null ? 'TODOS' : String(filters.value.ouriveId)),
  set: (value: string) => (filters.value.ouriveId = value === 'TODOS' ? null : Number(value)),
})
const statusLabel = (status: string) =>
  (
    ({
      RECEBIDA: 'Recebida',
      ORCAMENTO: 'Orçamento',
      AGUARDANDO_MATERIAL: 'Aguardando material',
      PRONTA_PRODUCAO: 'Pronta para produção',
      PRODUCAO: 'Em produção',
      FINALIZADA: 'Finalizada',
      REVISAO: 'Revisão',
      PRONTA_ENTREGA: 'Pronta para entrega',
      ENTREGUE: 'Entregue',
      RECUSADA: 'Recusada',
      CANCELADA: 'Cancelada',
    }) as Record<string, string>
  )[status] || status
const costs = computed(
  () =>
    Number(report.value?.materiais || 0) +
    Number(report.value?.valorOurives || 0) +
    Number(report.value?.custosExtras || 0) +
    Number(report.value?.proLabore || 0),
)
const margin = computed(() => {
  const revenue = Number(report.value?.receita || 0)
  return revenue ? (Number(report.value?.lucroLiquido || 0) / revenue) * 100 : 0
})
const statusRows = computed(() => report.value?.porStatus || [])
const periodLabel = computed(
  () =>
    `${periodo.value[0].toLocaleDateString('pt-BR')} — ${periodo.value[1].toLocaleDateString('pt-BR')}`,
)
async function load() {
  loading.value = true
  try {
    report.value = await OuriveRepository.relatorios(
      periodo.value[0].toISOString(),
      periodo.value[1].toISOString(),
      Object.fromEntries(
        Object.entries(filters.value).filter(([, value]) => value !== '' && value != null),
      ),
    )
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o relatório.')
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  await Promise.all([
    load(),
    OuriveRepository.equipe()
      .then((rows) => (team.value = rows))
      .catch(() => undefined),
  ])
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 class="h-6 w-6 text-primary" />Relatórios de ourivesaria
        </h2>
        <p class="text-sm text-muted-foreground">
          Recebimentos, faturamento e rentabilidade da operação.
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Calendarpicker v-model="periodo" :range="true" :teleport="true" /><Button
          :disabled="loading"
          @click="load"
          ><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button
        >
      </div>
    </div>
    <Card>
      <CardContent class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <Select v-model="statusFilter">
          <SelectTrigger aria-label="Status da OS" class="w-full bg-background">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem
              v-for="status in [
                'RECEBIDA',
                'ORCAMENTO',
                'AGUARDANDO_MATERIAL',
                'PRONTA_PRODUCAO',
                'PRODUCAO',
                'FINALIZADA',
                'REVISAO',
                'PRONTA_ENTREGA',
                'ENTREGUE',
                'RECUSADA',
                'CANCELADA',
              ]"
              :key="status"
              :value="status"
            >
              {{ statusLabel(status) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="typeFilter">
          <SelectTrigger aria-label="Tipo da OS" class="w-full bg-background">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os tipos</SelectItem>
            <SelectItem value="CONSERTO">Serviço / conserto</SelectItem>
            <SelectItem value="ENCOMENDA">Encomenda</SelectItem>
          </SelectContent>
        </Select>
        <Select2Ajax
          v-model="filters.clienteId"
          url="/clientes/select2"
          :allow-clear="true"
          placeholder="Todos os clientes"
        />
        <Select v-model="goldsmithFilter">
          <SelectTrigger aria-label="Ourives responsável" class="w-full bg-background">
            <SelectValue placeholder="Todos os ourives" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os ourives</SelectItem>
            <SelectItem v-for="user in team" :key="user.id" :value="String(user.id)">
              {{ user.nome }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button :disabled="loading" @click="load">Aplicar filtros</Button>
      </CardContent>
    </Card>
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Skeleton v-for="item in 5" :key="item" class="h-28 rounded-xl" />
    </div>
    <template v-else-if="report"
      ><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card
          ><CardContent class="flex items-center gap-3 p-4"
            ><ClipboardList class="h-8 w-8 text-blue-600" />
            <div>
              <p class="text-xs text-muted-foreground">OS recebidas</p>
              <p class="text-2xl font-bold">{{ report.totalOrdens }}</p>
            </div></CardContent
          ></Card
        ><Card
          ><CardContent class="flex items-center gap-3 p-4"
            ><PackageCheck class="h-8 w-8 text-emerald-600" />
            <div>
              <p class="text-xs text-muted-foreground">OS faturadas</p>
              <p class="text-2xl font-bold">{{ report.ordensFaturadas }}</p>
            </div></CardContent
          ></Card
        ><Card
          ><CardContent class="flex items-center gap-3 p-4"
            ><CircleDollarSign class="h-8 w-8 text-primary" />
            <div>
              <p class="text-xs text-muted-foreground">Receita faturada</p>
              <p class="text-lg font-bold">{{ formatCurrencyBR(Number(report.receita || 0)) }}</p>
            </div></CardContent
          ></Card
        ><Card
          ><CardContent class="flex items-center gap-3 p-4"
            ><WalletCards class="h-8 w-8 text-amber-600" />
            <div>
              <p class="text-xs text-muted-foreground">Custos totais</p>
              <p class="text-lg font-bold">{{ formatCurrencyBR(costs) }}</p>
            </div></CardContent
          ></Card
        ><Card
          ><CardContent class="flex items-center gap-3 p-4"
            ><TrendingUp class="h-8 w-8 text-violet-600" />
            <div>
              <p class="text-xs text-muted-foreground">Lucro líquido</p>
              <p class="text-lg font-bold">
                {{ formatCurrencyBR(Number(report.lucroLiquido || 0)) }}
              </p>
              <p class="text-xs text-muted-foreground">Margem de {{ margin.toFixed(1) }}%</p>
            </div></CardContent
          ></Card
        >
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card
          v-for="item in [
            { label: 'Valor da loja', value: formatCurrencyBR(Number(report.valorLoja || 0)) },
            {
              label: 'Valor dos ourives',
              value: formatCurrencyBR(Number(report.valorOurives || 0)),
            },
            {
              label: 'Repasses pendentes',
              value: formatCurrencyBR(Number(report.repassesPendentes || 0)),
            },
            { label: 'Repasses pagos', value: formatCurrencyBR(Number(report.repassesPagos || 0)) },
            {
              label: 'Produção média',
              value: `${Number(report.producao?.prazoMedioDias || 0).toFixed(1)} dias`,
            },
            {
              label: 'Perda real',
              value: `${Number(report.perdas?.quantidade || 0).toLocaleString('pt-BR')} g/un.`,
            },
          ]"
          :key="item.label"
          ><CardContent class="p-4"
            ><p class="text-xs text-muted-foreground">{{ item.label }}</p>
            <p class="mt-1 font-bold">{{ item.value }}</p></CardContent
          ></Card
        >
      </div>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card
          ><CardHeader
            ><CardTitle class="text-base">Composição dos custos</CardTitle
            ><CardDescription
              >Custos vinculados às OS faturadas no período.</CardDescription
            ></CardHeader
          ><CardContent class="space-y-4"
            ><div
              v-for="item in [
                { label: 'Materiais consumidos', value: report.materiais, color: 'bg-amber-500' },
                {
                  label: 'Repasses aos ourives',
                  value: report.valorOurives,
                  color: 'bg-violet-500',
                },
                { label: 'Custos extras', value: report.custosExtras, color: 'bg-rose-500' },
                { label: 'Pró-labore', value: report.proLabore, color: 'bg-blue-500' },
              ]"
              :key="item.label"
            >
              <div class="mb-2 flex justify-between gap-3 text-sm">
                <span>{{ item.label }}</span
                ><span class="font-semibold">{{ formatCurrencyBR(Number(item.value || 0)) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full"
                  :class="item.color"
                  :style="{
                    width: `${costs ? Math.min(100, (Number(item.value || 0) / costs) * 100) : 0}%`,
                  }"
                />
              </div>
            </div>
            <div class="flex items-center justify-between border-t pt-4">
              <span class="font-medium">Lucro líquido</span
              ><span class="font-bold">{{
                formatCurrencyBR(Number(report.lucroLiquido || 0))
              }}</span>
            </div></CardContent
          ></Card
        ><Card
          ><CardHeader
            ><CardTitle class="text-base">Status das OS recebidas</CardTitle
            ><CardDescription>Distribuição das entradas no período.</CardDescription></CardHeader
          ><CardContent class="space-y-2"
            ><div
              v-for="status in statusRows"
              :key="status.status"
              class="flex items-center justify-between rounded-lg border p-3"
            >
              <span class="text-sm font-medium">{{ statusLabel(status.status) }}</span
              ><span class="text-sm font-bold">{{ status._count?._all || 0 }}</span>
            </div>
            <p v-if="!statusRows.length" class="py-8 text-center text-sm text-muted-foreground">
              Nenhuma OS recebida no período.
            </p></CardContent
          ></Card
        >
      </div>
      <div class="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Perdas reais registradas</CardTitle>
            <CardDescription>Material, OS, ourives e quantidade no período.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <div
              v-for="item in report.perdas?.itens || []"
              :key="item.materialId"
              class="grid gap-1 rounded-lg border p-3 text-sm sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p class="font-semibold">{{ item.material || 'Material' }} · {{ item.ordem }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ item.ourives?.join(', ') || 'Sem ourives vinculado' }}
                </p>
              </div>
              <strong>{{ Number(item.quantidade || 0).toLocaleString('pt-BR') }} g/un.</strong>
            </div>
            <p
              v-if="!report.perdas?.itens?.length"
              class="py-8 text-center text-sm text-muted-foreground"
            >
              Nenhuma perda real no período.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Pagamentos por ourives</CardTitle>
            <CardDescription>Saldo atual filtrado e total pago no período.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <div
              v-for="item in report.pagamentos?.pendentePorOurive || []"
              :key="item.usuarioId"
              class="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span class="font-medium">{{ item.nome }}</span>
              <strong>{{ formatCurrencyBR(Number(item.valor || 0)) }}</strong>
            </div>
            <div class="mt-3 flex items-center justify-between border-t pt-4">
              <span>Pago no período</span>
              <strong>{{ formatCurrencyBR(Number(report.pagamentos?.pagoPeriodo || 0)) }}</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </section>
</template>
