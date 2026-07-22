<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { addDays, format } from 'date-fns'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import ItensOrdemLista from './ItensOrdemLista.vue'
import { OrdensServicoRepository } from '@/repositories/os-repository'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  BadgeCheck,
  Box,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Cog,
  FileArchive,
  FileClock,
  FileText,
  Inbox,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessageCircleMore,
  MoreVertical,
  OctagonX,
  Package,
  PenLine,
  Phone,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
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

// Mesma leitura de relance do painel de caixas: número grande, rótulo curto e
// um detalhe de apoio, para não obrigar a somar de cabeça.
const indicadores = computed(() => [
  {
    label: 'Total final',
    valor: formatCurrencyBR(totalFinal.value),
    detalhe: desconto.value > 0 ? `${formatCurrencyBR(desconto.value)} de desconto` : 'Sem desconto aplicado',
    icon: CircleDollarSign,
    classe: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    label: 'Itens',
    valor: String(quantidadeItens.value),
    detalhe: `${itens.value.length} linha(s) na OS`,
    icon: ShoppingBag,
    classe: 'text-blue-600 bg-blue-500/10',
  },
  {
    label: 'Produtos',
    valor: String(quantidadeProdutos.value),
    detalhe: `${produtos.value.length} produto(s) vinculado(s)`,
    icon: Package,
    classe: 'text-violet-600 bg-violet-500/10',
  },
  {
    label: 'Serviços',
    valor: String(quantidadeServicos.value),
    detalhe: `${servicos.value.length} serviço(s) vinculado(s)`,
    icon: ShieldCheck,
    classe: 'text-amber-600 bg-amber-500/10',
  },
])

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

    <div v-else-if="ordem" class="grid gap-3 px-3 pb-4 md:gap-4 md:px-4">
      <!-- Identificação da ordem -->
      <header class="rounded-xl border bg-card p-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="flex min-w-0 gap-3">
            <div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wrench class="h-6 w-6" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-lg font-semibold">{{ `#${ordem.Uid || ordem.id}` }}</h3>
                <BadgeCell
                  :label="statusMeta.label"
                  :color="statusMeta.color"
                  :icon="statusMeta.icon"
                  :capitalize="false"
                  size="sm"
                />
              </div>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">
                {{ ordem.Cliente?.nome || 'Cliente não informado' }} • aberta em {{ formatDateSafe(ordem.data) }}
              </p>
            </div>
          </div>

          <div class="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button type="button" variant="outline" class="w-full sm:w-auto" @click="editarOrdem">
              <PenLine class="h-4 w-4" /> Editar
            </Button>
            <Button v-if="ordem.status !== 'FATURADA'" type="button" class="w-full text-white sm:w-auto"
              @click="abrirFaturamento">
              <ReceiptText class="h-4 w-4" /> Faturar OS
            </Button>
            <Button v-else type="button" class="w-full bg-warning text-white hover:bg-warning/80 sm:w-auto"
              @click="estornarFaturamento">
              <ReceiptText class="h-4 w-4" /> Estornar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button type="button" variant="outline" class="w-full sm:w-auto">
                  <MoreVertical class="h-4 w-4" /> Mais ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuItem v-if="uiStore.canCreateCharge" @click="abrirCobranca">
                  <CircleDollarSign class="mr-2 h-4 w-4 text-emerald-500" /> Gerar cobrança
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="exportingPdf !== null" @click="gerarPdf(false)">
                  <LoaderCircle v-if="exportingPdf === 'default'" class="mr-2 h-4 w-4 animate-spin" />
                  <FileArchive v-else class="mr-2 h-4 w-4 text-blue-500" />
                  Exportar PDF A4
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="exportingPdf !== null" @click="gerarPdf(true)">
                  <LoaderCircle v-if="exportingPdf === 'pix'" class="mr-2 h-4 w-4 animate-spin" />
                  <CircleDollarSign v-else class="mr-2 h-4 w-4 text-emerald-500" />
                  Exportar PDF + PIX
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem :disabled="store.loadingDetalhe" @click="store.reloadDetalhes()">
                  <RefreshCw :class="['mr-2 h-4 w-4', store.loadingDetalhe ? 'animate-spin' : 'text-cyan-500']" />
                  Atualizar dados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Contexto do atendimento -->
        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <div class="flex items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <UserRound class="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p class="truncate text-xs font-semibold">{{ ordem.Cliente?.nome || 'Não informado' }}</p>
              <p class="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <Phone class="h-3 w-3 shrink-0" />{{ ordem.Cliente?.telefone || 'Sem telefone' }}
              </p>
              <p class="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <Mail class="h-3 w-3 shrink-0" />{{ ordem.Cliente?.email || 'Sem e-mail' }}
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <Wrench class="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Responsável</p>
              <p class="truncate text-xs font-semibold">{{ ordem.Operador?.nome || 'Não informado' }}</p>
              <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                Abertura em {{ formatDateSafe(ordem.data, 'dd/MM/yyyy HH:mm') }}
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">Garantia</p>
              <p class="truncate text-xs font-semibold">{{ garantiaLabel }}</p>
              <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                {{ mensagens.length }} mensagem(ns) no histórico
              </p>
            </div>
          </div>
        </div>
      </header>

      <!-- Indicadores da OS -->
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

      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="w-full justify-start overflow-x-auto rounded-lg">
          <TabsTrigger value="geral" class="h-10 px-4">
            <span class="flex items-center gap-2"><Cog class="h-4 w-4" /> Geral</span>
          </TabsTrigger>
          <TabsTrigger value="mensagens" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <MessageCircle class="h-4 w-4" /> Mensagens
              <Badge variant="outline" class="tabular-nums">{{ mensagens.length }}</Badge>
            </span>
          </TabsTrigger>
          <TabsTrigger value="produtos" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <Box class="h-4 w-4" /> Produtos
              <Badge variant="outline" class="tabular-nums">{{ produtos.length }}</Badge>
            </span>
          </TabsTrigger>
          <TabsTrigger value="servicos" class="h-10 px-4">
            <span class="flex items-center gap-2">
              <Wrench class="h-4 w-4" /> Serviços
              <Badge variant="outline" class="tabular-nums">{{ servicos.length }}</Badge>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" class="mt-3 space-y-3 md:space-y-4">
          <div class="grid gap-3 md:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section class="rounded-xl border bg-card p-4">
              <div class="mb-3 flex items-center gap-2">
                <FileText class="h-4 w-4 text-primary" />
                <h3 class="text-sm font-semibold">Observações registradas</h3>
              </div>
              <div class="grid gap-2">
                <div class="rounded-lg border border-cyan-200 bg-cyan-50/60 px-3 py-2.5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <p class="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Descrição técnica</p>
                  <p class="whitespace-pre-wrap text-sm text-foreground">
                    {{ ordem.descricao || 'Nenhuma descrição técnica informada.' }}
                  </p>
                </div>
                <div class="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2.5 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <p class="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Descrição do cliente</p>
                  <p class="whitespace-pre-wrap text-sm text-foreground">
                    {{ ordem.descricaoCliente || 'Nenhuma observação do cliente registrada.' }}
                  </p>
                </div>
              </div>
            </section>

            <div class="grid gap-3 md:gap-4">
              <section class="rounded-xl border bg-card p-4">
                <div class="mb-3 flex items-center gap-2">
                  <CircleDollarSign class="h-4 w-4 text-primary" />
                  <h3 class="text-sm font-semibold">Resumo financeiro</h3>
                </div>
                <div class="overflow-hidden rounded-lg border">
                  <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
                    <span class="text-muted-foreground">Subtotal dos itens</span>
                    <span class="font-medium tabular-nums">{{ formatCurrencyBR(subtotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3 border-b bg-background px-3 py-2 text-sm">
                    <span class="text-muted-foreground">Desconto</span>
                    <span class="font-medium tabular-nums" :class="desconto > 0 ? 'text-amber-600' : ''">
                      {{ desconto > 0 ? '-' : '' }} {{ formatCurrencyBR(desconto) }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2.5 text-sm">
                    <span class="font-semibold">Total final</span>
                    <strong class="tabular-nums">{{ formatCurrencyBR(totalFinal) }}</strong>
                  </div>
                </div>
              </section>

              <section class="rounded-xl border bg-card p-4">
                <div class="mb-3 flex items-center gap-2">
                  <CircleDollarSign class="h-4 w-4 text-primary" />
                  <h3 class="text-sm font-semibold">Cobranças vinculadas</h3>
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
                  Nenhuma cobrança vinculada a esta OS.
                </div>

                <Button v-if="uiStore.canCreateCharge" type="button" variant="outline" size="sm" class="mt-3 w-full"
                  @click="abrirCobranca">
                  <CircleDollarSign class="h-4 w-4 text-emerald-500" /> Nova cobrança
                </Button>
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mensagens" class="mt-3">
          <section class="rounded-xl border bg-card p-4">
            <div class="mb-3 flex items-center gap-2">
              <MessageCircleMore class="h-4 w-4 shrink-0 text-primary" />
              <div class="min-w-0">
                <h3 class="text-sm font-semibold">Linha do tempo da OS</h3>
                <p class="truncate text-xs text-muted-foreground">
                  Abertura, interações internas e registros finais ficam concentrados aqui.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" class="ml-auto shrink-0"
                :disabled="store.loadingDetalhe" @click="store.reloadDetalhes()">
                <RefreshCw :class="['h-4 w-4', store.loadingDetalhe ? 'animate-spin' : 'text-cyan-500']" />
                Atualizar
              </Button>
            </div>

            <ScrollArea class="rounded-lg border bg-background p-3">
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

              <div v-else class="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <Inbox class="h-8 w-8 opacity-50" />
                Nenhuma mensagem registrada. Use o campo abaixo para iniciar a conversa desta ordem.
              </div>
            </ScrollArea>

            <div class="mt-3 space-y-2">
              <Textarea
                v-model="novaMensagem"
                rows="3"
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
          </section>
        </TabsContent>

        <TabsContent value="produtos" class="mt-3">
          <ItensOrdemLista
            :itens="produtos"
            titulo="Produtos"
            descricao="Itens físicos consumidos ou reservados nesta ordem."
            :icone="Package"
            cor-icone="text-emerald-600"
            badge-label="Produto"
            badge-color="emerald"
            vazio-texto="Esta OS não possui produtos registrados até o momento."
          />
        </TabsContent>

        <TabsContent value="servicos" class="mt-3">
          <ItensOrdemLista
            :itens="servicos"
            titulo="Serviços"
            descricao="Execuções previstas, aprovadas ou já aplicadas nesta OS."
            :icone="ShieldCheck"
            cor-icone="text-amber-600"
            badge-label="Serviço"
            badge-color="yellow"
            vazio-texto="Esta OS não possui serviços registrados até o momento."
          />
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

    <div class="flex justify-end gap-2 px-3 pb-2 md:px-4">
      <Button type="button" variant="secondary" @click="store.openModalDetalheOs = false">
        <OctagonX class="h-4 w-4" />
        Fechar
      </Button>
    </div>
  </ModalView>
</template>
