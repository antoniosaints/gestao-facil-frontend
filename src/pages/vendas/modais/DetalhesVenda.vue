<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { addDays } from 'date-fns'
import { useToast } from 'vue-toastification'
import {
  BadgeCheck,
  BanknoteArrowDown,
  CircleDollarSign,
  CircleX,
  Copy,
  ExternalLink,
  FileClock,
  FileText,
  FlagTriangleRight,
  Inbox,
  Loader,
  MessageCircleMore,
  MoreVertical,
  Package,
  PenLine,
  Percent,
  Printer,
  RefreshCcw,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Undo2,
  UserRound,
  Wallet,
} from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { useConfirm } from '@/composables/useConfirm'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { VendaRepository } from '@/repositories/venda-repository'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useUiStore } from '@/stores/ui/uiStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR, formatPaymentMethodLabel } from '@/utils/formatters'
import {
  deletarVenda,
  editarVenda,
  enviarComprovanteVenda,
  gerarCupomVenda,
  openModalFaturarVenda,
} from '../ActionsVendas'

type BadgeColor = 'cyan' | 'yellow' | 'gray' | 'violet' | 'purple' | 'green' | 'emerald' | 'orange' | 'red' | 'blue'

/// Faturar, editar, comprovante e cobrança abrem modais que pertencem à tela
/// hospedeira. A tela declara o que monta para não sobrar botão que não faz nada
/// — as demais ações (cupom, impressão, estorno, exclusão) são autossuficientes.
type AcaoHost = 'faturar' | 'editar' | 'comprovante' | 'cobranca'

const props = withDefaults(
  defineProps<{ acoesHost?: AcaoHost[] }>(),
  { acoesHost: () => [] },
)

function hostSuporta(acao: AcaoHost) {
  return props.acoesHost.includes(acao)
}

const store = useVendasStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()
const toast = useToast()
const router = useRouter()

const venda = computed(() => store.venda ?? null)
const itens = computed(() => venda.value?.ItensVendas ?? [])
const cobrancas = computed(() => venda.value?.CobrancasFinanceiras ?? [])
const lancamentosFinanceiros = computed(() => venda.value?.LancamentoFinanceiro || [])

const subtotal = computed(() =>
  itens.value.reduce((acc, item) => acc + Number(item.quantidade || 0) * Number(item.valor || 0), 0),
)
const desconto = computed(() => Number(venda.value?.desconto || 0))
const total = computed(() => subtotal.value - desconto.value)
const quantidadeItens = computed(() =>
  itens.value.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
)
const percentualDesconto = computed(() =>
  subtotal.value > 0 ? (desconto.value / subtotal.value) * 100 : 0,
)

const isFaturada = computed(() => venda.value?.status === 'FATURADO')

// Venda faturada é um registro fechado: editar refaria itens e estoque já baixados,
// e cobrar de novo duplicaria o recebimento. O caminho é estornar antes.
const podeEditar = computed(() => hostSuporta('editar') && !isFaturada.value)
const podeCobrar = computed(() => hostSuporta('cobranca') && uiStore.canCreateCharge && !isFaturada.value)
const metodoPagamento = computed(() =>
  venda.value?.PagamentoVendas?.metodo ? formatPaymentMethodLabel(venda.value.PagamentoVendas.metodo) : null,
)

// Mesmo mapeamento de cor/ícone da coluna de status da tabela de vendas.
const statusMeta = computed((): { label: string; color: BadgeColor; icon: typeof FileClock } => {
  switch (venda.value?.status) {
    case 'PENDENTE':
      return { label: 'Pendente', color: 'yellow', icon: FileClock }
    case 'CANCELADO':
      return { label: 'Cancelado', color: 'red', icon: CircleX }
    case 'FINALIZADO':
      return { label: 'Finalizado', color: 'purple', icon: BadgeCheck }
    case 'ANDAMENTO':
      return { label: 'Em andamento', color: 'blue', icon: Loader }
    case 'FATURADO':
      return { label: 'Faturado', color: 'green', icon: BanknoteArrowDown }
    default:
      return { label: venda.value?.status || 'Sem status', color: 'gray', icon: FlagTriangleRight }
  }
})

const indicadores = computed(() => [
  {
    label: 'Total da venda',
    valor: formatCurrencyBR(total.value),
    detalhe: desconto.value > 0 ? `${formatCurrencyBR(desconto.value)} de desconto` : 'Sem desconto',
    icon: CircleDollarSign,
    classe: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    label: 'Itens',
    valor: String(quantidadeItens.value),
    detalhe: `${itens.value.length} linha(s) na venda`,
    icon: ShoppingBag,
    classe: 'text-blue-600 bg-blue-500/10',
  },
  {
    label: 'Pagamento',
    valor: metodoPagamento.value || 'Não informado',
    detalhe: isFaturada.value ? 'Venda faturada' : 'Aguardando faturamento',
    icon: Wallet,
    classe: 'text-violet-600 bg-violet-500/10',
  },
  {
    label: 'Desconto',
    valor: formatCurrencyBR(desconto.value),
    detalhe: desconto.value > 0 ? `${percentualDesconto.value.toFixed(1)}% do subtotal` : 'Nenhum aplicado',
    icon: Percent,
    classe: 'text-amber-600 bg-amber-500/10',
  },
])

// A garantia só faz sentido quando há prazo E data de venda válida.
const garantiaLabel = computed(() => {
  const dias = Number(venda.value?.garantia || 0)
  if (!dias) return 'Sem garantia'

  const base = venda.value?.data ? new Date(venda.value.data) : null
  if (!base || Number.isNaN(base.getTime())) return `${dias} dia(s)`

  return `${dias} dia(s) • até ${addDays(base, dias).toLocaleDateString('pt-BR')}`
})

function formatDate(value?: Date | string | null, comHora = false) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return comHora ? date.toLocaleString('pt-BR') : date.toLocaleDateString('pt-BR')
}

function getItemMeta(item: any) {
  return item.servico
    ? { label: 'Serviço', color: 'yellow' as BadgeColor, icon: ShieldCheck }
    : { label: 'Produto', color: 'emerald' as BadgeColor, icon: Package }
}

function getParcelasPendentes(lancamento: any) {
  const parcelas = Array.isArray(lancamento.parcelas) ? lancamento.parcelas : []
  const pendentes = parcelas.filter((parcela: any) => !parcela.pago)
  return pendentes.length ? pendentes : parcelas
}

function copiarUid() {
  navigator.clipboard.writeText(venda.value?.Uid ?? '')
  toast.success('ID da venda copiado.')
}

async function recarregar() {
  if (!store.idMutation) return
  await store.openDetalhes(store.idMutation)
}

function abrirCobranca() {
  if (!venda.value?.id) return
  storeCobranca.openSave({ id: venda.value.id, tipo: 'venda', valor: total.value })
}

function abrirLancamentoFinanceiro(id?: number) {
  if (!id) return
  store.openModalDetalhes = false
  router.push({ path: '/financeiro/detalhes', query: { id } })
}

async function excluirLancamentoFinanceiro(id?: number) {
  if (!id) return

  const confirmado = await useConfirm().confirm({
    title: 'Excluir lançamento financeiro',
    message: 'Deseja excluir o lançamento financeiro vinculado a esta venda?',
    confirmText: 'Sim, excluir',
  })

  if (!confirmado) return

  try {
    await LancamentosRepository.remove(id)
    toast.success('Lançamento financeiro excluído com sucesso')
    store.updateTable()
    await recarregar()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir o lançamento financeiro')
  }
}

function faturar() {
  if (!venda.value?.id) return
  store.openModalDetalhes = false
  openModalFaturarVenda(venda.value.id)
}

async function estornar() {
  if (!venda.value?.id) return

  const confirmado = await useConfirm().confirm({
    title: 'Estornar venda',
    message: 'O faturamento será desfeito e a venda volta para pendente. Deseja continuar?',
    confirmText: 'Sim, estornar',
  })

  if (!confirmado) return

  try {
    await VendaRepository.estornar(venda.value.id)
    toast.success('Venda estornada com sucesso')
    store.updateTable()
    await recarregar()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao estornar a venda')
  }
}

async function editar() {
  if (!venda.value?.id) return
  const id = venda.value.id
  store.openModalDetalhes = false
  await editarVenda(id)
}

async function imprimirCupom() {
  if (!venda.value?.id) return
  try {
    await VendaRepository.printCupom(venda.value.id)
    toast.success('Cupom enviado para impressão.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao imprimir o cupom.')
  }
}

function enviarComprovante() {
  if (!venda.value) return
  enviarComprovanteVenda(venda.value as any)
}

async function excluir() {
  if (!venda.value?.id) return
  const id = venda.value.id
  await deletarVenda(id)
  store.openModalDetalhes = false
}

watch(() => storeCobranca.filters.update, recarregar)
</script>

<template>
  <ModalView v-model:open="store.openModalDetalhes" size="4xl" title="Detalhes da venda"
    description="Resumo, itens, cobranças e financeiro vinculados à venda.">
    <div v-if="venda" class="grid gap-3 px-3 pb-4 md:gap-4 md:px-4">
      <!-- Identificação da venda -->
      <header class="rounded-xl border bg-card p-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="flex min-w-0 gap-3">
            <div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-lg font-semibold">#{{ venda.Uid || venda.id }}</h3>
                <BadgeCell :label="statusMeta.label" :color="statusMeta.color" :icon="statusMeta.icon"
                  :capitalize="false" size="sm" />
                <button type="button" class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] hover:bg-muted/50"
                  @click="copiarUid">
                  <Copy class="h-3 w-3" /> Copiar ID
                </button>
              </div>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">
                {{ venda.cliente?.nome || 'Cliente não informado' }} • {{ formatDate(venda.data) }}
              </p>
            </div>
          </div>

          <div class="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button v-if="!isFaturada && hostSuporta('faturar')" type="button" class="w-full text-white sm:w-auto"
              @click="faturar">
              <ReceiptText class="h-4 w-4" /> Faturar
            </Button>
            <Button v-else-if="isFaturada" type="button"
              class="w-full bg-warning text-white hover:bg-warning/80 sm:w-auto" @click="estornar">
              <Undo2 class="h-4 w-4" /> Estornar
            </Button>
            <Button type="button" variant="outline" class="w-full sm:w-auto"
              @click="gerarCupomVenda(venda.id!)">
              <FileText class="h-4 w-4" /> Cupom
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button type="button" variant="outline" class="w-full sm:w-auto">
                  <MoreVertical class="h-4 w-4" /> Mais ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuItem v-if="podeEditar" @click="editar">
                  <PenLine class="mr-2 h-4 w-4 text-violet-500" /> Editar venda
                </DropdownMenuItem>
                <DropdownMenuItem @click="imprimirCupom">
                  <Printer class="mr-2 h-4 w-4 text-blue-500" /> Imprimir cupom
                </DropdownMenuItem>
                <DropdownMenuItem v-if="hostSuporta('comprovante')" @click="enviarComprovante">
                  <MessageCircleMore class="mr-2 h-4 w-4 text-emerald-500" /> Enviar comprovante
                </DropdownMenuItem>
                <DropdownMenuItem v-if="podeCobrar" @click="abrirCobranca">
                  <CircleDollarSign class="mr-2 h-4 w-4 text-emerald-500" /> Gerar cobrança
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="recarregar">
                  <RefreshCcw class="mr-2 h-4 w-4 text-cyan-500" /> Atualizar dados
                </DropdownMenuItem>
                <DropdownMenuItem v-if="!isFaturada" class="text-red-600 focus:text-red-600" @click="excluir">
                  <Trash2 class="mr-2 h-4 w-4" /> Excluir venda
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Contexto da operação -->
        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <div class="flex items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <UserRound class="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p class="truncate text-xs font-semibold">{{ venda.cliente?.nome || 'Não informado' }}</p>
              <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                Vendedor: {{ venda.vendedor?.nome || 'Não informado' }}
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <Wallet class="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Pagamento</p>
              <p class="truncate text-xs font-semibold">{{ metodoPagamento || 'Não informado' }}</p>
              <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                Venda em {{ formatDate(venda.data, true) }}
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Garantia</p>
              <p class="truncate text-xs font-semibold">{{ garantiaLabel }}</p>
              <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                {{ cobrancas.length }} cobrança(s) gerada(s)
              </p>
            </div>
          </div>
        </div>
      </header>

      <!-- Indicadores -->
      <section class="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <div v-for="indicador in indicadores" :key="indicador.label" class="rounded-xl border bg-card p-3">
          <div class="flex items-center gap-2">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg" :class="indicador.classe">
              <component :is="indicador.icon" class="h-4 w-4" />
            </span>
            <p class="truncate text-[11px] font-medium text-muted-foreground">{{ indicador.label }}</p>
          </div>
          <p class="mt-2 truncate text-lg font-bold tabular-nums">{{ indicador.valor }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ indicador.detalhe }}</p>
        </div>
      </section>

      <!-- Itens da venda -->
      <section class="rounded-xl border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Package class="h-4 w-4 shrink-0 text-primary" />
          <h3 class="text-sm font-semibold">Itens da venda</h3>
          <Badge variant="outline" class="ml-auto tabular-nums">{{ itens.length }}</Badge>
        </div>

        <div v-if="!itens.length" class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <Inbox class="h-8 w-8 opacity-50" />
          Nenhum item registrado nesta venda.
        </div>

        <template v-else>
          <div class="overflow-hidden rounded-lg border">
            <div v-for="(item, index) in itens" :key="item.id ?? index"
              class="flex items-center justify-between gap-3 border-b bg-background pl-1 pr-3 py-1 text-sm last:border-b-0">
              <div class="flex min-w-0 items-center gap-3">
                <Popover v-if="item.produto?.imagem">
                  <PopoverTrigger as-child>
                    <button type="button"
                      class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/40 transition hover:ring-2 hover:ring-primary/40"
                      v-tooltip="'Ver imagem'">
                      <img :src="resolveFileUrl(item.produto.imagem)" :alt="item.produto?.nome || 'Produto'"
                        class="h-full w-full object-cover" loading="lazy" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" class="w-auto p-1.5">
                    <img :src="resolveFileUrl(item.produto.imagem)" :alt="item.produto?.nome || 'Produto'"
                      class="h-56 w-56 rounded-md object-contain" />
                    <p class="mt-1 max-w-56 truncate px-1 pb-0.5 text-center text-xs text-muted-foreground">
                      {{ item.produto?.nome }}
                    </p>
                  </PopoverContent>
                </Popover>
                <div v-else class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/40">
                  <component :is="getItemMeta(item).icon" class="h-5 w-5 text-muted-foreground" />
                </div>
                <div class="min-w-0">
                  <p class="truncate font-medium">
                    {{ item.produto?.nome || item.servico?.nome || item.itemName || 'Item' }}
                  </p>
                  <p class="text-xs tabular-nums text-muted-foreground">
                    {{ item.quantidade }} x {{ formatCurrencyBR(Number(item.valor || 0)) }}
                  </p>
                </div>
              </div>
              <strong class="shrink-0 tabular-nums">
                {{ formatCurrencyBR(Number(item.quantidade || 0) * Number(item.valor || 0)) }}
              </strong>
            </div>
          </div>

          <div class="mt-3 overflow-hidden rounded-lg border">
            <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="text-muted-foreground">Subtotal</span>
              <span class="font-medium tabular-nums">{{ formatCurrencyBR(subtotal) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
              <span class="text-muted-foreground">Desconto</span>
              <span class="font-medium tabular-nums" :class="desconto > 0 ? 'text-amber-600' : ''">
                {{ desconto > 0 ? '-' : '' }} {{ formatCurrencyBR(desconto) }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2.5 text-sm">
              <span class="font-semibold">Total</span>
              <strong class="tabular-nums">{{ formatCurrencyBR(total) }}</strong>
            </div>
          </div>
        </template>
      </section>

      <div class="grid gap-3 md:gap-4 lg:grid-cols-2">
        <!-- Cobranças -->
        <section class="rounded-xl border bg-card p-4">
          <div class="mb-3 flex items-center gap-2">
            <CircleDollarSign class="h-4 w-4 shrink-0 text-primary" />
            <h3 class="text-sm font-semibold">Cobranças</h3>
            <Badge variant="outline" class="ml-auto tabular-nums">{{ cobrancas.length }}</Badge>
          </div>

          <div v-if="cobrancas.length" class="grid gap-2">
            <div v-for="cobranca in cobrancas" :key="cobranca.id"
              class="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-2.5">
              <div class="min-w-0">
                <p class="text-sm font-semibold tabular-nums">
                  {{ formatCurrencyBR(Number(cobranca.valor || 0)) }}
                </p>
                <p class="truncate text-[11px] text-muted-foreground">
                  {{ cobranca.gateway }} • {{ cobranca.status }}
                </p>
              </div>
              <a v-if="cobranca.externalLink" :href="cobranca.externalLink" target="_blank"
                class="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400">
                Abrir
              </a>
            </div>
          </div>

          <div v-else class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Inbox class="h-8 w-8 opacity-50" />
            Nenhuma cobrança gerada para esta venda.
          </div>

          <Button v-if="podeCobrar" type="button" variant="outline" size="sm" class="mt-3 w-full"
            @click="abrirCobranca">
            <CircleDollarSign class="h-4 w-4 text-emerald-500" /> Gerar cobrança
          </Button>
          <p v-else-if="isFaturada && hostSuporta('cobranca')" class="mt-3 text-center text-[11px] text-muted-foreground">
            Venda já faturada — estorne o faturamento para gerar uma nova cobrança.
          </p>
        </section>

        <!-- Financeiro vinculado -->
        <section class="rounded-xl border bg-card p-4">
          <div class="mb-3 flex items-center gap-2">
            <ReceiptText class="h-4 w-4 shrink-0 text-primary" />
            <h3 class="text-sm font-semibold">Lançamentos financeiros</h3>
            <Badge variant="outline" class="ml-auto tabular-nums">{{ lancamentosFinanceiros.length }}</Badge>
          </div>

          <div v-if="lancamentosFinanceiros.length" class="grid gap-2">
            <div v-for="lancamento in lancamentosFinanceiros" :key="lancamento.id"
              class="rounded-lg border bg-background px-3 py-2.5">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">
                    {{ lancamento.descricao || `Lançamento #${lancamento.id}` }}
                  </p>
                  <p class="text-xs font-semibold tabular-nums text-muted-foreground">
                    {{ formatCurrencyBR(Number(lancamento.valorTotal || 0)) }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <Button type="button" size="icon" variant="outline" class="h-8 w-8"
                    v-tooltip="'Abrir detalhes do lançamento'" @click="abrirLancamentoFinanceiro(lancamento.id)">
                    <ExternalLink class="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="outline" class="h-8 w-8 text-rose-600 hover:text-rose-700"
                    v-tooltip="'Excluir lançamento'" @click="excluirLancamentoFinanceiro(lancamento.id)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div v-if="getParcelasPendentes(lancamento).length" class="mt-2 space-y-1 border-t pt-2">
                <div v-for="parcela in getParcelasPendentes(lancamento)" :key="parcela.id"
                  class="flex justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>Parcela {{ parcela.numero }} • vence {{ formatDate(parcela.vencimento) }}</span>
                  <span class="tabular-nums">{{ formatCurrencyBR(Number(parcela.valor || 0)) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Inbox class="h-8 w-8 opacity-50" />
            Nenhum lançamento financeiro vinculado.
          </div>
        </section>
      </div>

      <!-- Observações -->
      <section v-if="venda.observacoes" class="rounded-xl border bg-card p-4">
        <div class="mb-2 flex items-center gap-2">
          <FileText class="h-4 w-4 shrink-0 text-primary" />
          <h3 class="text-sm font-semibold">Observações</h3>
        </div>
        <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ venda.observacoes }}</p>
      </section>
    </div>

    <div v-else class="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
      <Inbox class="h-8 w-8 opacity-50" />
      Não foi possível carregar os dados desta venda.
    </div>

    <div class="flex justify-end gap-2 px-3 pb-2 md:px-4">
      <Button type="button" variant="secondary" @click="store.openModalDetalhes = false">
        Fechar
      </Button>
    </div>
  </ModalView>
</template>
