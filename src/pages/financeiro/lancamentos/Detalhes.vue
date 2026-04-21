<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  BadgeDollarSign,
  BadgeInfo,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Landmark,
  MoreVertical,
  PenLine,
  RotateCw,
  Tags,
  Trash2,
  Undo2,
  UserRound,
  Wallet,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useConfirm } from '@/composables/useConfirm'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useUiStore } from '@/stores/ui/uiStore'
import { goBack } from '@/hooks/links'
import router from '@/router'
import type {
  CategoriaFinanceiro,
  ClientesFornecedores,
  ContasFinanceiro,
  LancamentoFinanceiro,
  ParcelaFinanceiro,
} from '@/types/schemas'

import GerarCobranca from './modais/GerarCobranca.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import FormularioEfertivar from './modais/FormularioEfertivar.vue'
import ModalParcela from './modais/ModalParcela.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'

type ParcelaDetalhe = ParcelaFinanceiro & {
  ContaFinanceira?: ContasFinanceiro | null
}

type LancamentoDetalhe = LancamentoFinanceiro & {
  categoria?: CategoriaFinanceiro | null
  cliente?: ClientesFornecedores | null
  ContasFinanceiro?: ContasFinanceiro | null
  parcelas: ParcelaDetalhe[]
  createdAt?: string | Date
}

const route = useRoute()
const toast = useToast()
const store = useLancamentosStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()

const loading = ref(false)
const lancamento = ref<LancamentoDetalhe | null>(null)

function getRouteId() {
  const id = Number(route.query.id)
  if (!id || Number.isNaN(id)) {
    toast.error('ID de lançamento inválido')
    return null
  }
  return id
}

async function loadLancamento() {
  const id = getRouteId()
  if (!id) return

  try {
    loading.value = true
    const response = (await LancamentosRepository.get(id)) as { data: LancamentoDetalhe }
    lancamento.value = response.data
  } catch (error) {
    console.error(error)
    toast.error('Erro ao buscar o lançamento')
  } finally {
    loading.value = false
  }
}

const parcelasOrdenadas = computed(() => {
  if (!lancamento.value?.parcelas) return []
  return [...lancamento.value.parcelas].sort((a, b) => {
    const numeroA = a.numero ?? 0
    const numeroB = b.numero ?? 0
    if (numeroA !== numeroB) return numeroA - numeroB
    return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
  })
})

const valorTotal = computed(() =>
  parcelasOrdenadas.value.reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0),
)

const totalPago = computed(() =>
  parcelasOrdenadas.value
    .filter((parcela) => parcela.pago)
    .reduce((acc, parcela) => acc + Number(parcela.valorPago ?? parcela.valor ?? 0), 0),
)

const totalPendente = computed(() =>
  parcelasOrdenadas.value
    .filter((parcela) => !parcela.pago)
    .reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0),
)

const parcelasVencidas = computed(() => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return parcelasOrdenadas.value.filter((parcela) => {
    const vencimento = new Date(parcela.vencimento)
    vencimento.setHours(0, 0, 0, 0)
    return !parcela.pago && vencimento < hoje
  })
})

const proximaParcela = computed(() =>
  parcelasOrdenadas.value.find((parcela) => !parcela.pago) ?? null,
)

const resumoStatus = computed(() => {
  const status = lancamento.value?.status ?? 'PENDENTE'

  if (status === 'PAGO') {
    return {
      label: 'Quitado',
      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    }
  }

  if (status === 'ATRASADO') {
    return {
      label: 'Atrasado',
      classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    }
  }

  if (status === 'PARCIAL') {
    return {
      label: 'Parcial',
      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    }
  }

  return {
    label: 'Pendente',
    classes: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  }
})

function getTipoClasses(tipo?: string) {
  return tipo === 'DESPESA'
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
}

function copiarUid() {
  navigator.clipboard.writeText(lancamento.value?.Uid ?? '')
  toast.success('UID copiado para a área de transferência')
}

function editarParcela(parcela: ParcelaDetalhe) {
  store.idMutation = parcela.id!
  store.formParcela = {
    valor: parcela.valor,
    vencimento: new Date(parcela.vencimento),
    vencimentoOriginal: new Date(parcela.vencimento),
    numero: parcela.numero,
    pago: parcela.pago,
    escopo: 'ATUAL',
  }
  store.openModalParcela = true
}

function efetivarParcela(id: number) {
  store.idMutation = id
  store.openModalEfetivar = true
}

async function estornarParcela(id: number) {
  try {
    await LancamentosRepository.estornarParcela(id)
    toast.success('Parcela estornada com sucesso')
    loadLancamento()
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a parcela')
  }
}

function gerarCobrancaFatura() {
  const primeiraPendente = parcelasOrdenadas.value.find((parcela) => !parcela.pago)

  if (!primeiraPendente?.id) {
    toast.info('Não existe parcela pendente para cobrança neste lançamento')
    return
  }

  storeCobranca.openSave({
    id: primeiraPendente.id,
    tipo: 'parcela',
    valor: Number(primeiraPendente.valor || 0),
  })
}

function gerarCobrancaParcela(idParcela: number, valor?: number) {
  storeCobranca.openSave({
    id: idParcela,
    tipo: 'parcela',
    valor,
  })
}

function openLinkCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
}

async function deletar(id: number) {
  const confirm = await useConfirm().confirm({
    title: 'Excluir lançamento',
    message: 'Tem certeza que deseja excluir este lançamento?',
    confirmText: 'Sim, excluir',
  })

  if (!confirm) return

  try {
    await LancamentosRepository.remove(id)
    store.updateTable()
    toast.success('Lançamento deletado com sucesso')
    router.back()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao deletar o lançamento')
  }
}

function getNumeroParcelaLabel(parcela: ParcelaDetalhe) {
  if (parcela.numero === 0) return 'Entrada'
  if (parcela.numero === 1 && parcelasOrdenadas.value.length === 1) return 'À vista'
  return `Parcela ${parcela.numero}`
}

onMounted(loadLancamento)
watch(() => storeCobranca.filters.update, loadLancamento)
watch(() => store.filters.update, loadLancamento)
</script>

<template>
  <div class="mx-auto space-y-4 pb-24 md:pb-0">
    <div
      class="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <Badge class="border-0" :class="getTipoClasses(lancamento?.tipo)">
            {{ lancamento?.tipo === 'DESPESA' ? 'Despesa' : 'Receita' }}
          </Badge>
          <Badge class="border-0" :class="resumoStatus.classes">
            {{ resumoStatus.label }}
          </Badge>
          <Badge v-if="lancamento?.vendaId" variant="outline">Lançamento automático</Badge>
        </div>
        <div>
          <h1 class="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground">
            <BadgeDollarSign class="h-5 w-5 text-primary dark:text-yellow-400" />
            {{ lancamento?.descricao || 'Detalhes do lançamento' }}
          </h1>
          <p class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>#{{ lancamento?.Uid || 'N/A' }}</span>
            <button type="button"
              class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-muted/50"
              @click="copiarUid">
              <Copy class="h-3.5 w-3.5" /> Copiar UID
            </button>
          </p>
        </div>
      </div>

      <div class="hidden flex-wrap items-center gap-2 md:flex">
        <Button variant="outline" @click="goBack">
          <ArrowLeft class="h-4 w-4" /> Voltar
        </Button>
        <Button variant="outline" @click="loadLancamento">
          <RotateCw class="h-4 w-4" :class="{ 'animate-spin': loading }" /> Atualizar
        </Button>
        <Button class="bg-success text-white hover:bg-success/80"
          :disabled="!parcelasOrdenadas.some((parcela) => !parcela.pago)" @click="gerarCobrancaFatura">
          <CircleDollarSign class="h-4 w-4" /> Gerar cobrança
        </Button>
        <Button variant="destructive" :disabled="!lancamento?.id" @click="deletar(lancamento?.id!)">
          <Trash2 class="h-4 w-4" /> Excluir
        </Button>
      </div>
    </div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Total lançado</CardDescription>
          <CardTitle class="text-2xl">{{ formatCurrencyBR(valorTotal) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">{{ parcelasOrdenadas.length }} parcela(s) vinculada(s)</p>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>{{ lancamento?.tipo === 'DESPESA' ? 'Total pago' : 'Total recebido' }}</CardDescription>
          <CardTitle class="text-2xl text-emerald-600">{{ formatCurrencyBR(totalPago) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{parcelasOrdenadas.filter((parcela) => parcela.pago).length}} parcela(s) efetivada(s)
          </p>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Em aberto</CardDescription>
          <CardTitle class="text-2xl text-amber-600">{{ formatCurrencyBR(totalPendente) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{parcelasOrdenadas.filter((parcela) => !parcela.pago).length}} parcela(s) pendente(s)
          </p>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Próximo passo</CardDescription>
          <CardTitle class="text-base md:text-lg">
            {{ proximaParcela ? getNumeroParcelaLabel(proximaParcela) : 'Sem pendências' }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="proximaParcela" class="text-sm text-muted-foreground">
            Vence em {{ formatDateToPtBR(proximaParcela.vencimento) }}
          </p>
          <p v-else class="text-sm text-muted-foreground">Todas as parcelas já foram concluídas.</p>
        </CardContent>
      </Card>
    </section>

    <div class="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <Card class="shadow-sm">
        <CardHeader class="p-4">
          <CardTitle class="flex items-center gap-2 text-lg">
            <BadgeInfo class="h-5 w-5 text-primary" /> Resumo operacional
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 px-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="mb-3 text-sm font-medium text-foreground">Classificação</p>
              <div class="space-y-2 text-sm text-muted-foreground">
                <p class="flex items-center gap-2">
                  <Tags class="h-4 w-4" /> Categoria: <span class="font-medium text-foreground">{{
                    lancamento?.categoria?.nome || 'Não informada' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Landmark class="h-4 w-4" /> Conta: <span class="font-medium text-foreground">{{
                    lancamento?.ContasFinanceiro?.nome || 'Não informada' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <UserRound class="h-4 w-4" /> Cliente: <span class="font-medium text-foreground">{{
                    lancamento?.cliente?.nome || 'Não informado' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Wallet class="h-4 w-4" /> Forma de pagamento padrão: <span class="font-medium text-foreground">{{
                    lancamento?.formaPagamento || 'Não informada' }}</span>
                </p>
              </div>
            </div>

            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="mb-3 text-sm font-medium text-foreground">Datas e recorrência</p>
              <div class="space-y-2 text-sm text-muted-foreground">
                <p class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4" /> Lançamento: <span class="font-medium text-foreground">{{
                    lancamento?.dataLancamento ? formatDateToPtBR(lancamento.dataLancamento) : 'N/A' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Clock3 class="h-4 w-4" /> Cadastro: <span class="font-medium text-foreground">{{
                    lancamento?.createdAt ? formatDateToPtBR(lancamento.createdAt, true) : 'N/A' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4" /> Entrada: <span class="font-medium text-foreground">{{
                    lancamento?.dataEntrada ? formatDateToPtBR(lancamento.dataEntrada) : 'Sem entrada' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <BadgeInfo class="h-4 w-4" /> Modelo: <span class="font-medium text-foreground">{{
                    lancamento?.recorrente ? 'Parcelado/recorrente' : 'Lançamento único' }}</span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <p class="text-sm text-muted-foreground">Desconto aplicado</p>
              <p class="text-base font-semibold text-foreground">{{ formatCurrencyBR(lancamento?.desconto || 0) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Parcelas vencidas</p>
              <p class="text-base font-semibold text-foreground">{{ parcelasVencidas.length }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Próxima parcela</p>
              <p class="text-base font-semibold text-foreground">
                {{ proximaParcela ? formatDateToPtBR(proximaParcela.vencimento) : 'Sem pendências' }}
              </p>
            </div>
          </div>

          <div class="rounded-xl border bg-muted/20 p-4">
            <p class="mb-2 text-sm font-medium text-foreground">Descrição</p>
            <p class="text-sm leading-relaxed text-muted-foreground">
              {{ lancamento?.descricao || 'Nenhuma descrição informada.' }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="p-4">
          <CardTitle class="text-lg">Panorama rápido</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3 px-4">
          <div class="rounded-xl border p-4">
            <p class="text-sm text-muted-foreground">Saldo do lançamento</p>
            <p class="text-xl font-semibold" :class="totalPendente > 0 ? 'text-amber-600' : 'text-emerald-600'">
              {{ formatCurrencyBR(totalPago - totalPendente) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Recebido/pago {{ formatCurrencyBR(totalPago) }} • em aberto {{ formatCurrencyBR(totalPendente) }}
            </p>
          </div>

          <div class="rounded-xl border p-4">
            <p class="text-sm text-muted-foreground">Cobranças geradas</p>
            <p class="text-xl font-semibold text-foreground">
              {{parcelasOrdenadas.filter((parcela) => parcela.CobrancasFinanceiras?.length).length}}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Parcelas com link de cobrança disponível.</p>
          </div>

          <div class="rounded-xl border p-4">
            <p class="text-sm text-muted-foreground">Risco atual</p>
            <p class="text-xl font-semibold" :class="parcelasVencidas.length ? 'text-rose-600' : 'text-emerald-600'">
              {{ parcelasVencidas.length ? `${parcelasVencidas.length} vencida(s)` : 'Sem atraso' }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Acompanhamento por parcela e conta financeira.</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="shadow-sm" v-if="parcelasOrdenadas.length">
      <CardHeader class="px-4 py-2">
        <CardTitle class="text-lg flex items-center gap-2">
          <BadgeInfo class="h-4 w-4" />
          Parcelas e cobranças
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2.5 px-4">
        <div v-for="parcela in parcelasOrdenadas" :key="parcela.id"
          class="relative overflow-hidden rounded-r-xl border bg-card px-3 py-1 shadow-sm">
          <div class="absolute left-0 top-0 h-full w-1"
            :class="lancamento?.tipo === 'DESPESA' ? 'bg-rose-500' : 'bg-emerald-500'" />

          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-1.5 pl-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-foreground flex items-center gap-1">
                    {{ formatCurrencyBR(parcela.valor || 0) }}
                  <span class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2 py-0 text-[10px] border border-border rounded-md">{{ getNumeroParcelaLabel(parcela) }}</span>
                    <Badge class="border-0 px-2 py-0 text-[10px]"
                      :class="parcela.pago ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : parcelasVencidas.some((item) => item.id === parcela.id) ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
                      {{parcela.pago ? 'Pago' : parcelasVencidas.some((item) => item.id === parcela.id) ? 'Atrasado' :
                      'Pendente' }}
                    </Badge>
                    <Badge v-if="parcela.CobrancasFinanceiras?.length" variant="outline" class="px-2 py-0 text-[10px]">
                      Cobrança</Badge>
                  </span>
                  </p>
                  <div class="flex items-center gap-1">
                    <p class="truncate text-xs text-muted-foreground">
                      Conta: {{ parcela.ContaFinanceira?.nome || lancamento?.ContasFinanceiro?.nome || 'Não informada' }}
                    </p>
                    -
                    <p class="truncate text-[11px] text-muted-foreground flex items-center">
                      Venc. {{ formatDateToPtBR(parcela.vencimento) }}
                      <span v-if="parcela.dataPagamento"> 
                        • Pgto {{ formatDateToPtBR(parcela.dataPagamento, true)}}
                      </span>
                      <span v-if="parcela.formaPagamento"> • {{ parcela.formaPagamento }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <div class="hidden items-center gap-1 md:flex">
                <Button v-if="!parcela.pago" variant="outline" size="icon" class="h-8 w-8" @click="editarParcela(parcela)">
                  <PenLine class="h-4 w-4" />
                </Button>
                <Button v-if="!parcela.pago && !parcela.CobrancasFinanceiras?.length" size="icon"
                  class="h-8 w-8 bg-success text-white hover:bg-success/80"
                  @click="gerarCobrancaParcela(parcela.id!, Number(parcela.valor || 0))">
                  <CircleDollarSign class="h-4 w-4" />
                </Button>
                <Button v-if="parcela.CobrancasFinanceiras?.length" variant="outline" size="icon" class="h-8 w-8"
                  @click="openLinkCobranca(parcela.CobrancasFinanceiras[0].externalLink)">
                  <ExternalLink class="h-4 w-4" />
                </Button>
                <Button v-if="!parcela.pago" size="icon" class="h-8 w-8 dark:text-white" :disabled="Boolean(lancamento?.vendaId)"
                  @click="efetivarParcela(parcela.id!)">
                  <CheckCircle2 class="h-4 w-4" />
                </Button>
                <Button v-else size="icon" class="h-8 w-8 bg-warning text-white hover:bg-warning/80"
                  :disabled="Boolean(lancamento?.vendaId)" @click="estornarParcela(parcela.id!)">
                  <Undo2 class="h-4 w-4" />
                </Button>
              </div>

              <DropdownMenu v-if="uiStore.isMobile">
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="icon" class="h-8 w-8">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuItem v-if="!parcela.pago" @click="editarParcela(parcela)">
                    <PenLine class="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="!parcela.pago" :disabled="Boolean(lancamento?.vendaId)"
                    @click="efetivarParcela(parcela.id!)">
                    <CheckCircle2 class="mr-2 h-4 w-4" /> {{ lancamento?.tipo === 'DESPESA' ? 'Pagar' : 'Receber' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem v-else :disabled="Boolean(lancamento?.vendaId)"
                    @click="estornarParcela(parcela.id!)">
                    <Undo2 class="mr-2 h-4 w-4" /> Estornar
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="!parcela.pago && !parcela.CobrancasFinanceiras?.length"
                    @click="gerarCobrancaParcela(parcela.id!, Number(parcela.valor || 0))">
                    <CircleDollarSign class="mr-2 h-4 w-4" /> Gerar cobrança
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="parcela.CobrancasFinanceiras?.length"
                    @click="openLinkCobranca(parcela.CobrancasFinanceiras[0].externalLink)">
                    <ExternalLink class="mr-2 h-4 w-4" /> Abrir cobrança
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="goBack"
      >
        <ArrowLeft class="h-5 w-5" />
        <span class="text-xs">Voltar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="loadLancamento"
      >
        <RotateCw class="h-5 w-5" :class="{ 'animate-spin': loading }" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300 disabled:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!parcelasOrdenadas.some((parcela) => !parcela.pago)"
        @click="gerarCobrancaFatura"
      >
        <CircleDollarSign class="h-5 w-5" />
        <span class="text-xs">Cobrar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-red-600 transition hover:text-red-500 disabled:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!lancamento?.id"
        @click="deletar(lancamento?.id!)"
      >
        <Trash2 class="h-5 w-5" />
        <span class="text-xs">Excluir</span>
      </button>
    </MobileBottomBar>

    <GerarCobranca />
    <ClientesModal />
    <ModalParcela />
    <FormularioEfertivar @success="loadLancamento" />
  </div>
</template>
