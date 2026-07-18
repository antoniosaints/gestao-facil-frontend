<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlarmClock,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCw,
  Send,
  Settings2,
  SlidersHorizontal,
  TriangleAlert,
  UserCog,
  Users,
  Wallet,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatCurrencyBR } from '@/utils/formatters'
import { useUiStore } from '@/stores/ui/uiStore'
import {
  InadimplenciaRepository,
  type InadimplenciaConfig,
  type InadimplenciaItem,
  type InadimplenciaResumo,
  type InadimplenciaStatusFiltro,
  type LembreteConfigPayload,
} from '@/repositories/inadimplencia-repository'
import LembreteModal from './LembreteModal.vue'
import ConfiguracoesModal from './ConfiguracoesModal.vue'
import CobrancaRapidaModal from './CobrancaRapidaModal.vue'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(false)
const items = ref<InadimplenciaItem[]>([])
const resumo = ref<InadimplenciaResumo | null>(null)
const sistemaConfig = ref<InadimplenciaConfig | null>(null)
const search = ref('')
const status = ref<InadimplenciaStatusFiltro>('TODOS')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(1)
const selected = ref<Set<number>>(new Set())
const enviandoId = ref<number | null>(null)
const alternandoLembreteIds = ref<Set<number>>(new Set())

// Modal
const modalOpen = ref(false)
const modalSaving = ref(false)
const modalTitulo = ref('')
const modalDescricao = ref('')
const modalConfig = ref<LembreteConfigPayload>(defaultConfig())
const modalShowRemover = ref(false)
const modalMode = ref<'cliente' | 'lancamento' | 'massa'>('lancamento')
const modalTargetId = ref<number | null>(null)
const configOpen = ref(false)
const cobrancaRapidaOpen = ref(false)
const cobrancaRapidaItem = ref<InadimplenciaItem | null>(null)

function padraoDias(): number[] {
  return sistemaConfig.value?.dias?.length ? [...sistemaConfig.value.dias] : [-3, -1, 0, 1]
}

function padraoMensagem(): string | null {
  return sistemaConfig.value?.mensagem ?? null
}

function defaultConfig(): LembreteConfigPayload {
  return {
    ativo: true,
    dias: padraoDias(),
    canalWhatsapp: true,
    canalEmail: false,
    canalSms: false,
    mensagemCustom: padraoMensagem(),
  }
}

async function load() {
  try {
    loading.value = true
    const [lista, res, config] = await Promise.all([
      InadimplenciaRepository.listar({
        search: search.value.trim() || undefined,
        status: status.value,
        page: page.value,
        pageSize: pageSize.value,
      }),
      InadimplenciaRepository.resumo(),
      InadimplenciaRepository.getConfig(),
    ])
    items.value = lista.data
    total.value = lista.total
    totalPages.value = lista.totalPages
    resumo.value = res
    sistemaConfig.value = config
    selected.value = new Set()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar inadimplência.')
  } finally {
    loading.value = false
  }
}

function aplicarFiltros() {
  page.value = 1
  load()
}

watch(status, aplicarFiltros)

function irPara(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

// Seleção
const todosSelecionados = computed(() => items.value.length > 0 && items.value.every((i) => selected.value.has(i.id)))
function toggleTodos() {
  if (todosSelecionados.value) selected.value = new Set()
  else selected.value = new Set(items.value.map((i) => i.id))
}
function toggleUm(id: number) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

// Badges de lembrete
function lembreteBadge(item: InadimplenciaItem) {
  if (!item.lembrete.ativo) return { label: 'Sem lembrete', cls: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  if (item.lembrete.origem === 'OVERRIDE_LANCAMENTO') return { label: 'Personalizado', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' }
  if (item.lembrete.origem === 'CONFIG_CLIENTE') return { label: 'Padrão do cliente', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' }
  return { label: 'Padrão do sistema', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' }
}

function fmtData(value: string | null) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '—'
}

// Abrir modais
function configFromItem(item: InadimplenciaItem): LembreteConfigPayload {
  const temAgenda = item.lembrete.ativo && item.lembrete.dias.length > 0
  return {
    // Ao abrir para configurar, começa ativo — exceto se já houver um override de opt-out.
    ativo: item.lembrete.temOverride ? item.lembrete.overrideAtivo !== false : true,
    // Sem agenda própria → usa os dias padrão do sistema (config salva), não um hardcoded.
    dias: item.lembrete.dias.length ? [...item.lembrete.dias] : padraoDias(),
    canalWhatsapp: temAgenda ? item.lembrete.canais.whatsapp : true,
    canalEmail: item.lembrete.canais.email,
    canalSms: item.lembrete.canais.sms,
    // Mensagem própria do lembrete → senão o template padrão do sistema.
    mensagemCustom: item.lembrete.mensagemCustom ?? padraoMensagem(),
  }
}

function setAlternandoLembrete(id: number, value: boolean) {
  const next = new Set(alternandoLembreteIds.value)
  if (value) next.add(id)
  else next.delete(id)
  alternandoLembreteIds.value = next
}

function isAlternandoLembrete(id: number) {
  return alternandoLembreteIds.value.has(id)
}

function configToggleFromItem(item: InadimplenciaItem, ativo: boolean): LembreteConfigPayload {
  const base = item.lembrete.ativo || item.lembrete.temOverride ? configFromItem(item) : defaultConfig()
  return {
    ...base,
    ativo,
    dias: base.dias.length ? base.dias : padraoDias(),
    canalWhatsapp: base.canalWhatsapp ?? true,
    canalEmail: base.canalEmail ?? false,
    canalSms: base.canalSms ?? false,
    mensagemCustom: base.mensagemCustom ?? padraoMensagem(),
  }
}

async function alternarLembrete(item: InadimplenciaItem, value: boolean) {
  const ativo = Boolean(value)
  try {
    setAlternandoLembrete(item.id, true)
    await InadimplenciaRepository.salvarLembreteLancamento(item.id, configToggleFromItem(item, ativo))
    toast.success(ativo ? 'Lembrete ativado.' : 'Lembrete desativado.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível alterar o lembrete.')
  } finally {
    setAlternandoLembrete(item.id, false)
  }
}

function abrirOverride(item: InadimplenciaItem) {
  modalMode.value = 'lancamento'
  modalTargetId.value = item.id
  modalTitulo.value = `Lembrete de "${item.descricao}"`
  modalDescricao.value = 'Agenda específica deste lançamento (sobrepõe o padrão do cliente).'
  modalConfig.value = configFromItem(item)
  modalShowRemover.value = item.lembrete.temOverride
  modalOpen.value = true
}

function abrirCliente(item: InadimplenciaItem) {
  if (!item.cliente) return
  modalMode.value = 'cliente'
  modalTargetId.value = item.cliente.id
  modalTitulo.value = `Padrão de ${item.cliente.nome}`
  modalDescricao.value = 'Vale para todos os lançamentos a receber deste cliente, salvo override.'
  modalConfig.value = configFromItem(item)
  modalShowRemover.value = false
  modalOpen.value = true
}

function abrirMassa() {
  if (!selected.value.size) return
  modalMode.value = 'massa'
  modalTargetId.value = null
  modalTitulo.value = `Configurar ${selected.value.size} lançamento(s)`
  modalDescricao.value = 'Aplica a mesma agenda de lembrete (override) aos lançamentos selecionados.'
  modalConfig.value = defaultConfig()
  modalShowRemover.value = false
  modalOpen.value = true
}

async function salvarModal(payload: LembreteConfigPayload) {
  try {
    modalSaving.value = true
    if (modalMode.value === 'cliente' && modalTargetId.value) {
      await InadimplenciaRepository.salvarLembreteCliente(modalTargetId.value, payload)
    } else if (modalMode.value === 'lancamento' && modalTargetId.value) {
      await InadimplenciaRepository.salvarLembreteLancamento(modalTargetId.value, payload)
    } else if (modalMode.value === 'massa') {
      await InadimplenciaRepository.salvarEmMassa([...selected.value], payload)
    }
    toast.success('Agenda de lembretes salva.')
    modalOpen.value = false
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar.')
  } finally {
    modalSaving.value = false
  }
}

async function removerOverride() {
  if (modalMode.value !== 'lancamento' || !modalTargetId.value) return
  try {
    modalSaving.value = true
    await InadimplenciaRepository.removerLembreteLancamento(modalTargetId.value)
    toast.success('Override removido.')
    modalOpen.value = false
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remover.')
  } finally {
    modalSaving.value = false
  }
}

function abrirCobrancaRapida(item: InadimplenciaItem) {
  cobrancaRapidaItem.value = item
  cobrancaRapidaOpen.value = true
}

async function enviarAgora(mensagem?: string) {
  const item = cobrancaRapidaItem.value
  if (!item) return

  try {
    enviandoId.value = item.id
    await InadimplenciaRepository.enviarAgora(item.id, mensagem)
    toast.success('Cobrança colocada na fila para envio imediato.')
    cobrancaRapidaOpen.value = false
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Falha ao enfileirar a cobrança.')
  } finally {
    enviandoId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <!-- Cabeçalho -->
    <div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <TriangleAlert class="h-6 w-6 text-amber-500" :stroke-width="2.5" />
          Inadimplência
        </h2>
        <p class="text-sm text-muted-foreground">
          Controle quem tem valores a receber e configure os lembretes de cobrança ao cliente.
        </p>
      </div>
      <Button variant="outline" @click="load">
        <RotateCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
      </Button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="rounded-xl border bg-card p-4">
        <div class="flex items-center gap-2 text-xs text-muted-foreground"><Wallet class="h-4 w-4" /> A receber</div>
        <div class="mt-1 text-xl font-bold text-foreground">{{ formatCurrencyBR(resumo?.totalAReceber || 0) }}</div>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <div class="flex items-center gap-2 text-xs text-muted-foreground"><TriangleAlert class="h-4 w-4 text-red-500" /> Atrasado</div>
        <div class="mt-1 text-xl font-bold text-red-600">{{ formatCurrencyBR(resumo?.totalAtrasado || 0) }}</div>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <div class="flex items-center gap-2 text-xs text-muted-foreground"><Users class="h-4 w-4" /> Inadimplentes</div>
        <div class="mt-1 text-xl font-bold text-foreground">{{ resumo?.clientesInadimplentes || 0 }}</div>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <div class="flex items-center gap-2 text-xs text-muted-foreground"><BellRing class="h-4 w-4" /> Com lembrete</div>
        <div class="mt-1 text-xl font-bold text-foreground">{{ resumo?.lancamentosComLembrete || 0 }}</div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col gap-2 md:flex-row md:items-center">
      <Input
        v-model="search"
        placeholder="Buscar por cliente, descrição ou UID..."
        class="md:max-w-sm"
        @keyup.enter="aplicarFiltros"
      />
      <Select v-model="status">
        <SelectTrigger class="w-full md:w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos a receber</SelectItem>
          <SelectItem value="ATRASADOS">Somente atrasados</SelectItem>
          <SelectItem value="A_VENCER">Somente a vencer</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="secondary" @click="aplicarFiltros">Buscar</Button>
      <Button variant="outline" class="md:ml-auto" @click="configOpen = true">
        <SlidersHorizontal class="mr-2 h-4 w-4" /> Configurações
      </Button>
    </div>

    <!-- Barra de ações em massa -->
    <div
      v-if="selected.size"
      class="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-4 py-2"
    >
      <span class="text-sm font-medium">{{ selected.size }} selecionado(s)</span>
      <div class="flex gap-2">
        <Button size="sm" variant="ghost" @click="selected = new Set()">Limpar</Button>
        <Button size="sm" @click="abrirMassa">
          <Settings2 class="mr-2 h-4 w-4" /> Configurar lembrete
        </Button>
      </div>
    </div>

    <!-- Tabela desktop -->
    <div v-if="!uiStore.isMobile" class="overflow-hidden rounded-xl border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th class="w-10 px-3 py-2">
              <Checkbox :model-value="todosSelecionados" @update:model-value="toggleTodos" />
            </th>
            <th class="px-3 py-2">Cliente / Lançamento</th>
            <th class="px-3 py-2 text-right">A receber</th>
            <th class="px-3 py-2 text-center">Parcelas</th>
            <th class="px-3 py-2 text-center">Atraso</th>
            <th class="px-3 py-2">Lembrete</th>
            <th class="px-3 py-2 text-center">Ativo</th>
            <th class="px-3 py-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length">
            <td colspan="8" class="px-3 py-8 text-center text-muted-foreground">Carregando...</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="8" class="px-3 py-8 text-center text-muted-foreground">Nenhum lançamento a receber encontrado.</td>
          </tr>
          <tr v-for="item in items" :key="item.id" class="border-t hover:bg-muted/20">
            <td class="px-3 py-2">
              <Checkbox :model-value="selected.has(item.id)" @update:model-value="toggleUm(item.id)" />
            </td>
            <td class="px-3 py-2">
              <div class="font-medium text-foreground">{{ item.cliente?.nome || 'Sem cliente' }}</div>
              <div class="text-xs text-muted-foreground">{{ item.descricao }} · {{ item.Uid }}</div>
            </td>
            <td class="px-3 py-2 text-right">
              <div class="font-semibold text-foreground">{{ formatCurrencyBR(item.valorPendente) }}</div>
              <div v-if="item.valorAtrasado > 0" class="text-xs text-red-600">{{ formatCurrencyBR(item.valorAtrasado) }} atrasado</div>
            </td>
            <td class="px-3 py-2 text-center">
              {{ item.parcelasPendentes }}
              <span v-if="item.parcelasAtrasadas > 0" class="text-red-600">({{ item.parcelasAtrasadas }})</span>
            </td>
            <td class="px-3 py-2 text-center">
              <Badge v-if="item.diasAtraso > 0" class="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {{ item.diasAtraso }}d
              </Badge>
              <Badge v-else variant="outline">
                <Check class="mr-2 h-4 w-4" />
                Em dia
              </Badge>
            </td>
            <td class="px-3 py-1">
              <span class="inline-block rounded-lg px-2 py-0.5 text-sm border border-dotted" :class="lembreteBadge(item).cls">{{ lembreteBadge(item).label }}</span>
              <div v-if="item.lembrete.ativo && item.proximoLembrete" class="ml-1 text-[11px] text-muted-foreground">
                próximo: {{ fmtData(item.proximoLembrete) }}
              </div>
            </td>
            <td class="px-3 py-2 text-center">
              <Switch
                :model-value="item.lembrete.ativo"
                :disabled="isAlternandoLembrete(item.id)"
                :title="item.lembrete.ativo ? 'Desativar lembrete deste lançamento' : 'Ativar lembrete deste lançamento'"
                @update:model-value="(value) => alternarLembrete(item, value)"
              />
            </td>
            <td class="px-3 py-2">
              <div class="flex justify-end gap-1">
                <Button size="icon" variant="ghost" title="Configurar lembrete deste lançamento" @click="abrirOverride(item)">
                  <Settings2 class="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" title="Padrão do cliente" :disabled="!item.cliente" @click="abrirCliente(item)">
                  <UserCog class="h-4 w-4" />
                </Button>
                <RouterLink :to="`/financeiro/detalhes?id=${item.id}`">
                  <Button size="icon" variant="ghost" title="Abrir lançamento financeiro">
                    <ExternalLink class="h-4 w-4" />
                  </Button>
                </RouterLink>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Enviar lembrete agora (WhatsApp)"
                  :disabled="enviandoId === item.id"
                  @click="abrirCobrancaRapida(item)"
                >
                  <Send class="h-4 w-4" :class="enviandoId === item.id ? 'animate-pulse' : ''" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards mobile -->
    <div v-else class="space-y-2">
      <div v-if="loading && !items.length" class="rounded-xl border p-6 text-center text-sm text-muted-foreground">Carregando...</div>
      <Empty v-else-if="!items.length" class="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><AlarmClock class="h-6 w-6" /></EmptyMedia>
          <EmptyTitle>Nada a receber</EmptyTitle>
          <EmptyDescription>Nenhum lançamento a receber encontrado com os filtros atuais.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <article v-for="item in items" :key="item.id" class="rounded-xl border bg-card p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate font-semibold text-foreground">{{ item.cliente?.nome || 'Sem cliente' }}</div>
            <div class="truncate text-xs text-muted-foreground">{{ item.descricao }}</div>
          </div>
          <div class="text-right">
            <div class="font-semibold text-foreground">{{ formatCurrencyBR(item.valorPendente) }}</div>
            <Badge v-if="item.diasAtraso > 0" class="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">{{ item.diasAtraso }}d atraso</Badge>
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <Badge :class="lembreteBadge(item).cls">{{ lembreteBadge(item).label }}</Badge>
            <div v-if="item.lembrete.ativo && item.proximoLembrete" class="mt-0.5 text-[11px] text-muted-foreground">
              próximo: {{ fmtData(item.proximoLembrete) }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Switch
              :model-value="item.lembrete.ativo"
              :disabled="isAlternandoLembrete(item.id)"
              :title="item.lembrete.ativo ? 'Desativar lembrete deste lançamento' : 'Ativar lembrete deste lançamento'"
              @update:model-value="(value) => alternarLembrete(item, value)"
            />
            <div class="flex gap-1">
              <Button size="sm" variant="outline" @click="abrirOverride(item)"><Settings2 class="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" :disabled="!item.cliente" @click="abrirCliente(item)"><UserCog class="h-4 w-4" /></Button>
              <RouterLink :to="`/financeiro/detalhes?id=${item.id}`">
                <Button size="sm" variant="outline" title="Abrir lançamento financeiro"><ExternalLink class="h-4 w-4" /></Button>
              </RouterLink>
              <Button size="sm" variant="outline" :disabled="enviandoId === item.id" @click="abrirCobrancaRapida(item)"><Send class="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <span class="text-xs text-muted-foreground">{{ total }} lançamento(s)</span>
      <div class="flex items-center gap-2">
        <Button size="icon" variant="outline" :disabled="page <= 1" @click="irPara(page - 1)"><ChevronLeft class="h-4 w-4" /></Button>
        <span class="text-sm">{{ page }} / {{ totalPages }}</span>
        <Button size="icon" variant="outline" :disabled="page >= totalPages" @click="irPara(page + 1)"><ChevronRight class="h-4 w-4" /></Button>
      </div>
    </div>

    <LembreteModal
      v-model:open="modalOpen"
      :titulo="modalTitulo"
      :descricao="modalDescricao"
      :config="modalConfig"
      :show-remover="modalShowRemover"
      :saving="modalSaving"
      @salvar="salvarModal"
      @remover="removerOverride"
    />

    <ConfiguracoesModal v-model:open="configOpen" @salvo="load" />
    <CobrancaRapidaModal
      v-model:open="cobrancaRapidaOpen"
      :cliente="cobrancaRapidaItem?.cliente?.nome"
      :descricao="cobrancaRapidaItem?.descricao"
      :valor="cobrancaRapidaItem?.valorPendente"
      :mensagem-inicial="cobrancaRapidaItem?.lembrete.mensagemCustom || sistemaConfig?.mensagemModelo"
      :sending="enviandoId === cobrancaRapidaItem?.id"
      @enviar="enviarAgora"
    />
  </div>
</template>
