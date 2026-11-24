<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HandCoins,
  MoreHorizontal,
  PenLine,
  ReceiptText,
  Send,
  TrendingDown,
  TrendingUp,
  Undo2,
  UserRound,
  Wallet,
} from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrencyBR, formatDateToPtBR, formatPaymentMethodLabel } from '@/utils/formatters'
import type { ParcelaAcompanhamento } from './parcelaAcompanhamento'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  parcela: ParcelaAcompanhamento
  podeGerarCobranca?: boolean
  podeEnviarWhatsapp?: boolean
}>()
const emit = defineEmits<{
  efetivar: [parcela: ParcelaAcompanhamento]
  estornar: [id: number]
  editar: [parcela: ParcelaAcompanhamento]
  gerarCobranca: [parcela: ParcelaAcompanhamento]
  abrirCobranca: [url: string]
  enviarWhatsapp: [parcela: ParcelaAcompanhamento]
  ignorar: [parcela: ParcelaAcompanhamento, ignorado: boolean]
}>()

const receita = computed(() => props.parcela.tipo === 'RECEITA')
const statusLabel = computed(() =>
  props.parcela.status === 'PAGO'
    ? receita.value
      ? 'Recebido'
      : 'Pago'
    : props.parcela.status === 'ATRASADO'
      ? 'Em atraso'
      : 'Pendente',
)
const podeGerar = computed(
  () =>
    props.podeGerarCobranca && receita.value && !props.parcela.pago && !props.parcela.cobrancaLink,
)
const referencia = computed(() =>
  props.parcela.numero === 0
    ? 'Entrada'
    : `Parcela ${props.parcela.numero} de ${props.parcela.totalParcelas || props.parcela.numero || 1}`,
)
</script>

<template>
  <ModalView
    v-model:open="open"
    :title="parcela.descricao || 'Detalhes da parcela'"
    size="xl"
    content-class="max-h-[92dvh] overflow-hidden gap-0"
    header-class="px-6 pt-6 pb-0"
    body-class="min-h-0 overflow-y-auto px-6 py-5"
  >
    <template #title>
      <span class="min-w-0 space-y-2 text-left">
        <span class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ReceiptText class="size-4 shrink-0" aria-hidden="true" /> Detalhes da parcela
        </span>
        <span
          class="block break-words text-xl font-semibold leading-snug tracking-tight text-foreground"
        >
          {{ parcela.descricao }}
        </span>
      </span>
    </template>

    <div class="space-y-5">
      <section
        aria-label="Valor e situação da parcela"
        class="rounded-xl border bg-muted/20 p-4 sm:p-5"
      >
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            class="gap-1.5 border-transparent text-xs font-medium"
            :class="
              receita
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            "
          >
            <component
              :is="receita ? TrendingUp : TrendingDown"
              class="size-3.5"
              aria-hidden="true"
            />
            {{ receita ? 'Receita' : 'Despesa' }}
          </Badge>
          <Badge
            variant="outline"
            class="gap-1.5 border-transparent text-xs font-medium"
            :class="
              parcela.status === 'PAGO'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : parcela.status === 'ATRASADO'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            "
          >
            <component
              :is="parcela.status === 'PAGO' ? CheckCircle2 : Clock3"
              class="size-3.5"
              aria-hidden="true"
            />
            {{ statusLabel }}
          </Badge>
        </div>
        <div class="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
          <div>
            <p class="mb-1 text-xs font-medium text-muted-foreground">Valor da parcela</p>
            <p
              class="whitespace-nowrap text-3xl font-semibold leading-tight tracking-tight tabular-nums"
              :class="[
                receita
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
                parcela.ignorado && 'line-through opacity-70',
              ]"
            >
              {{ receita ? '+' : '−' }}{{ formatCurrencyBR(parcela.valor) }}
            </p>
          </div>
          <div class="min-w-0 pb-0.5 sm:text-right">
            <p class="text-sm font-medium text-foreground">{{ referencia }}</p>
            <p v-if="parcela.uid" class="mt-1 break-all text-xs text-muted-foreground">
              {{ parcela.uid }}
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="parcela.ignorado || parcela.contaIgnoradaNosCalculos"
        class="flex items-start gap-2.5 rounded-lg border bg-muted/20 p-3 text-sm"
      >
        <EyeOff class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div>
          <p class="font-medium">
            {{ parcela.ignorado ? 'Ignorado nos cálculos' : 'Conta fora dos cálculos gerais' }}
          </p>
          <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {{ parcela.ignorado
              ? 'Esta parcela fica fora dos totais e saldos.'
              : 'Esta parcela compõe o saldo da conta quando paga e fica fora dos totais gerais.' }}
          </p>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-x-5 gap-y-5 py-1">
        <div class="min-w-0">
          <dt class="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays class="size-4 shrink-0" aria-hidden="true" /> Vencimento
          </dt>
          <dd class="text-sm font-medium tabular-nums">
            {{ formatDateToPtBR(parcela.vencimento) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText class="size-4 shrink-0" aria-hidden="true" /> Categoria
          </dt>
          <dd class="break-words text-sm font-medium leading-relaxed">
            <EntityLink kind="categoria" :record-id="parcela.categoriaId" :label="parcela.categoria || 'Não informada'" />
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet class="size-4 shrink-0" aria-hidden="true" /> Conta financeira
          </dt>
          <dd class="break-words text-sm font-medium leading-relaxed">
            <EntityLink kind="conta" :record-id="parcela.contaFinanceiraId" :label="parcela.conta || 'Não informada'" />
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <HandCoins class="size-4 shrink-0" aria-hidden="true" /> Pagamento
          </dt>
          <dd class="space-y-0.5 text-sm">
            <p class="font-medium tabular-nums">
              {{ parcela.dataPagamento ? formatDateToPtBR(parcela.dataPagamento) : 'Pendente' }}
            </p>
            <p
              v-if="parcela.formaPagamento"
              class="break-words text-xs leading-relaxed text-muted-foreground"
            >
              {{ formatPaymentMethodLabel(parcela.formaPagamento) }}
            </p>
          </dd>
        </div>
        <div v-if="parcela.cliente" class="col-span-2 min-w-0 border-t pt-4">
          <dt class="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <UserRound class="size-4 shrink-0" aria-hidden="true" /> Cliente / fornecedor
          </dt>
          <dd class="break-words text-sm font-medium leading-relaxed"><EntityLink kind="cliente" :record-id="parcela.clienteId" :label="parcela.cliente" /></dd>
        </div>
      </dl>

      <div
        v-if="parcela.cobrancaLink || podeGerar"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
      >
        <div class="flex items-center gap-2 text-sm">
          <CircleDollarSign class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>{{ parcela.cobrancaLink ? 'Cobrança disponível' : 'Cobrança desta parcela' }}</span>
        </div>
        <Button
          v-if="parcela.cobrancaLink"
          type="button"
          variant="outline"
          size="sm"
          class="gap-2"
          @click="emit('abrirCobranca', parcela.cobrancaLink)"
        >
          Abrir cobrança <ExternalLink class="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          v-else
          type="button"
          variant="outline"
          size="sm"
          class="gap-2"
          @click="emit('gerarCobranca', parcela)"
        >
          <CircleDollarSign class="size-3.5" aria-hidden="true" /> Gerar cobrança
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              class="w-full justify-start gap-2 px-2 text-muted-foreground sm:w-auto"
              aria-label="Mais ações da parcela"
            >
              <MoreHorizontal class="size-4" aria-hidden="true" /><span>Mais ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="min-w-56">
            <DropdownMenuItem v-if="!parcela.pago" as-child>
              <RouterLink
                :to="`/financeiro/detalhes?id=${parcela.id}`"
                class="min-h-10"
                @click="open = false"
              >
                <ArrowUpRight aria-hidden="true" /> Gerenciar lançamento
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              class="min-h-10"
              @select="emit('ignorar', parcela, !parcela.ignorado)"
            >
              <component :is="parcela.ignorado ? Eye : EyeOff" aria-hidden="true" />
              {{ parcela.ignorado ? 'Reativar nos cálculos' : 'Ignorar nos cálculos' }}
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="podeEnviarWhatsapp && !parcela.pago"
              class="min-h-10"
              @select="emit('enviarWhatsapp', parcela)"
            >
              <Send aria-hidden="true" /> Enviar pelo WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <RouterLink to="/financeiro/contas" class="min-h-10" @click="open = false"
                ><Wallet aria-hidden="true" /> Ver contas financeiras</RouterLink
              >
            </DropdownMenuItem>
            <template v-if="parcela.pago">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="min-h-10 text-amber-700 focus:text-amber-800 dark:text-amber-400 dark:focus:text-amber-300"
                @select="emit('estornar', parcela.parcelaId)"
              >
                <Undo2 aria-hidden="true" /> Estornar pagamento
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
        <div class="flex flex-1 items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            class="flex-1 gap-2 sm:flex-none"
            @click="emit('editar', parcela)"
            ><PenLine class="size-4" aria-hidden="true" /> Editar</Button
          >
          <Button v-if="parcela.pago" as-child class="flex-1 gap-2 sm:flex-none">
            <RouterLink :to="`/financeiro/detalhes?id=${parcela.id}`" @click="open = false"
              >Gerenciar <ArrowUpRight class="size-4" aria-hidden="true"
            /></RouterLink>
          </Button>
          <Button
            v-else
            type="button"
            class="flex-1 gap-2 sm:flex-none"
            @click="emit('efetivar', parcela)"
          >
            <CheckCircle2 class="size-4" aria-hidden="true" /> {{ receita ? 'Receber' : 'Pagar' }}
          </Button>
        </div>
      </div>
    </template>
  </ModalView>
</template>
