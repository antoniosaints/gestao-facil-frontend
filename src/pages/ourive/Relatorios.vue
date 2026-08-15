<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { endOfMonth, startOfMonth } from 'date-fns'
import { BarChart3, CircleDollarSign, ClipboardList, PackageCheck, RefreshCw, TrendingUp, WalletCards } from 'lucide-vue-next'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { useToast } from 'vue-toastification'

const toast = useToast()
const loading = ref(true)
const periodo = ref<[Date, Date]>([startOfMonth(new Date()), endOfMonth(new Date())])
const report = ref<any>()
const statusLabel = (status: string) => ({ RECEBIDA: 'Recebida', ORCAMENTO: 'Orçamento', PRODUCAO: 'Produção', REVISAO: 'Revisão', ENTREGUE: 'Entregue', RECUSADA: 'Recusada', CANCELADA: 'Cancelada' } as Record<string, string>)[status] || status
const costs = computed(() => Number(report.value?.materiais || 0) + Number(report.value?.comissoes || 0) + Number(report.value?.custosExtras || 0))
const margin = computed(() => {
  const revenue = Number(report.value?.receita || 0)
  return revenue ? (Number(report.value?.lucroLiquido || 0) / revenue) * 100 : 0
})
const statusRows = computed(() => report.value?.porStatus || [])
const periodLabel = computed(() => `${periodo.value[0].toLocaleDateString('pt-BR')} — ${periodo.value[1].toLocaleDateString('pt-BR')}`)
async function load() {
  loading.value = true
  try { report.value = await OuriveRepository.relatorios(periodo.value[0].toISOString(), periodo.value[1].toISOString()) }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o relatório.') }
  finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 class="flex items-center gap-2 text-2xl font-bold"><BarChart3 class="h-6 w-6 text-primary" />Relatórios de ourivesaria</h2><p class="text-sm text-muted-foreground">Recebimentos, faturamento e rentabilidade da operação.</p></div><div class="flex flex-col gap-2 sm:flex-row sm:items-center"><Calendarpicker v-model="periodo" :range="true" :teleport="true" /><Button :disabled="loading" @click="load"><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button></div></div>
    <Card class="border-primary/20 bg-primary/[.03]"><CardContent class="p-4 text-sm"><span class="font-semibold">Período analisado:</span> {{ periodLabel }}. Receita, custos e lucro consideram somente as OS faturadas nesse intervalo; os status mostram as OS recebidas no período.</CardContent></Card>
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Skeleton v-for="item in 5" :key="item" class="h-28 rounded-xl" /></div>
    <template v-else-if="report"><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Card><CardContent class="flex items-center gap-3 p-4"><ClipboardList class="h-8 w-8 text-blue-600" /><div><p class="text-xs text-muted-foreground">OS recebidas</p><p class="text-2xl font-bold">{{ report.totalOrdens }}</p></div></CardContent></Card><Card><CardContent class="flex items-center gap-3 p-4"><PackageCheck class="h-8 w-8 text-emerald-600" /><div><p class="text-xs text-muted-foreground">OS faturadas</p><p class="text-2xl font-bold">{{ report.ordensFaturadas }}</p></div></CardContent></Card><Card><CardContent class="flex items-center gap-3 p-4"><CircleDollarSign class="h-8 w-8 text-primary" /><div><p class="text-xs text-muted-foreground">Receita faturada</p><p class="text-lg font-bold">{{ formatCurrencyBR(Number(report.receita || 0)) }}</p></div></CardContent></Card><Card><CardContent class="flex items-center gap-3 p-4"><WalletCards class="h-8 w-8 text-amber-600" /><div><p class="text-xs text-muted-foreground">Custos totais</p><p class="text-lg font-bold">{{ formatCurrencyBR(costs) }}</p></div></CardContent></Card><Card><CardContent class="flex items-center gap-3 p-4"><TrendingUp class="h-8 w-8 text-violet-600" /><div><p class="text-xs text-muted-foreground">Lucro líquido</p><p class="text-lg font-bold">{{ formatCurrencyBR(Number(report.lucroLiquido || 0)) }}</p><p class="text-xs text-muted-foreground">Margem de {{ margin.toFixed(1) }}%</p></div></CardContent></Card></div>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><Card><CardHeader><CardTitle class="text-base">Composição dos custos</CardTitle><CardDescription>Custos vinculados às OS faturadas no período.</CardDescription></CardHeader><CardContent class="space-y-4"><div v-for="item in [{ label: 'Materiais consumidos', value: report.materiais, color: 'bg-amber-500' }, { label: 'Comissões consolidadas', value: report.comissoes, color: 'bg-violet-500' }, { label: 'Custos extras', value: report.custosExtras, color: 'bg-rose-500' }]" :key="item.label"><div class="mb-2 flex justify-between gap-3 text-sm"><span>{{ item.label }}</span><span class="font-semibold">{{ formatCurrencyBR(Number(item.value || 0)) }}</span></div><div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full" :class="item.color" :style="{ width: `${costs ? Math.min(100, Number(item.value || 0) / costs * 100) : 0}%` }" /></div></div><div class="flex items-center justify-between border-t pt-4"><span class="font-medium">Lucro líquido</span><span class="font-bold">{{ formatCurrencyBR(Number(report.lucroLiquido || 0)) }}</span></div></CardContent></Card><Card><CardHeader><CardTitle class="text-base">Status das OS recebidas</CardTitle><CardDescription>Distribuição das entradas no período.</CardDescription></CardHeader><CardContent class="space-y-2"><div v-for="status in statusRows" :key="status.status" class="flex items-center justify-between rounded-lg border p-3"><span class="text-sm font-medium">{{ statusLabel(status.status) }}</span><span class="text-sm font-bold">{{ status._count?._all || 0 }}</span></div><p v-if="!statusRows.length" class="py-8 text-center text-sm text-muted-foreground">Nenhuma OS recebida no período.</p></CardContent></Card></div>
    </template>
  </section>
</template>
