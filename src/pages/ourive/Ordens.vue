<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import type { ColumnDef } from '@tanstack/vue-table'
import { ClipboardList, Eye, Plus, Search, Trash2 } from 'lucide-vue-next'
import DataTable from '@/components/tabela/DataTable.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const toast = useToast()
const ui = useUiStore()
const open = ref(false)
const saving = ref(false)
const mobileLoading = ref(false)
const mobileSearch = ref('')
const mobileOrders = ref<any[]>([])
const tableUpdate = ref(0)
const canReceive = ui.hasOuriveCapability('RECEBER')
const label = (status: string) => ({ RECEBIDA: 'Recebida', ORCAMENTO: 'Orçamento', PRODUCAO: 'Produção', REVISAO: 'Revisão', ENTREGUE: 'Entregue', RECUSADA: 'Recusada', CANCELADA: 'Cancelada' } as Record<string, string>)[status] || status
const emptyPiece = () => ({ descricao: '', metal: '', pedras: '', pesoInformado: undefined as number | undefined, estadoConservacao: '', checklist: '' })
const draft = ref({ clienteId: undefined as number | undefined, descricao: '', garantia: 'Sem garantia informada', pecas: [emptyPiece()] })

async function removeOrder(order: any) {
  const confirmed = await useConfirm().confirm({
    title: 'Apagar ordem de serviço',
    message: `A ordem ${order.codigoRastreio} será apagada definitivamente. Ordens com faturamento ou estoque movimentado não podem ser apagadas.`,
    confirmText: 'Apagar ordem',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    await OuriveRepository.excluirOrdem(order.id)
    tableUpdate.value++
    mobileOrders.value = mobileOrders.value.filter((item) => item.id !== order.id)
    toast.success('Ordem apagada com sucesso.')
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível apagar a ordem.') }
}

const columns: ColumnDef<any>[] = [
  { accessorKey: 'codigoRastreio', header: 'Código', cell: ({ row }) => h('span', { class: 'font-semibold whitespace-nowrap' }, row.original.codigoRastreio) },
  { id: 'cliente', header: 'Cliente', cell: ({ row }) => h('div', { class: 'min-w-[190px]' }, [h('p', { class: 'font-medium' }, row.original.ordemServico?.Cliente?.nome || 'Cliente'), h('p', { class: 'max-w-[280px] truncate text-xs text-muted-foreground' }, row.original.ordemServico?.descricao || 'Sem solicitação')]) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => h(Badge, { variant: row.original.status === 'ENTREGUE' ? 'default' : 'secondary' }, () => label(row.original.status)) },
  { accessorKey: 'updatedAt', header: 'Atualizada em', cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString('pt-BR') },
  { id: 'acoes', header: 'Ações', enableHiding: false, cell: ({ row }) => h('div', { class: 'flex justify-end gap-2' }, [h(Button, { variant: 'outline', size: 'sm', onClick: () => router.push({ name: 'ourive-ordem', params: { id: row.original.id } }) }, () => [h(Eye, { class: 'mr-1 h-4 w-4' }), 'Abrir']), ui.hasOuriveCapability('CONFIGURAR') && !row.original.faturadaEm ? h(Button, { variant: 'outline', size: 'icon', class: 'border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground', ariaLabel: 'Apagar ordem', onClick: () => removeOrder(row.original) }, () => h(Trash2, { class: 'h-4 w-4' })) : null]) },
]
const filteredMobileOrders = computed(() => {
  const term = mobileSearch.value.trim().toLowerCase()
  return term ? mobileOrders.value.filter((order) => `${order.codigoRastreio} ${order.ordemServico?.Cliente?.nome || ''} ${order.ordemServico?.descricao || ''}`.toLowerCase().includes(term)) : mobileOrders.value
})
async function loadMobile() {
  mobileLoading.value = true
  try { mobileOrders.value = (await OuriveRepository.ordens()).items } catch { toast.error('Não foi possível carregar as ordens.') } finally { mobileLoading.value = false }
}
function addPiece() { draft.value.pecas.push(emptyPiece()) }
async function save() {
  if (!draft.value.clienteId || draft.value.descricao.trim().length < 3 || draft.value.pecas.some((piece) => piece.descricao.trim().length < 2)) return toast.info('Informe cliente, solicitação e a descrição de cada peça.')
  saving.value = true
  try {
    const created = await OuriveRepository.criarOrdem({ ...draft.value, pecas: draft.value.pecas.map((piece) => ({ ...piece, checklistRecebimento: piece.checklist.split('\n').map((item) => item.trim()).filter(Boolean) })) })
    toast.success('Recebimento registrado.')
    await router.push({ name: 'ourive-ordem', params: { id: created.id } })
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar o recebimento.') } finally { saving.value = false }
}
onMounted(loadMobile)
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><h2 class="flex items-center gap-2 text-2xl font-bold"><ClipboardList class="h-6 w-6 text-primary" />Ordens de serviço</h2><p class="text-sm text-muted-foreground">Acompanhe a custódia, o orçamento e a produção em uma só visão.</p></div><Button v-if="canReceive" @click="open = true"><Plus class="mr-2 h-4 w-4" />Nova ordem</Button></div>
    <div class="hidden md:block"><DataTable :key="tableUpdate" :columns="columns" api="/v1/ourive/ordens" :filters="{ update: tableUpdate }" /></div>
    <div class="space-y-3 md:hidden"><div class="relative"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input v-model="mobileSearch" class="pl-9" placeholder="Buscar ordem, cliente ou serviço" /></div><div v-if="mobileLoading" class="py-12 text-center text-sm text-muted-foreground">Carregando ordens…</div><template v-else-if="filteredMobileOrders.length"><button v-for="order in filteredMobileOrders" :key="order.id" class="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition active:scale-[.99]" @click="router.push({ name: 'ourive-ordem', params: { id: order.id } })"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="font-semibold">{{ order.codigoRastreio }}</p><p class="mt-1 truncate text-sm text-muted-foreground">{{ order.ordemServico?.Cliente?.nome || 'Cliente' }}</p></div><Badge :variant="order.status === 'ENTREGUE' ? 'default' : 'secondary'">{{ label(order.status) }}</Badge></div><p class="mt-3 line-clamp-2 text-sm">{{ order.ordemServico?.descricao || 'Sem solicitação' }}</p><div class="mt-3 flex items-center gap-1 text-xs font-medium text-primary"><Eye class="h-3.5 w-3.5" /> Ver detalhes</div></button></template><Empty v-else><EmptyHeader><EmptyMedia variant="icon"><ClipboardList /></EmptyMedia><EmptyTitle>Nenhuma ordem encontrada</EmptyTitle><EmptyDescription>As ordens recebidas aparecerão aqui.</EmptyDescription></EmptyHeader></Empty></div>
    <Dialog v-model:open="open"><DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Receber peças</DialogTitle><DialogDescription>Uma OS pode agrupar várias peças do mesmo cliente.</DialogDescription></DialogHeader><div class="grid gap-4 py-2"><label class="grid gap-1 text-sm font-medium">Cliente<Select2Ajax v-model="draft.clienteId" url="/clientes/select2" placeholder="Busque o cliente" /></label><label class="grid gap-1 text-sm font-medium">Solicitação<textarea v-model="draft.descricao" class="min-h-20 rounded-md border bg-background p-3" placeholder="Descreva o serviço solicitado" /></label><label class="grid gap-1 text-sm font-medium">Garantia<Input v-model="draft.garantia" /></label><div v-for="(piece, index) in draft.pecas" :key="index" class="space-y-3 rounded-xl border bg-muted/20 p-4"><div class="flex items-center justify-between"><p class="font-semibold">Peça {{ index + 1 }}</p><Button v-if="draft.pecas.length > 1" size="sm" variant="ghost" @click="draft.pecas.splice(index, 1)"><Trash2 class="h-4 w-4" /></Button></div><div class="grid gap-3 sm:grid-cols-2"><Input v-model="piece.descricao" placeholder="Descrição da peça" /><Input v-model="piece.metal" placeholder="Metal (ex.: ouro 18k)" /><Input v-model="piece.pedras" placeholder="Pedras" /><Input v-model.number="piece.pesoInformado" type="number" min="0" step="0.001" placeholder="Peso informado (g)" /></div><textarea v-model="piece.estadoConservacao" class="min-h-16 w-full rounded-md border bg-background p-3 text-sm" placeholder="Estado de conservação" /><textarea v-model="piece.checklist" class="min-h-16 w-full rounded-md border bg-background p-3 text-sm" placeholder="Checklist de recebimento (um item por linha)" /></div><Button type="button" variant="outline" class="w-fit" @click="addPiece"><Plus class="mr-2 h-4 w-4" />Adicionar peça</Button></div><DialogFooter><Button variant="outline" @click="open = false">Cancelar</Button><Button :disabled="saving" @click="save">Registrar recebimento</Button></DialogFooter></DialogContent></Dialog>
  </section>
</template>
