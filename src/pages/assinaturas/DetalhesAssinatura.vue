<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  FilePenLineIcon,
  FileText,
  History,
  Layers3,
  Package,
  PlusCircle,
  RefreshCcw,
  Repeat,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import DataTable from '@/components/tabela/DataTable.vue'
import {
  AssinaturaRepository,
  type AssinaturaDetalheResponse,
  type AssinaturaItemForm,
  type AssinaturaOption,
  type ModoCobrancaItem,
} from '@/repositories/assinatura-repository'
import { useConfirm } from '@/composables/useConfirm'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import {
  getPeriodicidadeLabel,
  getStatusAssinaturaMeta,
} from './shared'
import { columnsCobrancasAssinatura } from './components/cobrancasColumns'
import { columnsComodatosAssinatura } from './components/comodatosColumns'
import { columnsHistoricoAssinatura } from './components/historicoColumns'

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

const pageTitle = computed(() => detalhe.value?.nomeContrato || 'Detalhes do contrato')
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
      toast.error('Contrato inválido.')
      router.push('/assinaturas/assinaturas')
      return
    }

    loading.value = true
    const response = await AssinaturaRepository.detalhes(subscriptionId.value)
    detalhe.value = response.data
    nextStatus.value = response.data.status

    if (showFeedback) {
      toast.success('Detalhes do contrato atualizados.')
    }
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar os detalhes do contrato.')
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
    toast.error(error?.response?.data?.message || 'Erro ao atualizar o status do contrato.')
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
    refreshTables()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar o ciclo do contrato.')
  } finally {
    cycleLoading.value = false
  }
}

const confirm = useConfirm()

// Filtros server-side das abas (cobranças, comodatos, histórico). `update` força refetch após mutações.
const tableFilters = reactive({ assinaturaId: subscriptionId.value, update: false })
function refreshTables() {
  tableFilters.update = !tableFilters.update
}

// ---- Opções para o modal de adicionar item ----
const opcoesServicos = ref<AssinaturaOption[]>([])
const opcoesProdutos = ref<AssinaturaOption[]>([])
const opcoesLoaded = ref(false)

async function loadOpcoes() {
  if (opcoesLoaded.value) return
  try {
    const { data } = await AssinaturaRepository.opcoes()
    opcoesServicos.value = data.servicos || []
    opcoesProdutos.value = data.produtos || []
    opcoesLoaded.value = true
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar as opções de itens.')
  }
}

const modoCobrancaLabels: Record<ModoCobrancaItem, string> = {
  MENSALIDADE: 'Mensalidade',
  UNICA: 'Cobrança única',
  PARCELADA: 'Cobrança parcelada',
}

function modoCobrancaBadge(modo: ModoCobrancaItem, cobrarVezes?: number | null, vezesCobradas?: number) {
  if (modo === 'PARCELADA') {
    return `Parcelada • ${vezesCobradas ?? 0}/${cobrarVezes ?? 0}`
  }
  return modoCobrancaLabels[modo]
}

// ---- Modal de adicionar item ----
const itemModalOpen = ref(false)
const itemLoading = ref(false)
const removingItemId = ref<number | null>(null)

const itemForm = reactive({
  tipoItem: 'SERVICO' as 'SERVICO' | 'PRODUTO',
  itemId: '' as string,
  descricaoSnapshot: '',
  quantidade: 1,
  valorUnitario: 0,
  cobrar: true,
  comodato: false,
  modoCobranca: 'MENSALIDADE' as ModoCobrancaItem,
  cobrarVezes: undefined as number | undefined,
  identificacao: '',
})

const itemOptions = computed(() =>
  itemForm.tipoItem === 'SERVICO' ? opcoesServicos.value : opcoesProdutos.value,
)

function resetItemForm() {
  itemForm.tipoItem = 'SERVICO'
  itemForm.itemId = ''
  itemForm.descricaoSnapshot = ''
  itemForm.quantidade = 1
  itemForm.valorUnitario = 0
  itemForm.cobrar = true
  itemForm.comodato = false
  itemForm.modoCobranca = 'MENSALIDADE'
  itemForm.cobrarVezes = undefined
  itemForm.identificacao = ''
}

async function openAddItemModal() {
  resetItemForm()
  await loadOpcoes()
  itemModalOpen.value = true
}

function onSelectItemOption(value: string) {
  itemForm.itemId = value
  const option = itemOptions.value.find((opt) => String(opt.id) === String(value))
  if (option && !itemForm.descricaoSnapshot) {
    // O label vem como "Nome • preço"; usa apenas o nome como descrição inicial.
    itemForm.descricaoSnapshot = option.label.split(' • ')[0] || option.label
  }
}

async function submitAddItem() {
  if (!detalhe.value) return
  if (!itemForm.descricaoSnapshot.trim()) {
    toast.error('Informe a descrição do item.')
    return
  }
  if (itemForm.modoCobranca === 'PARCELADA' && (!itemForm.cobrarVezes || itemForm.cobrarVezes < 1)) {
    toast.error('Informe quantas vezes o item será cobrado.')
    return
  }

  const selectedId = itemForm.itemId ? Number(itemForm.itemId) : null
  const payload: AssinaturaItemForm = {
    tipoItem: itemForm.tipoItem,
    servicoId: itemForm.tipoItem === 'SERVICO' ? selectedId : null,
    produtoId: itemForm.tipoItem === 'PRODUTO' ? selectedId : null,
    descricaoSnapshot: itemForm.descricaoSnapshot.trim(),
    quantidade: Number(itemForm.quantidade) || 1,
    valorUnitario: Number(itemForm.valorUnitario) || 0,
    cobrar: itemForm.cobrar,
    comodato: itemForm.comodato,
    modoCobranca: itemForm.modoCobranca,
    cobrarVezes: itemForm.modoCobranca === 'PARCELADA' ? Number(itemForm.cobrarVezes) : null,
    identificacao: itemForm.comodato ? itemForm.identificacao || null : null,
  }

  try {
    itemLoading.value = true
    await AssinaturaRepository.adicionarItem(detalhe.value.id, payload)
    toast.success('Item adicionado ao contrato.')
    itemModalOpen.value = false
    await loadDetalhe()
    refreshTables()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao adicionar o item.')
  } finally {
    itemLoading.value = false
  }
}

async function removeItem(itemId: number, descricao: string) {
  if (!detalhe.value) return
  const ok = await confirm.confirm({
    title: 'Remover item',
    message: `Deseja remover o item "${descricao}" deste contrato?`,
    confirmText: 'Remover',
    colorButton: 'danger',
  })
  if (!ok) return

  try {
    removingItemId.value = itemId
    await AssinaturaRepository.removerItem(detalhe.value.id, itemId)
    toast.success('Item removido do contrato.')
    await loadDetalhe()
    refreshTables()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao remover o item.')
  } finally {
    removingItemId.value = null
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
              <FilePenLineIcon class="h-6 w-6 text-primary" />
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
      Carregando detalhes do contrato...
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
                  <div class="rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Conta financeira dos lançamentos</div>
                    <div class="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Wallet class="h-4 w-4 text-primary" />
                      <span v-if="detalhe.contaFinanceira">
                        {{ detalhe.contaFinanceira.nome }}
                        <span v-if="detalhe.categoria" class="font-normal text-muted-foreground"> • {{ detalhe.categoria.nome }}</span>
                      </span>
                      <span v-else class="font-normal text-muted-foreground">Padrão (primeira conta cadastrada)</span>
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
                    <Button size="sm" variant="outline" class="gap-2" @click="openAddItemModal">
                      <PlusCircle class="h-4 w-4" />
                      Adicionar item
                    </Button>
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
                        <div class="flex flex-wrap items-center gap-2">
                          <BadgeCell :label="item.ativo ? 'Ativo' : 'Inativo'" :color="item.ativo ? 'green' : 'gray'"
                            :icon="Sparkles" :capitalize="false" size="sm" />
                          <BadgeCell
                            :label="modoCobrancaBadge(item.modoCobranca, item.cobrarVezes, item.vezesCobradas)"
                            :color="item.modoCobranca === 'MENSALIDADE' ? 'purple' : item.modoCobranca === 'UNICA' ? 'cyan' : 'yellow'"
                            :icon="Repeat" :capitalize="false" size="sm" />
                          <BadgeCell v-if="item.cobrar" label="Cobrado" color="blue" :icon="CircleDollarSign"
                            :capitalize="false" size="sm" />
                          <BadgeCell v-if="item.comodato" label="Comodato" color="orange" :icon="Package"
                            :capitalize="false" size="sm" />
                          <Button size="icon" variant="ghost"
                            class="h-7 w-7 text-red-600 hover:text-red-600"
                            :disabled="removingItemId === item.id"
                            @click="removeItem(item.id, item.descricaoSnapshot)">
                            <RefreshCcw v-if="removingItemId === item.id" class="h-4 w-4 animate-spin" />
                            <Trash2 v-else class="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Este contrato ainda não possui itens cadastrados.
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
                    <label class="text-sm font-medium">Status do contrato</label>
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
          <DataTable :columns="columnsCobrancasAssinatura" api="/assinaturas/cobrancas/tabela"
            :filters="tableFilters" />
        </TabsContent>

        <TabsContent value="comodatos" class="space-y-4">
          <DataTable :columns="columnsComodatosAssinatura" api="/assinaturas/comodatos/tabela"
            :filters="tableFilters" />
        </TabsContent>

        <TabsContent value="historico" class="space-y-4">
          <DataTable :columns="columnsHistoricoAssinatura" api="/assinaturas/historico/tabela"
            :filters="tableFilters" />
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
      description="Essa ação cria um novo ciclo para o contrato e pode disparar geração automática de lançamento financeiro e cobrança no gateway, conforme a configuração atual."
      size="sm">
      <div class="space-y-4 px-4">
        <div class="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          <p><strong class="text-foreground">Contrato:</strong> {{ detalhe?.nomeContrato || '-' }}</p>
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

    <ModalView v-model:open="itemModalOpen" title="Adicionar item ao contrato"
      description="Defina se o valor entra na mensalidade recorrente, cobra uma única vez ou é parcelado por um número definido de ciclos."
      size="lg">
      <div class="space-y-4 px-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>Tipo</Label>
            <Select v-model="itemForm.tipoItem">
              <SelectTrigger class="w-full bg-card">
                <SelectValue placeholder="Tipo do item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVICO">Serviço</SelectItem>
                <SelectItem value="PRODUTO">Produto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>{{ itemForm.tipoItem === 'SERVICO' ? 'Serviço' : 'Produto' }}</Label>
            <Select :model-value="itemForm.itemId" @update:model-value="(v) => onSelectItemOption(String(v))">
              <SelectTrigger class="w-full bg-card">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in itemOptions" :key="opt.id" :value="String(opt.id)">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label>Descrição</Label>
          <Input v-model="itemForm.descricaoSnapshot" placeholder="Descrição do item no contrato" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>Quantidade</Label>
            <Input v-model.number="itemForm.quantidade" type="number" min="1" />
          </div>
          <div class="space-y-2">
            <Label>Valor unitário</Label>
            <Input v-model.number="itemForm.valorUnitario" type="number" min="0" step="0.01" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>Forma de cobrança</Label>
            <Select v-model="itemForm.modoCobranca">
              <SelectTrigger class="w-full bg-card">
                <SelectValue placeholder="Forma de cobrança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSALIDADE">Sempre (entra na mensalidade)</SelectItem>
                <SelectItem value="UNICA">Uma única vez</SelectItem>
                <SelectItem value="PARCELADA">Cobrar N vezes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="itemForm.modoCobranca === 'PARCELADA'" class="space-y-2">
            <Label>Cobrar por (vezes)</Label>
            <Input v-model.number="itemForm.cobrarVezes" type="number" min="1" placeholder="Ex.: 3" />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-6">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <Checkbox :model-value="itemForm.cobrar" @update:model-value="(v) => (itemForm.cobrar = Boolean(v))" />
            Cobrar este item
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <Checkbox :model-value="itemForm.comodato" @update:model-value="(v) => (itemForm.comodato = Boolean(v))" />
            É comodato
          </label>
        </div>

        <div v-if="itemForm.comodato" class="space-y-2">
          <Label>Identificação do comodato</Label>
          <Input v-model="itemForm.identificacao" placeholder="Nº de série, patrimônio, etc." />
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="itemLoading" @click="itemModalOpen = false">
            Cancelar
          </Button>
          <Button type="button" class="text-white" :disabled="itemLoading" @click="submitAddItem">
            <RefreshCcw v-if="itemLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ itemLoading ? 'Salvando...' : 'Adicionar item' }}
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
