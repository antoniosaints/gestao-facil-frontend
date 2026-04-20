<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  History,
  Layers3,
  Package,
  RefreshCcw,
  Sparkles,
} from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
const activeTab = ref<'cobrancas' | 'comodatos' | 'historico'>('cobrancas')

const subscriptionId = computed(() => Number(route.params.id || route.query.id || 0))
const comodatos = computed(() => detalhe.value?.itens.flatMap((entry) => entry.comodatos) || [])

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
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:flex-row md:items-start md:justify-between">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <Badge v-if="detalhe" :class="getStatusAssinaturaMeta(detalhe.status).className">
            {{ getStatusAssinaturaMeta(detalhe.status).label }}
          </Badge>
          <Badge v-if="detalhe?.plano" variant="outline">Plano {{ detalhe.plano.nome }}</Badge>
        </div>
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Sparkles class="h-5 w-5 text-primary" />
            {{ detalhe?.nomeContrato || 'Detalhes da assinatura' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ detalhe?.cliente?.nome || 'Cliente não informado' }} • {{ detalhe?.Uid || '-' }}
          </p>
        </div>
      </div>

      <div class="hidden flex-wrap items-center gap-2 md:flex">
        <Button variant="outline" class="gap-2" @click="router.back()">
          <ArrowLeft class="h-4 w-4" /> Voltar
        </Button>
        <Button variant="outline" class="gap-2" @click="loadDetalhe(true)">
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" /> Atualizar
        </Button>
        <Button class="gap-2" @click="openGenerateCycleModal">
          <CircleDollarSign class="h-4 w-4" /> Gerar ciclo
        </Button>
      </div>
    </div>

    <div v-if="loading && !detalhe" class="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
      Carregando detalhes da assinatura...
    </div>

    <template v-else-if="detalhe">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card class="shadow-sm">
          <CardHeader class="py-3">
            <CardTitle class="text-sm">Valor atual</CardTitle>
          </CardHeader>
          <CardContent class="pb-3">
            <p class="text-2xl font-semibold text-foreground">{{ formatCurrencyBR(detalhe.valorAtual) }}</p>
            <p class="text-xs text-muted-foreground">Modo {{ detalhe.modoValor.toLowerCase() }}</p>
          </CardContent>
        </Card>
        <Card class="shadow-sm">
          <CardHeader class="py-3">
            <CardTitle class="text-sm">Periodicidade</CardTitle>
          </CardHeader>
          <CardContent class="pb-3">
            <p class="text-2xl font-semibold text-foreground">{{ getPeriodicidadeLabel(detalhe.periodicidade) }}</p>
            <p class="text-xs text-muted-foreground">Próxima cobrança {{ formatDateToPtBR(detalhe.proximaCobranca) }}</p>
          </CardContent>
        </Card>
        <Card class="shadow-sm">
          <CardHeader class="py-3">
            <CardTitle class="text-sm">Itens / comodatos</CardTitle>
          </CardHeader>
          <CardContent class="pb-3">
            <p class="text-2xl font-semibold text-foreground">{{ detalhe.resumo.itens }}</p>
            <p class="text-xs text-muted-foreground">{{ detalhe.resumo.comodatos }} comodato(s) vinculado(s)</p>
          </CardContent>
        </Card>
        <Card class="shadow-sm">
          <CardHeader class="py-3">
            <CardTitle class="text-sm">Pendências</CardTitle>
          </CardHeader>
          <CardContent class="pb-3">
            <p class="text-2xl font-semibold text-foreground">{{ detalhe.resumo.ciclosPendentes + detalhe.resumo.ciclosAtrasados }}</p>
            <p class="text-xs text-muted-foreground">{{ detalhe.resumo.ciclosPendentes }} pendente(s) • {{ detalhe.resumo.ciclosAtrasados }} atrasado(s)</p>
          </CardContent>
        </Card>
      </section>

      <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card class="shadow-sm">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <Layers3 class="h-5 w-5 text-primary" /> Resumo do contrato
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-border/60 bg-muted/10 px-4 py-2">
                <p class="text-sm text-muted-foreground">Período</p>
                <p class="mt-1 text-sm font-medium text-foreground">
                  {{ formatDateToPtBR(detalhe.inicio) }}
                  <span v-if="detalhe.fim">→ {{ formatDateToPtBR(detalhe.fim) }}</span>
                  <span v-else>• recorrência indefinida</span>
                </p>
              </div>
              <div class="rounded-xl border border-border/60 bg-muted/10 px-4 py-2">
                <p class="text-sm text-muted-foreground">Cobrança padrão</p>
                <p class="mt-1 text-sm font-medium text-foreground">
                  {{ detalhe.gateway || 'Gateway não informado' }} • {{ detalhe.tipoCobranca || 'Tipo não informado' }}
                </p>
              </div>
              <div class="rounded-xl border border-border/60 bg-muted/10 px-4 py-2">
                <p class="text-sm text-muted-foreground">Plano vinculado</p>
                <p class="mt-1 text-sm font-medium text-foreground">{{ detalhe.plano?.nome || 'Sem plano base' }}</p>
              </div>
              <div class="rounded-xl border border-border/60 bg-muted/10 px-4 py-2">
                <p class="text-sm text-muted-foreground">Automação</p>
                <p class="mt-1 text-sm font-medium text-foreground">
                  {{ detalhe.cobrancaAutomatica ? 'Cobrança automática habilitada' : 'Cobrança manual/assistida' }}
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
              <p class="text-sm text-muted-foreground">Observações</p>
              <p class="mt-2 text-sm leading-relaxed text-foreground">{{ detalhe.observacoes || 'Nenhuma observação cadastrada.' }}</p>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-sm">
          <CardHeader>
            <CardTitle class="text-lg">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="space-y-2">
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
              {{ statusLoading ? 'Atualizando...' : 'Atualizar status' }}
            </Button>
            <Button class="w-full gap-2" @click="openGenerateCycleModal">
              <CircleDollarSign class="h-4 w-4" /> Gerar novo ciclo
            </Button>
            <RouterLink to="/assinaturas/cobrancas">
              <Button variant="outline" class="w-full">Ver todas as cobranças</Button>
            </RouterLink>
          </CardContent>
        </Card>
      </div>

      <Card class="shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Sparkles class="h-5 w-5 text-primary" /> Itens contratados
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="item in detalhe.itens" :key="item.id" class="rounded-md border border-border/60 bg-muted/10 px-4 py-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium text-foreground">{{ item.descricaoSnapshot }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ item.tipoItem }} • {{ item.quantidade }} × {{ formatCurrencyBR(item.valorUnitario) }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge :class="item.ativo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'">
                  {{ item.ativo ? 'Ativo' : 'Inativo' }}
                </Badge>
                <Badge v-if="item.cobrar" class="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Cobrado</Badge>
                <Badge v-if="item.comodato" class="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">Comodato</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs v-model="activeTab" default-value="cobrancas" class="space-y-2">
        <TabsList class="w-full justify-start rounded-b-lg overflow-x-auto">
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

        <TabsContent value="cobrancas" class="space-y-4">
          <Card class="shadow-sm">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-lg">
                <CalendarClock class="h-5 w-5 text-primary" /> Ciclos e cobranças
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div
                v-for="item in detalhe.ciclos"
                :key="item.id"
                class="rounded-md border border-border/60 bg-muted/10 px-4 py-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="space-y-1">
                    <p class="font-medium text-foreground">Referência {{ item.referencia }}</p>
                    <p class="text-sm text-muted-foreground">{{ formatDateToPtBR(item.inicioPeriodo) }} → {{ formatDateToPtBR(item.fimPeriodo) }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ item.gatewayUsado || 'Gateway não informado' }} • {{ item.tipoCobrancaUsado || 'Tipo não informado' }}
                    </p>
                    <p v-if="item.cobranca?.idCobranca" class="text-xs text-muted-foreground">
                      Ref. gateway: {{ item.cobranca.idCobranca }}
                    </p>
                    <a
                      v-if="item.cobranca?.externalLink"
                      :href="item.cobranca.externalLink"
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex text-xs text-primary underline underline-offset-2"
                    >
                      Abrir cobrança
                    </a>
                  </div>
                  <div class="flex items-start gap-2">
                    <div class="flex flex-wrap gap-2">
                      <Badge :class="getStatusCicloMeta(item.status).className">
                        {{ getStatusCicloMeta(item.status).label }}
                      </Badge>
                      <Badge class="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {{ formatCurrencyBR(item.valorCobrado) }}
                      </Badge>
                      <Badge
                        v-if="item.cobranca"
                        :class="item.cobranca.status === 'EFETIVADO'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : item.cobranca.status === 'PENDENTE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'"
                      >
                        {{ item.cobranca.status }}
                      </Badge>
                    </div>
                    <CobrancasActions :data="item" :on-changed="loadDetalhe" />
                  </div>
                </div>
              </div>
              <div v-if="!detalhe.ciclos.length" class="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Esta assinatura ainda não possui ciclos gerados.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comodatos" class="space-y-4">
          <Card class="shadow-sm">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-lg">
                <Package class="h-5 w-5 text-primary" /> Comodatos
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="item in comodatos" :key="item.id" class="rounded-2xl border border-border/60 bg-muted/10 p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-medium text-foreground">{{ item.produto?.nome || 'Produto' }}</p>
                    <p class="text-sm text-muted-foreground">{{ item.quantidade }} unidade(s) • entregue em {{ formatDateToPtBR(item.dataEntrega) }}</p>
                    <p v-if="item.identificacao" class="text-xs text-muted-foreground">Identificação: {{ item.identificacao }}</p>
                  </div>
                  <Badge :class="getStatusComodatoMeta(item.status).className">
                    {{ getStatusComodatoMeta(item.status).label }}
                  </Badge>
                </div>
              </div>
              <div v-if="!comodatos.length" class="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Esta assinatura ainda não possui itens em comodato.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" class="space-y-4">
          <Card class="shadow-sm">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-lg">
                <History class="h-5 w-5 text-primary" /> Histórico
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="item in detalhe.historico" :key="item.id" class="rounded-md border border-border/60 bg-muted/10 px-4 py-2">
                <p class="font-medium text-foreground">{{ item.evento }}</p>
                <p class="text-sm text-muted-foreground">{{ item.autor }} • {{ formatDateToPtBR(item.createdAt, true) }}</p>
              </div>
              <div v-if="!detalhe.historico.length" class="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Nenhum evento registrado para esta assinatura.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </template>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="router.back()">
        <ArrowLeft class="h-5 w-5" />
        <span class="text-xs">Voltar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="loadDetalhe(true)">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="openGenerateCycleModal">
        <CircleDollarSign class="h-5 w-5" />
        <span class="text-xs">Ciclo</span>
      </button>
      <RouterLink to="/assinaturas/cobrancas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <CalendarClock class="h-5 w-5" />
        <span class="text-xs">Cobranças</span>
      </RouterLink>
    </MobileBottomBar>

    <ModalView
      v-model:open="cycleModalOpen"
      title="Gerar ciclo manual"
      description="Essa ação cria um novo ciclo para a assinatura e pode disparar geração automática de lançamento financeiro e cobrança no gateway, conforme a configuração atual do contrato."
      size="sm"
    >
      <div class="space-y-4 px-4">
        <div class="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          <p><strong class="text-foreground">Assinatura:</strong> {{ detalhe?.nomeContrato || '-' }}</p>
          <p><strong class="text-foreground">Próxima cobrança:</strong> {{ detalhe?.proximaCobranca ? formatDateToPtBR(detalhe.proximaCobranca) : '-' }}</p>
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
