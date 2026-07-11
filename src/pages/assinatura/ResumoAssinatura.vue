<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useToast } from "vue-toastification"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ContaRepository, type StatusConta, type StatusContaFatura } from "@/repositories/conta-repository"
import { useUiStore } from "@/stores/ui/uiStore"
import { formatCurrencyBR } from "@/utils/formatters"
import {
  CalendarClock,
  CheckCircle2,
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
  ShieldCheck,
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

const totalPagas = computed(() => historicoFaturas.value.filter((f) => f.status === "PAGO").length)

// Fatura em aberto (pendente/atrasada) para direcionar o pagamento.
const faturaPendente = computed(
  () => historicoFaturas.value.find((f) => ["PENDENTE", "ATRASADO"].includes(f.status)) || null,
)

const linkParaPagar = computed(
  () => assinatura.value?.proximoLinkPagamento || faturaPendente.value?.linkPagamento || null,
)
const precisaGerarRenovacao = computed(
  () => !linkParaPagar.value && (assinaturaEmRisco.value || assinaturaVencida.value),
)

// Valor em destaque: o que precisa ser pago agora, ou a mensalidade prevista.
const valorDestaque = computed(() =>
  faturaPendente.value
    ? formatCurrencyBR(Number(faturaPendente.value.valor))
    : assinatura.value?.valor || "R$ 0,00",
)
const valorDestaqueLabel = computed(() =>
  faturaPendente.value ? "Valor a pagar" : "Mensalidade atual",
)
const vencimentoDestaque = computed(
  () => faturaPendente.value?.vencimento || assinatura.value?.proximoVencimento || "-",
)

const diasLabel = computed(() => {
  if (assinaturaVencida.value) return `${Math.abs(Math.ceil(diasBrutos.value))} dia(s) em atraso`
  if (assinaturaVenceHoje.value) return "Vence hoje"
  return `Faltam ${diasParaVencer.value} dia(s)`
})

// Estado único que guia todo o cartão principal (tom + textos + ícone).
const hero = computed(() => {
  if (assinaturaVencida.value) {
    return {
      tone: "danger" as const,
      icon: ShieldAlert,
      titulo: "Sua assinatura está vencida",
      descricao: "Regularize o pagamento para reativar seu acesso e manter os apps funcionando.",
    }
  }
  if (temLinkPendente.value || faturaPendente.value) {
    return {
      tone: "warn" as const,
      icon: Clock3,
      titulo: "Você tem um pagamento pendente",
      descricao: "Assim que confirmarmos o pagamento, sua próxima vigência é aplicada automaticamente.",
    }
  }
  if (assinaturaVenceHoje.value) {
    return {
      tone: "warn" as const,
      icon: CalendarClock,
      titulo: "Sua assinatura vence hoje",
      descricao: "Antecipe o pagamento para continuar usando o sistema sem interrupções.",
    }
  }
  if (assinaturaEmRisco.value) {
    return {
      tone: "warn" as const,
      icon: CalendarClock,
      titulo: "Sua renovação está próxima",
      descricao: "Pagar agora evita bloqueios e mantém todos os seus apps ativos.",
    }
  }
  return {
    tone: "ok" as const,
    icon: ShieldCheck,
    titulo: "Tudo certo, seu plano está em dia",
    descricao: "Sua conta está ativa. Você pode adiantar a próxima mensalidade quando quiser.",
  }
})

const toneUI = computed(() => {
  const map = {
    ok: {
      wrap: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20",
      icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    warn: {
      wrap: "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20",
      icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    danger: {
      wrap: "border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20",
      icon: "bg-red-500/15 text-red-600 dark:text-red-400",
      badge: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    },
  }
  return map[hero.value.tone]
})

function getStatusFatura(fatura: StatusContaFatura) {
  if (fatura.status === "PAGO") {
    return { label: "Paga", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", icon: CheckCircle2 }
  }
  if (fatura.status === "PENDENTE") {
    return { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", icon: Clock3 }
  }
  if (fatura.status === "ATRASADO") {
    return { label: "Atrasada", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300", icon: ShieldAlert }
  }
  return { label: "Cancelada", className: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: XCircle }
}

function getOrigemFatura(fatura: StatusContaFatura) {
  return fatura.origem === "APP"
    ? { label: "App Store", className: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" }
    : { label: "Mensalidade", className: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" }
}

function getTituloFatura(fatura: StatusContaFatura) {
  return fatura.descricao || (fatura.origem === "APP" ? "Cobrança de app" : "Mensalidade do plano")
}

async function getDataConta() {
  try {
    refresh.value = true
    assinatura.value = await storeUi.getStatus()
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
    toast.success("Link de pagamento gerado")
    window.location.href = response.link
  } catch (error) {
    console.error(error)
    toast.error("Não foi possível gerar o link de pagamento")
  } finally {
    generatingLink.value = false
  }
}

function abrirLink(url?: string | null) {
  if (!url) return
  window.open(url, "_blank")
}

function pagarPrincipal() {
  if (linkParaPagar.value) return abrirLink(linkParaPagar.value)
  return renovarAssinatura()
}

onMounted(getDataConta)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5 pb-24 md:pb-8">
    <!-- Cabeçalho enxuto -->
    <header class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-foreground md:text-2xl">Sua assinatura</h1>
        <p class="text-sm text-muted-foreground">Acompanhe seu plano e mantenha o acesso ativo.</p>
      </div>
      <Button variant="ghost" size="icon" :disabled="refresh" title="Atualizar" @click="getDataConta">
        <RefreshCcw class="h-5 w-5" :class="refresh ? 'animate-spin' : ''" />
      </Button>
    </header>

    <!-- Cartão principal: status + valor + ação de pagamento -->
    <section class="rounded-2xl border p-5 shadow-sm md:p-6" :class="toneUI.wrap">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-xl" :class="toneUI.icon">
            <component :is="hero.icon" class="h-6 w-6" />
          </div>
          <div>
            <Badge class="border-0 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide" :class="toneUI.badge">
              {{ assinatura?.status || storeUi.status }}
            </Badge>
            <h2 class="mt-1 text-lg font-semibold leading-tight text-foreground md:text-xl">{{ hero.titulo }}</h2>
          </div>
        </div>
      </div>

      <p class="mt-3 text-sm text-muted-foreground">{{ hero.descricao }}</p>

      <!-- Bloco de valor + fatos -->
      <div class="mt-5 rounded-xl border bg-background/70 p-4">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted-foreground">{{ valorDestaqueLabel }}</p>
            <p class="text-3xl font-bold text-foreground md:text-4xl">{{ valorDestaque }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">Vencimento</p>
            <p class="text-sm font-semibold text-foreground">{{ vencimentoDestaque }}</p>
            <span
              class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="toneUI.badge"
            >
              <Clock3 class="h-3 w-3" /> {{ diasLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ações -->
      <div class="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          class="h-11 flex-1 gap-2 text-base dark:text-white"
          :disabled="generatingLink"
          @click="pagarPrincipal"
        >
          <LoaderCircle v-if="generatingLink" class="h-4 w-4 animate-spin" />
          <CreditCard v-else class="h-4 w-4" />
          {{ linkParaPagar ? "Pagar agora" : precisaGerarRenovacao ? "Gerar renovação" : "Adiantar pagamento" }}
        </Button>
        <Button as-child variant="outline" class="h-11 gap-2">
          <RouterLink to="/loja">
            <PackagePlus class="h-4 w-4" />
            Gerenciar apps
          </RouterLink>
        </Button>
      </div>
    </section>

    <!-- Histórico de faturas -->
    <Card class="border-border/70 shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between gap-3 py-4">
        <div>
          <CardTitle class="flex items-center gap-2 text-base">
            <ReceiptText class="h-4 w-4 text-primary" /> Histórico de faturas
          </CardTitle>
          <CardDescription>Pague pendências e acesse comprovantes.</CardDescription>
        </div>
        <div class="hidden shrink-0 items-center gap-2 text-xs sm:flex">
          <span class="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {{ totalPagas }} paga(s)
          </span>
          <span
            v-if="Number(assinatura?.valorPendente || 0) > 0"
            class="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          >
            Pendente {{ formatCurrencyBR(Number(assinatura?.valorPendente || 0)) }}
          </span>
        </div>
      </CardHeader>

      <CardContent class="pt-0">
        <div v-if="refresh && !historicoFaturas.length" class="rounded-lg border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><LoaderCircle class="h-6 w-6 animate-spin" /></EmptyMedia>
              <EmptyTitle>Carregando histórico</EmptyTitle>
              <EmptyDescription>Buscando as últimas faturas da assinatura.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <div v-else-if="!historicoFaturas.length" class="rounded-lg border p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><FileClock class="h-6 w-6" /></EmptyMedia>
              <EmptyTitle>Nenhuma fatura ainda</EmptyTitle>
              <EmptyDescription>Assim que sua conta gerar cobranças, elas aparecem aqui.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <ul v-else class="divide-y divide-border/60">
          <li
            v-for="fatura in historicoFaturas"
            :key="fatura.id"
            class="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="truncate text-sm font-medium text-foreground">{{ getTituloFatura(fatura) }}</span>
                <Badge class="border-0 px-1.5 py-0 text-[10px]" :class="getOrigemFatura(fatura).className">
                  {{ getOrigemFatura(fatura).label }}
                </Badge>
              </div>
              <p class="mt-0.5 text-xs text-muted-foreground">Vencimento em {{ fatura.vencimento }}</p>
            </div>

            <div class="flex items-center justify-between gap-3 sm:justify-end">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-foreground">{{ formatCurrencyBR(Number(fatura.valor)) }}</span>
                <Badge class="border-0 px-2 py-0.5 text-[10px]" :class="getStatusFatura(fatura).className">
                  <component :is="getStatusFatura(fatura).icon" class="mr-1 h-3 w-3" />
                  {{ getStatusFatura(fatura).label }}
                </Badge>
              </div>

              <Button
                v-if="['PENDENTE', 'ATRASADO'].includes(fatura.status)"
                size="sm"
                class="gap-1.5 dark:text-white"
                @click="abrirLink(fatura.linkPagamento)"
              >
                <CreditCard class="h-3.5 w-3.5" /> Pagar
              </Button>
              <Button
                v-else-if="fatura.linkPagamento"
                size="sm"
                variant="outline"
                class="gap-1.5"
                @click="abrirLink(fatura.linkPagamento)"
              >
                <FileCheck2 v-if="fatura.status === 'PAGO'" class="h-3.5 w-3.5" />
                <ExternalLink v-else class="h-3.5 w-3.5" />
                {{ fatura.status === "PAGO" ? "Comprovante" : "Abrir" }}
              </Button>
            </div>
          </li>
        </ul>
      </CardContent>
    </Card>

    <!-- Barra inferior (mobile) -->
    <nav
      v-if="storeUi.isMobile"
      class="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center gap-2 border-t bg-background px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
    >
      <button
        class="flex flex-col items-center gap-0.5 px-2 text-muted-foreground hover:text-primary"
        @click="storeUi.openSidebar = true"
      >
        <Menu class="h-5 w-5" />
        <span class="text-[10px] font-medium">Menu</span>
      </button>
      <Button class="h-11 flex-1 gap-2 dark:text-white" :disabled="generatingLink" @click="pagarPrincipal">
        <LoaderCircle v-if="generatingLink" class="h-4 w-4 animate-spin" />
        <CreditCard v-else class="h-4 w-4" />
        {{ linkParaPagar ? "Pagar agora" : precisaGerarRenovacao ? "Gerar renovação" : "Adiantar" }}
      </Button>
    </nav>
  </div>
</template>
