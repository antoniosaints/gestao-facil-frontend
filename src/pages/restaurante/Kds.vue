<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useSocketEvent } from '@/composables/useSocketEvent'
import {
  RestauranteRepository,
  type RestauranteKdsTicket,
  type RestaurantePontoProducao,
  type RestauranteTicketStatus,
} from '@/repositories/restaurante-repository'
import { CheckCheck, ChefHat, Clock3, CookingPot, Plus, Printer, RefreshCw, Settings2, UtensilsCrossed } from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const tickets = ref<RestauranteKdsTicket[]>([])
const pontos = ref<RestaurantePontoProducao[]>([])
const categorias = ref<Array<{ id: number; nome: string }>>([])
const pontoFiltro = ref('TODOS')
const configModal = ref(false)
const pontoModal = ref(false)
const pontoAtual = ref<RestaurantePontoProducao | null>(null)
const form = ref({ nome: '', cor: 'orange', ativo: true, ordem: 0, categoriaIds: [] as number[], version: undefined as number | undefined })

const statusLabel: Record<RestauranteTicketStatus, string> = {
  PENDENTE: 'Pendente', PREPARANDO: 'Preparando', PRONTO: 'Pronto', ENTREGUE: 'Entregue',
}
const statusClass: Record<RestauranteTicketStatus, string> = {
  PENDENTE: 'border-amber-500/40', PREPARANDO: 'border-blue-500/50 bg-blue-500/5', PRONTO: 'border-emerald-500/50 bg-emerald-500/5', ENTREGUE: 'border-muted opacity-70',
}
const nextStatus: Partial<Record<RestauranteTicketStatus, RestauranteTicketStatus>> = {
  PENDENTE: 'PREPARANDO', PREPARANDO: 'PRONTO', PRONTO: 'ENTREGUE',
}
const nextLabel: Partial<Record<RestauranteTicketStatus, string>> = {
  PENDENTE: 'Iniciar preparo', PREPARANDO: 'Marcar pronto', PRONTO: 'Entregar',
}
const filtrados = computed(() => tickets.value.filter((ticket) => pontoFiltro.value === 'TODOS' || ticket.pontoId === Number(pontoFiltro.value)))

async function carregar(feedback = false) {
  try {
    loading.value = true
    ;[pontos.value, tickets.value, categorias.value] = await Promise.all([
      RestauranteRepository.pontosProducao(),
      RestauranteRepository.ticketsKds(),
      RestauranteRepository.categoriasProducao(),
    ])
    if (feedback) toast.info('KDS atualizado')
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o KDS.') }
  finally { loading.value = false }
}

async function avancar(ticket: RestauranteKdsTicket) {
  const status = nextStatus[ticket.status]
  if (!status) return
  try {
    const updated = await RestauranteRepository.transicionarTicketKds(ticket.id, status, ticket.version)
    if (status === 'ENTREGUE') tickets.value = tickets.value.filter((item) => item.id !== ticket.id)
    else tickets.value = tickets.value.map((item) => item.id === ticket.id ? updated : item)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar o ticket.')
    if (error?.response?.status === 409) await carregar()
  }
}

async function reimprimir(ticket: RestauranteKdsTicket) {
  try {
    await RestauranteRepository.reimprimirTicket(ticket.id)
    toast.success(`Reimpressão do pedido ${ticket.Pedido.codigo} enviada para a fila`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível solicitar a reimpressão.')
  }
}

function editarPonto(ponto?: RestaurantePontoProducao) {
  pontoAtual.value = ponto || null
  form.value = {
    nome: ponto?.nome || '', cor: ponto?.cor || 'orange', ativo: ponto?.ativo ?? true, ordem: ponto?.ordem || 0,
    categoriaIds: ponto?.roteamentos.map((route) => route.categoriaId) || [], version: ponto?.version,
  }
  pontoModal.value = true
}

function toggleCategoria(id: number) {
  form.value.categoriaIds = form.value.categoriaIds.includes(id)
    ? form.value.categoriaIds.filter((value) => value !== id)
    : [...form.value.categoriaIds, id]
}

async function salvarPonto() {
  if (!form.value.nome.trim()) return
  try {
    saving.value = true
    await RestauranteRepository.salvarPontoProducao(form.value, pontoAtual.value?.id)
    pontoModal.value = false
    toast.success('Ponto de produção salvo')
    await carregar()
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o ponto.') }
  finally { saving.value = false }
}

function elapsed(value: string) {
  const total = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)}h ${total % 60}min`
}

function selections(item: RestauranteKdsTicket['itens'][number]) {
  return Array.isArray(item.PedidoItem.selecoesSnapshotJson)
    ? item.PedidoItem.selecoesSnapshotJson.map((selection) => selection.nome).filter(Boolean).join(', ')
    : ''
}

useSocketEvent('restaurante:kds', () => carregar())
onMounted(() => carregar())
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><CookingPot class="h-6 w-6 text-primary" />KDS</h1><p class="text-sm text-muted-foreground">Produção separada por cozinha, bar, pizzaria ou balcão.</p></div>
      <div class="flex gap-2"><Button variant="outline" :disabled="loading" @click="carregar(true)"><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button><Button variant="outline" @click="configModal = true"><Settings2 class="mr-2 h-4 w-4" />Pontos</Button></div>
    </header>

    <div class="max-w-sm"><Select v-model="pontoFiltro"><SelectTrigger><SelectValue placeholder="Ponto de produção" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos os pontos</SelectItem><SelectItem v-for="ponto in pontos.filter((item) => item.ativo)" :key="ponto.id" :value="String(ponto.id)">{{ ponto.nome }}</SelectItem></SelectContent></Select></div>

    <div v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"><Skeleton v-for="item in 6" :key="item" class="h-72 rounded-xl" /></div>
    <div v-else-if="!pontos.some((item) => item.ativo)" class="rounded-xl border border-dashed p-10 text-center"><Settings2 class="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><p class="font-medium">Configure o primeiro ponto de produção</p><p class="mb-4 text-sm text-muted-foreground">Associe categorias à cozinha, bar ou outro setor.</p><Button @click="editarPonto()"><Plus class="mr-2 h-4 w-4" />Criar ponto</Button></div>
    <div v-else-if="!filtrados.length" class="rounded-xl border border-dashed p-10 text-center"><CheckCheck class="mx-auto mb-3 h-9 w-9 text-emerald-500" /><p class="font-medium">Produção em dia</p><p class="text-sm text-muted-foreground">Nenhum ticket ativo para este ponto.</p></div>
    <div v-else class="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card v-for="ticket in filtrados" :key="ticket.id" class="rounded-xl border-2" :class="statusClass[ticket.status]">
        <CardHeader class="pb-3"><div class="flex items-start justify-between gap-3"><div><CardTitle class="flex items-center gap-2 text-lg">{{ ticket.Pedido.codigo }}<Badge v-if="ticket.tipo !== 'INICIAL'" variant="destructive">{{ ticket.tipo }}</Badge></CardTitle><p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 class="h-3.5 w-3.5" />{{ elapsed(ticket.createdAt) }} · {{ ticket.Pedido.Mesa?.nome || ticket.Pedido.origem.replace('_', ' ') }}</p></div><Badge variant="outline">{{ ticket.Ponto.nome }} · {{ statusLabel[ticket.status] }}</Badge></div></CardHeader>
        <CardContent class="space-y-3"><div v-for="item in ticket.itens" :key="item.PedidoItem.id" class="rounded-lg border bg-background p-3"><p class="font-semibold">{{ Number(item.quantidade) }}× {{ item.PedidoItem.nomeSnapshot }}</p><p v-if="item.PedidoItem.tamanhoSnapshot" class="text-sm text-muted-foreground">{{ item.PedidoItem.tamanhoSnapshot }}</p><p v-if="selections(item)" class="text-sm text-muted-foreground">+ {{ selections(item) }}</p><p v-if="item.PedidoItem.observacao || item.observacao" class="mt-2 rounded bg-amber-500/10 p-2 text-sm font-medium text-amber-800 dark:text-amber-200">{{ item.PedidoItem.observacao || item.observacao }}</p></div><p v-if="ticket.Pedido.observacao" class="rounded-lg bg-muted p-3 text-sm"><strong>Pedido:</strong> {{ ticket.Pedido.observacao }}</p></CardContent>
        <CardFooter class="gap-2 border-t pt-4"><Button v-if="nextStatus[ticket.status]" class="flex-1" @click="avancar(ticket)"><ChefHat class="mr-2 h-4 w-4" />{{ nextLabel[ticket.status] }}</Button><Button variant="outline" :class="nextStatus[ticket.status] ? '' : 'w-full'" @click="reimprimir(ticket)"><Printer class="mr-2 h-4 w-4" />Reimprimir</Button></CardFooter>
      </Card>
    </div>

    <Dialog v-model:open="configModal"><DialogContent class="sm:max-w-2xl"><DialogHeader><DialogTitle>Pontos de produção</DialogTitle><DialogDescription>Cada categoria pode alimentar um ou mais pontos obrigatórios.</DialogDescription></DialogHeader><div class="space-y-2"><div v-for="ponto in pontos" :key="ponto.id" class="flex items-center justify-between rounded-xl border p-3"><div><p class="font-medium">{{ ponto.nome }}</p><p class="text-xs text-muted-foreground">{{ ponto.roteamentos.map((route) => route.Categoria.nome).join(', ') || 'Sem categorias' }}</p></div><div class="flex items-center gap-2"><Badge variant="outline">{{ ponto.ativo ? 'Ativo' : 'Inativo' }}</Badge><Button size="sm" variant="outline" @click="editarPonto(ponto)">Editar</Button></div></div></div><DialogFooter><Button variant="outline" @click="configModal = false">Fechar</Button><Button @click="editarPonto()"><Plus class="mr-2 h-4 w-4" />Novo ponto</Button></DialogFooter></DialogContent></Dialog>

    <Dialog v-model:open="pontoModal"><DialogContent><DialogHeader><DialogTitle>{{ pontoAtual ? 'Editar ponto' : 'Novo ponto' }}</DialogTitle><DialogDescription>Selecione quais categorias devem aparecer neste KDS.</DialogDescription></DialogHeader><div class="grid gap-4 sm:grid-cols-2"><div class="space-y-2"><Label>Nome</Label><Input v-model="form.nome" placeholder="Ex.: Cozinha" /></div><div class="space-y-2"><Label>Ordem</Label><Input v-model.number="form.ordem" type="number" /></div><div class="flex items-center justify-between rounded-lg border p-3 sm:col-span-2"><div><p class="text-sm font-medium">Ponto ativo</p><p class="text-xs text-muted-foreground">Recebe novos tickets.</p></div><Switch v-model:model-value="form.ativo" /></div><div class="space-y-2 sm:col-span-2"><Label>Categorias roteadas</Label><div class="flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-xl border p-3"><Button v-for="categoria in categorias" :key="categoria.id" type="button" size="sm" :variant="form.categoriaIds.includes(categoria.id) ? 'default' : 'outline'" @click="toggleCategoria(categoria.id)"><UtensilsCrossed class="mr-2 h-3.5 w-3.5" />{{ categoria.nome }}</Button><p v-if="!categorias.length" class="text-sm text-muted-foreground">Cadastre categorias de produtos antes de configurar o roteamento.</p></div></div></div><DialogFooter><Button variant="outline" @click="pontoModal = false">Cancelar</Button><Button :disabled="saving || !form.nome.trim()" @click="salvarPonto">Salvar ponto</Button></DialogFooter></DialogContent></Dialog>
  </section>
</template>
