<script setup lang="ts">
import { h, ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { HandCoins } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/tabela/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast()
const ui = useUiStore()
const update = ref(0)
const tableFilters = { update: 0 }
const money = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
async function settle(commission: any) {
  try { await OuriveRepository.quitarComissao(commission.id); update.value++; toast.success('Comissão quitada e lançamento financeiro efetivado.') }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível quitar a comissão.') }
}
const columns: ColumnDef<any>[] = [
  { id: 'usuario', header: 'Profissional', cell: ({ row }) => h('div', [h('p', { class: 'font-medium' }, row.original.usuario?.nome || 'Ourive'), h('p', { class: 'text-xs text-muted-foreground' }, `Etapa #${row.original.etapaId}`)]) },
  { accessorKey: 'tipo', header: 'Regra', cell: ({ row }) => row.original.tipo === 'PERCENTUAL' ? `${row.original.referencia}%` : money(row.original.referencia) },
  { accessorKey: 'valorConsolidado', header: 'Valor', cell: ({ row }) => row.original.valorConsolidado ? money(row.original.valorConsolidado) : 'Aguardando revisão' },
  { id: 'status', header: 'Status', cell: ({ row }) => h(Badge, { variant: row.original.quitadaEm ? 'default' : row.original.valorConsolidado ? 'secondary' : 'outline' }, () => row.original.quitadaEm ? 'Quitada' : row.original.valorConsolidado ? 'Pendente' : 'Em apuração') },
  { id: 'acoes', header: 'Ações', enableHiding: false, cell: ({ row }) => ui.hasOuriveCapability('FINANCEIRO') && row.original.lancamentoFinanceiroId && !row.original.quitadaEm ? h(Button, { size: 'sm', onClick: () => settle(row.original) }, () => 'Quitar') : h('span', { class: 'text-xs text-muted-foreground' }, '—') },
]
</script>

<template>
  <section class="space-y-5"><div><h2 class="flex items-center gap-2 text-2xl font-bold"><HandCoins class="h-6 w-6 text-primary" />Comissões</h2><p class="text-sm text-muted-foreground">Acompanhe valores consolidados e a quitação financeira por etapa.</p></div><DataTable :key="update" :columns="columns" api="/v1/ourive/comissoes" :filters="tableFilters" /></section>
</template>
