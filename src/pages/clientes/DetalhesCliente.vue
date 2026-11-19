<template>
  <div class="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:pb-4">
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>

    <div v-else-if="error" class="text-center font-medium text-red-500">
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <Card class="overflow-hidden rounded-md">
        <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            <Avatar class="h-16 w-16 shrink-0 ring-2 ring-primary/90">
              <AvatarFallback class="text-lg font-bold text-foreground">{{ initials(stats?.cliente?.nome) }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <CardTitle class="break-words text-2xl font-semibold leading-tight">{{ stats?.cliente?.nome }}</CardTitle>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" class="uppercase">{{ stats?.cliente?.tipo }}</Badge>
                <Badge
                  variant="outline"
                  class="gap-1 uppercase"
                  :class="isClienteAtivo ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800' : 'border-muted-foreground/30 text-muted-foreground'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="isClienteAtivo ? 'bg-emerald-500' : 'bg-muted-foreground'"></span>
                  {{ clienteStatus }}
                </Badge>
              </div>
              <p class="mt-1 text-xs text-muted-foreground">{{ stats?.cliente?.Uid || `Cliente #${clienteId}` }}</p>
              <div class="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate">{{ contatoPrincipal || 'Sem telefone cadastrado' }}</span>
              </div>
            </div>
          </div>

          <div class="flex w-full flex-wrap items-center gap-1.5 rounded-xl p-1.5 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              class="gap-2 bg-background/70"
              @click="$router.push({ name: 'clientes-tabela' })"
            >
              <ChevronLeft class="h-4 w-4" />
              Voltar
            </Button>
            <Button
              v-if="podeIniciarAtendimento"
              type="button"
              variant="outline"
              class="gap-2 border-emerald-500/40 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400"
              @click="iniciarAtendimento"
            >
              <Headset class="h-4 w-4" />
              Atender
            </Button>
            <Button type="button" class="gap-2 text-white" @click="openReminderModal()">
              <MessageCircleMore class="h-4 w-4" />
              Enviar lembrete
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button type="button" variant="outline" size="icon" :disabled="clienteActionLoading" v-tooltip="'Mais ações'">
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuItem @select="editarCliente">
                  <Pencil class="h-4 w-4" />
                  Editar cadastro
                </DropdownMenuItem>
                <DropdownMenuItem @select="alternarStatusCliente">
                  <component :is="isClienteAtivo ? PowerOff : Power" class="h-4 w-4" />
                  {{ isClienteAtivo ? 'Desativar cliente' : 'Ativar cliente' }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-red-600 focus:text-red-700" @select="excluirCliente">
                  <Trash2 class="h-4 w-4" />
                  Excluir cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      <Card class="overflow-hidden rounded-md">
        <CardContent class="space-y-4 p-4">
          <Tabs v-model="displayTab" class="w-full">
            <TabsList class="grid h-auto w-full rounded-md grid-cols-2 gap-1 p-1 sm:grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="resumo" class="gap-2"><UserRound class="h-4 w-4" />Resumo</TabsTrigger>
              <TabsTrigger value="cobrancas" class="gap-2"><Receipt class="h-4 w-4" />Cobranças</TabsTrigger>
              <TabsTrigger value="lancamentos" class="gap-2"><WalletCards class="h-4 w-4" />Lançamentos</TabsTrigger>
              <TabsTrigger value="vendas" class="gap-2"><ShoppingCartIcon class="h-4 w-4" />Vendas</TabsTrigger>
              <TabsTrigger value="ordens" class="gap-2"><WrenchIcon class="h-4 w-4" />Ordens</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" class="mt-5 space-y-4">
              <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card v-for="item in summaryCards" :key="item.title" class="transition hover:shadow-md">
                  <CardContent class="flex items-start gap-3 p-4">
                    <div class="shrink-0 rounded-xl p-2.5" :class="item.chipClass"><component :is="item.icon" class="h-5 w-5" /></div>
                    <div class="min-w-0"><p class="text-xs font-medium text-muted-foreground">{{ item.title }}</p><p class="truncate text-xl font-bold" :class="item.valueClass">{{ item.value }}</p><p class="mt-0.5 text-xs text-muted-foreground">{{ item.description }}</p></div>
                  </CardContent>
                </Card>
              </div>
              <div class="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><p class="text-xs text-muted-foreground">Documento</p><p class="mt-1 break-words font-medium">{{ stats?.cliente?.documento || 'Não informado' }}</p></div>
                <div><p class="text-xs text-muted-foreground">E-mail</p><p class="mt-1 break-all font-medium">{{ stats?.cliente?.email || 'Não informado' }}</p></div>
                <div><p class="text-xs text-muted-foreground">Cidade / UF</p><p class="mt-1 font-medium">{{ [stats?.cliente?.cidade, stats?.cliente?.estado].filter(Boolean).join(' / ') || 'Não informado' }}</p></div>
                <div><p class="text-xs text-muted-foreground">Tipo de cadastro</p><p class="mt-1 font-medium">{{ stats?.cliente?.tipo || '-' }}</p></div>
                <div><p class="text-xs text-muted-foreground">Telefone / WhatsApp</p><p class="mt-1 font-medium">{{ contatoPrincipal || 'Não informado' }}</p></div>
                <div><p class="text-xs text-muted-foreground">Situação</p><p class="mt-1 font-medium">{{ clienteStatus }}</p></div>
              </div>
            </TabsContent>

            <template v-if="displayTab !== 'resumo'">
              <div class="mt-5 flex flex-col gap-3 rounded-lg border bg-muted/15 p-3 sm:flex-row sm:items-end">
                <div class="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <div class="space-y-1.5"><Label>Data inicial</Label><Calendarpicker v-model="filters.inicio" :required="false" placeholder="Data inicial" :teleport="true" /></div>
                  <div class="space-y-1.5"><Label>Data final</Label><Calendarpicker v-model="filters.fim" :required="false" placeholder="Data final" :teleport="true" /></div>
                </div>
                <div class="flex gap-2">
                  <Button type="button" variant="outline" @click="clearFilters">Limpar</Button>
                  <Button type="button" class="gap-2 text-white" @click="applyFilters"><Filter class="h-4 w-4" />Aplicar período</Button>
                </div>
              </div>
              <div class="mt-4 min-w-0">
                <DataTable
                  :key="`${clienteId}:${displayTab}`"
                  :columns="detailsColumns"
                  :api="`/clientes/${clienteId}/detalhes-operacionais`"
                  :filters="tableFilters"
                  :state-key="`cliente:${clienteId}:${displayTab}`"
                  :clear-search-token="clearSearchToken"
                  :empty-title="emptyLabels[displayTab]"
                  empty-description="Altere a busca ou o período para conferir outros registros deste cliente."
                  search-placeholder="Buscar nesta listagem"
                />
              </div>
            </template>
          </Tabs>
        </CardContent>
      </Card>
    </div>

    <ModalView v-model:open="reminderOpen" title="Enviar mensagem ao cliente" description="Escolha o conteúdo, confira o destinatário e selecione a instância de envio." size="lg">
      <form class="space-y-5 px-2 pb-4 sm:px-4" @submit.prevent="sendReminder">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Tipo de envio</label>
          <Select v-model="reminderForm.tipo"><SelectTrigger aria-label="Tipo de envio"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="COBRANCA">Lembrete de cobrança</SelectItem><SelectItem value="LANCAMENTO">Pendência de lançamento</SelectItem><SelectItem value="MENSAGEM">Mensagem avulsa</SelectItem><SelectItem value="ORCAMENTO_VENDA">Orçamento de venda</SelectItem><SelectItem value="COMPROVANTE_VENDA">Comprovante de venda</SelectItem></SelectContent></Select>
        </div>

        <p v-if="reminderOptionsLoading" class="text-xs text-muted-foreground">Carregando registros do cliente...</p>

        <div v-if="reminderForm.tipo === 'COBRANCA'" class="grid gap-2">
          <label class="text-sm font-medium">Cobrança</label>
          <Select :model-value="reminderForm.cobrancaId?.toString()" @update:model-value="reminderForm.cobrancaId = $event ? Number($event) : null"><SelectTrigger aria-label="Cobrança"><SelectValue placeholder="Selecione uma cobrança" /></SelectTrigger><SelectContent><SelectItem v-for="cobranca in reminderOptions.cobrancas" :key="cobranca.id" :value="String(cobranca.id)">{{ cobranca.Uid || cobranca.idCobranca }} - {{ formatCurrency(cobranca.valor) }}</SelectItem></SelectContent></Select>
        </div>

        <div v-if="reminderForm.tipo === 'LANCAMENTO'" class="grid gap-2">
          <label class="text-sm font-medium">Lançamento (receitas pendentes)</label>
          <Select :model-value="reminderForm.lancamentoId?.toString()" @update:model-value="reminderForm.lancamentoId = $event ? Number($event) : null"><SelectTrigger aria-label="Lançamento"><SelectValue placeholder="Selecione um lançamento" /></SelectTrigger><SelectContent><SelectItem v-for="lancamento in reminderOptions.lancamentos" :key="lancamento.id" :value="String(lancamento.id)">{{ lancamento.descricao }} - {{ formatCurrency(lancamento.valorTotal) }}</SelectItem></SelectContent></Select>
          <p v-if="!reminderOptionsLoading && !reminderOptions.lancamentos.length" class="text-xs text-muted-foreground">
            Nenhuma receita pendente encontrada para este cliente.
          </p>
        </div>

        <div v-if="['ORCAMENTO_VENDA', 'COMPROVANTE_VENDA'].includes(reminderForm.tipo)" class="grid gap-2">
          <label class="text-sm font-medium">Venda</label>
          <Select :model-value="reminderForm.vendaId?.toString()" @update:model-value="reminderForm.vendaId = $event ? Number($event) : null"><SelectTrigger aria-label="Venda"><SelectValue placeholder="Selecione uma venda" /></SelectTrigger><SelectContent><SelectItem v-for="venda in reminderOptions.vendas" :key="venda.id" :value="String(venda.id)">{{ venda.Uid }} - {{ formatCurrency(totalVenda(venda)) }}</SelectItem></SelectContent></Select>
        </div>

        <div v-if="reminderForm.tipo === 'MENSAGEM'" class="grid gap-2">
          <label class="text-sm font-medium">Mensagem</label>
          <Textarea v-model="reminderForm.mensagem" rows="5" placeholder="Digite a mensagem para o cliente" />
        </div>

        <div class="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          Destino: {{ contatoPrincipal || 'cliente sem telefone/WhatsApp cadastrado' }}
        </div>

        <WhatsAppInstanceSelect v-model="reminderForm.instanciaId" :instances="senderInstances" :module-active="whatsappActive" :loading="whatsappContextLoading" :disabled="sendingReminder" @refresh="refreshWhatsAppInstances" />
        <p v-if="!contatoPrincipal" class="text-sm text-destructive" role="alert">Adicione um telefone ao cadastro do cliente antes de enviar.</p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" :disabled="sendingReminder" @click="reminderOpen = false">Cancelar</Button>
          <Button type="submit" class="text-white" :disabled="!canSendReminder">
            <Send class="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </form>
    </ModalView>

    <ModalView v-model:open="quickSend.open" title="Confirmar envio por WhatsApp" description="Confira os dados e a instância antes de enviar." size="lg">
      <div class="space-y-5 px-2 pb-4 sm:px-4">
        <div class="rounded-md border bg-muted/30 p-3 text-sm">
          Enviar {{ quickSend.resumo }} para
          <strong>{{ contatoPrincipal || 'cliente sem telefone cadastrado' }}</strong>?
        </div>
        <WhatsAppInstanceSelect v-model="quickSend.instanciaId" :instances="senderInstances" :module-active="whatsappActive" :loading="whatsappContextLoading" :disabled="quickSend.sending" @refresh="refreshWhatsAppInstances" />
        <p v-if="!contatoPrincipal" class="text-sm text-destructive" role="alert">Adicione um telefone ao cadastro do cliente antes de enviar.</p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" :disabled="quickSend.sending" @click="quickSend.open = false">Cancelar</Button>
          <Button type="button" class="text-white" :disabled="!canQuickSend" @click="confirmQuickSend">
            <Send class="h-4 w-4" />
            {{ quickSend.sending ? 'Enviando...' : 'Confirmar envio' }}
          </Button>
        </div>
      </div>
    </ModalView>
    <MobileBottomBar>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="$router.push({ name: 'clientes-tabela' })">
        <ChevronLeft class="h-5 w-5" />
        <span class="text-xs">Voltar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="editarCliente">
        <Pencil class="h-5 w-5" />
        <span class="text-xs">Editar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="openReminderModal()">
        <MessageCircleMore class="h-5 w-5" />
        <span class="text-xs">Lembrete</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="clearFilters">
        <Filter class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="refreshClienteDetalhes">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>
    <ClientesModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ClienteRepository,
  type ClienteDetalhesTab,
  type ClienteWhatsappPayload,
} from '@/repositories/cliente-repository'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { useUiStore } from '@/stores/ui/uiStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import DataTable from '@/components/tabela/DataTable.vue'
import { Label } from '@/components/ui/label'
import WhatsAppInstanceSelect from './partials/WhatsAppInstanceSelect.vue'
import { clienteDetailsColumns } from './partials/detailsColumns'
import { formatCurrencyBR as formatCurrency, formatDateToPtBR } from '@/utils/formatters'
import {
  AlertCircle as AlertCircleIcon,
  ChevronLeft,
  Filter,
  Headset,
  MessageCircleMore,
  MoreVertical,
  Phone,
  Pencil,
  Power,
  PowerOff,
  Receipt,
  RefreshCcw,
  Send,
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  TrendingUp as TrendingUpIcon,
  UserRound,
  WalletCards,
  Wrench as WrenchIcon,
} from 'lucide-vue-next'

type ReminderType = ClienteWhatsappPayload['tipo']

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const storeCliente = useClientesStore()
const storeUi = useUiStore()
const loading = ref(true)
const sendingReminder = ref(false)
const clienteActionLoading = ref(false)
const error = ref('')
const stats = ref<any>(null)
const activeTab = ref<ClienteDetalhesTab>('cobrancas')
const displayTab = ref<'resumo' | ClienteDetalhesTab>('resumo')
const reminderOpen = ref(false)
const tableVersion = ref(0)
const clearSearchToken = ref(0)
const whatsappContextLoading = ref(false)
const appliedPeriod = reactive({ inicio: null as string | null, fim: null as string | null })
const emptyLabels = { cobrancas: 'Nenhuma cobrança encontrada', lancamentos: 'Nenhum lançamento encontrado', vendas: 'Nenhuma venda encontrada', ordens: 'Nenhuma ordem de serviço encontrada' }
const tableFilters = computed(() => ({ tab: displayTab.value, ...appliedPeriod, update: tableVersion.value }))
const detailsColumns = computed(() => clienteDetailsColumns(activeTab.value, {
  send: openQuickSend,
  openEntry: openLancamento,
}))
const filters = ref({
  inicio: null as Date | null,
  fim: null as Date | null,
})
const reminderForm = ref<{
  tipo: ReminderType
  instanciaId: number | null
  cobrancaId: number | null
  vendaId: number | null
  lancamentoId: number | null
  mensagem: string
}>({
  tipo: 'COBRANCA',
  instanciaId: null,
  cobrancaId: null,
  vendaId: null,
  lancamentoId: null,
  mensagem: '',
})
const reminderOptions = ref<{ cobrancas: any[]; vendas: any[]; lancamentos: any[] }>({
  cobrancas: [],
  vendas: [],
  lancamentos: [],
})
const reminderOptionsLoading = ref(false)
const quickSend = ref<{
  open: boolean
  sending: boolean
  payload: ClienteWhatsappPayload | null
  resumo: string
  instanciaId: number | null
}>({
  open: false,
  sending: false,
  payload: null,
  resumo: '',
  instanciaId: null,
})

const clienteId = computed(() => Number(route.params.id))
const contatoPrincipal = computed(() => stats.value?.cliente?.whastapp || stats.value?.cliente?.telefone || '')
const podeIniciarAtendimento = computed(
  () => Boolean(contatoPrincipal.value),
)

function iniciarAtendimento() {
  if (!contatoPrincipal.value) {
    toast.warning('Cliente sem telefone/WhatsApp cadastrado.')
    return
  }
  router.push({ name: 'atendimento', query: { cliente: clienteId.value } })
}
const clienteStatus = computed(() => stats.value?.cliente?.status || 'ATIVO')
const isClienteAtivo = computed(() => clienteStatus.value === 'ATIVO')
const whatsappActive = computed(() => stats.value?.whatsapp?.ativo ?? storeUi.hasActiveModule('whatsapp'))
const senderInstances = computed<Array<{ id: number; nome: string; status: string; numeroConectado?: string }>>(() => stats.value?.whatsapp?.instancias || [])
const hasConnectedSender = (id: number | null) => whatsappActive.value && senderInstances.value.some(instance => instance.id === id && instance.status === 'CONECTADA')
const canSendReminder = computed(() => Boolean(contatoPrincipal.value) && hasConnectedSender(reminderForm.value.instanciaId) && !sendingReminder.value && !whatsappContextLoading.value)
const canQuickSend = computed(() => Boolean(contatoPrincipal.value) && hasConnectedSender(quickSend.value.instanciaId) && !quickSend.value.sending && !whatsappContextLoading.value)
function defaultSender() {
  const connected = senderInstances.value.filter(instance => instance.status === 'CONECTADA')
  return connected.find(instance => instance.id === stats.value?.whatsapp?.instanciaPadraoId)?.id ?? (connected.length === 1 ? connected[0].id : null)
}
async function refreshWhatsAppInstances() {
  whatsappContextLoading.value = true
  try { await reloadClienteStats() }
  catch { toast.error('Não foi possível atualizar as instâncias. Tente novamente.') }
  finally { whatsappContextLoading.value = false }
}
const summaryCards = computed(() => [
  {
    title: stats.value?.cliente?.tipo === 'FORNECEDOR' ? 'Total comprado' : 'Total em vendas',
    value: formatCurrency(stats.value?.cliente?.tipo === 'FORNECEDOR' ? stats.value?.compras?.total || 0 : stats.value?.vendas?.total || 0),
    description: `${stats.value?.cliente?.tipo === 'FORNECEDOR' ? stats.value?.compras?.quantidade || 0 : stats.value?.vendas?.quantidade || 0} operações registradas`,
    icon: ShoppingCartIcon,
    chipClass: 'bg-primary/10 text-primary',
    valueClass: '',
  },
  {
    title: 'Lucro estimado',
    value: formatCurrency(stats.value?.vendas?.lucroEstimado || 0),
    description: 'Baseado no custo de estoque',
    icon: TrendingUpIcon,
    chipClass: 'bg-emerald-500/10 text-emerald-600',
    valueClass: 'text-emerald-600',
  },
  {
    title: 'Ordens de serviço',
    value: formatCurrency(stats.value?.os?.total || 0),
    description: `${stats.value?.os?.quantidade || 0} serviços finalizados`,
    icon: WrenchIcon,
    chipClass: 'bg-blue-500/10 text-blue-600',
    valueClass: '',
  },
  {
    title: 'Saldo pendente',
    value: formatCurrency((stats.value?.financeiro?.pendenteReceber || 0) - (stats.value?.financeiro?.pendentePagar || 0)),
    description: `Receber: ${formatCurrency(stats.value?.financeiro?.pendenteReceber || 0)} | Pagar: ${formatCurrency(stats.value?.financeiro?.pendentePagar || 0)}`,
    icon: AlertCircleIcon,
    chipClass: 'bg-amber-500/10 text-amber-600',
    valueClass: 'text-amber-600',
  },
])

function initials(name: string) {
  return name ? name.substring(0, 2).toUpperCase() : '??'
}

function formatDate(value?: string | Date | null) {
  return value ? formatDateToPtBR(value) : '-'
}

function totalVenda(venda: any) {
  return Math.max(0, Number(venda?.valor || 0) - Number(venda?.desconto || 0))
}

function openLancamento(lancamentoId: number) {
  router.push({ name: 'lancamentos-financeiro-detalhes', query: { id: String(lancamentoId) } })
}

function toDateTime(value: Date | string | null, endOfDay = false) {
  if (!value) return null
  if (value instanceof Date) {
    const date = new Date(value)
    date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0)
    return date.toISOString()
  }
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

async function reloadClienteStats() {
  stats.value = await ClienteRepository.getStats(clienteId.value)
}

function editarCliente() {
  storeCliente.openUpdate(clienteId.value)
}

async function alternarStatusCliente() {
  const nextStatus = isClienteAtivo.value ? 'INATIVO' : 'ATIVO'
  const confirmed = await confirm.confirm({
    title: `${nextStatus === 'ATIVO' ? 'Ativar' : 'Desativar'} cliente`,
    message: `Deseja ${nextStatus === 'ATIVO' ? 'ativar' : 'desativar'} este cliente?`,
    confirmText: nextStatus === 'ATIVO' ? 'Sim, ativar' : 'Sim, desativar',
    colorButton: nextStatus === 'ATIVO' ? 'success' : 'warning',
  })

  if (!confirmed) return

  try {
    clienteActionLoading.value = true
    const cliente = await ClienteRepository.get(clienteId.value)
    await ClienteRepository.update({ ...cliente.data, status: nextStatus }, clienteId.value)
    await reloadClienteStats()
    storeCliente.updateTable()
    toast.success(nextStatus === 'ATIVO' ? 'Cliente ativado com sucesso' : 'Cliente desativado com sucesso')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Erro ao atualizar status do cliente')
  } finally {
    clienteActionLoading.value = false
  }
}

async function excluirCliente() {
  const confirmed = await confirm.confirm({
    title: 'Excluir cliente',
    message: 'Tem certeza que deseja excluir este cliente?',
    confirmText: 'Sim, excluir',
    colorButton: 'danger',
  })

  if (!confirmed) return

  try {
    clienteActionLoading.value = true
    await ClienteRepository.remove(clienteId.value)
    storeCliente.updateTable()
    toast.success('Cliente deletado com sucesso')
    router.push({ name: 'clientes-tabela' })
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Erro ao deletar o cliente')
  } finally {
    clienteActionLoading.value = false
  }
}

function applyFilters() {
  if (filters.value.inicio && filters.value.fim && new Date(filters.value.inicio) > new Date(filters.value.fim)) {
    toast.warning('A data inicial deve ser anterior à data final.')
    return
  }
  appliedPeriod.inicio = toDateTime(filters.value.inicio)
  appliedPeriod.fim = toDateTime(filters.value.fim, true)
  tableVersion.value++
}
function clearFilters() {
  filters.value = { inicio: null, fim: null }
  appliedPeriod.inicio = null
  appliedPeriod.fim = null
  clearSearchToken.value++
  tableVersion.value++
}
async function refreshClienteDetalhes() {
  await reloadClienteStats()
  tableVersion.value++
}

async function loadReminderOptions() {
  reminderOptionsLoading.value = true
  try {
    // Listas proprias do modal: independentes dos filtros e da tab ativa.
    const [cobrancas, vendas, lancamentos] = await Promise.all([
      ClienteRepository.getDetalhesOperacionais(clienteId.value, { tab: 'cobrancas', page: 1, limit: 30 }),
      ClienteRepository.getDetalhesOperacionais(clienteId.value, { tab: 'vendas', page: 1, limit: 30 }),
      ClienteRepository.getDetalhesOperacionais(clienteId.value, { tab: 'lancamentos', page: 1, limit: 30 }),
    ])

    reminderOptions.value = {
      cobrancas: cobrancas.items || [],
      vendas: vendas.items || [],
      lancamentos: (lancamentos.items || []).filter(
        (lancamento: any) => lancamento.tipo === 'RECEITA' && lancamento.status !== 'PAGO',
      ),
    }

    if (!reminderForm.value.cobrancaId) {
      reminderForm.value.cobrancaId = reminderOptions.value.cobrancas[0]?.id ?? null
    }
    if (!reminderForm.value.vendaId) {
      reminderForm.value.vendaId = reminderOptions.value.vendas[0]?.id ?? null
    }
    if (!reminderForm.value.lancamentoId) {
      reminderForm.value.lancamentoId = reminderOptions.value.lancamentos[0]?.id ?? null
    }
  } catch (e) {
    console.error(e)
    toast.error('Falha ao carregar registros do cliente para o lembrete')
  } finally {
    reminderOptionsLoading.value = false
  }
}

function openReminderModal(
  tipo: ReminderType = 'COBRANCA',
  cobrancaId?: number,
  vendaId?: number,
  lancamentoId?: number,
) {
  reminderForm.value = {
    tipo,
    instanciaId: defaultSender(),
    cobrancaId: cobrancaId ?? null,
    vendaId: vendaId ?? null,
    lancamentoId: lancamentoId ?? null,
    mensagem: '',
  }
  reminderOpen.value = true
  loadReminderOptions()
}

function openQuickSend(payload: ClienteWhatsappPayload, resumo: string) {
  quickSend.value = { open: true, sending: false, payload, resumo, instanciaId: defaultSender() }
}

async function confirmQuickSend() {
  if (!quickSend.value.payload || !canQuickSend.value) return

  try {
    quickSend.value.sending = true
    await ClienteRepository.enviarWhatsapp(clienteId.value, { ...quickSend.value.payload, instanciaId: quickSend.value.instanciaId! })
    toast.success('Mensagem enviada pela instância selecionada')
    quickSend.value.open = false
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Erro ao enviar mensagem')
  } finally {
    quickSend.value.sending = false
  }
}

function buildReminderPayload(): ClienteWhatsappPayload | null {
  if (reminderForm.value.tipo === 'MENSAGEM') {
    if (!reminderForm.value.mensagem.trim()) {
      toast.error('Digite a mensagem para envio')
      return null
    }
    return { tipo: 'MENSAGEM', mensagem: reminderForm.value.mensagem }
  }

  if (reminderForm.value.tipo === 'COBRANCA') {
    if (!reminderForm.value.cobrancaId) {
      toast.error('Selecione uma cobrança')
      return null
    }
    return { tipo: 'COBRANCA', cobrancaId: reminderForm.value.cobrancaId }
  }

  if (reminderForm.value.tipo === 'LANCAMENTO') {
    if (!reminderForm.value.lancamentoId) {
      toast.error('Selecione um lançamento')
      return null
    }
    return { tipo: 'LANCAMENTO', lancamentoId: reminderForm.value.lancamentoId }
  }

  if (!reminderForm.value.vendaId) {
    toast.error('Selecione uma venda')
    return null
  }

  return {
    tipo: reminderForm.value.tipo,
    vendaId: reminderForm.value.vendaId,
  } as ClienteWhatsappPayload
}

async function sendReminder() {
  const payload = buildReminderPayload()
  if (!payload || !canSendReminder.value) return

  try {
    sendingReminder.value = true
    await ClienteRepository.enviarWhatsapp(clienteId.value, { ...payload, instanciaId: reminderForm.value.instanciaId! })
    toast.success('Mensagem enviada pela instância selecionada')
    reminderOpen.value = false
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Erro ao enviar mensagem')
  } finally {
    sendingReminder.value = false
  }
}

watch(displayTab, (tab) => {
  if (tab === 'resumo') return
  if (activeTab.value === tab) return
  activeTab.value = tab
})

watch(
  () => storeCliente.filters.update,
  () => {
    if (!loading.value) {
      reloadClienteStats()
    }
  },
)

onMounted(async () => {
  try {
    if (!clienteId.value) throw new Error('ID invalido')
    storeUi.loadAppModules().catch(() => undefined)
    await reloadClienteStats()
  } catch (e: any) {
    console.error(e)
    error.value = 'Falha ao carregar estatisticas'
  } finally {
    loading.value = false
  }
})
</script>
