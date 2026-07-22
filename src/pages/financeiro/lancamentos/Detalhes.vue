<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeft,
  BadgeDollarSign,
  BadgeInfo,
  Bell,
  BellOff,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Landmark,
  MoreVertical,
  Pause,
  PenLine,
  Play,
  Plus,
  Repeat,
  RotateCw,
  Send,
  ShoppingCart,
  Tags,
  Trash2,
  Undo2,
  UserRound,
  Wallet,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrencyBR, formatDateToPtBR, formatToNumberValue } from '@/utils/formatters'
import { LancamentosRepository, type ParcelaIgnoradaLote } from '@/repositories/lancamento-repository'
import { InadimplenciaRepository } from '@/repositories/inadimplencia-repository'
import { useConfirm } from '@/composables/useConfirm'
import { useParcelasSelecao } from '@/composables/useParcelasSelecao'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import { useUiStore } from '@/stores/ui/uiStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { goBack } from '@/hooks/links'
import router from '@/router'
import type {
  CategoriaFinanceiro,
  ClientesFornecedores,
  ContasFinanceiro,
  LancamentoFinanceiro,
  ParcelaFinanceiro,
} from '@/types/schemas'

import GerarCobranca from './modais/GerarCobranca.vue'
import FormularioRecorrencia from './modais/FormularioRecorrencia.vue'
import LancamentoModal from './formulario/LancamentoModal.vue'
import ClientesModal from '@/pages/clientes/modais/ClientesModal.vue'
import FormularioEfertivar from './modais/FormularioEfertivar.vue'
import EfetivarLoteModal from './modais/EfetivarLoteModal.vue'
import CobrancaLoteModal from './modais/CobrancaLoteModal.vue'
import ParcelasBulkBar from './components/ParcelasBulkBar.vue'
import ModalParcela from './modais/ModalParcela.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import DetalhesVenda from '@/pages/vendas/modais/DetalhesVenda.vue'
import CobrancaRapidaModal from '../inadimplencia/CobrancaRapidaModal.vue'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'

type ParcelaDetalhe = ParcelaFinanceiro & {
  ContaFinanceira?: ContasFinanceiro | null
}

type LancamentoDetalhe = LancamentoFinanceiro & {
  categoria?: CategoriaFinanceiro | null
  cliente?: ClientesFornecedores | null
  ContasFinanceiro?: ContasFinanceiro | null
  parcelas: ParcelaDetalhe[]
  createdAt?: string | Date
}

const route = useRoute()
const toast = useToast()
const store = useLancamentosStore()
const storeCobranca = useCobrancasFinanceirasStore()
const uiStore = useUiStore()
const vendasStore = useVendasStore()

const loading = ref(false)
const salvandoParcela = ref(false)
const openAdicionarParcela = ref(false)
const cobrancaRapidaOpen = ref(false)
const cobrancaRapidaSending = ref(false)
const cobrancaRapidaParcela = ref<ParcelaDetalhe | null>(null)
const mensagemCobrancaPadrao = ref('')
const lancamento = ref<LancamentoDetalhe | null>(null)
const novaParcela = ref({
  descricao: '',
  valor: '',
  vencimento: new Date(),
})

function getRouteId() {
  const id = Number(route.query.id)
  if (!id || Number.isNaN(id)) {
    toast.error('ID de lançamento inválido')
    return null
  }
  return id
}

async function loadLancamento() {
  const id = getRouteId()
  if (!id) return

  try {
    loading.value = true
    const response = (await LancamentosRepository.get(id)) as { data: LancamentoDetalhe }
    lancamento.value = response.data
  } catch (error) {
    console.error(error)
    toast.error('Erro ao buscar o lançamento')
  } finally {
    loading.value = false
  }
}

async function abrirVendaVinculada() {
  if (!lancamento.value?.vendaId) return
  await vendasStore.openDetalhes(lancamento.value.vendaId)
}

async function abrirCobrancaRapida(parcela: ParcelaDetalhe) {
  cobrancaRapidaParcela.value = parcela
  if (!mensagemCobrancaPadrao.value) {
    try {
      mensagemCobrancaPadrao.value = (await InadimplenciaRepository.getConfig()).mensagemModelo
    } catch (error) {
      console.error(error)
      toast.warning('Não foi possível carregar o modelo padrão da cobrança.')
    }
  }
  cobrancaRapidaOpen.value = true
}

async function enviarCobrancaRapida(mensagem?: string) {
  if (!lancamento.value?.id || !cobrancaRapidaParcela.value?.id) return

  try {
    cobrancaRapidaSending.value = true
    await InadimplenciaRepository.enviarAgora(
      lancamento.value.id,
      mensagem,
      cobrancaRapidaParcela.value.id,
    )
    toast.success('Cobrança colocada na fila para envio imediato.')
    cobrancaRapidaOpen.value = false
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Falha ao enfileirar a cobrança.')
  } finally {
    cobrancaRapidaSending.value = false
  }
}

const parcelasOrdenadas = computed(() => {
  if (!lancamento.value?.parcelas) return []
  return [...lancamento.value.parcelas].sort((a, b) => {
    const numeroA = a.numero ?? 0
    const numeroB = b.numero ?? 0
    if (numeroA !== numeroB) return numeroA - numeroB
    return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
  })
})

const podeNotificarCliente = computed(() => lancamento.value?.tipo === 'RECEITA' && Boolean(lancamento.value?.clienteId))

const valorTotal = computed(() =>
  parcelasOrdenadas.value.reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0),
)

const totalPago = computed(() =>
  parcelasOrdenadas.value
    .filter((parcela) => parcela.pago)
    .reduce((acc, parcela) => acc + Number(parcela.valorPago ?? parcela.valor ?? 0), 0),
)

const totalPendente = computed(() =>
  parcelasOrdenadas.value
    .filter((parcela) => !parcela.pago)
    .reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0),
)

const parcelasVencidas = computed(() => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return parcelasOrdenadas.value.filter((parcela) => {
    const vencimento = new Date(parcela.vencimento)
    vencimento.setHours(0, 0, 0, 0)
    return !parcela.pago && vencimento < hoje
  })
})

const proximaParcela = computed(() =>
  parcelasOrdenadas.value.find((parcela) => !parcela.pago) ?? null,
)

// ---- Recorrência (contas fixas: as ocorrências viram parcelas deste lançamento) ----
const recorrenciaOpen = ref(false)
const recorrenciaSalvando = ref(false)
const recorrencia = computed(() => lancamento.value?.recorrencia ?? null)
const parcelasEmAberto = computed(() => parcelasOrdenadas.value.filter((parcela) => !parcela.pago).length)

const descricaoFrequenciaRecorrencia = computed(() => {
  switch (recorrencia.value?.frequencia) {
    case 'DIARIO':
      return 'Diária'
    case 'SEMANAL':
      return 'Semanal'
    case 'QUINZENAL':
      return 'Quinzenal'
    case 'TRIMESTRAL':
      return 'Trimestral'
    case 'SEMESTRAL':
      return 'Semestral'
    case 'ANUAL':
      return 'Anual'
    case 'PERSONALIZADO':
      return `A cada ${recorrencia.value?.intervaloDias || 0} dia(s)`
    default:
      return 'Mensal'
  }
})

const situacaoRecorrencia = computed(() => {
  if (!recorrencia.value) return { label: 'Sem recorrência', classes: '' }
  if (!recorrencia.value.ativo && !recorrencia.value.proximoVencimento) {
    return {
      label: 'Encerrada',
      classes: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
    }
  }
  if (!recorrencia.value.ativo) {
    return {
      label: 'Pausada',
      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    }
  }
  return {
    label: 'Ativa',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  }
})

async function gerarProximaOcorrencia() {
  if (!lancamento.value?.id) return

  try {
    recorrenciaSalvando.value = true
    const resposta = await LancamentosRepository.gerarProximaRecorrencia(lancamento.value.id)
    toast.success(resposta?.message || 'Próxima ocorrência gerada.')
    await loadLancamento()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível gerar a próxima ocorrência.')
  } finally {
    recorrenciaSalvando.value = false
  }
}

async function alternarPausaRecorrencia() {
  if (!lancamento.value?.id || !recorrencia.value) return

  try {
    recorrenciaSalvando.value = true
    const resposta = await LancamentosRepository.atualizarStatusRecorrencia(lancamento.value.id, {
      ativo: !recorrencia.value.ativo,
    })
    toast.success(resposta?.message || 'Recorrência atualizada.')
    await loadLancamento()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível atualizar a recorrência.')
  } finally {
    recorrenciaSalvando.value = false
  }
}

async function encerrarRecorrencia() {
  if (!lancamento.value?.id) return

  const confirmado = await useConfirm().confirm({
    title: 'Encerrar recorrência',
    message:
      'Nenhuma nova ocorrência será gerada. As parcelas já criadas continuam em aberto normalmente.',
    confirmText: 'Encerrar',
  })

  if (!confirmado) return

  try {
    recorrenciaSalvando.value = true
    const resposta = await LancamentosRepository.atualizarStatusRecorrencia(lancamento.value.id, {
      encerrar: true,
    })
    toast.success(resposta?.message || 'Recorrência encerrada.')
    await loadLancamento()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível encerrar a recorrência.')
  } finally {
    recorrenciaSalvando.value = false
  }
}

const resumoStatus = computed(() => {
  const status = lancamento.value?.status ?? 'PENDENTE'

  if (status === 'PAGO') {
    return {
      label: 'Quitado',
      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200 hover:text-emerald-900',
    }
  }

  if (status === 'ATRASADO') {
    return {
      label: 'Atrasado',
      classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200 hover:text-rose-900',
    }
  }

  if (status === 'PARCIAL') {
    return {
      label: 'Parcial',
      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-200 hover:text-amber-900',
    }
  }

  return {
    label: 'Pendente',
    classes: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 hover:bg-sky-200 hover:text-sky-900',
  }
})

function getTipoClasses(tipo?: string) {
  return tipo === 'DESPESA'
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200 hover:text-rose-900'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200 hover:text-emerald-900'
}

function copiarUid() {
  navigator.clipboard.writeText(lancamento.value?.Uid ?? '')
  toast.success('UID copiado para a área de transferência')
}

async function editarLancamento() {
  if (!lancamento.value?.id) return
  try {
    await store.openUpdate(lancamento.value.id)
  } catch (error) {
    console.error(error)
    toast.error('Erro ao abrir a edição do lançamento')
  }
}

function editarParcela(parcela: ParcelaDetalhe) {
  store.idMutation = parcela.id!
  store.formParcela = {
    valor: parcela.valor,
    vencimento: new Date(parcela.vencimento),
    vencimentoOriginal: new Date(parcela.vencimento),
    numero: parcela.numero,
    pago: parcela.pago,
    escopo: 'ATUAL',
  }
  store.openModalParcela = true
}

function abrirAdicionarParcela() {
  novaParcela.value = {
    descricao: '',
    valor: '',
    vencimento: proximaParcela.value?.vencimento
      ? new Date(proximaParcela.value.vencimento)
      : new Date(),
  }
  openAdicionarParcela.value = true
}

async function adicionarParcela() {
  if (!lancamento.value?.id) return

  const valor = formatToNumberValue(novaParcela.value.valor)
  if (!valor || valor <= 0) {
    toast.error('Informe um valor válido para a parcela')
    return
  }

  if (!novaParcela.value.vencimento || Number.isNaN(new Date(novaParcela.value.vencimento).getTime())) {
    toast.error('Informe uma data de vencimento válida')
    return
  }

  try {
    salvandoParcela.value = true
    const response = await LancamentosRepository.adicionarParcela(lancamento.value.id, {
      valor,
      vencimento: novaParcela.value.vencimento.toISOString(),
      descricao: novaParcela.value.descricao.trim() || null,
    })
    toast.success(response?.message || 'Parcela adicionada com sucesso')
    openAdicionarParcela.value = false
    store.updateTable()
    await loadLancamento()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao adicionar a parcela')
  } finally {
    salvandoParcela.value = false
  }
}

async function excluirParcela(parcela: ParcelaDetalhe) {
  if (!parcela.id) return

  const confirm = await useConfirm().confirm({
    title: 'Excluir parcela',
    message: 'Deseja excluir esta parcela pendente? O total do lançamento será recalculado pelas parcelas restantes.',
    confirmText: 'Sim, excluir',
  })

  if (!confirm) return

  try {
    const response = await LancamentosRepository.deletarParcela(parcela.id)
    toast.success(response?.message || 'Parcela excluída com sucesso')
    store.updateTable()
    await loadLancamento()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir a parcela')
  }
}

function efetivarParcela(id: number) {
  store.idMutation = id
  store.openModalEfetivar = true
}

async function estornarParcela(id: number) {
  try {
    await LancamentosRepository.estornarParcela(id)
    toast.success('Parcela estornada com sucesso')
    loadLancamento()
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao estornar a parcela')
  }
}

function gerarCobrancaFatura() {
  const primeiraPendente = parcelasOrdenadas.value.find((parcela) => !parcela.pago)

  if (!primeiraPendente?.id) {
    toast.info('Não existe parcela pendente para cobrança neste lançamento')
    return
  }

  storeCobranca.openSave({
    id: primeiraPendente.id,
    tipo: 'parcela',
    valor: Number(primeiraPendente.valor || 0),
  })
}

function gerarCobrancaParcela(idParcela: number, valor?: number) {
  storeCobranca.openSave({
    id: idParcela,
    tipo: 'parcela',
    valor,
  })
}

function openLinkCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
}

async function deletar(id: number) {
  const confirm = await useConfirm().confirm({
    title: 'Excluir lançamento',
    message: 'Tem certeza que deseja excluir este lançamento?',
    confirmText: 'Sim, excluir',
  })

  if (!confirm) return

  try {
    await LancamentosRepository.remove(id)
    store.updateTable()
    toast.success('Lançamento deletado com sucesso')
    router.back()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao deletar o lançamento')
  }
}

async function toggleNotificacaoVencimento() {
  if (!lancamento.value?.id) return

  const ativo = !lancamento.value.notificarVencimento

  try {
    const response = await LancamentosRepository.atualizarNotificacaoVencimento(lancamento.value.id, ativo)
    lancamento.value.notificarVencimento = Boolean(response?.data?.notificarVencimento ?? ativo)
    store.updateTable()
    toast.success(response?.message || (ativo ? 'Notificação ativada.' : 'Notificação desativada.'))
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao atualizar notificação.')
  }
}

async function toggleNotificacaoClienteVencimento() {
  if (!lancamento.value?.id || !podeNotificarCliente.value) return

  const ativo = !lancamento.value.notificarClienteVencimento

  try {
    const response = await LancamentosRepository.atualizarNotificacaoClienteVencimento(lancamento.value.id, ativo)
    lancamento.value.notificarClienteVencimento = Boolean(response?.data?.notificarClienteVencimento ?? ativo)
    store.updateTable()
    toast.success(response?.message || (ativo ? 'Cobranca ao cliente ativada.' : 'Cobranca ao cliente desativada.'))
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao atualizar cobranca ao cliente.')
  }
}

// ---- Seleção e ações em massa nas parcelas ----
const selecao = useParcelasSelecao(() => parcelasOrdenadas.value)
const loteProcessando = ref(false)
const efetivarLoteOpen = ref(false)
const cobrancaLoteOpen = ref(false)

const parcelasParaCobranca = computed(() =>
  selecao.selecionadasSemCobranca.value.map((parcela) => ({
    id: parcela.id as number,
    valor: Number(parcela.valor || 0),
  })),
)

function reportarIgnoradas(ignoradas: ParcelaIgnoradaLote[]) {
  if (!ignoradas.length) return

  const porMotivo = new Map<string, number>()
  for (const item of ignoradas) {
    porMotivo.set(item.motivo, (porMotivo.get(item.motivo) ?? 0) + 1)
  }

  const resumo = [...porMotivo.entries()]
    .map(([motivo, quantidade]) => `${quantidade}x ${motivo}`)
    .join(' ')

  toast.warning(`${ignoradas.length} parcela(s) ignorada(s): ${resumo}`, { timeout: 8000 })
}

async function finalizarLote() {
  selecao.limpar()
  store.updateTable()
  await loadLancamento()
}

function abrirEfetivarLote() {
  if (!selecao.pendentesSelecionadas.value.length) return
  efetivarLoteOpen.value = true
}

function abrirCobrancaLote() {
  if (!parcelasParaCobranca.value.length) return
  cobrancaLoteOpen.value = true
}

async function onEfetivarLoteSalvo(resultado: { efetivadas: number; ignoradas: ParcelaIgnoradaLote[] }) {
  toast.success(`${resultado.efetivadas} parcela(s) efetivada(s) com sucesso.`)
  reportarIgnoradas(resultado.ignoradas)
  await finalizarLote()
}

async function estornarSelecionadas() {
  const ids = selecao.pagasSelecionadas.value.map((parcela) => parcela.id as number)
  if (!ids.length) return

  const confirmado = await useConfirm().confirm({
    title: 'Estornar parcelas',
    message: `Deseja estornar ${ids.length} parcela(s) efetivada(s)? Elas voltam para o status pendente.`,
    confirmText: 'Sim, estornar',
  })

  if (!confirmado) return

  try {
    loteProcessando.value = true
    const response = await LancamentosRepository.estornarMultiplasParcelas(ids)
    toast.success(`${response.data?.estornadas ?? 0} parcela(s) estornada(s) com sucesso.`)
    reportarIgnoradas(response.data?.ignoradas ?? [])
    await finalizarLote()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao estornar as parcelas')
  } finally {
    loteProcessando.value = false
  }
}

async function excluirSelecionadas() {
  const ids = selecao.pendentesSelecionadas.value.map((parcela) => parcela.id as number)
  if (!ids.length) return

  const confirmado = await useConfirm().confirm({
    title: 'Excluir parcelas',
    message: `Deseja excluir ${ids.length} parcela(s) pendente(s)? O total do lançamento será recalculado e o lançamento manterá ao menos uma parcela.`,
    confirmText: 'Sim, excluir',
  })

  if (!confirmado) return

  try {
    loteProcessando.value = true
    const response = await LancamentosRepository.deletarMultiplasParcelas(ids)
    toast.success(`${response.data?.excluidas ?? 0} parcela(s) excluída(s) com sucesso.`)
    reportarIgnoradas(response.data?.ignoradas ?? [])
    await finalizarLote()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao excluir as parcelas')
  } finally {
    loteProcessando.value = false
  }
}

function getNumeroParcelaLabel(parcela: ParcelaDetalhe) {
  if (parcela.numero === 0) return 'Entrada'
  if (parcela.numero === 1 && parcelasOrdenadas.value.length === 1) return 'À vista'
  return `Parcela ${parcela.numero}`
}

onMounted(loadLancamento)
watch(() => storeCobranca.filters.update, loadLancamento)
watch(() => store.filters.update, loadLancamento)
</script>

<template>
  <div class="mx-auto space-y-4 pb-20 md:pb-0">
    <div
      class="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <Badge class="border-0" :class="getTipoClasses(lancamento?.tipo)">
            {{ lancamento?.tipo === 'DESPESA' ? 'Despesa' : 'Receita' }}
          </Badge>
          <Badge class="border-0" :class="resumoStatus.classes">
            {{ resumoStatus.label }}
          </Badge>
          <Badge v-if="lancamento?.vendaId" variant="outline">Lançamento automático</Badge>
          <Badge v-if="recorrencia" variant="outline" class="gap-1">
            <Repeat class="h-3 w-3" /> Recorrente
          </Badge>
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground">
            <BadgeDollarSign class="h-5 w-5 text-primary dark:text-yellow-400" />
            {{ lancamento?.descricao || 'Detalhes do lançamento' }}
          </div>
          <p class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>#{{ lancamento?.Uid || 'N/A' }}</span>
            <button type="button"
              class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-muted/50"
              @click="copiarUid">
              <Copy class="h-3.5 w-3.5" /> Copiar UID
            </button>
          </p>
        </div>
      </div>

      <div class="hidden flex-wrap items-center gap-2 md:flex">
        <Button variant="outline" @click="goBack">
          <ArrowLeft class="h-4 w-4" /> Voltar
        </Button>
        <Button v-if="lancamento?.vendaId" variant="outline" @click="abrirVendaVinculada">
          <ShoppingCart class="h-4 w-4" /> Detalhes da venda
        </Button>
        <Button v-if="uiStore.canCreateCharge" class="bg-success text-white hover:bg-success/80"
          :disabled="!parcelasOrdenadas.some((parcela) => !parcela.pago)" @click="gerarCobrancaFatura">
          <CircleDollarSign class="h-4 w-4" /> Gerar cobrança
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="gap-1">
              <MoreVertical class="h-4 w-4" /> Mais ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-60">
            <DropdownMenuItem :disabled="!lancamento?.id" @click="editarLancamento">
              <PenLine class="mr-2 h-4 w-4" /> Editar lançamento
            </DropdownMenuItem>
            <DropdownMenuItem @click="loadLancamento">
              <RotateCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" /> Atualizar dados
            </DropdownMenuItem>
            <DropdownMenuItem :disabled="!lancamento?.id" @click="recorrenciaOpen = true">
              <Repeat class="mr-2 h-4 w-4" />
              {{ recorrencia ? 'Editar recorrência' : 'Tornar recorrente' }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem :disabled="!lancamento?.id" @click="toggleNotificacaoVencimento">
              <BellOff v-if="lancamento?.notificarVencimento" class="mr-2 h-4 w-4" />
              <Bell v-else class="mr-2 h-4 w-4" />
              {{ lancamento?.notificarVencimento ? 'Não lembrar vencimento' : 'Lembrar vencimento' }}
            </DropdownMenuItem>
            <DropdownMenuItem v-if="podeNotificarCliente" :disabled="!lancamento?.id" @click="toggleNotificacaoClienteVencimento">
              <BellOff v-if="lancamento?.notificarClienteVencimento" class="mr-2 h-4 w-4" />
              <Bell v-else class="mr-2 h-4 w-4" />
              {{ lancamento?.notificarClienteVencimento ? 'Desativar aviso ao cliente' : 'Notificar cliente' }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-red-600 focus:text-red-600" :disabled="!lancamento?.id" @click="deletar(lancamento?.id!)">
              <Trash2 class="mr-2 h-4 w-4" /> Excluir lançamento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Total lançado</CardDescription>
          <CardTitle class="text-2xl">{{ formatCurrencyBR(valorTotal) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">{{ parcelasOrdenadas.length }} parcela(s) vinculada(s)</p>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>{{ lancamento?.tipo === 'DESPESA' ? 'Total pago' : 'Total recebido' }}</CardDescription>
          <CardTitle class="text-2xl text-emerald-600">{{ formatCurrencyBR(totalPago) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{parcelasOrdenadas.filter((parcela) => parcela.pago).length}} parcela(s) efetivada(s)
          </p>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Em aberto</CardDescription>
          <CardTitle class="text-2xl text-amber-600">{{ formatCurrencyBR(totalPendente) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {{parcelasOrdenadas.filter((parcela) => !parcela.pago).length}} parcela(s) pendente(s)
          </p>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Próximo passo</CardDescription>
          <CardTitle class="text-base md:text-lg">
            {{ proximaParcela ? `${getNumeroParcelaLabel(proximaParcela)} de ${parcelasOrdenadas.length}` : '✅ Sem pendências' }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="proximaParcela" class="text-sm text-muted-foreground">
            Vence em {{ formatDateToPtBR(proximaParcela.vencimento) }}
          </p>
          <p v-else class="text-sm text-muted-foreground">Todas as parcelas já foram concluídas.</p>
        </CardContent>
      </Card>
    </section>

    <div class="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <Card class="shadow-sm">
        <CardHeader class="p-4">
          <CardTitle class="flex items-center gap-2 text-lg">
            <BadgeInfo class="h-5 w-5 text-primary" /> Resumo operacional
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 px-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="mb-3 text-sm font-medium text-foreground">Classificação</p>
              <div class="space-y-2 text-sm text-muted-foreground">
                <p class="flex items-center gap-2">
                  <Tags class="h-4 w-4" /> Categoria: <span class="font-medium text-foreground">{{
                    lancamento?.categoria?.nome || 'Não informada' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Landmark class="h-4 w-4" /> Conta: <span class="font-medium text-foreground">{{
                    lancamento?.ContasFinanceiro?.nome || 'Não informada' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <UserRound class="h-4 w-4" /> Cliente: <span class="font-medium text-foreground">{{
                    lancamento?.cliente?.nome || 'Não informado' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Wallet class="h-4 w-4" /> Forma de pagamento padrão: <span class="font-medium text-foreground">{{
                    lancamento?.formaPagamento || 'Não informada' }}</span>
                </p>
              </div>
            </div>

            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="mb-3 text-sm font-medium text-foreground">Datas e recorrência</p>
              <div class="space-y-2 text-sm text-muted-foreground">
                <p class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4" /> Lançamento: <span class="font-medium text-foreground">{{
                    lancamento?.dataLancamento ? formatDateToPtBR(lancamento.dataLancamento) : 'N/A' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Clock3 class="h-4 w-4" /> Cadastro: <span class="font-medium text-foreground">{{
                    lancamento?.createdAt ? formatDateToPtBR(lancamento.createdAt, true) : 'N/A' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4" /> Entrada: <span class="font-medium text-foreground">{{
                    lancamento?.dataEntrada ? formatDateToPtBR(lancamento.dataEntrada) : 'Sem entrada' }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <BadgeInfo class="h-4 w-4" /> Modelo: <span class="font-medium text-foreground">{{
                    recorrencia
                      ? `Recorrente (${descricaoFrequenciaRecorrencia.toLowerCase()})`
                      : lancamento?.recorrente
                        ? 'Parcelado'
                        : 'Lançamento único' }}</span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <p class="text-sm text-muted-foreground">Desconto aplicado</p>
              <p class="text-base font-semibold text-foreground">{{ formatCurrencyBR(lancamento?.desconto || 0) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Parcelas vencidas</p>
              <p class="text-base font-semibold text-foreground">{{ parcelasVencidas.length }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Próxima parcela</p>
              <p class="text-base font-semibold text-foreground">
                {{ proximaParcela ? formatDateToPtBR(proximaParcela.vencimento) : 'Sem pendências' }}
              </p>
            </div>
          </div>

          <div class="rounded-xl border bg-muted/20 p-4">
            <p class="mb-2 text-sm font-medium text-foreground">Descrição</p>
            <p class="text-sm leading-relaxed text-muted-foreground">
              {{ lancamento?.descricao || 'Nenhuma descrição informada.' }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="p-4">
          <CardTitle class="text-lg">Panorama rápido</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3 px-4">
          <div class="rounded-xl border p-4">
            <p class="text-sm text-muted-foreground">Saldo do lançamento</p>
            <p class="text-xl font-semibold" :class="totalPendente > 0 ? 'text-amber-600' : 'text-emerald-600'">
              {{ formatCurrencyBR(totalPago - totalPendente) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Recebido/pago {{ formatCurrencyBR(totalPago) }} • em aberto {{ formatCurrencyBR(totalPendente) }}
            </p>
          </div>

          <div class="rounded-xl border p-4">
            <p class="text-sm text-muted-foreground">Cobranças geradas</p>
            <p class="text-xl font-semibold text-foreground">
              {{parcelasOrdenadas.filter((parcela) => parcela.CobrancasFinanceiras?.length).length}}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Parcelas com link de cobrança disponível.</p>
          </div>

          <div class="rounded-xl border p-4">
            <p class="text-sm text-muted-foreground">Risco atual</p>
            <p class="text-xl font-semibold" :class="parcelasVencidas.length ? 'text-rose-600' : 'text-emerald-600'">
              {{ parcelasVencidas.length ? `${parcelasVencidas.length} vencida(s)` : 'Sem atraso' }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Acompanhamento por parcela e conta financeira.</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-if="recorrencia" class="shadow-sm">
      <CardHeader class="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <CardTitle class="flex flex-wrap items-center gap-2 text-lg">
          <Repeat class="h-5 w-5 text-primary" /> Recorrência
          <Badge class="border-0" :class="situacaoRecorrencia.classes">
            {{ situacaoRecorrencia.label }}
          </Badge>
        </CardTitle>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="recorrenciaSalvando || !recorrencia.ativo"
            @click="gerarProximaOcorrencia"
          >
            <Plus class="h-4 w-4" /> Gerar próxima
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="recorrenciaSalvando || (!recorrencia.ativo && !recorrencia.proximoVencimento)"
            @click="alternarPausaRecorrencia"
          >
            <Pause v-if="recorrencia.ativo" class="h-4 w-4" />
            <Play v-else class="h-4 w-4" />
            {{ recorrencia.ativo ? 'Pausar' : 'Retomar' }}
          </Button>
          <Button variant="outline" size="sm" :disabled="recorrenciaSalvando" @click="recorrenciaOpen = true">
            <PenLine class="h-4 w-4" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="text-red-600 hover:text-red-600"
            :disabled="recorrenciaSalvando || !recorrencia.proximoVencimento"
            @click="encerrarRecorrencia"
          >
            <Undo2 class="h-4 w-4" /> Encerrar
          </Button>
        </div>
      </CardHeader>
      <CardContent class="px-4 pb-4">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-sm text-muted-foreground">Valor por ocorrência</p>
            <p class="text-base font-semibold text-foreground">
              {{ formatCurrencyBR(Number(recorrencia.valorParcela || 0)) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">{{ descricaoFrequenciaRecorrencia }}</p>
          </div>

          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-sm text-muted-foreground">Próxima geração</p>
            <p class="text-base font-semibold text-foreground">
              {{
                recorrencia.proximoVencimento
                  ? formatDateToPtBR(recorrencia.proximoVencimento as string)
                  : 'Encerrada'
              }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{
                recorrencia.geracaoAutomatica
                  ? `Automática ${recorrencia.diasAntecedencia} dia(s) antes`
                  : 'Gerada ao pagar a parcela vigente'
              }}
            </p>
          </div>

          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-sm text-muted-foreground">Parcelas em aberto</p>
            <p
              class="text-base font-semibold"
              :class="
                parcelasEmAberto >= Number(recorrencia.maximoEmAberto)
                  ? 'text-rose-600'
                  : 'text-foreground'
              "
            >
              {{ parcelasEmAberto }} de no máx. {{ recorrencia.maximoEmAberto }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Mínimo mantido: {{ recorrencia.minimoGerado }}
            </p>
          </div>

          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-sm text-muted-foreground">Período</p>
            <p class="text-base font-semibold text-foreground">
              {{ formatDateToPtBR(recorrencia.dataInicio as string) }} →
              {{ recorrencia.dataFim ? formatDateToPtBR(recorrencia.dataFim as string) : 'sem fim' }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ recorrencia.totalGerado }} ocorrência(s) gerada(s)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="shadow-sm" v-if="parcelasOrdenadas.length">
      <CardHeader class="flex flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between">
        <CardTitle class="text-lg flex items-center gap-2">
          <BadgeInfo class="h-4 w-4" />
          Parcelas e cobranças
        </CardTitle>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox :model-value="selecao.todosSelecionados.value" @update:model-value="selecao.toggleTodos()" />
            Selecionar todas
          </label>
          <button type="button" class="rounded-md border px-2 py-0.5 text-xs hover:bg-muted/50"
            @click="selecao.selecionarPendentes()">
            Pendentes
          </button>
          <button type="button" class="rounded-md border px-2 py-0.5 text-xs hover:bg-muted/50"
            @click="selecao.selecionarPagas()">
            Pagas
          </button>
          <button v-if="selecao.total.value" type="button"
            class="rounded-md border px-2 py-0.5 text-xs hover:bg-muted/50" @click="selecao.limpar()">
            Limpar
          </button>
          <Button variant="outline" size="sm" :disabled="!lancamento?.id" @click="abrirAdicionarParcela">
            <Plus class="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-2.5 px-4">
        <ParcelasBulkBar
          :total="selecao.total.value"
          :valor="selecao.valorSelecionado.value"
          :pendentes="selecao.pendentesSelecionadas.value.length"
          :pagas="selecao.pagasSelecionadas.value.length"
          :sem-cobranca="parcelasParaCobranca.length"
          :processando="loteProcessando"
          @efetivar="abrirEfetivarLote"
          @cobrar="abrirCobrancaLote"
          @estornar="estornarSelecionadas"
          @excluir="excluirSelecionadas"
          @limpar="selecao.limpar()"
        />

        <div v-for="parcela in parcelasOrdenadas" :key="parcela.id"
          class="relative overflow-hidden rounded-r-xl border bg-card px-3 py-1 shadow-sm"
          :class="selecao.estaSelecionada(parcela.id) ? 'ring-1 ring-primary/40' : ''">
          <div class="absolute left-0 top-0 h-full w-1"
            :class="lancamento?.tipo === 'DESPESA' ? 'bg-rose-500' : 'bg-emerald-500'" />

          <div class="flex items-center justify-between gap-3">
            <Checkbox
              class="ml-1.5 shrink-0"
              :model-value="selecao.estaSelecionada(parcela.id)"
              @update:model-value="selecao.toggle(parcela.id!)"
            />
            <div class="min-w-0 flex-1 space-y-1.5 pl-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-foreground flex items-center gap-1">
                    {{ formatCurrencyBR(parcela.valor || 0) }}
                  <span class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2 py-0 text-[10px] border border-border rounded-md">{{ getNumeroParcelaLabel(parcela) }}</span>
                    <Badge class="border-0 px-2 py-0 text-[10px]"
                      :class="parcela.pago ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : parcelasVencidas.some((item) => item.id === parcela.id) ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
                      {{parcela.pago ? 'Pago' : parcelasVencidas.some((item) => item.id === parcela.id) ? 'Atrasado' :
                      'Pendente' }}
                    </Badge>
                    <Badge v-if="parcela.CobrancasFinanceiras?.length" variant="outline" class="px-2 py-0 text-[10px]">
                      Cobrança</Badge>
                  </span>
                  </p>
                  <div class="flex items-center gap-1">
                    <p class="truncate text-xs text-muted-foreground">
                      Conta: {{ parcela.ContaFinanceira?.nome || lancamento?.ContasFinanceiro?.nome || 'Não informada' }}
                    </p>
                    -
                    <p class="truncate text-[11px] text-muted-foreground flex items-center">
                      Venc. {{ formatDateToPtBR(parcela.vencimento) }}
                      <span v-if="parcela.dataPagamento"> 
                        • Pgto {{ formatDateToPtBR(parcela.dataPagamento, true)}}
                      </span>
                      <span v-if="parcela.formaPagamento"> • {{ parcela.formaPagamento }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <div class="hidden items-center gap-1 md:flex">
                <Button v-if="!parcela.pago" variant="outline" size="icon" class="h-8 w-8" v-tooltip="'Editar'" @click="editarParcela(parcela)">
                  <PenLine class="h-4 w-4" />
                </Button>
                <Button v-if="!parcela.pago" variant="outline" size="icon" class="h-8 w-8 text-rose-600 hover:text-rose-700"
                  v-tooltip="'Excluir'" @click="excluirParcela(parcela)">
                  <Trash2 class="h-4 w-4" />
                </Button>
                <Button v-if="uiStore.canCreateCharge && !parcela.pago && !parcela.CobrancasFinanceiras?.length" size="icon"
                  class="h-8 w-8 bg-success text-white hover:bg-success/80" v-tooltip="'Gerar cobrança'"
                  @click="gerarCobrancaParcela(parcela.id!, Number(parcela.valor || 0))">
                  <CircleDollarSign class="h-4 w-4" />
                </Button>
                <Button v-if="parcela.CobrancasFinanceiras?.length" variant="outline" size="icon" class="h-8 w-8"
                  v-tooltip="'Abrir cobrança'" @click="openLinkCobranca(parcela.CobrancasFinanceiras[0].externalLink)">
                  <ExternalLink class="h-4 w-4" />
                </Button>
                <Button v-if="lancamento?.tipo === 'RECEITA' && lancamento?.clienteId && !parcela.pago"
                  variant="outline" size="icon" class="h-8 w-8" v-tooltip="'Enviar cobrança pelo WhatsApp'"
                  @click="abrirCobrancaRapida(parcela)">
                  <Send class="h-4 w-4" />
                </Button>
                <Button v-if="!parcela.pago" size="icon" class="h-8 w-8 dark:text-white"
                  v-tooltip="lancamento?.tipo === 'DESPESA' ? 'Pagar' : 'Receber'" @click="efetivarParcela(parcela.id!)">
                  <CheckCircle2 class="h-4 w-4" />
                </Button>
                <Button v-else size="icon" class="h-8 w-8 bg-warning text-white hover:bg-warning/80"
                  v-tooltip="'Estornar'" @click="estornarParcela(parcela.id!)">
                  <Undo2 class="h-4 w-4" />
                </Button>
              </div>

              <DropdownMenu v-if="uiStore.isMobile">
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="icon" class="h-8 w-8">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuItem v-if="!parcela.pago" @click="editarParcela(parcela)">
                    <PenLine class="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="!parcela.pago"
                    @click="excluirParcela(parcela)">
                    <Trash2 class="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="!parcela.pago"
                    @click="efetivarParcela(parcela.id!)">
                    <CheckCircle2 class="mr-2 h-4 w-4" /> {{ lancamento?.tipo === 'DESPESA' ? 'Pagar' : 'Receber' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem v-else
                    @click="estornarParcela(parcela.id!)">
                    <Undo2 class="mr-2 h-4 w-4" /> Estornar
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="uiStore.canCreateCharge && !parcela.pago && !parcela.CobrancasFinanceiras?.length"
                    @click="gerarCobrancaParcela(parcela.id!, Number(parcela.valor || 0))">
                    <CircleDollarSign class="mr-2 h-4 w-4" /> Gerar cobrança
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="parcela.CobrancasFinanceiras?.length"
                    @click="openLinkCobranca(parcela.CobrancasFinanceiras[0].externalLink)">
                    <ExternalLink class="mr-2 h-4 w-4" /> Abrir cobrança
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="lancamento?.tipo === 'RECEITA' && lancamento?.clienteId && !parcela.pago"
                    @click="abrirCobrancaRapida(parcela)">
                    <Send class="mr-2 h-4 w-4" /> Enviar pelo WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="goBack"
      >
        <ArrowLeft class="h-5 w-5" />
        <span class="text-xs">Voltar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="loadLancamento"
      >
        <RotateCw class="h-5 w-5" :class="{ 'animate-spin': loading }" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button
        v-if="lancamento?.vendaId"
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="abrirVendaVinculada"
      >
        <ShoppingCart class="h-5 w-5" />
        <span class="text-xs">Venda</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!lancamento?.id"
        @click="editarLancamento"
      >
        <PenLine class="h-5 w-5" />
        <span class="text-xs">Editar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!lancamento?.id"
        @click="abrirAdicionarParcela"
      >
        <Plus class="h-5 w-5" />
        <span class="text-xs">Parcela</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!lancamento?.id"
        @click="toggleNotificacaoVencimento"
      >
        <BellOff v-if="lancamento?.notificarVencimento" class="h-5 w-5" />
        <Bell v-else class="h-5 w-5" />
        <span class="text-xs">{{ lancamento?.notificarVencimento ? 'Desativar' : 'Ativar' }}</span>
      </button>
      <button
        v-if="podeNotificarCliente"
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary disabled:text-gray-300 dark:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!lancamento?.id"
        @click="toggleNotificacaoClienteVencimento"
      >
        <BellOff v-if="lancamento?.notificarClienteVencimento" class="h-5 w-5" />
        <Bell v-else class="h-5 w-5" />
        <span class="text-xs">{{ lancamento?.notificarClienteVencimento ? 'Cliente off' : 'Cliente' }}</span>
      </button>
      <button
        v-if="uiStore.canCreateCharge"
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300 disabled:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!parcelasOrdenadas.some((parcela) => !parcela.pago)"
        @click="gerarCobrancaFatura"
      >
        <CircleDollarSign class="h-5 w-5" />
        <span class="text-xs">Cobrar</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-center text-red-600 transition hover:text-red-500 disabled:text-gray-300 dark:disabled:text-gray-600"
        :disabled="!lancamento?.id"
        @click="deletar(lancamento?.id!)"
      >
        <Trash2 class="h-5 w-5" />
        <span class="text-xs">Excluir</span>
      </button>
    </MobileBottomBar>

    <GerarCobranca />
    <LancamentoModal />
    <ClientesModal />
    <DetalhesVenda :acoes-host="['cobranca']" />
    <CobrancaRapidaModal
      v-model:open="cobrancaRapidaOpen"
      :cliente="lancamento?.cliente?.nome"
      :descricao="cobrancaRapidaParcela ? `${lancamento?.descricao} • ${getNumeroParcelaLabel(cobrancaRapidaParcela)}` : lancamento?.descricao"
      :valor="Number(cobrancaRapidaParcela?.valor || 0)"
      :mensagem-inicial="mensagemCobrancaPadrao"
      :sending="cobrancaRapidaSending"
      @enviar="enviarCobrancaRapida"
    />
    <ModalParcela />
    <ModalView
      v-model:open="openAdicionarParcela"
      size="md"
      title="Adicionar parcela"
      description="Inclua uma nova parcela pendente neste lançamento. O total será recalculado pelas parcelas."
    >
      <form class="grid grid-cols-1 gap-3 px-4" @submit.prevent="adicionarParcela">
        <div>
          <Label>Descrição</Label>
          <Input v-model="novaParcela.descricao" placeholder="Opcional" />
        </div>
        <div>
          <Label>Vencimento</Label>
          <Calendarpicker required :teleport="true" v-model="novaParcela.vencimento" />
        </div>
        <div>
          <Label>Valor</Label>
          <Input
            v-model="novaParcela.valor"
            type="text"
            required
            placeholder="R$ 0,00"
            v-maska="moneyMaskOptions"
          />
        </div>
        <div class="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="salvandoParcela" @click="openAdicionarParcela = false">
            Cancelar
          </Button>
          <Button type="submit" class="text-white" :disabled="salvandoParcela">
            {{ salvandoParcela ? 'Salvando...' : 'Adicionar' }}
          </Button>
        </div>
      </form>
    </ModalView>
    <FormularioEfertivar @success="loadLancamento" />

    <EfetivarLoteModal
      v-model:open="efetivarLoteOpen"
      :parcelas-ids="selecao.pendentesSelecionadas.value.map((parcela) => parcela.id!)"
      @saved="onEfetivarLoteSalvo"
    />

    <CobrancaLoteModal
      v-model:open="cobrancaLoteOpen"
      :parcelas="parcelasParaCobranca"
      :cliente-id="lancamento?.clienteId"
      @finished="finalizarLote"
    />

    <FormularioRecorrencia
      v-if="lancamento?.id"
      v-model:open="recorrenciaOpen"
      :lancamento-id="lancamento.id"
      :recorrencia="recorrencia"
      :valor-sugerido="proximaParcela?.valor ?? parcelasOrdenadas[0]?.valor ?? null"
      @saved="loadLancamento"
    />
  </div>
</template>
