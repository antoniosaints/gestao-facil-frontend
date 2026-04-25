<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { addDays, format } from 'date-fns'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import type { ItensOrdensServico } from '@/types/schemas'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  BadgeCheck,
  Box,
  Calendar,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Cog,
  FileArchive,
  FileClock,
  FileText,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessageCircleMore,
  OctagonX,
  Package,
  PenLine,
  Phone,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-vue-next'

type BadgeColor = 'cyan' | 'yellow' | 'gray' | 'violet' | 'purple' | 'green' | 'emerald' | 'orange' | 'red' | 'blue'

const store = useOrdemServicoStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()
const toast = useToast()
const confirm = useConfirm()

const activeTab = ref('geral')
const novaMensagem = ref('')
const sendingMessage = ref(false)
const exportingPdf = ref<'default' | 'pix' | null>(null)

const ordem = computed(() => store.ordemDetalhe ?? null)
const itens = computed(() => ordem.value?.ItensOrdensServico ?? [])
const produtos = computed(() => itens.value.filter((item) => item.tipo === 'PRODUTO'))
const servicos = computed(() => itens.value.filter((item) => item.tipo === 'SERVICO'))
const mensagens = computed(() => ordem.value?.MensagensInteracoesOrdemServico ?? [])
const cobrancas = computed(() => ordem.value?.CobrancasFinanceiras ?? [])

const subtotal = computed(() =>
  itens.value.reduce((total, item) => total + Number(item.valor || 0) * Number(item.quantidade || 0), 0),
)
const desconto = computed(() => Number(ordem.value?.desconto ?? 0))
const totalFinal = computed(() => subtotal.value - desconto.value)
const quantidadeItens = computed(() => itens.value.reduce((total, item) => total + Number(item.quantidade || 0), 0))
const quantidadeProdutos = computed(() =>
  produtos.value.reduce((total, item) => total + Number(item.quantidade || 0), 0),
)
const quantidadeServicos = computed(() =>
  servicos.value.reduce((total, item) => total + Number(item.quantidade || 0), 0),
)
const statusMeta = computed(() => getStatusMeta(ordem.value?.status))

const garantiaLabel = computed(() => {
  if (!ordem.value?.garantia) return 'Não informada'

  const dias = Number(ordem.value.garantia)
  if (!dias) return 'Não informada'

  const dataBase = new Date(ordem.value.data)
  if (Number.isNaN(dataBase.getTime())) return `${dias} dia(s)`

  return `${dias} dia(s) • até ${format(addDays(dataBase, dias), 'dd/MM/yyyy')}`
})

function formatDateSafe(value?: string | Date | null, pattern: string = 'dd/MM/yyyy') {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return format(date, pattern)
}

function getStatusMeta(status?: string) {
  switch (status) {
    case 'ABERTA':
      return { label: 'Aberta', color: 'cyan' as BadgeColor, icon: FileClock }
    case 'ORCAMENTO':
      return { label: 'Orçamento', color: 'gray' as BadgeColor, icon: FileText }
    case 'APROVADA':
      return { label: 'Aprovada', color: 'purple' as BadgeColor, icon: BadgeCheck }
    case 'ANDAMENTO':
      return { label: 'Em andamento', color: 'blue' as BadgeColor, icon: Wrench }
    case 'FATURADA':
      return { label: 'Faturada', color: 'emerald' as BadgeColor, icon: CircleDollarSign }
    case 'CANCELADA':
      return { label: 'Cancelada', color: 'red' as BadgeColor, icon: CircleAlert }
    default:
      return { label: status || 'Sem status', color: 'gray' as BadgeColor, icon: FileText }
  }
}

function getMessageTypeMeta(tipo?: string) {
  if (tipo === 'ABERTURA') {
    return {
      label: 'Abertura',
      color: 'cyan' as BadgeColor,
      icon: FileClock,
      containerClass: 'border-cyan-200 bg-cyan-50 dark:border-cyan-900/70 dark:bg-cyan-950/30',
    }
  }

  if (tipo === 'ENCERRAMENTO') {
    return {
      label: 'Encerramento',
      color: 'emerald' as BadgeColor,
      icon: BadgeCheck,
      containerClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/30',
    }
  }

  return {
    label: 'Mensagem',
    color: 'blue' as BadgeColor,
    icon: MessageCircleMore,
    containerClass: 'border-blue-200 bg-blue-50 dark:border-blue-900/70 dark:bg-blue-950/20',
  }
}

function getInitials(nome?: string | null) {
  if (!nome) return 'OS'

  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getItemTotal(item: ItensOrdensServico) {
  return Number(item.valor || 0) * Number(item.quantidade || 0)
}

function buildItemKey(item: ItensOrdensServico, index: number) {
  return item.id ?? `${item.tipo}-${item.itemName}-${index}`
}

function getItemTypeBadge(tipo: ItensOrdensServico['tipo']) {
  if (tipo === 'PRODUTO') {
    return { label: 'Produto', color: 'emerald' as BadgeColor, icon: Package }
  }

  return { label: 'Serviço', color: 'yellow' as BadgeColor, icon: ShieldCheck }
}

async function enviarMensagem() {
  const mensagem = novaMensagem.value.trim()
  const ordemId = ordem.value?.id

  if (!mensagem || !ordemId || sendingMessage.value) return

  try {
    sendingMessage.value = true
    await OrdensServicoRepository.addMensagem(ordemId, mensagem)
    novaMensagem.value = ''
    await store.reloadDetalhes()
    activeTab.value = 'mensagens'
    toast.success('Mensagem enviada com sucesso.')
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao enviar mensagem para a OS.')
  } finally {
    sendingMessage.value = false
  }
}

async function gerarPdf(withPix: boolean = false) {
  if (!ordem.value?.id || !ordem.value?.Uid || exportingPdf.value) return

  try {
    exportingPdf.value = withPix ? 'pix' : 'default'
    await OrdensServicoRepository.getOsPdf(ordem.value.id, ordem.value.Uid, withPix)
    toast.success(withPix ? 'PDF da OS com PIX gerado com sucesso.' : 'PDF da OS gerado com sucesso.')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar o PDF da OS.')
  } finally {
    exportingPdf.value = null
  }
}

async function editarOrdem() {
  if (!ordem.value?.id) return
  const id = ordem.value.id
  store.openModalDetalheOs = false
  await store.openUpdate(id)
}

function abrirFaturamento() {
  if (!ordem.value?.id) return
  store.idMutation = ordem.value.id
  store.openModalFaturar = true
}

function abrirCobranca() {
  if (!ordem.value?.id) return
  storeCobranca.openSave({
    id: ordem.value.id,
    tipo: 'os',
    valor: totalFinal.value,
  })
}

async function estornarFaturamento() {
  if (!ordem.value?.id) return

  const ok = await confirm.confirm({
    title: 'Estornar faturamento',
    message: 'Tem certeza que deseja estornar o faturamento desta OS?',
    confirmText: 'Sim, estornar',
  })

  if (!ok) return

  try {
    await OrdensServicoRepository.estornar(ordem.value.id)
    toast.success('OS estornada com sucesso.')
    await store.reloadDetalhes()
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar o faturamento da OS.')
  }
}

function handleComposerKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    void enviarMensagem()
  }
}

watch(
  () => store.openModalDetalheOs,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = 'geral'
      return
    }

    novaMensagem.value = ''
    sendingMessage.value = false
    exportingPdf.value = null
  },
)

watch(
  () => ordem.value?.id,
  () => {
    novaMensagem.value = ''
    activeTab.value = 'geral'
  },
)

watch(
  () => storeCobranca.filters.update,
  () => {
    if (store.openModalDetalheOs) {
      void store.reloadDetalhes()
    }
  },
)
</script>

<template>
  <ModalView
    v-model:open="store.openModalDetalheOs"
    size="5xl"
    title="Detalhes da OS"
    description="Resumo operacional, itens vinculados e histórico de mensagens da ordem de serviço."
  >
    <div v-if="store.loadingDetalhe" class="px-4 py-8 transition-all animate-pulse">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Carregando detalhes da OS</EmptyTitle>
          <EmptyDescription>Buscando o resumo, itens e histórico mais recente da ordem.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else-if="ordem" class="space-y-2 px-4">
      <div class="rounded-xl border border-border bg-background p-4 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0 space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-xl font-semibold text-blue-500 dark:text-blue-400">
                {{ `#${ordem.Uid || ordem.id}` }}
              </div>
              <BadgeCell
                :label="statusMeta.label"
                :color="statusMeta.color"
                :icon="statusMeta.icon"
                :capitalize="false"
                size="sm"
              />
              <BadgeCell
                :label="`${mensagens.length} mensagem(ns)`"
                color="blue"
                :icon="MessageCircleMore"
                :capitalize="false"
                size="sm"
              />
            </div>

            <div class="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-lg border border-border bg-card px-3 py-3">
                <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <UserRound class="h-3.5 w-3.5 text-cyan-500" />
                  Cliente
                </div>
                <div class="font-medium text-foreground">{{ ordem.Cliente?.nome || 'Não informado' }}</div>
                <div class="mt-1 text-xs text-muted-foreground">{{ ordem.Cliente?.email || 'Sem e-mail' }}</div>
              </div>

              <div class="rounded-lg border border-border bg-card px-3 py-3">
                <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Phone class="h-3.5 w-3.5 text-emerald-500" />
                  Contato
                </div>
                <div class="font-medium text-foreground">{{ ordem.Cliente?.telefone || 'Não informado' }}</div>
                <div class="mt-1 text-xs text-muted-foreground">{{ ordem.Cliente?.email || 'Sem e-mail' }}</div>
              </div>

              <div class="rounded-lg border border-border bg-card px-3 py-3 sm:col-span-2 xl:col-span-1">
                <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Wrench class="h-3.5 w-3.5 text-violet-500" />
                  Responsável
                </div>
                <div class="font-medium text-foreground truncate">{{ ordem.Operador?.nome || 'Não informado' }}</div>
                <div class="mt-1 text-xs text-muted-foreground">Abertura em {{ formatDateSafe(ordem.data) }}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 xl:w-[360px]">
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Total final</div>
              <div class="mt-1 text-lg font-semibold text-foreground">{{ formatCurrencyBR(totalFinal) }}</div>
            </div>
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Itens</div>
              <div class="mt-1 text-lg font-semibold text-foreground">{{ quantidadeItens }}</div>
            </div>
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Produtos</div>
              <div class="mt-1 text-lg font-semibold text-foreground">{{ quantidadeProdutos }}</div>
            </div>
            <div class="rounded-lg border border-border bg-card px-3 py-2">
              <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Serviços</div>
              <div class="mt-1 text-lg font-semibold text-foreground">{{ quantidadeServicos }}</div>
            </div>
          </div>
        </div>

        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="outline" @click="editarOrdem">
            <PenLine class="mr-2 h-4 w-4 text-violet-500" />
            Editar OS
          </Button>
          <Button v-if="ordem.status !== 'FATURADA'" type="button" @click="abrirFaturamento">
            <ReceiptText class="mr-2 h-4 w-4" />
            Faturar OS
          </Button>
          <Button v-else type="button" class="bg-warning text-white hover:bg-warning/80" @click="estornarFaturamento">
            <ReceiptText class="mr-2 h-4 w-4" />
            Estornar faturamento
          </Button>
          <Button v-if="uiStore.canCreateCharge" type="button" variant="outline" @click="abrirCobranca">
            <CircleDollarSign class="mr-2 h-4 w-4 text-emerald-500" />
            Gerar cobrança
          </Button>
          <Button type="button" variant="outline" :disabled="exportingPdf !== null" @click="gerarPdf(false)">
            <LoaderCircle v-if="exportingPdf === 'default'" class="mr-2 h-4 w-4 animate-spin" />
            <FileArchive v-else class="mr-2 h-4 w-4 text-blue-500" />
            PDF A4
          </Button>
          <Button type="button" variant="outline" :disabled="exportingPdf !== null" @click="gerarPdf(true)">
            <LoaderCircle v-if="exportingPdf === 'pix'" class="mr-2 h-4 w-4 animate-spin" />
            <CircleDollarSign v-else class="mr-2 h-4 w-4 text-emerald-500" />
            PDF + PIX
          </Button>
          <Button type="button" variant="outline" @click="store.reloadDetalhes()" :disabled="store.loadingDetalhe">
            <RefreshCw :class="['mr-2 h-4 w-4', store.loadingDetalhe ? 'animate-spin' : 'text-cyan-500']" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs v-model="activeTab" class="w-full">
        <div class="overflow-auto pb-0">
          <TabsList class="grid w-full min-w-[720px] grid-cols-4 rounded-lg">
            <TabsTrigger value="geral"><span class="flex items-center gap-2"><Cog class="h-4 w-4" /> Geral</span></TabsTrigger>
            <TabsTrigger value="mensagens"><span class="flex items-center gap-2"><MessageCircle class="h-4 w-4" />Mensagens - {{ mensagens.length }}</span></TabsTrigger>
            <TabsTrigger value="produtos"><span class="flex items-center gap-2"><Box class="h-4 w-4" />Produtos - {{ produtos.length }}</span></TabsTrigger>
            <TabsTrigger value="servicos"><span class="flex items-center gap-2"><Wrench class="h-4 w-4" />Serviços - {{ servicos.length }}</span></TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral" class="mt-2 space-y-4">
          <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div class="space-y-4">
              <div class="rounded-xl border border-border bg-background p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText class="h-4 w-4 text-cyan-500" />
                  Observações registradas
                </div>
                <Separator class="my-3" />
                <div class="grid gap-3">
                  <div class="rounded-lg border border-cyan-100 bg-cyan-50/60 px-3 py-3 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                    <div class="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Descrição técnica</div>
                    <div class="text-sm text-foreground whitespace-pre-wrap">
                      {{ ordem.descricao || 'Nenhuma descrição técnica informada.' }}
                    </div>
                  </div>
                  <div class="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-3 dark:border-violet-900/40 dark:bg-violet-950/20">
                    <div class="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Descrição do cliente</div>
                    <div class="text-sm text-foreground whitespace-pre-wrap">
                      {{ ordem.descricaoCliente || 'Nenhuma observação do cliente registrada.' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-border bg-background p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ReceiptText class="h-4 w-4 text-emerald-500" />
                  Composição da OS
                </div>
                <Separator class="my-3" />
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-lg border border-border bg-card px-3 py-3">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Produtos vinculados</div>
                    <div class="mt-1 text-base font-semibold text-foreground">{{ produtos.length }}</div>
                    <div class="text-xs text-muted-foreground">{{ quantidadeProdutos }} unidade(s) no total</div>
                  </div>
                  <div class="rounded-lg border border-border bg-card px-3 py-3">
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Serviços vinculados</div>
                    <div class="mt-1 text-base font-semibold text-foreground">{{ servicos.length }}</div>
                    <div class="text-xs text-muted-foreground">{{ quantidadeServicos }} unidade(s) no total</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-xl border border-border bg-background p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CircleDollarSign class="h-4 w-4 text-emerald-500" />
                  Resumo financeiro
                </div>
                <Separator class="my-3" />
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-muted-foreground">Subtotal</span>
                    <span class="font-medium text-foreground">{{ formatCurrencyBR(subtotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-muted-foreground">Desconto</span>
                    <span class="font-medium text-foreground">{{ formatCurrencyBR(desconto) }}</span>
                  </div>
                  <Separator />
                  <div class="flex items-center justify-between gap-3 text-base font-semibold">
                    <span class="text-foreground">Total final</span>
                    <span class="text-foreground">{{ formatCurrencyBR(totalFinal) }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-border bg-background p-4">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CircleDollarSign class="h-4 w-4 text-blue-500" />
                    Cobranças vinculadas
                  </div>
                  <Button v-if="uiStore.canCreateCharge" type="button" variant="outline" size="sm" @click="abrirCobranca">
                    Nova cobrança
                  </Button>
                </div>
                <Separator class="my-3" />
                <div v-if="cobrancas.length" class="space-y-2">
                  <div v-for="cobranca in cobrancas" :key="cobranca.id" class="rounded-lg border border-border bg-card px-3 py-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="font-medium text-foreground">{{ formatCurrencyBR(Number(cobranca.valor || 0)) }}</div>
                        <div class="text-xs text-muted-foreground">
                          {{ cobranca.gateway }} • {{ cobranca.status }}
                        </div>
                      </div>
                      <a
                        v-if="cobranca.externalLink"
                        :href="cobranca.externalLink"
                        target="_blank"
                        class="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Abrir cobrança
                      </a>
                    </div>
                  </div>
                </div>
                <div v-else class="rounded-lg border border-dashed border-border bg-card px-3 py-4 text-sm text-muted-foreground">
                  Nenhuma cobrança vinculada a esta OS.
                </div>
              </div>

              <div class="rounded-xl border border-border bg-background p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calendar class="h-4 w-4 text-violet-500" />
                  Atendimento
                </div>
                <Separator class="my-3" />
                <div class="space-y-3 text-sm">
                  <div>
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Data de abertura</div>
                    <div class="font-medium text-foreground">{{ formatDateSafe(ordem.data, 'dd/MM/yyyy HH:mm') }}</div>
                  </div>
                  <div>
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Garantia</div>
                    <div class="font-medium text-foreground">{{ garantiaLabel }}</div>
                  </div>
                  <div>
                    <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Contato principal</div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 text-foreground">
                        <Phone class="h-3.5 w-3.5 text-emerald-500" />
                        {{ ordem.Cliente?.telefone || 'Não informado' }}
                      </div>
                      <div class="flex items-center gap-2 text-foreground">
                        <Mail class="h-3.5 w-3.5 text-cyan-500" />
                        {{ ordem.Cliente?.email || 'Não informado' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mensagens" class="mt-4 space-y-4">
          <div class="rounded-xl bg-background">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="font-medium text-foreground">Linha do tempo da OS</div>
                <div class="text-xs text-muted-foreground">
                  Abertura, interações internas e registros finais ficam concentrados aqui.
                </div>
              </div>
              <Button type="button" variant="outline" @click="store.reloadDetalhes()" :disabled="store.loadingDetalhe">
                <RefreshCw :class="['h-4 w-4', store.loadingDetalhe ? 'animate-spin' : 'text-cyan-500']" />
                Atualizar
              </Button>
            </div>

            <Separator class="my-4" />

            <ScrollArea class="rounded-xl border border-border bg-muted/20 p-4">
              <div v-if="mensagens.length" class="space-y-2">
                <div
                  v-for="(msg, index) in mensagens"
                  :key="msg.id ?? `${msg.tipo}-${index}`"
                  class="rounded-xl border px-3 py-2"
                  :class="getMessageTypeMeta(msg.tipo).containerClass"
                >
                  <div class="flex items-start gap-3">
                    <Avatar class="mt-0.5 bg-background" size="sm">
                      <AvatarFallback>{{ getInitials(msg.Autor?.nome || 'Sistema') }}</AvatarFallback>
                    </Avatar>

                    <div class="min-w-0 flex-1 space-y-2">
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div class="min-w-0">
                          <div class="font-medium text-foreground">{{ msg.Autor?.nome || 'Sistema' }}</div>
                          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <BadgeCell
                              :label="getMessageTypeMeta(msg.tipo).label"
                              :color="getMessageTypeMeta(msg.tipo).color"
                              :icon="getMessageTypeMeta(msg.tipo).icon"
                              :capitalize="false"
                              size="sm"
                            />
                            <span class="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5">
                              <Clock3 class="h-3 w-3 text-violet-500" />
                              {{ formatDateSafe(msg.data, 'dd/MM/yyyy HH:mm') }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="text-xs text-foreground whitespace-pre-wrap">
                        {{ msg.mensagem }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="flex h-full items-center justify-center">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageCircleMore class="h-5 w-5" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma mensagem registrada</EmptyTitle>
                    <EmptyDescription>
                      Use o campo abaixo para iniciar a conversa desta ordem de serviço.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            </ScrollArea>

            <div class="mt-4 space-y-2">
              <Textarea
                v-model="novaMensagem"
                rows="4"
                placeholder="Escreva uma atualização para a equipe ou um registro interno da ordem..."
                @keydown="handleComposerKeydown"
              />
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs text-muted-foreground">Dica: use Ctrl/Cmd + Enter para enviar rapidamente.</p>
                <Button
                  type="button"
                  class="text-white"
                  :disabled="!novaMensagem.trim() || sendingMessage"
                  @click="enviarMensagem"
                >
                  <LoaderCircle v-if="sendingMessage" class="h-4 w-4 animate-spin" />
                  <Send v-else class="h-4 w-4" />
                  Enviar mensagem
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="produtos" class="mt-4">
          <div class="rounded-xl bg-background">
            <div class="flex items-center gap-2 text-sm font-medium text-foreground">
              <Package class="h-4 w-4 text-emerald-500" />
              Produtos vinculados
            </div>
            <div class="text-xs text-muted-foreground">Itens físicos consumidos ou reservados nesta ordem.</div>

            <Separator class="my-4" />

            <div v-if="produtos.length" class="grid gap-3 lg:grid-cols-2">
              <div
                v-for="(item, index) in produtos"
                :key="buildItemKey(item, index)"
                class="rounded-xl border border-border bg-card px-4 py-2"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 space-y-0">
                    <BadgeCell
                      :label="getItemTypeBadge(item.tipo).label"
                      :color="getItemTypeBadge(item.tipo).color"
                      :icon="getItemTypeBadge(item.tipo).icon"
                      :capitalize="false"
                      size="sm"
                    />
                    <div class="font-medium text-foreground">{{ item.itemName }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ item.quantidade }} x {{ formatCurrencyBR(Number(item.valor || 0)) }}
                    </div>
                  </div>
                  <div class="text-right text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(getItemTotal(item)) }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="py-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Box class="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum produto vinculado</EmptyTitle>
                  <EmptyDescription>Esta OS não possui produtos registrados até o momento.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="servicos" class="mt-4">
          <div class="rounded-xl bg-background">
            <div class="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck class="h-4 w-4 text-yellow-500" />
              Serviços vinculados
            </div>
            <div class="text-xs text-muted-foreground">Execuções previstas, aprovadas ou já aplicadas nesta OS.</div>

            <Separator class="my-4" />

            <div v-if="servicos.length" class="grid gap-3 lg:grid-cols-2">
              <div
                v-for="(item, index) in servicos"
                :key="buildItemKey(item, index)"
                class="rounded-xl border border-border bg-card p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 space-y-2">
                    <BadgeCell
                      :label="getItemTypeBadge(item.tipo).label"
                      :color="getItemTypeBadge(item.tipo).color"
                      :icon="getItemTypeBadge(item.tipo).icon"
                      :capitalize="false"
                      size="sm"
                    />
                    <div class="font-medium text-foreground">{{ item.itemName }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ item.quantidade }} x {{ formatCurrencyBR(Number(item.valor || 0)) }}
                    </div>
                  </div>
                  <div class="text-right text-sm font-semibold text-foreground">
                    {{ formatCurrencyBR(getItemTotal(item)) }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="py-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShieldCheck class="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum serviço vinculado</EmptyTitle>
                  <EmptyDescription>Esta OS não possui serviços registrados até o momento.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <div v-else class="px-4 py-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText class="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>Detalhes indisponíveis</EmptyTitle>
          <EmptyDescription>Não foi possível carregar a ordem de serviço selecionada.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div class="mt-4 flex justify-end gap-2 px-4">
      <Button type="button" variant="outline" @click="store.reloadDetalhes()" :disabled="store.loadingDetalhe || !ordem">
        <RefreshCw :class="['h-4 w-4', store.loadingDetalhe ? 'animate-spin' : 'text-cyan-500']" />
        Recarregar
      </Button>
      <Button type="button" variant="secondary" @click="store.openModalDetalheOs = false">
        <OctagonX class="h-4 w-4" />
        Fechar
      </Button>
    </div>
  </ModalView>
</template>
