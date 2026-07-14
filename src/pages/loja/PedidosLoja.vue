<script setup lang="ts">
import { h, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/tabela/DataTable.vue'
import { LojaRepository } from '@/repositories/loja-repository'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, PackageOpen } from 'lucide-vue-next'
import { formatCurrencyBR } from '@/utils/formatters'
import { getSocket } from '@/pluguins/socket'

const toast = useToast(); const selected = ref<any>(null); const acting = ref(false); const mobileOrders = ref<any[]>([])
const filters = reactive({ update: 0 })
const statusColor: Record<string, string> = { RECEBIDO: 'secondary', CONFIRMADO: 'default', PREPARANDO: 'default', DESPACHADO: 'default', CONCLUIDO: 'outline', CANCELADO: 'destructive', EXPIRADO: 'destructive', REVISAO: 'destructive' }
async function open(order: any) { selected.value = await LojaRepository.getOrder(order.id) }
const columns: ColumnDef<any>[] = [
  { accessorKey: 'Uid', header: 'Pedido' },
  { accessorKey: 'nomeSnapshot', header: 'Cliente' },
  { accessorKey: 'canal', header: 'Canal' },
  { accessorKey: 'status', header: 'Pedido', cell: ({ row }) => h(Badge, { variant: statusColor[row.original.status] as any }, () => row.original.status) },
  { accessorKey: 'pagamentoStatus', header: 'Pagamento' },
  { accessorKey: 'total', header: 'Total', cell: ({ row }) => formatCurrencyBR(Number(row.original.total)) },
  { id: 'acoes', header: '', cell: ({ row }) => h(Button, { size: 'sm', variant: 'outline', onClick: () => open(row.original) }, () => 'Detalhes') },
]
async function loadMobile() { try { mobileOrders.value = (await LojaRepository.listOrders({ page: 1, limit: 100 })).data } catch { mobileOrders.value = [] } }
async function act(action: 'confirmar' | 'preparar' | 'despachar' | 'cancelar' | 'concluir') {
  if (!selected.value) return
  try { acting.value = true; await LojaRepository.actOnOrder(selected.value.id, action); toast.success('Pedido atualizado.'); await open(selected.value); filters.update += 1; await loadMobile() } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível atualizar o pedido.') } finally { acting.value = false }
}
const socket = getSocket()
async function onStoreUpdate(payload: any) { if (String(payload?.reason || '').startsWith('loja-')) { filters.update += 1; await loadMobile(); if (selected.value?.id === payload.pedidoId) await open(selected.value) } }
onMounted(() => { loadMobile(); socket.on('vendas:updatetable', onStoreUpdate) })
onUnmounted(() => socket.off('vendas:updatetable', onStoreUpdate))
</script>

<template>
  <div>
    <div class="hidden md:block"><DataTable :columns="columns" api="/loja/pedidos" :filters="filters" /></div>
    <div class="space-y-3 md:hidden">
      <Card v-for="order in mobileOrders" :key="order.id" @click="open(order)"><CardContent class="p-4"><div class="flex items-start justify-between"><div><p class="font-bold">{{ order.Uid }}</p><p class="text-sm text-muted-foreground">{{ order.nomeSnapshot }}</p></div><Badge :variant="statusColor[order.status] as any">{{ order.status }}</Badge></div><div class="mt-3 flex justify-between text-sm"><span>{{ order.canal }} · {{ order.pagamentoStatus }}</span><b>{{ formatCurrencyBR(Number(order.total)) }}</b></div></CardContent></Card>
      <div v-if="!mobileOrders.length" class="py-16 text-center text-muted-foreground"><PackageOpen class="mx-auto mb-2 h-10 w-10" />Nenhum pedido recebido.</div>
    </div>
    <Dialog :open="!!selected" @update:open="!$event && (selected = null)"><DialogContent v-if="selected" class="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{{ selected.Uid }} · {{ selected.nomeSnapshot }}</DialogTitle></DialogHeader>
      <div class="grid gap-3 sm:grid-cols-3"><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Pedido</p><b>{{ selected.status }}</b></div><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Pagamento</p><b>{{ selected.pagamentoStatus }}</b></div><div class="rounded-lg border p-3"><p class="text-xs text-muted-foreground">Estoque</p><b>{{ selected.reservas?.some((r:any) => r.status === 'CONSUMIDA') ? 'Consumido' : 'Reservado' }}</b></div></div>
      <div class="rounded-lg border"><div v-for="item in selected.itens" :key="item.id" class="flex justify-between border-b p-3 last:border-0"><span>{{ item.quantidade }}× {{ item.produtoNomeSnapshot }} / {{ item.varianteNomeSnapshot }}</span><b>{{ formatCurrencyBR(Number(item.subtotal)) }}</b></div><div class="flex justify-between bg-muted/40 p-3 text-lg font-bold"><span>Total</span><span>{{ formatCurrencyBR(Number(selected.total)) }}</span></div></div>
      <div class="text-sm"><p><b>Contato:</b> {{ selected.telefoneSnapshot }} · {{ selected.emailSnapshot || 'sem e-mail' }}</p><p v-if="selected.tipoEntrega === 'ENTREGA_LOCAL'"><b>Entrega:</b> {{ selected.enderecoSnapshot }}, {{ selected.numeroSnapshot }} — {{ selected.cidadeSnapshot }}/{{ selected.estadoSnapshot }}</p><p v-else><b>Entrega:</b> Retirada</p><p v-if="selected.Venda"><b>Venda:</b> {{ selected.Venda.Uid }} · {{ selected.Venda.faturado ? 'Faturada' : 'Pendente' }}</p></div>
      <div class="flex flex-wrap justify-end gap-2"><Button v-if="['RECEBIDO','REVISAO'].includes(selected.status)" variant="outline" :disabled="acting" @click="act('cancelar')">{{ selected.status === 'REVISAO' ? 'Solicitar estorno' : 'Cancelar' }}</Button><Button v-if="selected.status === 'RECEBIDO'" :disabled="acting" @click="act('confirmar')">Confirmar</Button><Button v-if="selected.status === 'CONFIRMADO'" :disabled="acting" @click="act('preparar')">Preparar</Button><Button v-if="selected.status === 'PREPARANDO'" :disabled="acting" @click="act('despachar')">Despachar</Button><Button v-if="selected.status === 'DESPACHADO'" :disabled="acting" @click="act('concluir')">Concluir</Button><LoaderCircle v-if="acting" class="h-5 w-5 animate-spin" /></div>
    </DialogContent></Dialog>
  </div>
</template>
