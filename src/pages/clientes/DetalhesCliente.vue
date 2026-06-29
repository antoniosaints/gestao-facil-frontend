<template>
  <div class="mx-auto max-w-7xl space-y-6 p-4">
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>

    <div v-else-if="error" class="text-center font-medium text-red-500">
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <Card>
        <CardHeader class="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar class="h-16 w-16 border bg-muted">
            <AvatarFallback class="text-lg font-bold">{{ initials(stats?.cliente?.nome) }}</AvatarFallback>
          </Avatar>
          <div class="flex-1">
            <CardTitle class="text-2xl font-bold">{{ stats?.cliente?.nome }}</CardTitle>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" class="uppercase">{{ stats?.cliente?.tipo }}</Badge>
              <Badge
                variant="outline"
                class="uppercase"
                :class="isClienteAtivo ? 'border-emerald-200 text-emerald-700' : 'border-muted-foreground/30 text-muted-foreground'"
              >
                {{ clienteStatus }}
              </Badge>
              <Badge variant="outline" class="gap-1">
                <Phone class="h-3.5 w-3.5" />
                {{ contatoPrincipal || 'Sem telefone' }}
              </Badge>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button type="button" variant="outline" :disabled="clienteActionLoading" @click="editarCliente">
              <Pencil class="h-4 w-4" />
              Editar
            </Button>
            <Button type="button" variant="outline" :disabled="clienteActionLoading" @click="alternarStatusCliente">
              <component :is="isClienteAtivo ? PowerOff : Power" class="h-4 w-4" />
              {{ isClienteAtivo ? 'Desativar' : 'Ativar' }}
            </Button>
            <Button
              type="button"
              variant="outline"
              class="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              :disabled="clienteActionLoading"
              @click="excluirCliente"
            >
              <Trash2 class="h-4 w-4" />
              Excluir
            </Button>
            <Button type="button" class="text-white" @click="openReminderModal()">
              <MessageCircleMore class="h-4 w-4" />
              Enviar lembrete
            </Button>
            <Button variant="outline" @click="$router.push({ name: 'clientes-tabela' })">
              Voltar para lista
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="item in summaryCards" :key="item.title">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{{ item.title }}</CardTitle>
            <component :is="item.icon" class="h-4 w-4" :class="item.iconClass" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold" :class="item.valueClass">{{ item.value }}</div>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent class="space-y-4 p-4">
          <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <div class="relative">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                v-model="filters.search"
                type="text"
                class="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
                placeholder="Buscar na aba atual"
                @keyup.enter="applyFilters"
              />
            </div>
            <input v-model="filters.inicio" type="date" class="h-10 rounded-md border bg-background px-3 text-sm" />
            <input v-model="filters.fim" type="date" class="h-10 rounded-md border bg-background px-3 text-sm" />
            <div class="flex gap-2">
              <Button type="button" variant="outline" class="flex-1" @click="clearFilters">Limpar</Button>
              <Button type="button" class="flex-1 text-white" @click="applyFilters">
                <Filter class="h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </div>

          <Tabs v-model="activeTab" class="w-full">
            <TabsList class="grid w-full grid-cols-2 gap-1 md:grid-cols-4">
              <TabsTrigger value="cobrancas" class="gap-2">
                <Receipt class="h-4 w-4 inline" />
                Cobranças
              </TabsTrigger>
              <TabsTrigger value="lancamentos" class="gap-2">
                <WalletCards class="h-4 w-4 inline" />
                Lançamentos
              </TabsTrigger>
              <TabsTrigger value="vendas" class="gap-2">
                <ShoppingCartIcon class="h-4 w-4 inline" />
                Vendas
              </TabsTrigger>
              <TabsTrigger value="ordens" class="gap-2">
                <WrenchIcon class="h-4 w-4 inline" />
                Ordens S.
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cobrancas" class="mt-4">
              <TabState :loading="operationalLoading" :empty="!operational.cobrancas.length" empty-label="Nenhuma cobrança vinculada.">
                <div class="grid gap-3">
                  <div v-for="cobranca in operational.cobrancas" :key="cobranca.id" class="rounded-md border bg-background p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div class="font-medium">{{ cobranca.Uid || cobranca.idCobranca }}</div>
                        <div class="text-xs text-muted-foreground">Vencimento: {{ formatDate(cobranca.dataVencimento) }}</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge variant="outline">{{ cobranca.status }}</Badge>
                        <span class="font-semibold">{{ formatCurrency(cobranca.valor) }}</span>
                        <Button type="button" variant="outline" size="sm" @click="openReminderModal('COBRANCA', cobranca.id)">
                          <Send class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabState>
            </TabsContent>

            <TabsContent value="lancamentos" class="mt-4">
              <TabState :loading="operationalLoading" :empty="!operational.lancamentos.length" empty-label="Nenhum lançamento vinculado.">
                <div class="grid gap-3">
                  <div v-for="lancamento in operational.lancamentos" :key="lancamento.id" class="rounded-md border bg-background p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div class="font-medium">{{ lancamento.descricao }}</div>
                        <div class="text-xs text-muted-foreground">{{ lancamento.Uid }} · {{ formatDate(lancamento.dataLancamento) }}</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge variant="outline">{{ lancamento.status }}</Badge>
                        <span class="font-semibold">{{ formatCurrency(lancamento.valorTotal) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabState>
            </TabsContent>

            <TabsContent value="vendas" class="mt-4">
              <TabState :loading="operationalLoading" :empty="!operational.vendas.length" empty-label="Nenhuma venda vinculada.">
                <div class="grid gap-3">
                  <div v-for="venda in operational.vendas" :key="venda.id" class="rounded-md border bg-background p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div class="font-medium">{{ venda.Uid }}</div>
                        <div class="text-xs text-muted-foreground">{{ formatDate(venda.data) }} · {{ venda.ItensVendas?.length || 0 }} itens</div>
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{{ venda.status }}</Badge>
                        <span class="font-semibold">{{ formatCurrency(totalVenda(venda)) }}</span>
                        <Button type="button" variant="outline" size="sm" @click="openReminderModal('ORCAMENTO_VENDA', undefined, venda.id)">
                          Orçamento
                        </Button>
                        <Button type="button" variant="outline" size="sm" @click="openReminderModal('COMPROVANTE_VENDA', undefined, venda.id)">
                          Comprovante
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabState>
            </TabsContent>

            <TabsContent value="ordens" class="mt-4">
              <TabState :loading="operationalLoading" :empty="!operational.ordens.length" empty-label="Nenhuma OS vinculada.">
                <div class="grid gap-3">
                  <div v-for="ordem in operational.ordens" :key="ordem.id" class="rounded-md border bg-background p-3">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div class="font-medium">{{ ordem.Uid }}</div>
                        <div class="text-xs text-muted-foreground">{{ formatDate(ordem.data) }} · {{ ordem.ItensOrdensServico?.length || 0 }} itens</div>
                      </div>
                      <Badge variant="outline">{{ ordem.status }}</Badge>
                    </div>
                  </div>
                </div>
              </TabState>
            </TabsContent>
          </Tabs>

          <div class="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span class="text-xs text-muted-foreground">
              {{ activeMeta.total }} registro(s) · página {{ activeMeta.page }} de {{ activeMeta.totalPages }}
            </span>
            <div class="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" :disabled="activeMeta.page <= 1 || operationalLoading" @click="changePage(activeMeta.page - 1)">
                <ChevronLeft class="h-4 w-4" />
                Anterior
              </Button>
              <Button type="button" variant="outline" size="sm" :disabled="activeMeta.page >= activeMeta.totalPages || operationalLoading" @click="changePage(activeMeta.page + 1)">
                Próxima
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <ModalView v-model:open="reminderOpen" title="Enviar lembrete" description="Envie mensagens para o WhatsApp do cliente." size="lg">
      <form class="space-y-4 px-4" @submit.prevent="sendReminder">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Tipo de envio</label>
          <select v-model="reminderForm.tipo" class="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="COBRANCA">Lembrete de cobrança</option>
            <option value="MENSAGEM">Mensagem avulsa</option>
            <option value="ORCAMENTO_VENDA">Orçamento de venda</option>
            <option value="COMPROVANTE_VENDA">Comprovante de venda</option>
          </select>
        </div>

        <div v-if="reminderForm.tipo === 'COBRANCA'" class="grid gap-2">
          <label class="text-sm font-medium">Cobrança</label>
          <select v-model.number="reminderForm.cobrancaId" class="h-10 rounded-md border bg-background px-3 text-sm">
            <option :value="null">Selecione uma cobrança</option>
            <option v-for="cobranca in operational.cobrancas" :key="cobranca.id" :value="cobranca.id">
              {{ cobranca.Uid || cobranca.idCobranca }} - {{ formatCurrency(cobranca.valor) }}
            </option>
          </select>
        </div>

        <div v-if="['ORCAMENTO_VENDA', 'COMPROVANTE_VENDA'].includes(reminderForm.tipo)" class="grid gap-2">
          <label class="text-sm font-medium">Venda</label>
          <select v-model.number="reminderForm.vendaId" class="h-10 rounded-md border bg-background px-3 text-sm">
            <option :value="null">Selecione uma venda</option>
            <option v-for="venda in operational.vendas" :key="venda.id" :value="venda.id">
              {{ venda.Uid }} - {{ formatCurrency(totalVenda(venda)) }}
            </option>
          </select>
        </div>

        <div v-if="reminderForm.tipo === 'MENSAGEM'" class="grid gap-2">
          <label class="text-sm font-medium">Mensagem</label>
          <Textarea v-model="reminderForm.mensagem" rows="5" placeholder="Digite a mensagem para o cliente" />
        </div>

        <div class="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          Destino: {{ contatoPrincipal || 'cliente sem telefone/WhatsApp cadastrado' }}
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="reminderOpen = false">Cancelar</Button>
          <Button type="submit" class="text-white" :disabled="sendingReminder">
            <Send class="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </form>
    </ModalView>
    <ClientesModal />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import ModalView from '@/components/formulario/ModalView.vue'
import { formatCurrencyBR as formatCurrency, formatDateToPtBR } from '@/utils/formatters'
import {
  AlertCircle as AlertCircleIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageCircleMore,
  Phone,
  Pencil,
  Power,
  PowerOff,
  Receipt,
  Search,
  Send,
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  TrendingUp as TrendingUpIcon,
  WalletCards,
  Wrench as WrenchIcon,
} from 'lucide-vue-next'

type ReminderType = ClienteWhatsappPayload['tipo']

const TabState = defineComponent({
  props: {
    loading: { type: Boolean, required: true },
    empty: { type: Boolean, required: true },
    emptyLabel: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => {
      if (props.loading) {
        return h('div', { class: 'py-8 text-center text-sm text-muted-foreground' }, 'Carregando registros...')
      }
      if (props.empty) {
        return h('div', { class: 'py-8 text-center text-sm text-muted-foreground' }, props.emptyLabel)
      }
      return slots.default?.()
    }
  },
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const storeCliente = useClientesStore()
const loading = ref(true)
const operationalLoading = ref(true)
const sendingReminder = ref(false)
const clienteActionLoading = ref(false)
const error = ref('')
const stats = ref<any>(null)
const activeTab = ref<ClienteDetalhesTab>('cobrancas')
const reminderOpen = ref(false)
const operational = ref<Record<ClienteDetalhesTab, any[]>>({
  cobrancas: [],
  lancamentos: [],
  vendas: [],
  ordens: [],
})
const tabMeta = ref<Record<ClienteDetalhesTab, { total: number; page: number; limit: number; totalPages: number }>>({
  cobrancas: { total: 0, page: 1, limit: 10, totalPages: 1 },
  lancamentos: { total: 0, page: 1, limit: 10, totalPages: 1 },
  vendas: { total: 0, page: 1, limit: 10, totalPages: 1 },
  ordens: { total: 0, page: 1, limit: 10, totalPages: 1 },
})
const filters = ref({
  search: '',
  inicio: '',
  fim: '',
})
const reminderForm = ref<{
  tipo: ReminderType
  cobrancaId: number | null
  vendaId: number | null
  mensagem: string
}>({
  tipo: 'COBRANCA',
  cobrancaId: null,
  vendaId: null,
  mensagem: '',
})

const clienteId = computed(() => Number(route.params.id))
const contatoPrincipal = computed(() => stats.value?.cliente?.whastapp || stats.value?.cliente?.telefone || '')
const clienteStatus = computed(() => stats.value?.cliente?.status || 'ATIVO')
const isClienteAtivo = computed(() => clienteStatus.value === 'ATIVO')
const activeMeta = computed(() => tabMeta.value[activeTab.value])
const summaryCards = computed(() => [
  {
    title: stats.value?.cliente?.tipo === 'FORNECEDOR' ? 'Total comprado' : 'Total em vendas',
    value: formatCurrency(stats.value?.cliente?.tipo === 'FORNECEDOR' ? stats.value?.compras?.total || 0 : stats.value?.vendas?.total || 0),
    description: `${stats.value?.cliente?.tipo === 'FORNECEDOR' ? stats.value?.compras?.quantidade || 0 : stats.value?.vendas?.quantidade || 0} operações registradas`,
    icon: ShoppingCartIcon,
    iconClass: 'text-muted-foreground',
    valueClass: '',
  },
  {
    title: 'Lucro estimado',
    value: formatCurrency(stats.value?.vendas?.lucroEstimado || 0),
    description: 'Baseado no custo de estoque',
    icon: TrendingUpIcon,
    iconClass: 'text-emerald-500',
    valueClass: 'text-emerald-600',
  },
  {
    title: 'Ordens de serviço',
    value: formatCurrency(stats.value?.os?.total || 0),
    description: `${stats.value?.os?.quantidade || 0} serviços finalizados`,
    icon: WrenchIcon,
    iconClass: 'text-muted-foreground',
    valueClass: '',
  },
  {
    title: 'Pendente',
    value: formatCurrency((stats.value?.financeiro?.pendenteReceber || 0) - (stats.value?.financeiro?.pendentePagar || 0)),
    description: `Receber: ${formatCurrency(stats.value?.financeiro?.pendenteReceber || 0)} | Pagar: ${formatCurrency(stats.value?.financeiro?.pendentePagar || 0)}`,
    icon: AlertCircleIcon,
    iconClass: 'text-yellow-500',
    valueClass: 'text-yellow-600',
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

function toDateTime(value: string, endOfDay = false) {
  if (!value) return null
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

async function loadOperationalDetails(page = activeMeta.value.page) {
  operationalLoading.value = true
  try {
    const response = await ClienteRepository.getDetalhesOperacionais(clienteId.value, {
      tab: activeTab.value,
      search: filters.value.search,
      page,
      limit: activeMeta.value.limit,
      inicio: toDateTime(filters.value.inicio),
      fim: toDateTime(filters.value.fim, true),
    })
    operational.value[activeTab.value] = response.items || []
    tabMeta.value[activeTab.value] = response.meta || { total: 0, page, limit: 10, totalPages: 1 }
  } catch (e) {
    console.error(e)
    toast.error('Falha ao carregar detalhes operacionais')
  } finally {
    operationalLoading.value = false
  }
}

function applyFilters() {
  loadOperationalDetails(1)
}

function clearFilters() {
  filters.value = { search: '', inicio: '', fim: '' }
  loadOperationalDetails(1)
}

function changePage(page: number) {
  loadOperationalDetails(page)
}

function openReminderModal(tipo: ReminderType = 'COBRANCA', cobrancaId?: number, vendaId?: number) {
  reminderForm.value = {
    tipo,
    cobrancaId: cobrancaId ?? operational.value.cobrancas[0]?.id ?? null,
    vendaId: vendaId ?? operational.value.vendas[0]?.id ?? null,
    mensagem: '',
  }
  reminderOpen.value = true
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
  if (!payload) return

  try {
    sendingReminder.value = true
    await ClienteRepository.enviarWhatsapp(clienteId.value, payload)
    toast.success('Mensagem enviada pelo WhatsApp')
    reminderOpen.value = false
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Erro ao enviar mensagem')
  } finally {
    sendingReminder.value = false
  }
}

watch(activeTab, () => {
  loadOperationalDetails(1)
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
    await reloadClienteStats()
    await loadOperationalDetails(1)
  } catch (e: any) {
    console.error(e)
    error.value = 'Falha ao carregar estatisticas'
  } finally {
    loading.value = false
  }
})
</script>
