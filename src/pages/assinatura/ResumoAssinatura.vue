<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useToast } from "vue-toastification"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ContaRepository, type StatusConta, type StatusContaFatura } from "@/repositories/conta-repository"
import { useUiStore } from "@/stores/ui/uiStore"
import { formatCurrencyBR } from "@/utils/formatters"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileClock,
  LoaderCircle,
  Menu,
  PackagePlus,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-vue-next"

const storeUi = useUiStore()
const toast = useToast()

const assinatura = ref<StatusConta | null>(null)
const refresh = ref(false)
const generatingLink = ref(false)

const historicoFaturas = computed<StatusContaFatura[]>(() => assinatura.value?.faturas || [])
const diasBrutos = computed(() => Number(assinatura.value?.diasParaVencer || 0))
const diasParaVencer = computed(() => Math.max(Math.ceil(diasBrutos.value), 0))
const assinaturaVencida = computed(() => diasBrutos.value < 0)
const assinaturaVenceHoje = computed(() => !assinaturaVencida.value && diasParaVencer.value === 0)
const assinaturaEmRisco = computed(() => !assinaturaVencida.value && diasParaVencer.value <= 3)
const temLinkPendente = computed(() => Boolean(assinatura.value?.proximoLinkPagamento))

const totalFaturas = computed(() => historicoFaturas.value.length)
const totalPagas = computed(
  () => historicoFaturas.value.filter((fatura) => fatura.status === "PAGO").length,
)
const totalPendentes = computed(
  () => historicoFaturas.value.filter((fatura) => ["PENDENTE", "ATRASADO"].includes(fatura.status)).length,
)
const totalCanceladas = computed(
  () => historicoFaturas.value.filter((fatura) => ["CANCELADO", "ESTORNADO"].includes(fatura.status)).length,
)

const faturaEmAberto = computed(
  () =>
    historicoFaturas.value.find((fatura) => ["PENDENTE", "ATRASADO"].includes(fatura.status)) ||
    historicoFaturas.value[0] ||
    null,
)

const statusBadgeClass = computed(() => {
  if (assinaturaVencida.value) {
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
  }

  if (assinaturaEmRisco.value || temLinkPendente.value) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
})

const statusResumo = computed(() => {
  if (assinaturaVencida.value) {
    return {
      titulo: "Assinatura vencida",
      descricao:
        "Seu acesso depende da regularizacao da mensalidade. Gere ou abra o pagamento pendente para voltar ao fluxo normal.",
    }
  }

  if (temLinkPendente.value) {
    return {
      titulo: "Existe um pagamento pendente",
      descricao:
        "Voce ja tem uma cobranca aberta para a renovacao. Assim que o pagamento for confirmado, a nova vigencia sera aplicada automaticamente.",
    }
  }

  if (assinaturaVenceHoje.value) {
    return {
      titulo: "Sua assinatura vence hoje",
      descricao:
        "Evite bloqueios no acesso gerando agora o pagamento da proxima mensalidade.",
    }
  }

  if (assinaturaEmRisco.value) {
    return {
      titulo: "Renovacao proxima",
      descricao:
        "Sua assinatura esta perto do vencimento. Antecipar o pagamento evita interrupcoes e mantem os apps ativos.",
    }
  }

  return {
    titulo: "Plano em dia",
    descricao:
      "Sua conta esta regular. Acompanhe o vencimento, consulte o historico e acesse a App Store para ajustar seu plano.",
  }
})

const proximosPassos = computed(() => {
  if (assinaturaVencida.value) {
    return [
      "Abra a cobranca pendente ou gere uma nova renovacao.",
      "Depois da confirmacao, a conta e os apps voltam ao ciclo normal.",
      "Revise os apps ativos para entender o valor da proxima mensalidade.",
    ]
  }

  if (temLinkPendente.value) {
    return [
      "Concluir o pagamento pendente para atualizar a vigencia.",
      "A confirmacao libera automaticamente a proxima fase da assinatura.",
      "Se quiser ajustar o valor da recorrencia, acesse a App Store antes do proximo vencimento.",
    ]
  }

  if (assinaturaEmRisco.value) {
    return [
      "Gerar o link da proxima mensalidade agora.",
      "Conferir se os apps ativos refletem o valor esperado.",
      "Acompanhar o historico abaixo para garantir que nao exista nenhuma cobranca antiga em aberto.",
    ]
  }

  return [
    "Acompanhar o proximo vencimento da conta.",
    "Usar a App Store para adicionar ou remover apps do plano.",
    "Consultar o historico sempre que precisar de comprovantes ou links pendentes.",
  ]
})

function getStatusFatura(fatura: StatusContaFatura) {
  if (fatura.status === "PAGO") {
    return {
      label: "Paga",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      icon: CheckCircle2,
    }
  }

  if (fatura.status === "PENDENTE") {
    return {
      label: "Pendente",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      icon: Clock3,
    }
  }

  if (fatura.status === "ATRASADO") {
    return {
      label: "Atrasada",
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      icon: ShieldAlert,
    }
  }

  return {
    label: "Cancelada",
    className: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: XCircle,
  }
}

function getOrigemFatura(fatura: StatusContaFatura) {
  if (fatura.origem === "APP") {
    return {
      label: "App Store",
      className: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    }
  }

  return {
    label: "Mensalidade",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  }
}

function getTituloFatura(fatura: StatusContaFatura) {
  if (fatura.origem === "APP") {
    return fatura.descricao || "Cobranca de app"
  }

  return fatura.descricao || "Mensalidade do plano"
}

async function getDataConta() {
  try {
    refresh.value = true
    const response = await storeUi.getStatus()
    assinatura.value = response
  } catch (error) {
    console.error(error)
  } finally {
    refresh.value = false
  }
}

async function renovarAssinatura() {
  try {
    generatingLink.value = true
    const response = await ContaRepository.gerarLink()
    toast.success("Link gerado com sucesso")
    window.location.href = response.link
  } catch (error) {
    console.error(error)
    toast.error("Erro ao gerar o link")
  } finally {
    generatingLink.value = false
  }
}

function abrirLink(url?: string | null) {
  if (!url) return
  window.open(url, "_blank")
}

onMounted(() => {
  getDataConta()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Assinatura e resumo financeiro
        </h2>
        <p class="text-sm text-muted-foreground">
          Veja o estado atual do plano, acompanhe vencimentos e resolva rapidamente qualquer pagamento pendente.
        </p>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <Button variant="outline" class="gap-2" :disabled="refresh" @click="getDataConta">
          <RefreshCcw class="h-4 w-4" :class="refresh ? 'animate-spin' : ''" />
          Atualizar
        </Button>

        <Button as-child variant="outline" class="gap-2">
          <RouterLink to="/loja">
            <PackagePlus class="h-4 w-4" />
            App Store
          </RouterLink>
        </Button>

        <Button
          v-if="temLinkPendente"
          class="gap-2"
          @click="abrirLink(assinatura?.proximoLinkPagamento)"
        >
          <CreditCard class="h-4 w-4" />
          Pagar agora
        </Button>

        <Button
          v-else-if="assinaturaEmRisco || assinaturaVencida"
          class="gap-2"
          :disabled="generatingLink"
          @click="renovarAssinatura"
        >
          <LoaderCircle v-if="generatingLink" class="h-4 w-4 animate-spin" />
          <CreditCard v-else class="h-4 w-4" />
          Gerar renovacao
        </Button>
      </div>
    </div>

    <Alert
      :class="[
        'border',
        assinaturaVencida
          ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-200'
          : temLinkPendente || assinaturaEmRisco
            ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-950/50 dark:bg-amber-950/20 dark:text-amber-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-950/50 dark:bg-emerald-950/20 dark:text-emerald-200',
      ]"
    >
      <ShieldAlert class="h-4 w-4" />
      <AlertTitle>{{ statusResumo.titulo }}</AlertTitle>
      <AlertDescription>
        {{ statusResumo.descricao }}
      </AlertDescription>
    </Alert>

    <Card class="overflow-hidden border">
      <CardHeader class="border-b bg-muted/20 pb-2 pt-2">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-primary/10 p-3 text-primary">
                <Wallet class="h-5 w-5" />
              </div>

              <div>
                <CardTitle class="text-xl">Visao geral do plano</CardTitle>
                <CardDescription>
                  Entenda o valor atual da sua mensalidade, o vencimento e o historico recente da conta.
                </CardDescription>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Badge class="px-3 py-1 text-xs font-semibold uppercase tracking-wide" :class="statusBadgeClass">
                {{ assinatura?.status || storeUi.status }}
              </Badge>
              <Badge variant="outline" class="px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {{ assinatura?.labelAssinatura || "Resumo da assinatura" }}
              </Badge>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-2 lg:hidden">
            <Button variant="outline" class="gap-2" :disabled="refresh" @click="getDataConta">
              <RefreshCcw class="h-4 w-4" :class="refresh ? 'animate-spin' : ''" />
              Atualizar
            </Button>

            <Button as-child variant="outline" class="gap-2">
              <RouterLink to="/loja">
                <PackagePlus class="h-4 w-4" />
                App Store
              </RouterLink>
            </Button>

            <Button
              v-if="temLinkPendente"
              class="gap-2 sm:col-span-2"
              @click="abrirLink(assinatura?.proximoLinkPagamento)"
            >
              <CreditCard class="h-4 w-4" />
              Abrir pagamento pendente
            </Button>

            <Button
              v-else-if="assinaturaEmRisco || assinaturaVencida"
              class="gap-2 sm:col-span-2"
              :disabled="generatingLink"
              @click="renovarAssinatura"
            >
              <LoaderCircle v-if="generatingLink" class="h-4 w-4 animate-spin" />
              <CreditCard v-else class="h-4 w-4" />
              Gerar renovacao
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-4 p-4 md:p-6">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card class="border-dashed">
            <CardHeader class="space-y-1 py-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleDollarSign class="h-4 w-4" />
                Mensalidade atual
              </div>
              <CardTitle class="text-2xl">
                {{ assinatura?.valor || "R$ 0,00" }}
              </CardTitle>
              <div class="text-xs text-muted-foreground">
                Valor previsto da recorrencia atual da conta.
              </div>
            </CardHeader>
          </Card>

          <Card class="border-dashed">
            <CardHeader class="space-y-1 py-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock class="h-4 w-4" />
                Proximo vencimento
              </div>
              <CardTitle class="text-2xl">
                {{ assinatura?.proximoVencimento || "-" }}
              </CardTitle>
              <div class="text-xs text-muted-foreground">
                {{ assinaturaVencida ? "Pagamento em atraso" : "Data base do proximo ciclo" }}
              </div>
            </CardHeader>
          </Card>

          <Card class="border-dashed">
            <CardHeader class="space-y-1 py-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 class="h-4 w-4" />
                Tempo restante
              </div>
              <CardTitle class="text-2xl" :class="assinaturaEmRisco || assinaturaVencida ? 'text-destructive' : ''">
                {{
                  assinaturaVencida
                    ? `${Math.abs(Math.ceil(diasBrutos))} dia(s) em atraso`
                    : assinaturaVenceHoje
                      ? "Vence hoje"
                      : `${diasParaVencer} dia(s)`
                }}
              </CardTitle>
              <div class="text-xs text-muted-foreground">
                {{ assinaturaVencida ? "Regularize para evitar bloqueios" : "Prazo ate o proximo vencimento" }}
              </div>
            </CardHeader>
          </Card>

          <Card class="border-dashed">
            <CardHeader class="space-y-1 py-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <ReceiptText class="h-4 w-4" />
                Faturas recentes
              </div>
              <CardTitle class="text-2xl">
                {{ totalFaturas }}
              </CardTitle>
              <div class="text-xs text-muted-foreground">
                {{ totalPendentes }} pendente(s), {{ totalPagas }} paga(s)
              </div>
            </CardHeader>
          </Card>
        </div>

        <div class="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
          <div class="rounded-xl border bg-card p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-medium">Resumo financeiro da assinatura</p>
                <p class="text-xs text-muted-foreground">
                  Consolidado do historico carregado para a conta.
                </p>
              </div>
              <Badge variant="outline">Ultimas 10 faturas</Badge>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-lg border border-border bg-muted/40 p-3">
                <div class="text-xs uppercase tracking-wide text-muted-foreground">Total movimentado</div>
                <div class="mt-2 text-lg font-semibold text-foreground">
                  {{ formatCurrencyBR(assinatura?.valorTotal || 0) }}
                </div>
              </div>

              <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-950/50 dark:bg-emerald-950/20">
                <div class="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Pago</div>
                <div class="mt-2 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {{ formatCurrencyBR(assinatura?.valorPago || 0) }}
                </div>
              </div>

              <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-950/50 dark:bg-amber-950/20">
                <div class="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Pendente</div>
                <div class="mt-2 text-lg font-semibold text-amber-700 dark:text-amber-300">
                  {{ formatCurrencyBR(assinatura?.valorPendente || 0) }}
                </div>
              </div>

              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                <div class="text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">Cancelado</div>
                <div class="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {{ formatCurrencyBR(assinatura?.valorCancelado || 0) }}
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border bg-card p-4">
            <div class="space-y-1">
              <p class="text-sm font-medium">O que fazer agora</p>
              <p class="text-xs text-muted-foreground">
                Orientacao rapida para o estado atual da sua assinatura.
              </p>
            </div>

            <div class="mt-4 space-y-3">
              <div
                v-for="(passo, index) in proximosPassos"
                :key="passo"
                class="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 border text-xs font-bold text-primary dark:text-blue-400">
                  {{ index + 1 }}
                </div>
                <p class="text-sm text-foreground">{{ passo }}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-3 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader class="pb-2 pt-2">
          <CardTitle class="text-lg">Fatura em destaque</CardTitle>
          <CardDescription>
            A cobranca mais importante para acao imediata no seu ciclo atual.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div
            v-if="faturaEmAberto"
            class="rounded-xl border border-border bg-muted/20 p-4"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge :class="getStatusFatura(faturaEmAberto).className">
                    <component :is="getStatusFatura(faturaEmAberto).icon" class="mr-1 h-3.5 w-3.5" />
                    {{ getStatusFatura(faturaEmAberto).label }}
                  </Badge>
                  <Badge :class="getOrigemFatura(faturaEmAberto).className">
                    {{ getOrigemFatura(faturaEmAberto).label }}
                  </Badge>
                </div>

                <div>
                  <p class="text-xl font-semibold text-foreground">
                    {{ formatCurrencyBR(faturaEmAberto.valor) }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    Vencimento em {{ faturaEmAberto.vencimento }}
                  </p>
                </div>

                <p class="text-sm text-muted-foreground">
                  {{ temLinkPendente
                    ? "Existe uma cobranca aberta aguardando pagamento."
                    : "Use este bloco para consultar a cobranca mais recente do plano ou dos apps." }}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <Button
                  v-if="['PENDENTE', 'ATRASADO'].includes(faturaEmAberto.status)"
                  class="gap-2"
                  @click="abrirLink(faturaEmAberto.linkPagamento)"
                >
                  <CreditCard class="h-4 w-4" />
                  Pagar fatura
                </Button>

                <Button
                  v-if="faturaEmAberto.linkPagamento"
                  variant="outline"
                  class="gap-2"
                  @click="abrirLink(faturaEmAberto.linkPagamento)"
                >
                  <ExternalLink class="h-4 w-4" />
                  Abrir link
                </Button>

                <Button
                  v-if="faturaEmAberto.status === 'PAGO' && faturaEmAberto.linkPagamento"
                  variant="outline"
                  class="gap-2"
                  @click="abrirLink(faturaEmAberto.linkPagamento)"
                >
                  <FileCheck2 class="h-4 w-4" />
                  Ver comprovante
                </Button>
              </div>
            </div>
          </div>

          <div v-else class="rounded-lg border border-border p-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileClock class="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma fatura disponivel</EmptyTitle>
                <EmptyDescription>
                  Quando houver cobrancas da assinatura, elas aparecerao aqui para consulta rapida.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="py-3">
          <CardTitle class="text-lg">Apps e recorrencia</CardTitle>
          <CardDescription>
            Ajuste os apps contratados e acompanhe o impacto no valor do plano.
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-3">
          <div class="rounded-lg border border-border bg-muted/30 p-4">
            <div class="text-sm font-medium text-foreground">Gerencie sua App Store</div>
            <p class="mt-1 text-sm text-muted-foreground">
              Adicione apps, remova recursos e veja como cada escolha afeta a proxima mensalidade.
            </p>
          </div>

          <Button as-child class="w-full gap-2 dark:text-white">
            <RouterLink to="/loja">
              Abrir App Store
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
          </Button>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader class="py-3">
        <CardTitle class="text-lg">Historico de faturas</CardTitle>
        <CardDescription>
          Consulte os ultimos pagamentos da assinatura, abra links pendentes e visualize comprovantes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div v-if="refresh && !historicoFaturas.length" class="rounded-lg border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LoaderCircle class="h-6 w-6 animate-spin" />
              </EmptyMedia>
              <EmptyTitle>Carregando historico</EmptyTitle>
              <EmptyDescription>Buscando as ultimas faturas da assinatura.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <div v-else-if="!historicoFaturas.length" class="rounded-lg border border-border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText class="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma fatura encontrada</EmptyTitle>
              <EmptyDescription>Assim que a conta gerar cobrancas, elas aparecerao neste historico.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <div v-else class="space-y-3">
          <div class="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <div>Fatura</div>
            <div>Valor</div>
            <div>Status</div>
            <div class="text-right">Acoes</div>
          </div>

          <div
            v-for="fatura in historicoFaturas"
            :key="fatura.id"
            class="rounded-xl border border-border bg-card px-4 py-2"
          >
            <div class="flex flex-col gap-4 md:grid md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] md:items-center">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="font-medium text-foreground">{{ getTituloFatura(fatura) }}</div>
                  <Badge :class="getOrigemFatura(fatura).className" class="w-fit">
                    {{ getOrigemFatura(fatura).label }}
                  </Badge>
                </div>
                <div class="text-sm text-muted-foreground">
                  Vencimento em {{ fatura.vencimento }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-xs uppercase tracking-wide text-muted-foreground md:hidden">Valor</div>
                <div class="font-semibold text-foreground">
                  {{ formatCurrencyBR(fatura.valor) }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-xs uppercase tracking-wide text-muted-foreground md:hidden">Status</div>
                <Badge :class="getStatusFatura(fatura).className" class="w-fit">
                  <component :is="getStatusFatura(fatura).icon" class="mr-1 h-3.5 w-3.5" />
                  {{ getStatusFatura(fatura).label }}
                </Badge>
              </div>

              <div class="flex flex-wrap justify-start gap-2 md:justify-end">
                <Button
                  v-if="['PENDENTE', 'ATRASADO'].includes(fatura.status)"
                  size="sm"
                  class="gap-2"
                  @click="abrirLink(fatura.linkPagamento)"
                >
                  <CreditCard class="h-4 w-4" />
                  Pagar
                </Button>

                <Button
                  v-if="fatura.linkPagamento"
                  size="sm"
                  variant="outline"
                  class="gap-2"
                  @click="abrirLink(fatura.linkPagamento)"
                >
                  <ExternalLink class="h-4 w-4" />
                  Abrir
                </Button>

                <Button
                  v-if="fatura.status === 'PAGO' && fatura.linkPagamento"
                  size="sm"
                  variant="outline"
                  class="gap-2"
                  @click="abrirLink(fatura.linkPagamento)"
                >
                  <FileCheck2 class="h-4 w-4" />
                  Comprovante
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="h-20 md:hidden"></div>

    <nav
      v-if="storeUi.isMobile"
      class="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t bg-background shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
    >
      <button
        class="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
        @click="storeUi.openSidebar = true"
      >
        <Menu class="h-5 w-5" />
        <span class="text-[10px] font-medium">Menu</span>
      </button>

      <button
        class="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
        @click="abrirLink(assinatura?.proximoLinkPagamento)"
      >
        <CreditCard class="h-5 w-5" />
        <span class="text-[10px] font-medium">Pagar</span>
      </button>
    </nav>
  </div>
</template>
