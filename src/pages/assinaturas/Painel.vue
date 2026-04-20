<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  Layers3,
  Package,
  ReceiptText,
  RefreshCcw,
  Sparkles,
  Wallet,
} from 'lucide-vue-next'

import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AssinaturaRepository, type AssinaturaDashboardResponse } from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(true)
const dashboard = ref<AssinaturaDashboardResponse['data'] | null>(null)

const atalhos = [
  { titulo: 'Assinaturas', link: '/assinaturas/assinaturas', icon: Sparkles },
  { titulo: 'Planos', link: '/assinaturas/planos', icon: Layers3 },
  { titulo: 'Cobranças', link: '/assinaturas/cobrancas', icon: ReceiptText },
  { titulo: 'Comodatos', link: '/assinaturas/comodatos', icon: Package },
]

async function loadDashboard(showFeedback = false) {
  try {
    loading.value = true
    const response = await AssinaturaRepository.dashboard()
    dashboard.value = response.data

    if (showFeedback) {
      toast.success('Painel de assinaturas atualizado.')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o painel de assinaturas.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ChartPie class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Painel de assinaturas
        </h2>
        <p class="text-sm text-muted-foreground">
          Visão executiva da receita recorrente, vencimentos e comodatos do ERP.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <RouterLink v-for="atalho in atalhos" :key="atalho.titulo" :to="atalho.link">
          <Button variant="outline" class="gap-2">
            <component :is="atalho.icon" class="h-4 w-4" />
            {{ atalho.titulo }}
          </Button>
        </RouterLink>
        <Button variant="outline" class="gap-2" @click="loadDashboard(true)">
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Atualizar
        </Button>
      </div>
    </div>

    <section v-if="loading" class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Skeleton v-for="item in 6" :key="item" class="h-28 rounded-2xl" />
    </section>

    <section v-else class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <Sparkles class="h-4 w-4 text-primary" /> Assinaturas ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ dashboard?.kpis.assinaturasAtivas || 0 }}</p>
          <p class="text-xs text-muted-foreground">De {{ dashboard?.kpis.totalAssinaturas || 0 }} contratos ativos no domínio.</p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <CircleDollarSign class="h-4 w-4 text-emerald-600" /> MRR estimado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(dashboard?.kpis.mrrEstimado || 0) }}</p>
          <p class="text-xs text-muted-foreground">Equivalência mensal do portfólio ativo.</p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <Wallet class="h-4 w-4 text-rose-600" /> Inadimplência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(dashboard?.kpis.inadimplencia || 0) }}</p>
          <p class="text-xs text-muted-foreground">Soma das cobranças marcadas como atrasadas.</p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <ReceiptText class="h-4 w-4 text-amber-600" /> Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ dashboard?.kpis.cobrancasPendentes || 0 }}</p>
          <p class="text-xs text-muted-foreground">Ciclos aguardando cobrança ou confirmação.</p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <CalendarClock class="h-4 w-4 text-orange-600" /> Atrasadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ dashboard?.kpis.cobrancasAtrasadas || 0 }}</p>
          <p class="text-xs text-muted-foreground">Ciclos vencidos sem regularização.</p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <Package class="h-4 w-4 text-blue-600" /> Comodatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-semibold text-foreground">{{ dashboard?.kpis.comodatosEmUso || 0 }}</p>
          <p class="text-xs text-muted-foreground">Equipamentos ainda em uso pelos clientes.</p>
        </CardContent>
      </Card>
    </section>

    <div class="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <CalendarClock class="h-5 w-5 text-primary" /> Próximos vencimentos
          </CardTitle>
          <CardDescription>
            Assinaturas priorizadas por vencimento para ação rápida da operação.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="item in dashboard?.proximosVencimentos || []"
            :key="item.id"
            class="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="font-medium text-foreground">{{ item.nomeContrato }}</p>
                <p class="text-sm text-muted-foreground">{{ item.cliente }} • {{ item.Uid }}</p>
                <p class="text-xs text-muted-foreground">
                  Próxima cobrança em {{ formatDateToPtBR(item.proximaCobranca) }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <Badge :class="item.atrasada ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'">
                  {{ item.atrasada ? 'Atrasada' : 'No radar' }}
                </Badge>
                <Badge class="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {{ formatCurrencyBR(item.valorPrevisto) }}
                </Badge>
                <RouterLink :to="`/assinaturas/assinaturas/${item.id}`">
                  <Button variant="outline" size="sm">Abrir</Button>
                </RouterLink>
              </div>
            </div>
          </div>
          <div v-if="!dashboard?.proximosVencimentos?.length" class="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhuma assinatura cadastrada ainda neste módulo.
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle class="text-lg">Próximos passos</CardTitle>
          <CardDescription>
            Sugestão de operação mínima para ativar o domínio recorrente no dia a dia.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
            <p class="font-medium text-foreground">1. Cadastre seus planos base</p>
            <p class="mt-1 text-sm text-muted-foreground">Use planos para padronizar itens, cobrança e valor inicial.</p>
          </div>
          <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
            <p class="font-medium text-foreground">2. Vincule clientes e itens</p>
            <p class="mt-1 text-sm text-muted-foreground">Assinaturas podem misturar serviços, produtos recorrentes e comodato.</p>
          </div>
          <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
            <p class="font-medium text-foreground">3. Gere ciclos e acompanhe atrasos</p>
            <p class="mt-1 text-sm text-muted-foreground">O painel passa a exibir MRR, cobranças pendentes e próximos vencimentos.</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <MobileBottomBar v-if="uiStore.isMobile">
      <RouterLink to="/assinaturas/assinaturas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Sparkles class="h-5 w-5" />
        <span class="text-xs">Assinaturas</span>
      </RouterLink>
      <RouterLink to="/assinaturas/planos" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Layers3 class="h-5 w-5" />
        <span class="text-xs">Planos</span>
      </RouterLink>
      <RouterLink to="/assinaturas/cobrancas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <ReceiptText class="h-5 w-5" />
        <span class="text-xs">Cobranças</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="loadDashboard(true)">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
