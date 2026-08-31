<script setup lang="ts">
import { computed } from 'vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  RestauranteLocalizacao,
  RestaurantePedido,
  RestaurantePedidoStatus,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR, formatPaymentMethodLabel } from '@/utils/formatters'
import { MapPinned, MapPin, MessageCircle, Pencil, Phone, ShoppingBag } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  pedido: RestaurantePedido | null
  localizacaoEmpresa?: RestauranteLocalizacao | null
  podeAbrirChat?: boolean
  abrindoChat?: boolean
  podeEditarCliente?: boolean
  podeEditarItens?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'abrir-rota': [pedido: RestaurantePedido]
  'abrir-chat': [pedido: RestaurantePedido]
  'editar-cliente': [pedido: RestaurantePedido]
  'editar-itens': [pedido: RestaurantePedido]
}>()

const itens = computed(() => (Array.isArray(props.pedido?.itens) ? props.pedido.itens : []))
const podeAbrirChat = computed(
  () => props.podeAbrirChat && Boolean(props.pedido?.clienteTelefone?.trim()),
)

const statusLabels: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

const statusBadgeClasses: Record<RestaurantePedidoStatus, string> = {
  RECEBIDO:
    'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-200',
  CONFIRMADO:
    'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300',
  EM_PREPARO:
    'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300',
  PRONTO:
    'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300',
  CONCLUIDO:
    'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-300',
  CANCELADO:
    'border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/15 dark:text-red-300',
}

function dataHora(value?: string | null) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function origemLabel(origem: string) {
  return origem.replace(/_/g, ' ')
}

function aguardandoPagamentoOnline(pedido: RestaurantePedido) {
  return (
    pedido.pagamentoStatus === 'PENDENTE' &&
    ['PIX', 'CHECKOUT_PRO'].includes(pedido.pagamentoMetodoSnapshot || '')
  )
}

function enderecoFormatado(pedido: RestaurantePedido) {
  const endereco = pedido.enderecoSnapshotJson
  if (!endereco) return ''
  return [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.complemento,
    endereco.bairro,
    [endereco.cidade, endereco.uf].filter(Boolean).join(' - '),
    endereco.cep,
    endereco.referencia ? `Ref.: ${endereco.referencia}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function hasCustomerCoordinates(pedido: RestaurantePedido) {
  const endereco = pedido.enderecoSnapshotJson
  return Number.isFinite(endereco?.latitude) && Number.isFinite(endereco?.longitude)
}

function selecoes(item: RestaurantePedido['itens'][number]) {
  if (!Array.isArray(item.selecoesSnapshotJson)) return ''
  return item.selecoesSnapshotJson
    .map((selecao) => selecao.nome)
    .filter(Boolean)
    .join(', ')
}

function abrirChat() {
  if (props.pedido) emit('abrir-chat', props.pedido)
}

function editarCliente() {
  if (props.pedido) emit('editar-cliente', props.pedido)
}

function editarItens() {
  if (props.pedido) emit('editar-itens', props.pedido)
}
</script>

<template>
  <ModalView
    :open="props.open"
    :title="props.pedido ? `Pedido ${props.pedido.codigo}` : 'Detalhes do pedido'"
    :description="props.pedido ? `Recebido em ${dataHora(props.pedido.createdAt)}` : undefined"
    size="3xl"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="props.pedido" class="space-y-5 p-4">
      <section class="rounded-xl border bg-muted/30 p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resumo do pedido
            </p>
            <p class="mt-1 text-xl font-semibold">#{{ props.pedido.codigo }}</p>
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <Badge variant="outline" :class="statusBadgeClasses[props.pedido.status]">
              {{ statusLabels[props.pedido.status] }}
            </Badge>
            <Badge variant="secondary">{{ origemLabel(props.pedido.origem) }}</Badge>
          </div>
        </div>
        <div
          class="mt-4 grid divide-y border-t pt-3 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <div class="pb-3 sm:px-3 sm:pb-0 sm:pl-0">
            <p class="text-xs text-muted-foreground">Recebido em</p>
            <p class="mt-1 font-medium">{{ dataHora(props.pedido.createdAt) }}</p>
          </div>
          <div class="py-3 sm:px-3 sm:py-0">
            <p class="text-xs text-muted-foreground">Itens</p>
            <p class="mt-1 font-medium">
              {{ itens.length }}
              {{ itens.length === 1 ? 'item' : 'itens' }}
            </p>
          </div>
          <div class="pt-3 sm:px-3 sm:pt-0">
            <p class="text-xs text-muted-foreground">Total</p>
            <p class="mt-1 text-base font-semibold">
              {{ formatCurrencyBR(Number(props.pedido.total)) }}
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-3 sm:grid-cols-2">
        <section class="rounded-xl border p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              ><Phone class="h-4 w-4"
            /></span>
            <p class="text-sm font-semibold">Cliente</p>
            </div>
            <Button
              v-if="props.podeEditarCliente"
              size="sm"
              variant="ghost"
              class="h-8 px-2"
              @click="editarCliente"
            >
              <Pencil class="mr-1.5 h-3.5 w-3.5" />Editar
            </Button>
          </div>
          <p class="mt-3 font-medium">
            {{ props.pedido.clienteNomeSnapshot || 'Cliente visitante' }}
          </p>
          <p
            v-if="props.pedido.clienteTelefone"
            class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Phone class="h-3.5 w-3.5" />{{ props.pedido.clienteTelefone }}
          </p>
          <p v-if="props.pedido.clienteEmail" class="mt-1 text-sm text-muted-foreground">
            {{ props.pedido.clienteEmail }}
          </p>
          <Button
            v-if="podeAbrirChat"
            class="mt-3"
            size="sm"
            variant="outline"
            :disabled="props.abrindoChat"
            @click="abrirChat"
          >
            <MessageCircle class="mr-1.5 h-4 w-4" />
            {{ props.abrindoChat ? 'Abrindo chat…' : 'Abrir chat' }}
          </Button>
        </section>

        <section class="rounded-xl border p-4">
          <p class="text-sm font-semibold">Pagamento e atendimento</p>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Método</span
              ><span class="text-right font-medium">{{
                formatPaymentMethodLabel(props.pedido.pagamentoMetodoSnapshot)
              }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Situação</span
              ><span class="text-right font-medium">{{
                aguardandoPagamentoOnline(props.pedido)
                  ? 'Aguardando pagamento online'
                  : formatPaymentMethodLabel(props.pedido.pagamentoStatus)
              }}</span>
            </div>
            <div
              v-if="props.pedido.pagamentoMetodoSnapshot === 'DINHEIRO' && props.pedido.trocoParaSnapshot"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-muted-foreground">Troco para</span><span class="text-right font-medium">{{ formatCurrencyBR(Number(props.pedido.trocoParaSnapshot)) }}</span>
            </div>
            <div
              v-if="props.pedido.Mesa?.nome"
              class="flex items-center justify-between gap-3 border-t pt-2"
            >
              <span class="text-muted-foreground">Mesa</span
              ><span class="font-medium">{{ props.pedido.Mesa.nome }}</span>
            </div>
          </div>
        </section>
      </div>

      <section v-if="enderecoFormatado(props.pedido)" class="rounded-xl border p-4">
        <p class="flex items-center gap-2 text-sm font-semibold">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            ><MapPin class="h-4 w-4" /></span
          >Endereço de entrega
        </p>
        <p class="mt-3 text-sm">{{ enderecoFormatado(props.pedido) }}</p>
        <Button
          v-if="props.localizacaoEmpresa && hasCustomerCoordinates(props.pedido)"
          class="mt-3"
          size="sm"
          variant="outline"
          @click="emit('abrir-rota', props.pedido)"
          ><MapPinned class="mr-1.5 h-4 w-4" />Traçar rota até o cliente</Button
        >
        <p v-else class="mt-2 text-xs text-muted-foreground">
          A rota no mapa fica disponível quando a localização do cliente é enviada no checkout.
        </p>
      </section>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <section class="overflow-hidden rounded-xl border">
            <div class="flex items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3 text-sm font-semibold">
              <span class="flex items-center gap-2"><ShoppingBag class="h-4 w-4 text-muted-foreground" />Itens do pedido</span>
              <Button
                v-if="props.podeEditarItens"
                size="sm"
                variant="ghost"
                class="h-8 px-2"
                @click="editarItens"
              >
                <Pencil class="mr-1.5 h-3.5 w-3.5" />Editar
              </Button>
            </div>
          <div class="divide-y">
            <div v-for="item in itens" :key="item.id" class="flex gap-3 px-4 py-3">
              <div class="min-w-0 flex-1">
                <p class="font-medium">{{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}</p>
                <p v-if="item.tamanhoSnapshot" class="mt-0.5 text-sm text-muted-foreground">
                  {{ item.tamanhoSnapshot }}
                </p>
                <p v-if="selecoes(item)" class="mt-0.5 text-sm text-muted-foreground">
                  {{ selecoes(item) }}
                </p>
                <p v-if="item.observacao" class="mt-1 text-sm text-muted-foreground">
                  Obs.: {{ item.observacao }}
                </p>
              </div>
              <strong class="shrink-0 text-sm">{{
                formatCurrencyBR(Number(item.subtotalSnapshot))
              }}</strong>
            </div>
          </div>
        </section>

        <section class="h-fit rounded-xl border bg-muted/20 p-4 text-sm">
          <p class="font-semibold">Resumo financeiro</p>
          <div class="mt-3 space-y-2">
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground">Subtotal</span
              ><span>{{ formatCurrencyBR(Number(props.pedido.subtotal)) }}</span>
            </div>
            <div v-if="Number(props.pedido.frete)" class="flex justify-between gap-3">
              <span class="text-muted-foreground">Entrega</span
              ><span>{{ formatCurrencyBR(Number(props.pedido.frete)) }}</span>
            </div>
            <div
              v-if="Number(props.pedido.desconto)"
              class="flex justify-between gap-3 text-emerald-700 dark:text-emerald-400"
            >
              <span>Desconto</span
              ><span>- {{ formatCurrencyBR(Number(props.pedido.desconto)) }}</span>
            </div>
          </div>
          <div class="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span><span>{{ formatCurrencyBR(Number(props.pedido.total)) }}</span>
          </div>
        </section>
      </div>

      <section v-if="props.pedido.observacao" class="rounded-xl border border-dashed p-4">
        <p class="text-sm font-semibold">Observação do pedido</p>
        <p class="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {{ props.pedido.observacao }}
        </p>
      </section>

      <slot name="actions" :pedido="props.pedido" />
    </div>
  </ModalView>
</template>
