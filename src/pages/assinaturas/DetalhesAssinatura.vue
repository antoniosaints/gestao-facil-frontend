<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  FileText,
  History,
  Layers3,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { AssinaturaRepository, type AssinaturaDetalheResponse } from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import {
  getPeriodicidadeLabel,
  getStatusAssinaturaMeta,
  getStatusCicloMeta,
  getStatusComodatoMeta,
} from './shared'
import CobrancasActions from './components/CobrancasActions.vue'

type ActiveTab = 'resumo' | 'cobrancas' | 'comodatos' | 'historico'
type BadgeColor = 'cyan' | 'yellow' | 'gray' | 'violet' | 'purple' | 'green' | 'emerald' | 'orange' | 'red' | 'blue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const uiStore = useUiStore()

const loading = ref(false)
const statusLoading = ref(false)
const cycleModalOpen = ref(false)
const cycleLoading = ref(false)
const detalhe = ref<AssinaturaDetalheResponse['data'] | null>(null)
const nextStatus = ref<'ATIVA' | 'SUSPENSA' | 'CANCELADA' | 'ENCERRADA'>('ATIVA')
const activeTab = ref<ActiveTab>('resumo')

const subscriptionId = computed(() => Number(route.params.id || route.query.id || 0))
const comodatos = computed(() => detalhe.value?.itens.flatMap((entry) => entry.comodatos) || [])

const pageTitle = computed(() => detalhe.value?.nomeContrato || 'Detalhes da assinatura')
const pageSubtitle = computed(() => {
  if (!detalhe.value) return 'Contrato recorrente'
  return `${detalhe.value.cliente?.nome || 'Cliente não informado'} • ${detalhe.value.Uid || '-'}`
})

const overviewHighlights = computed(() => {
  if (!detalhe.value) return []

  return [
    {
      label: 'Valor atual',
      value: formatCurrencyBR(detalhe.value.valorAtual),
      color: 'green' as BadgeColor,
      icon: CircleDollarSign,
    },
    {
      label: 'Periodicidade',
      value: getPeriodicidadeLabel(detalhe.value.periodicidade),
      color: 'blue' as BadgeColor,
      icon: CalendarClock,
    },
    {
      label: 'Itens ativos',
      value: `${detalhe.value.resumo.itens}`,
      color: 'purple' as BadgeColor,
      icon: Layers3,
    },
    {
      label: 'Pendências',
      value: `${detalhe.value.resumo.ciclosPendentes + detalhe.value.resumo.ciclosAtrasados}`,
      color:
        detalhe.value.resumo.ciclosPendentes + detalhe.value.resumo.ciclosAtrasados > 0
          ? ('orange' as BadgeColor)
          : ('emerald' as BadgeColor),
      icon: ShieldCheck,
    },
  ]
})

async function loadDetalhe(showFeedback = false) {
  try {
    if (!subscriptionId.value) {
      toast.error('Assinatura inválida.')
      router.push('/assinaturas/assinaturas')
      return
    }

    loading.value = true
    const response = await AssinaturaRepository.detalhes(subscriptionId.value)
    detalhe.value = response.data
    nextStatus.value = response.data.status

    if (showFeedback) {
      toast.success('Detalhes da assinatura atualizados.')
    }
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar os detalhes da assinatura.')
  } finally {
    loading.value = false
  }
}

async function changeStatus() {
  try {
    if (!detalhe.value) return
    statusLoading.value = true
    await AssinaturaRepository.atualizarStatus(detalhe.value.id, nextStatus.value)
    toast.success('Status atualizado com sucesso.')
    await loadDetalhe()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar o status da assinatura.')
  } finally {
    statusLoading.value = false
  }
}

function openGenerateCycleModal() {
  cycleModalOpen.value = true
}

async function confirmGenerateCycle() {
  try {
    if (!detalhe.value) return
    cycleLoading.value = true
    await AssinaturaRepository.gerarCiclo(detalhe.value.id)
    toast.success('Ciclo gerado com sucesso.')
    cycleModalOpen.value = false
    activeTab.value = 'cobrancas'
    await loadDetalhe()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar o ciclo da assinatura.')
  } finally {
    cycleLoading.value = false
  }
}

onMounted(() => {
  loadDetalhe()
})
</script>

<template>
  <div class="space-y-3 pb-20 md:pb-0">
    <div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <Badge v-if="detalhe" :class="getStatusAssinaturaMeta(detalhe.status).className">
              {{ getStatusAssinaturaMeta(detalhe.status).label }}
            </Badge>
            <Badge v-if="detalhe?.plano" variant="outline">Plano {{ detalhe.plano.nome }}</Badge>
            <Badge v-if="detalhe?.cobrancaAutomatica" variant="outline">Cobrança automática</Badge>
            <Badge v-else-if="detalhe" variant="outline">Cobrança assistida</Badge>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2 text-lg font-semibold text-foreground md:text-2xl">
              <Sparkles class="h-6 w-6 text-primary" />
              {{ pageTitle }}
            </div>
            <p class="text-sm text-muted-foreground">
              {{ pageSubtitle }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <BadgeCell v-for="highlight in overviewHighlights" :key="highlight.label"
              :label="`${highlight.label}: ${highlight.value}`" :color="highlight.color" :icon="highlight.icon"
              :capitalize="false" size="sm" />
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
          <Button variant="outline" @click="router.back()">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button variant="outline" @click="loadDetalhe(true)" :disabled="loading">
            <RefreshCcw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            Atualizar
          </Button>
          <Button class="gap-2" @click="openGenerateCycleModal">
            <CircleDollarSign class="h-4 w-4" />
            Gerar ciclo
          </Button>
        </div>
      </div>
    </div>

    <div v-if="loading && !detalhe"
      class="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Carregando detalhes da assinatura...
    </div>

    <template v-else-if="detalhe">
      <Tabs v-model="activeTab" default-value="resumo" class="space-y-2">
        <TabsList class="w-full justify-start overflow-x-auto rounded-b-lg">
          <TabsTrigger value="resumo" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <FileText class="h-4 w-4" />
              <span>Resumo</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="cobrancas" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <CalendarClock class="h-4 w-4" />
              <span>Cobranças</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="comodatos" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <Package class="h-4 w-4" />
              <span>Comodatos</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="historico" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <History class="h-4 w-4" />
              <span>Histórico</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card class="border-border">
              <CardContent class="mt-4 space-y-4">
                <div class="flex flex-wrap gap-2">
                  <BadgeCell :label="`Status: ${getStatusAssinaturaMeta(detalhe.status).label}`"
                    :color="detalhe.status === 'ATIVA' ? 'green' : detalhe.status === 'SUSPENSA' ? 'yellow' : detalhe.status === 'CANCELADA' ? 'red' : 'gray'"
                    :icon="Sparkles" :capitalize="false" size="sm" />
                  <BadgeCell
                    :label="`Cobrança: ${detalhe.gateway || 'Não informado'} • ${detalhe.tipoCobranca || 'Não informado'}`"
                    color="blue" :icon="CircleDollarSign" :capitalize="false" size="sm" />
                  <BadgeCell :label="detalhe.cobrancaAutomatica ? 'Automática' : 'Manual/assistida'"
                    :color="detalhe.cobrancaAutomatica ? 'emerald' : 'gray'" :icon="ShieldCheck" :capitalize="false"
                    size="sm" />
                </div>

                <div>
                  <div class="text-xl font-semibold text-foreground">
                    {{ detalhe.nomeContrato }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ detalhe.cliente?.nome || 'Cliente não informado' }} • {{ detalhe.plano?.nome || 'Sem plano base'
                    }}
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Valor atual</div>
                    <div class="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {{ formatCurrencyBR(detalhe.valorAtual) }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Modo de valor</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ detalhe.modoValor === 'MANUAL' ? 'Manual' : 'Dinâmico' }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Periodicidade</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ getPeriodicidadeLabel(detalhe.periodicidade) }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Próxima cobrança</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ formatDateToPtBR(detalhe.proximaCobranca) }}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Período</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ formatDateToPtBR(detalhe.inicio) }}
                      <span v-if="detalhe.fim"> • até {{ formatDateToPtBR(detalhe.fim) }}</span>
                      <span v-else> • indefinida</span>
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Pendências</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ detalhe.resumo.ciclosPendentes }} pendente(s) • {{ detalhe.resumo.ciclosAtrasados }}
                      atrasado(s)
                    </div>
                  </div>
                </div>

                <div>
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">Observações</div>
                  <div class="mt-1 text-sm whitespace-pre-wrap text-foreground">
                    {{ detalhe.observacoes || 'Nenhuma observação cadastrada.' }}
                  </div>
                </div>

                <Separator />

                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <div class="text-sm font-medium text-foreground">Itens contratados</div>
                      <div class="text-xs text-muted-foreground">
                        {{ detalhe.resumo.itens }} item(ns) • {{ detalhe.resumo.comodatos }} comodato(s)
                      </div>
                    </div>
                  </div>

                  <div v-if="detalhe.itens.length" class="space-y-2">
                    <div v-for="item in detalhe.itens" :key="item.id"
                      class="rounded-xl border border-border bg-background px-3 py-2">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div class="text-sm font-medium text-foreground">{{ item.descricaoSnapshot }}</div>
                          <div class="text-xs text-muted-foreground">
                            {{ item.tipoItem }} • {{ item.quantidade }} × {{ formatCurrencyBR(item.valorUnitario) }}
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <BadgeCell :label="item.ativo ? 'Ativo' : 'Inativo'" :color="item.ativo ? 'green' : 'gray'"
                            :icon="Sparkles" :capitalize="false" size="sm" />
                          <BadgeCell v-if="item.cobrar" label="Cobrado" color="blue" :icon="CircleDollarSign"
                            :capitalize="false" size="sm" />
                          <BadgeCell v-if="item.comodato" label="Comodato" color="orange" :icon="Package"
                            :capitalize="false" size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Esta assinatura ainda não possui itens cadastrados.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card class="border-border">
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <ShieldCheck class="h-4 w-4" />
                  Panorama rápido
                </CardTitle>
                <CardDescription>
                  Indicadores compactos do contrato para leitura operacional.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Ciclos gerados</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">{{ detalhe.ciclos.length }}</div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Histórico</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">{{ detalhe.historico.length }} evento(s)
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Comodatos em uso</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{comodatos.filter((item) => item.status === 'EM_USO').length}}
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-background px-3 py-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Cobranças ativas</div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{detalhe.ciclos.filter((item) => item.cobranca && ['PENDENTE',
                        'EFETIVADO'].includes(item.cobranca.status)).length }}
                    </div>
                  </div>
                </div>

                <Separator />

                <div class="grid grid-cols-4 gap-2 items-end">
                  <div class="space-y-2 col-span-3">
                    <label class="text-sm font-medium">Status da assinatura</label>
                    <Select v-model="nextStatus">
                      <SelectTrigger class="w-full bg-card">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVA">Ativa</SelectItem>
                        <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada</SelectItem>
                        <SelectItem value="ENCERRADA">Encerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" class="w-full" :disabled="statusLoading" @click="changeStatus">
                    <RefreshCcw v-if="statusLoading" class="mr-2 h-4 w-4 animate-spin" />
                    {{ statusLoading ? 'Atualizando...' : 'Atualizar' }}
                  </Button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <Button class="w-full gap-2" @click="openGenerateCycleModal">
                    <CircleDollarSign class="h-4 w-4" /> Gerar novo ciclo
                  </Button>
                  <RouterLink to="/assinaturas/cobrancas">
                    <Button variant="outline" class="w-full">Ver todas as cobranças</Button>
                  </RouterLink>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cobrancas" class="space-y-4">
          <Card class="border-border">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <CalendarClock class="h-5 w-5 text-primary" />
                Ciclos e cobranças
              </CardTitle>
              <CardDescription>
                Ciclos gerados, vínculo com gateway e ações financeiras do contrato.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="item in detalhe.ciclos" :key="item.id"
                class="relative overflow-hidden rounded-xl border border-border bg-background px-3 py-3 shadow-sm">
                <div class="absolute left-0 top-0 h-full w-1"
                  :class="item.status === 'PAGO' ? 'bg-emerald-500' : item.status === 'ATRASADO' ? 'bg-rose-500' : item.status === 'COBRADO' ? 'bg-blue-500' : item.status === 'FALHA' ? 'bg-orange-500' : 'bg-amber-500'" />

                <div class="flex items-start justify-between gap-3 pl-1">
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-semibold text-foreground">{{ item.referencia }}</span>
                      <BadgeCell :label="getStatusCicloMeta(item.status).label"
                        :color="item.status === 'PAGO' ? 'green' : item.status === 'ATRASADO' ? 'red' : item.status === 'COBRADO' ? 'blue' : item.status === 'FALHA' ? 'orange' : 'yellow'"
                        :icon="CalendarClock" :capitalize="false" size="sm" />
                      <BadgeCell :label="formatCurrencyBR(item.valorCobrado)" color="green" :icon="CircleDollarSign"
                        :capitalize="false" size="sm" />
                      <BadgeCell v-if="item.cobranca" :label="item.cobranca.status"
                        :color="item.cobranca.status === 'EFETIVADO' ? 'green' : item.cobranca.status === 'PENDENTE' ? 'yellow' : 'gray'"
                        :icon="Sparkles" :capitalize="false" size="sm" />
                    </div>

                    <p class="text-xs text-muted-foreground">
                      {{ formatDateToPtBR(item.inicioPeriodo) }} → {{ formatDateToPtBR(item.fimPeriodo) }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ (item.gatewayUsado || 'Gateway não informado') }}
                       • 
                      {{ (item.tipoCobrancaUsado || 'Tipo não informado') }}
                    </p>
                    <p v-if="item.cobranca?.idCobranca" class="text-xs text-muted-foreground">
                      Ref. gateway: {{ item.cobranca.idCobranca }}
                    </p>
                    <a v-if="item.cobranca?.externalLink" :href="item.cobranca.externalLink" target="_blank"
                      rel="noreferrer" class="inline-flex text-xs text-primary underline underline-offset-2">
                      Abrir cobrança
                    </a>
                  </div>

                  <CobrancasActions :data="item" :on-changed="loadDetalhe" />
                </div>
              </div>

              <div v-if="!detalhe.ciclos.length"
                class="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Esta assinatura ainda não possui ciclos gerados.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comodatos" class="space-y-4">
          <Card class="border-border">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Package class="h-5 w-5 text-primary" />
                Comodatos
              </CardTitle>
              <CardDescription>
                Itens entregues em comodato vinculados a este contrato.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="item in comodatos" :key="item.id"
                class="rounded-xl border border-border bg-background px-3 py-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-medium text-foreground">{{ item.produto?.nome || 'Produto' }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ item.quantidade }} unidade(s) • entregue em {{ formatDateToPtBR(item.dataEntrega) }}
                    </p>
                    <p v-if="item.identificacao" class="text-xs text-muted-foreground">
                      Identificação: {{ item.identificacao }}
                    </p>
                  </div>
                  <BadgeCell :label="getStatusComodatoMeta(item.status).label"
                    :color="item.status === 'DEVOLVIDO' ? 'green' : item.status === 'PERDIDO' ? 'red' : item.status === 'AVARIADO' ? 'orange' : 'blue'"
                    :icon="Package" :capitalize="false" size="sm" />
                </div>
              </div>

              <div v-if="!comodatos.length"
                class="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Esta assinatura ainda não possui itens em comodato.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" class="space-y-4">
          <Card class="border-border">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <History class="h-5 w-5 text-primary" />
                Histórico
              </CardTitle>
              <CardDescription>
                Eventos registrados para a assinatura, cobrança e operação do contrato.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="item in detalhe.historico" :key="item.id"
                class="rounded-xl border border-border bg-background px-3 py-3">
                <p class="text-sm font-medium text-foreground">{{ item.evento }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ item.autor }} • {{ formatDateToPtBR(item.createdAt, true) }}
                </p>
              </div>

              <div v-if="!detalhe.historico.length"
                class="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Nenhum evento registrado para esta assinatura.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </template>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="router.back()">
        <ArrowLeft class="h-5 w-5" />
        <span class="text-xs">Voltar</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="loadDetalhe(true)">
        <RefreshCcw class="h-5 w-5" :class="loading ? 'animate-spin' : ''" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="activeTab = 'resumo'">
        <FileText class="h-5 w-5" />
        <span class="text-xs">Resumo</span>
      </button>
      <button type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="openGenerateCycleModal">
        <CircleDollarSign class="h-5 w-5" />
        <span class="text-xs">Ciclo</span>
      </button>
    </MobileBottomBar>

    <ModalView v-model:open="cycleModalOpen" title="Gerar ciclo manual"
      description="Essa ação cria um novo ciclo para a assinatura e pode disparar geração automática de lançamento financeiro e cobrança no gateway, conforme a configuração atual do contrato."
      size="sm">
      <div class="space-y-4 px-4">
        <div class="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          <p><strong class="text-foreground">Assinatura:</strong> {{ detalhe?.nomeContrato || '-' }}</p>
          <p><strong class="text-foreground">Próxima cobrança:</strong> {{ detalhe?.proximaCobranca ?
            formatDateToPtBR(detalhe.proximaCobranca) : '-' }}</p>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="cycleLoading" @click="cycleModalOpen = false">
            Cancelar
          </Button>
          <Button type="button" class="text-white" :disabled="cycleLoading" @click="confirmGenerateCycle">
            <RefreshCcw v-if="cycleLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ cycleLoading ? 'Gerando...' : 'Confirmar geração' }}
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
