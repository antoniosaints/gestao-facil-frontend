<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useSocketEvent } from '@/composables/useSocketEvent'
import PedidoDetalhesDialog from './PedidoDetalhesDialog.vue'
import {
  RestauranteRepository,
  type RestauranteKdsTicket,
  type RestaurantePedido,
  type RestaurantePontoProducao,
  type RestauranteTicketStatus,
} from '@/repositories/restaurante-repository'
import { WhatsAppRepository } from '@/repositories/whatsapp-repository'
import { formatKdsSelections } from './kdsSelections'
import {
  CheckCheck,
  ChefHat,
  Clock3,
  CookingPot,
  Maximize2,
  Minimize2,
  Plus,
  Printer,
  RefreshCw,
  Settings2,
  UtensilsCrossed,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast()
const uiStore = useUiStore()
const router = useRouter()
const canOperate = computed(() => uiStore.hasRestaurantCapability('KDS_OPERAR'))
const canConfigure = computed(() => uiStore.hasRestaurantCapability('KDS_CONFIGURAR'))
const modoImersivo = computed(() => uiStore.kdsImersivo)
const loading = ref(true)
const saving = ref(false)
const tickets = ref<RestauranteKdsTicket[]>([])
const pontos = ref<RestaurantePontoProducao[]>([])
const categorias = ref<Array<{ id: number; nome: string }>>([])
const pontoFiltro = ref('TODOS')
const configModal = ref(false)
const pontoModal = ref(false)
const openModalDetalhes = ref(false)
const abrindoChat = ref(false)
const pontoAtual = ref<RestaurantePontoProducao | null>(null)
const pedidoSelecionado = ref<RestaurantePedido | null>(null)
const atendimentoDisponivel = computed(() => uiStore.hasActiveModule('atendimento'))
const form = ref({
  nome: '',
  cor: 'orange',
  ativo: true,
  ordem: 0,
  categoriaIds: [] as number[],
  version: undefined as number | undefined,
})

const statusLabel: Record<RestauranteTicketStatus, string> = {
  PENDENTE: 'Pendente',
  PREPARANDO: 'Preparando',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
}
const statusClass: Record<RestauranteTicketStatus, string> = {
  PENDENTE: 'border-l-amber-500',
  PREPARANDO: 'border-l-blue-500 bg-blue-500/5',
  PRONTO: 'border-l-emerald-500 bg-emerald-500/5',
  ENTREGUE: 'border-l-muted opacity-70',
}
const typeLabel: Record<RestauranteKdsTicket['tipo'], string> = {
  INICIAL: 'Pedido',
  ADICAO: 'Adição',
  CANCELAMENTO: 'Cancelamento',
}
const nextStatus: Partial<Record<RestauranteTicketStatus, RestauranteTicketStatus>> = {
  PENDENTE: 'PREPARANDO',
  PREPARANDO: 'PRONTO',
  PRONTO: 'ENTREGUE',
}
const nextLabel: Partial<Record<RestauranteTicketStatus, string>> = {
  PENDENTE: 'Iniciar preparo',
  PREPARANDO: 'Marcar pronto',
  PRONTO: 'Entregar',
}
const filtrados = computed(() =>
  tickets.value.filter(
    (ticket) => pontoFiltro.value === 'TODOS' || ticket.pontoId === Number(pontoFiltro.value),
  ),
)
const statusCounts = computed(() => ({
  PENDENTE: filtrados.value.filter((ticket) => ticket.status === 'PENDENTE').length,
  PREPARANDO: filtrados.value.filter((ticket) => ticket.status === 'PREPARANDO').length,
  PRONTO: filtrados.value.filter((ticket) => ticket.status === 'PRONTO').length,
}))

async function carregar(feedback = false) {
  try {
    loading.value = true
    ;[pontos.value, tickets.value, categorias.value] = await Promise.all([
      RestauranteRepository.pontosProducao(),
      RestauranteRepository.ticketsKds(),
      RestauranteRepository.categoriasProducao(),
    ])
    if (feedback) toast.info('KDS atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o KDS.')
  } finally {
    loading.value = false
  }
}

async function avancar(ticket: RestauranteKdsTicket) {
  const status = nextStatus[ticket.status]
  if (!status) return
  try {
    const updated = await RestauranteRepository.transicionarTicketKds(
      ticket.id,
      status,
      ticket.version,
    )
    if (status === 'ENTREGUE') tickets.value = tickets.value.filter((item) => item.id !== ticket.id)
    else tickets.value = tickets.value.map((item) => (item.id === ticket.id ? updated : item))
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
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível solicitar a reimpressão.',
    )
  }
}

function abrirDetalhes(ticket: RestauranteKdsTicket) {
  // O KDS pode receber um ticket de uma conexão que ainda está com o formato
  // anterior do payload. Normalizamos os campos usados no diálogo para que a
  // abertura do overlay nunca fique sem conteúdo enquanto a lista é atualizada.
  const pedido = ticket.Pedido as Partial<RestaurantePedido>
  pedidoSelecionado.value = {
    ...pedido,
    id: pedido.id ?? ticket.Pedido.id,
    codigo: pedido.codigo ?? ticket.Pedido.codigo,
    origem: pedido.origem ?? ticket.Pedido.origem,
    status: pedido.status ?? 'RECEBIDO',
    producaoStatus: pedido.producaoStatus ?? 'PENDENTE',
    pagamentoStatus: pedido.pagamentoStatus ?? 'NAO_INFORMADO',
    entregaStatus: pedido.entregaStatus ?? 'NAO_APLICAVEL',
    subtotal: pedido.subtotal ?? 0,
    frete: pedido.frete ?? 0,
    desconto: pedido.desconto ?? 0,
    total: pedido.total ?? 0,
    version: pedido.version ?? ticket.version,
    createdAt: pedido.createdAt ?? ticket.createdAt,
    itens: Array.isArray(pedido.itens)
      ? pedido.itens
      : ticket.itens.map((item) => ({
          id: item.PedidoItem.id,
          nomeSnapshot: item.PedidoItem.nomeSnapshot,
          quantidade: item.quantidade,
          subtotalSnapshot: 0,
          tamanhoSnapshot: item.PedidoItem.tamanhoSnapshot,
          selecoesSnapshotJson: item.PedidoItem.selecoesSnapshotJson,
          observacao: item.PedidoItem.observacao || item.observacao,
        })),
  }
  openModalDetalhes.value = true
}

async function abrirChatPedido(pedido: RestaurantePedido) {
  const telefone = pedido.clienteTelefone?.trim()
  if (!telefone) {
    toast.info('Este pedido não possui telefone para iniciar o atendimento.')
    return
  }
  try {
    abrindoChat.value = true
    const conversa = await WhatsAppRepository.startConversation({
      phone: telefone,
      nome: pedido.clienteNomeSnapshot || undefined,
    })
    await router.push({ name: 'atendimento', query: { conversa: String(conversa.id) } })
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível abrir o chat deste cliente.')
  } finally {
    abrindoChat.value = false
  }
}

function editarPonto(ponto?: RestaurantePontoProducao) {
  pontoAtual.value = ponto || null
  form.value = {
    nome: ponto?.nome || '',
    cor: ponto?.cor || 'orange',
    ativo: ponto?.ativo ?? true,
    ordem: ponto?.ordem || 0,
    categoriaIds: ponto?.roteamentos.map((route) => route.categoriaId) || [],
    version: ponto?.version,
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
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar o ponto.')
  } finally {
    saving.value = false
  }
}

function elapsed(value: string) {
  const total = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)}h ${total % 60}min`
}

function selections(item: RestauranteKdsTicket['itens'][number]) {
  return formatKdsSelections(item.PedidoItem.selecoesSnapshotJson)
}

function alternarModoImersivo() {
  uiStore.kdsImersivo = !uiStore.kdsImersivo
}

function tratarTeclaAtalho(event: KeyboardEvent) {
  if (event.key === 'Escape' && uiStore.kdsImersivo) uiStore.kdsImersivo = false
}

useSocketEvent('restaurante:kds', () => carregar())
onMounted(() => {
  window.addEventListener('keydown', tratarTeclaAtalho)
  carregar()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', tratarTeclaAtalho)
  uiStore.kdsImersivo = false
})
</script>

<template>
  <section :class="['space-y-4', modoImersivo && 'min-h-screen bg-background p-4 md:p-6']">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <CookingPot class="h-6 w-6 text-primary" />KDS
        </h1>
        <p class="text-sm text-muted-foreground">
          Produção por cozinha, bar, pizzaria ou outro setor produtor.
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          :title="modoImersivo ? 'Sair do modo imersivo (Esc)' : 'Maximizar KDS'"
          @click="alternarModoImersivo"
        >
          <Minimize2 v-if="modoImersivo" class="h-4 w-4 sm:mr-2" />
          <Maximize2 v-else class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">{{ modoImersivo ? 'Restaurar' : 'Maximizar' }}</span>
          <span class="sr-only">{{ modoImersivo ? 'Restaurar KDS' : 'Maximizar KDS' }}</span>
        </Button>
        <Button variant="outline" :disabled="loading" @click="carregar(true)">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar </Button
        ><Button v-if="canConfigure" variant="outline" @click="configModal = true">
          <Settings2 class="mr-2 h-4 w-4" />Pontos
        </Button>
      </div>
    </header>

    <div class="flex flex-col gap-2 rounded-xl border bg-card p-2 sm:flex-row sm:items-center">
      <Select v-model="pontoFiltro">
        <SelectTrigger class="w-full sm:max-w-xs">
          <SelectValue placeholder="Ponto de produção" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os pontos</SelectItem>
          <SelectItem
            v-for="ponto in pontos.filter((item) => item.ativo)"
            :key="ponto.id"
            :value="String(ponto.id)"
            >{{ ponto.nome }}</SelectItem
          >
        </SelectContent>
      </Select>
      <div class="flex flex-wrap items-center gap-1.5 sm:ml-auto">
        <Badge variant="outline" class="tabular-nums">{{ filtrados.length }} ativo(s)</Badge>
        <Badge
          class="tabular-nums border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
        >
          {{ statusCounts.PENDENTE }} pendente(s)</Badge
        >
        <Badge
          class="tabular-nums border-blue-500/30 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300"
        >
          {{ statusCounts.PREPARANDO }} preparando</Badge
        >
        <Badge
          class="tabular-nums border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
        >
          {{ statusCounts.PRONTO }} pronto(s)</Badge
        >
      </div>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <Skeleton v-for="item in 8" :key="item" class="h-52 rounded-xl" />
    </div>
    <div
      v-else-if="!pontos.some((item) => item.ativo)"
      class="rounded-xl border border-dashed p-10 text-center"
    >
      <Settings2 class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      <p class="font-medium">Nenhum ponto de produção ativo</p>
      <p class="mb-4 text-sm text-muted-foreground">
        Associe categorias à cozinha, bar ou outro setor.
      </p>
      <Button v-if="canConfigure" @click="editarPonto()">
        <Plus class="mr-2 h-4 w-4" />Criar ponto
      </Button>
    </div>
    <div v-else-if="!filtrados.length" class="rounded-xl border border-dashed p-10 text-center">
      <CheckCheck class="mx-auto mb-3 h-9 w-9 text-emerald-500" />
      <p class="font-medium">Produção em dia</p>
      <p class="text-sm text-muted-foreground">Nenhum ticket ativo para este ponto.</p>
    </div>
    <div
      v-else
      class="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <Card
        v-for="ticket in filtrados"
        :key="ticket.id"
        class="overflow-hidden rounded-l-sm rounded-r-md border-l-4"
        :class="statusClass[ticket.status]"
      >
        <CardHeader
          class="cursor-pointer border-b p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          role="button"
          tabindex="0"
          :aria-label="`Ver detalhes do pedido ${ticket.Pedido.codigo}`"
          @click="abrirDetalhes(ticket)"
          @keydown.enter.prevent="abrirDetalhes(ticket)"
          @keydown.space.prevent="abrirDetalhes(ticket)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5">
                <CardTitle class="text-base">{{ ticket.Pedido.codigo }}</CardTitle>
                <Badge v-if="ticket.tipo !== 'INICIAL'" variant="destructive" class="text-[10px]">{{
                  typeLabel[ticket.tipo]
                }}</Badge>
              </div>
              <p
                class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
              >
                <span class="flex items-center gap-1">
                  <Clock3 class="h-3.5 w-3.5" />{{ elapsed(ticket.createdAt) }} </span
                ><span>{{
                  ticket.Pedido.Mesa?.nome || ticket.Pedido.origem.replace('_', ' ')
                }}</span>
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="outline">{{ statusLabel[ticket.status] }}</Badge
              ><span class="text-[11px] text-muted-foreground">{{ ticket.Ponto.nome }}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2 p-3">
          <div class="divide-y rounded-sm bg-background px-2 ring-1 ring-border">
            <div v-for="item in ticket.itens" :key="item.PedidoItem.id" class="py-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold leading-5">
                    {{ item.PedidoItem.nomeSnapshot
                    }}<span
                      v-if="item.PedidoItem.tamanhoSnapshot"
                      class="font-normal text-muted-foreground"
                    >
                      · {{ item.PedidoItem.tamanhoSnapshot }}</span
                    >
                  </p>
                  <div
                    v-if="selections(item).length"
                    class="mt-0.5 space-y-0.5 text-xs leading-4 text-muted-foreground"
                  >
                    <p
                      v-for="(selection, index) in selections(item)"
                      :key="`${selection}-${index}`"
                    >
                      {{ selection }}
                    </p>
                  </div>
                </div>
                <span
                  class="inline-flex min-w-7 shrink-0 justify-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums"
                  >{{ Number(item.quantidade) }}×</span
                >
              </div>
              <p
                v-if="item.PedidoItem.observacao || item.observacao"
                class="mt-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs font-medium leading-4 text-amber-800 dark:text-amber-200"
              >
                {{ item.PedidoItem.observacao || item.observacao }}
              </p>
            </div>
          </div>
          <p
            v-if="ticket.Pedido.observacao"
            class="rounded-lg bg-muted px-2.5 py-2 text-xs leading-4"
          >
            <strong>Observação do pedido:</strong> {{ ticket.Pedido.observacao }}
          </p>
        </CardContent>
        <CardFooter v-if="canOperate" class="gap-2 border-t px-3 py-2.5"
          ><Button
            v-if="nextStatus[ticket.status]"
            size="sm"
            class="min-h-9 flex-1"
            @click="avancar(ticket)"
          >
            <ChefHat class="mr-1.5 h-4 w-4" />{{ nextLabel[ticket.status] }} </Button
          ><Button
            size="sm"
            variant="outline"
            class="min-h-9"
            :class="nextStatus[ticket.status] ? '' : 'w-full'"
            @click="reimprimir(ticket)"
          >
            <Printer class="mr-1.5 h-4 w-4" />Reimprimir
          </Button></CardFooter
        >
      </Card>
    </div>

    <PedidoDetalhesDialog
      v-model:open="openModalDetalhes"
      :pedido="pedidoSelecionado"
      :pode-abrir-chat="atendimentoDisponivel"
      :abrindo-chat="abrindoChat"
      @abrir-chat="abrirChatPedido"
    />

    <Dialog v-model:open="configModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pontos de produção</DialogTitle>
          <DialogDescription
            >Cada categoria pode ser enviada para um ou mais pontos de produção.</DialogDescription
          >
        </DialogHeader>
        <div class="space-y-2">
          <div
            v-for="ponto in pontos"
            :key="ponto.id"
            class="flex items-center justify-between rounded-xl border p-3"
          >
            <div>
              <p class="font-medium">{{ ponto.nome }}</p>
              <p class="text-xs text-muted-foreground">
                {{
                  ponto.roteamentos.map((route) => route.Categoria.nome).join(',') ||
                  'Sem categorias'
                }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="outline">{{ ponto.ativo ? 'Ativo' : 'Inativo' }}</Badge
              ><Button size="sm" variant="outline" @click="editarPonto(ponto)">Editar</Button>
            </div>
          </div>
        </div>
        <DialogFooter
          ><Button variant="outline" @click="configModal = false">Fechar</Button
          ><Button @click="editarPonto()">
            <Plus class="mr-2 h-4 w-4" />Novo ponto
          </Button></DialogFooter
        >
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="pontoModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ pontoAtual ? 'Editar ponto' : 'Novo ponto' }}</DialogTitle>
          <DialogDescription
            >Selecione as categorias produzidas neste ponto. Uma categoria pode participar de vários
            pontos ativos.</DialogDescription
          >
        </DialogHeader>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>Nome</Label><Input v-model="form.nome" placeholder="Ex.: Cozinha" />
          </div>
          <div class="space-y-2">
            <Label>Ordem</Label><Input v-model.number="form.ordem" type="number" />
          </div>
          <div class="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <p class="text-sm font-medium">Ponto ativo</p>
              <p class="text-xs text-muted-foreground">Recebe novos tickets.</p>
            </div>
            <Switch v-model:model-value="form.ativo" />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label>Categorias roteadas</Label>
            <div class="flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-xl border p-3">
              <Button
                v-for="categoria in categorias"
                :key="categoria.id"
                type="button"
                size="sm"
                :variant="form.categoriaIds.includes(categoria.id) ? 'default' : 'outline'"
                @click="toggleCategoria(categoria.id)"
              >
                <UtensilsCrossed class="mr-2 h-3.5 w-3.5" />{{ categoria.nome }}
              </Button>
              <p v-if="!categorias.length" class="text-sm text-muted-foreground">
                Cadastre categorias de produtos antes de configurar o roteamento.
              </p>
            </div>
            <p class="text-xs text-muted-foreground">
              Cada ponto selecionado receberá seu próprio ticket com os itens da categoria.
            </p>
          </div>
        </div>
        <DialogFooter
          ><Button variant="outline" @click="pontoModal = false">Cancelar</Button
          ><Button :disabled="saving || !form.nome.trim()" @click="salvarPonto"
            >Salvar ponto</Button
          ></DialogFooter
        >
      </DialogContent>
    </Dialog>
  </section>
</template>
