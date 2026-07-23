<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { formatCurrencyBR } from '@/utils/formatters'
import { StoreRepository, type StoreModule, type StoreResumo } from '@/repositories/store-repository'
import { ContaRepository, type MercadoPagoIntegracaoStatus } from '@/repositories/conta-repository'
import type { UpdateParametrosConta } from '@/types/schemas'
import { isStoreModuleFree, shouldShowImmediateBillingOptions } from './billing'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Banknote,
  Bot,
  CalendarCheck,
  CircleCheck,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  Headset,
  LoaderCircle,
  MessageCircle,
  PackagePlus,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-vue-next'

const toast = useToast()
const confirm = useConfirm()
const route = useRoute()
const router = useRouter()

const CONFIG_APP_CODES = ['mercado-pago', 'abacatepay'] as const

type ConfigAppCode = (typeof CONFIG_APP_CODES)[number]

const modulos = ref<StoreModule[]>([])
const resumo = ref<StoreResumo | null>(null)
const moduloSelecionado = ref<StoreModule | null>(null)
const isDialogOpen = ref(false)
const loading = ref(false)
const actionLoadingId = ref<number | null>(null)
const configSavingCode = ref<ConfigAppCode | null>(null)
const search = ref('')
const statusFilter = ref<'TODOS' | 'ATIVOS' | 'PENDENTES' | 'DISPONIVEIS'>('TODOS')
const billingMode = ref<'PROPORCIONAL' | 'MENSAL'>('PROPORCIONAL')

const formMercadoPago = reactive<UpdateParametrosConta>({
  MercadoPagoApiKey: '',
  MercadoPagoEnv: '',
})
const mercadoPagoStatus = ref<MercadoPagoIntegracaoStatus | null>(null)
const mercadoPagoLoading = ref(false)
const mostrarChaveManualMp = ref(false)
const formAbacatePay = reactive<UpdateParametrosConta>({
  AbacatePayApiKey: '',
  AbacatePaySecret: '',
})

const iconMap = {
  'core-ia': Bot,
  assinaturas: Sparkles,
  whatsapp: MessageCircle,
  atendimento: Headset,
  servicos: Wrench,
  arena: CalendarCheck,
  'mercado-pago': CreditCard,
  abacatepay: Banknote,
} as const

const logoMap = {
  'core-ia': '/imgs/apps/core.png',
  'loja-virtual': '/imgs/apps/loja.png',
  assinaturas: '/imgs/apps/assina.png',
  whatsapp: '/imgs/apps/wpp.avif',
  arena: '/imgs/apps/arena.png',
  servicos: '/imgs/apps/servicos.png',
  atendimento: '/imgs/apps/atende.png',
  'mercado-pago': '/imgs/apps/mp.png',
  abacatepay: '/imgs/apps/abacate.png',
} as const

const iconShellClassMap: Record<string, string> = {
  'core-ia': 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20',
  assinaturas: 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/20',
  whatsapp: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
  atendimento: 'bg-green-500/15 text-green-300 ring-1 ring-green-500/20',
  servicos: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
  arena: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20',
  'mercado-pago': 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20',
  abacatepay: 'bg-lime-500/15 text-lime-300 ring-1 ring-lime-500/20',
}

const categoryOrder: Record<string, number> = {
  extensoes: 0,
  financeiro: 1,
  produtividade: 2,
  notificacoes: 3,
  'chat inteligente': 4,
  'canais de comunicacao': 5,
  'sistemas de gestao': 6,
  crm: 7,
}

const mercadoPagoConectado = computed(() => Boolean(mercadoPagoStatus.value?.conectado))
const mercadoPagoConfigured = computed(
  () => mercadoPagoConectado.value || Boolean(formMercadoPago.MercadoPagoApiKey),
)
const abacatePayConfigured = computed(() => Boolean(formAbacatePay.AbacatePayApiKey && formAbacatePay.AbacatePaySecret))
const selectedIsConfigApp = computed(() => Boolean(moduloSelecionado.value && isConfigApp(moduloSelecionado.value.codigo)))

const cards = computed(() => {
  const query = search.value.trim().toLowerCase()

  return [...modulos.value]
    .filter((modulo) => {
      const matchesSearch =
        !query ||
        [modulo.nome, modulo.categoria, modulo.descricao || '']
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter.value === 'TODOS' ||
        (statusFilter.value === 'ATIVOS' && modulo.ativo) ||
        (statusFilter.value === 'PENDENTES' && (modulo.pendenteAtivacao || modulo.cobrancaPendenteAtual || modulo.cancelamentoAgendado)) ||
        (statusFilter.value === 'DISPONIVEIS' && !modulo.ativo && !modulo.pendenteAtivacao && !modulo.cancelamentoAgendado)

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const priorityA = getModulePriority(a)
      const priorityB = getModulePriority(b)

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
})

const groupedCards = computed(() => {
  const grouped = new Map<string, StoreModule[]>()

  for (const modulo of cards.value) {
    const categoria = modulo.categoria || 'Outros'
    const current = grouped.get(categoria) || []
    current.push(modulo)
    grouped.set(categoria, current)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => getCategoryPriority(a) - getCategoryPriority(b) || a.localeCompare(b, 'pt-BR'))
    .map(([categoria, items]) => ({ categoria, items }))
})

const totalAppsAtivos = computed(() => resumo.value?.totalAppsEmUso ?? modulos.value.filter((modulo) => modulo.ativo).length)
const totalAppsPendentes = computed(
  () => resumo.value?.totalAppsPendentes ?? modulos.value.filter((modulo) => modulo.pendenteAtivacao || modulo.cobrancaPendenteAtual).length,
)
const valorAppsProximoCiclo = computed(() => resumo.value?.valorAppsProximoCiclo || 0)

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isConfigApp(codigo?: string | null): codigo is ConfigAppCode {
  return CONFIG_APP_CODES.includes((codigo || '') as ConfigAppCode)
}

function isModuleConfigured(modulo: StoreModule) {
  if (modulo.codigo === 'mercado-pago') return mercadoPagoConfigured.value
  if (modulo.codigo === 'abacatepay') return abacatePayConfigured.value
  return false
}

function getCategoryPriority(categoria: string) {
  return categoryOrder[normalizeText(categoria)] ?? 999
}

function getModulePriority(modulo: StoreModule) {
  if (modulo.ativo && !modulo.cancelamentoAgendado) return 0
  if (modulo.cobrancaPendenteAtual) return 1
  if (modulo.pendenteAtivacao) return 2
  if (modulo.cancelamentoAgendado) return 3
  return 4
}

function getIcon(modulo: StoreModule) {
  return iconMap[modulo.codigo as keyof typeof iconMap] || PackagePlus
}

function getImage(modulo: StoreModule) {
  return logoMap[modulo.codigo as keyof typeof logoMap] || '/imgs/logo.png'
}

function getIconShellClass(modulo: StoreModule) {
  return iconShellClassMap[modulo.codigo] || 'bg-slate-500/15 text-slate-200 ring-1 ring-white/10'
}

function getDataFormatada(data?: string | Date | null) {
  if (!data) return 'Não informado'
  return new Date(data).toLocaleDateString('pt-BR')
}

function getMonthlyValueAfterAction(modulo: StoreModule) {
  const mensalidadeAtual = resumo.value?.mensalidadeAtual || 0

  if (modulo.cancelamentoAgendado) {
    return mensalidadeAtual
  }

  if (modulo.ativo || modulo.pendenteAtivacao) {
    return Math.max(mensalidadeAtual - modulo.preco, 0)
  }

  return mensalidadeAtual + modulo.preco
}

function getImmediateChargeValue(modulo: StoreModule, mode = billingMode.value) {
  if (isStoreModuleFree(modulo)) return 0
  return mode === 'MENSAL' ? modulo.valorCobrancaMensal : modulo.valorCobrancaProporcional
}

function getImpactDescription(modulo: StoreModule) {
  if (isConfigApp(modulo.codigo)) {
    if (modulo.ativo) {
      if (modulo.codigo === 'mercado-pago' && !mercadoPagoConfigured.value) {
        return 'App gratuito ativo. Falta apenas conectar sua conta do Mercado Pago para concluir a integração.'
      }

      return isModuleConfigured(modulo)
        ? 'App gratuito ativo. As credenciais operacionais desta conta já foram salvas e podem ser atualizadas a qualquer momento.'
        : 'App gratuito ativo. Falta apenas salvar as credenciais operacionais desta conta para concluir a integração.'
    }

    return 'App gratuito. Ao instalar, ele é liberado imediatamente e não altera a recorrência da conta.'
  }

  if (isStoreModuleFree(modulo)) {
    if (modulo.ativo) {
      return 'App gratuito ativo. Ele não altera a mensalidade da conta.'
    }

    return 'App gratuito. Ao instalar, ele é liberado sem cobrança e não altera a mensalidade da conta.'
  }

  if (modulo.cobrancaPendenteAtual && modulo.cobrancaAtual?.tipo === 'PROPORCIONAL') {
    return `Existe uma cobrança proporcional pendente para liberar o app até ${getDataFormatada(modulo.cobrancaAtual.vencimento)}.`
  }

  if (modulo.cobrancaPendenteAtual && modulo.cobrancaAtual?.tipo === 'MENSAL') {
    return 'Existe uma cobrança da primeira mensalidade pendente para liberar o app neste ciclo.'
  }

  if (modulo.pendenteAtivacao) {
    return 'Este app já está reservado para a próxima mensalidade e será liberado quando o pagamento do plano for confirmado.'
  }

  if (modulo.cancelamentoAgendado) {
    return `O app permanece disponível até ${getDataFormatada(modulo.vigenciaAte)}.`
  }

  if (modulo.ativo) {
    return 'Se cancelar agora, a remoção será aplicada no próximo ciclo pago.'
  }

  if (modulo.ativacaoImediataDisponivel) {
    return 'Escolha entre cobrança proporcional ou primeira mensalidade completa para liberar o app ainda neste ciclo. Em ambos os casos, a próxima mensalidade já virá cheia com este app.'
  }

  return 'Ao contratar, o valor será somado na próxima mensalidade do plano e o app será liberado somente após esse pagamento.'
}

function getCatalogPriceLabel(modulo: StoreModule) {
  return modulo.preco > 0 ? `${formatCurrencyBR(modulo.preco)}/mês` : 'Grátis'
}

function getCatalogStateLabel(modulo: StoreModule) {
  if (isConfigApp(modulo.codigo) && modulo.ativo && isModuleConfigured(modulo)) return 'Configurado'
  if (modulo.cancelamentoAgendado) return 'Remoção agendada'
  if (modulo.ativo) return 'Instalado'
  if (modulo.cobrancaPendenteAtual) return 'Pagamento pendente'
  if (modulo.pendenteAtivacao) return 'Agendado'
  return 'Disponível'
}

function getCatalogStateClass(modulo: StoreModule) {
  if (isConfigApp(modulo.codigo) && modulo.ativo && isModuleConfigured(modulo)) return 'text-emerald-500'
  if (isConfigApp(modulo.codigo) && modulo.ativo) return 'text-amber-500'
  if (modulo.cancelamentoAgendado) return 'text-orange-500'
  if (modulo.ativo) return 'text-emerald-500'
  if (modulo.cobrancaPendenteAtual) return 'text-amber-500'
  if (modulo.pendenteAtivacao) return 'text-sky-500'
  return 'text-sky-500'
}

function getCardHint(modulo: StoreModule) {
  if (isConfigApp(modulo.codigo)) {
    if (!modulo.ativo) return 'Instale grátis para liberar a configuração desta integração.'
    if (modulo.codigo === 'mercado-pago') {
      if (mercadoPagoConectado.value) return 'Conta do Mercado Pago conectada.'
      if (mercadoPagoConfigured.value) return 'Chave manual salva para esta conta.'
      return 'App instalado. Falta conectar sua conta do Mercado Pago.'
    }
    if (isModuleConfigured(modulo)) return 'Credenciais salvas para esta conta.'
    return 'App instalado. Falta salvar as credenciais.'
  }

  if (isStoreModuleFree(modulo) && !modulo.ativo) {
    return 'Instale grátis. Não haverá cobrança na mensalidade.'
  }

  if (modulo.cobrancaPendenteAtual) {
    return `Cobrança pendente até ${getDataFormatada(modulo.cobrancaAtual?.vencimento)}.`
  }

  if (modulo.pendenteAtivacao) {
    return 'Liberação no próximo pagamento do plano.'
  }

  if (modulo.cancelamentoAgendado) {
    return `Uso liberado até ${getDataFormatada(modulo.vigenciaAte)}.`
  }

  if (modulo.ativacaoImediataDisponivel && !modulo.ativo) {
    return `Ative agora a partir de ${formatCurrencyBR(modulo.valorCobrancaProporcional)}.`
  }

  if (modulo.ativo) {
    // App instalado: getMonthlyValueAfterAction retorna a mensalidade já SEM este app
    // (mensalidadeAtual - preco), então a label espelha o modal ("sem este app").
    return `Próximo ciclo sem este app: ${formatCurrencyBR(getMonthlyValueAfterAction(modulo))}.`
  }

  return 'Entrará na próxima mensalidade após confirmação.'
}

function applyParametros(payload?: Record<string, any> | null) {
  Object.assign(formMercadoPago, {
    MercadoPagoApiKey: payload?.MercadoPagoApiKey || '',
    MercadoPagoEnv: payload?.MercadoPagoEnv || '',
  })

  Object.assign(formAbacatePay, {
    AbacatePayApiKey: payload?.AbacatePayApiKey || '',
    AbacatePaySecret: payload?.AbacatePaySecret || '',
  })
}

function setModuloSelecionado(id: number) {
  moduloSelecionado.value = modulos.value.find((item) => item.id === id) || null
}

function abrirDetalhes(modulo: StoreModule) {
  moduloSelecionado.value = modulo
  billingMode.value = shouldShowImmediateBillingOptions(modulo) ? 'PROPORCIONAL' : 'MENSAL'
  isDialogOpen.value = true
}

function abrirCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
}

async function carregarModulos() {
  try {
    loading.value = true

    const [storeResponse, parametrosResponse, mpStatusResponse] = await Promise.all([
      StoreRepository.listar(),
      ContaRepository.getParametros().catch(() => ({ data: {} })),
      ContaRepository.statusMercadoPago().catch(() => null),
    ])

    modulos.value = storeResponse.data
    resumo.value = storeResponse.resumo
    applyParametros(parametrosResponse?.data)
    mercadoPagoStatus.value = mpStatusResponse

    if (moduloSelecionado.value) {
      setModuloSelecionado(moduloSelecionado.value.id)
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os apps da loja.')
  } finally {
    loading.value = false
  }
}

async function adicionarAoPlano(modulo: StoreModule) {
  const valorAtual = resumo.value?.mensalidadeAtual || 0
  const proximoValor = getMonthlyValueAfterAction(modulo)
  const immediateCharge = getImmediateChargeValue(modulo)
  const immediateFlow = shouldShowImmediateBillingOptions(modulo)
  const isFreeApp = isStoreModuleFree(modulo)

  const confirmed = await confirm.confirm({
    title: isFreeApp
      ? 'Instalar app gratuito'
      : immediateFlow
        ? 'Adicionar app ao plano'
        : 'Reservar app para o próximo ciclo',
    message: isFreeApp
      ? 'Ao confirmar, o app será liberado imediatamente e não altera a mensalidade da conta. Depois você poderá concluir a configuração aqui mesmo na App Store.'
      : immediateFlow
        ? `Ao confirmar, será gerada uma cobrança ${billingMode.value === 'MENSAL' ? 'mensal' : 'proporcional'} de ${formatCurrencyBR(immediateCharge)} para liberar o app neste ciclo. A recorrência da conta passará de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)} a partir da próxima mensalidade.`
        : `Ao confirmar, o valor de ${formatCurrencyBR(modulo.preco)} será acrescido na próxima mensalidade. A recorrência passará de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)} e o app será liberado quando esse pagamento for confirmado.`,
    confirmText: isFreeApp
      ? 'Instalar app'
      : immediateFlow
        ? 'Gerar cobrança do app'
        : 'Reservar app',
    cancelText: 'Voltar',
    colorButton: 'warning',
  })

  if (!confirmed) return

  try {
    actionLoadingId.value = modulo.id
    const response = await StoreRepository.ativar(modulo.id, billingMode.value)
    await carregarModulos()
    setModuloSelecionado(modulo.id)
    toast.success(response.message || 'App selecionado com sucesso.')

    if (!isFreeApp && response.data?.paymentLink) {
      abrirCobranca(response.data.paymentLink)
    }
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao adicionar o app ao plano.')
  } finally {
    actionLoadingId.value = null
  }
}

async function cancelarModulo(modulo: StoreModule) {
  const valorAtual = resumo.value?.mensalidadeAtual || 0
  const proximoValor = getMonthlyValueAfterAction(modulo)
  const isPending = modulo.pendenteAtivacao
  const isFreeApp = isStoreModuleFree(modulo)

  const confirmed = await confirm.confirm({
    title: isFreeApp
      ? 'Remover app gratuito'
      : isPending
        ? 'Cancelar solicitação do app'
        : 'Agendar cancelamento do app',
    message: isFreeApp
      ? 'O app será removido imediatamente da conta. As credenciais já salvas permanecem armazenadas e poderão ser reaproveitadas se ele for instalado de novo.'
      : isPending
        ? `O app será removido da próxima mensalidade e qualquer cobrança avulsa pendente será encerrada. A recorrência prevista volta de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)}.`
        : `Se a mensalidade atual já foi paga, o cancelamento só será aplicado no próximo pagamento. Na próxima cobrança, o valor previsto passa de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)}.`,
    confirmText: isFreeApp
      ? 'Remover app'
      : isPending
        ? 'Cancelar solicitação'
        : 'Agendar cancelamento',
    cancelText: isPending ? 'Manter solicitação' : 'Manter app',
    colorButton: 'danger',
  })

  if (!confirmed) return

  try {
    actionLoadingId.value = modulo.id
    const response = await StoreRepository.cancelar(modulo.id)
    await carregarModulos()
    setModuloSelecionado(modulo.id)
    toast.success(response.message || 'Atualização realizada com sucesso.')
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao atualizar o app.')
  } finally {
    actionLoadingId.value = null
  }
}

async function salvarConfiguracaoIntegracao(modulo: StoreModule) {
  if (!isConfigApp(modulo.codigo) || !modulo.ativo) return

  const payload = modulo.codigo === 'mercado-pago' ? formMercadoPago : formAbacatePay

  try {
    configSavingCode.value = modulo.codigo
    const response = await ContaRepository.parametros(payload)
    toast.success('Configuração salva com sucesso')

    if (modulo.codigo === 'abacatepay') {
      const webhookStatus = response?.data?.abacatePayWebhookStatus
      if (webhookStatus === 'created') {
        toast.info('Webhook da AbacatePay sincronizada automaticamente para esta conta.')
      } else if (webhookStatus === 'non-https-base-url') {
        toast.info('Credenciais salvas. A webhook da AbacatePay não foi criada automaticamente porque a BASE_URL atual não é HTTPS.')
      } else if (webhookStatus === 'sync-failed') {
        toast.warning('Credenciais salvas, mas a sincronização automática da webhook da AbacatePay falhou. Revise a chave da conta ou configure a webhook no painel da AbacatePay.')
      }
    }

    await carregarModulos()
    setModuloSelecionado(modulo.id)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar a configuração do app.')
  } finally {
    configSavingCode.value = null
  }
}

async function conectarMercadoPago() {
  try {
    mercadoPagoLoading.value = true
    const { url } = await ContaRepository.conectarMercadoPago()
    window.location.href = url
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao iniciar a conexão com o Mercado Pago.')
    mercadoPagoLoading.value = false
  }
}

async function desconectarMercadoPago() {
  const confirmed = await confirm.confirm({
    title: 'Desconectar Mercado Pago',
    message:
      'As cobranças por PIX, boleto e link deixarão de ser geradas até você conectar novamente (ou salvar uma chave de API manual). Deseja continuar?',
    confirmText: 'Desconectar',
    cancelText: 'Manter conexão',
    colorButton: 'danger',
  })

  if (!confirmed) return

  try {
    mercadoPagoLoading.value = true
    mercadoPagoStatus.value = await ContaRepository.desconectarMercadoPago()
    toast.success('Conta do Mercado Pago desconectada.')
    toast.info('Remova também a autorização em "Aplicações autorizadas" na sua conta do Mercado Pago.')
    await carregarModulos()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao desconectar a conta do Mercado Pago.')
  } finally {
    mercadoPagoLoading.value = false
  }
}

const MP_OAUTH_ERROS: Record<string, string> = {
  'state-invalido': 'A autorização expirou ou já foi usada. Clique em Conectar novamente.',
  'token-recusado': 'O Mercado Pago recusou a autorização. Tente novamente.',
  'oauth-desabilitado': 'A conexão automática com o Mercado Pago não está habilitada.',
  'retorno-invalido': 'O Mercado Pago retornou uma resposta inesperada.',
  access_denied: 'Você cancelou a autorização no Mercado Pago.',
}

function tratarRetornoOAuth() {
  const resultado = route.query.mercadopago as string | undefined
  if (!resultado) return

  if (resultado === 'conectado') {
    toast.success('Conta do Mercado Pago conectada com sucesso!')
  } else {
    const motivo = route.query.motivo as string | undefined
    toast.error(MP_OAUTH_ERROS[motivo || ''] || 'Não foi possível conectar a conta do Mercado Pago.')
  }

  const query = { ...route.query }
  delete query.mercadopago
  delete query.motivo
  router.replace({ query })
}

onMounted(async () => {
  tratarRetornoOAuth()
  await carregarModulos()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <PackagePlus class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Apps
        </h2>
        <p class="text-sm text-muted-foreground">
          Ative módulos adicionais, acompanhe o impacto na mensalidade e gerencie os apps já liberados na conta.
        </p>
      </div>

      <Button variant="outline" class="gap-2 self-start" @click="carregarModulos">
        <RefreshCcw class="h-4 w-4" />
        Atualizar
      </Button>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_220px_180px]">
      <div class="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3">
        <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar app por nome, categoria ou descrição..."
          class="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <Select v-model="statusFilter">
        <SelectTrigger class="w-full rounded-lg border-border/70 bg-card/80">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos</SelectItem>
          <SelectItem value="ATIVOS">Ativos</SelectItem>
          <SelectItem value="PENDENTES">Pendentes</SelectItem>
          <SelectItem value="DISPONIVEIS">Disponíveis</SelectItem>
        </SelectContent>
      </Select>

      <div class="hidden items-center justify-end xl:flex">
        <Badge variant="outline" class="rounded-lg px-3 py-1 text-xs">
          {{ modulos.length }} apps mapeados
        </Badge>
      </div>
    </div>

    <div class="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1 xl:border-r xl:border-border/60 xl:pr-4">
          <div class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Plano base</div>
          <div class="text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo?.valorBasePlano || 0) }}</div>
        </div>

        <div class="space-y-1 xl:border-r xl:border-border/60 xl:px-4">
          <div class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Próxima mensalidade</div>
          <div class="text-lg font-semibold text-foreground">{{ formatCurrencyBR(resumo?.mensalidadeAtual || 0) }}</div>
          <div class="text-xs text-muted-foreground">Apps no próximo ciclo: {{ formatCurrencyBR(valorAppsProximoCiclo) }}</div>
        </div>

        <div class="space-y-1 xl:border-r xl:border-border/60 xl:px-4">
          <div class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Apps ativos</div>
          <div class="text-lg font-semibold text-foreground">{{ totalAppsAtivos }}</div>
          <div class="text-xs text-muted-foreground">Próximo vencimento: {{ getDataFormatada(resumo?.proximoVencimento) }}</div>
        </div>

        <div class="space-y-1 xl:pl-4">
          <div class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pendentes</div>
          <div class="text-lg font-semibold text-foreground">{{ totalAppsPendentes }}</div>
          <div class="text-xs text-muted-foreground">
            {{ resumo?.contaAtiva ? 'Conta apta para ativação imediata' : 'Aguardando próximo pagamento do plano' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-border p-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Carregando apps</EmptyTitle>
          <EmptyDescription>Buscando os apps e o resumo da recorrência da conta.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else-if="!groupedCards.length" class="rounded-2xl border border-border p-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackagePlus class="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum app encontrado</EmptyTitle>
          <EmptyDescription>Ajuste os filtros ou a busca para localizar outro app.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else class="space-y-8">
      <section v-for="grupo in groupedCards" :key="grupo.categoria" class="space-y-3">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-medium text-muted-foreground">
            {{ grupo.categoria }}
          </h3>
          <div class="h-px flex-1 bg-border/70" />
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <button
            v-for="modulo in grupo.items"
            :key="modulo.id"
            type="button"
            class="catalog-card group text-left"
            @click="abrirDetalhes(modulo)"
          >
            <div class="flex items-start gap-4">
              <div :class="['flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', getIconShellClass(modulo)]">
                <img :src="getImage(modulo)" class="h-14 w-14 rounded-2xl" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-2 font-semibold leading-none text-foreground md:text-lg">
                      {{ modulo.nome }}
                    </div>
                    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span :class="['font-semibold', getCatalogStateClass(modulo)]">
                        {{ getCatalogPriceLabel(modulo) }}
                      </span>
                      <span class="text-muted-foreground">
                        {{ getCatalogStateLabel(modulo) }}
                      </span>
                    </div>
                  </div>

                  <Badge
                    v-if="modulo.cobrancaPendenteAtual"
                    variant="secondary"
                    class="shrink-0 border-0 bg-amber-500/10 text-[10px] text-amber-500"
                  >
                    Cobrança
                  </Badge>
                  <Badge
                    v-else-if="modulo.cancelamentoAgendado"
                    variant="secondary"
                    class="shrink-0 border-0 bg-orange-500/10 text-[10px] text-orange-500"
                  >
                    Saída
                  </Badge>
                  <Badge
                    v-else-if="isConfigApp(modulo.codigo) && modulo.ativo && isModuleConfigured(modulo)"
                    variant="secondary"
                    class="shrink-0 border-0 bg-emerald-500/10 text-[10px] text-emerald-500"
                  >
                    Configurado
                  </Badge>
                  <Badge
                    v-else-if="modulo.ativo"
                    variant="secondary"
                    class="shrink-0 border-0 bg-emerald-500/10 text-[10px] text-emerald-500"
                  >
                    Ativo
                  </Badge>
                </div>

                <p class="catalog-description mt-3 text-sm leading-6 text-muted-foreground">
                  {{ modulo.descricao || 'Sem descrição cadastrada para este app.' }}
                </p>

                <div class="mt-4 flex items-center justify-between gap-3 text-xs">
                  <span class="text-muted-foreground">{{ getCardHint(modulo) }}</span>
                  <span class="font-medium text-foreground/80 group-hover:text-primary">
                    {{ modulo.ativo || modulo.pendenteAtivacao || modulo.cancelamentoAgendado ? 'Gerenciar' : 'Ver detalhes' }}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>

    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[620px]">
        <DialogHeader v-if="moduloSelecionado">
          <div class="mb-2 flex items-center gap-3">
            <div class="rounded-lg bg-primary/10 p-2 text-primary">
              <component :is="getIcon(moduloSelecionado)" class="h-6 w-6" />
            </div>
            <div class="space-y-1">
              <DialogTitle class="text-xl">{{ moduloSelecionado.nome }}</DialogTitle>
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{{ moduloSelecionado.categoria }}</Badge>
                <Badge variant="outline">{{ getCatalogPriceLabel(moduloSelecionado) }}</Badge>
              </div>
            </div>
          </div>
          <DialogDescription class="pt-2 text-base text-muted-foreground">
            {{ moduloSelecionado.detalhes || moduloSelecionado.descricao }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="moduloSelecionado && selectedIsConfigApp" class="space-y-4">
          <div class="rounded-xl border-2 border-dashed border-primary/20 bg-muted/40 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">Status do app</p>
                <p class="text-xs text-muted-foreground">
                  {{ getImpactDescription(moduloSelecionado) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-xl font-black text-primary">{{ getCatalogPriceLabel(moduloSelecionado) }}</div>
                <div class="text-xs text-muted-foreground">sem impacto na mensalidade</div>
              </div>
            </div>
          </div>

          <Alert v-if="!moduloSelecionado.ativo">
            <PackagePlus class="h-4 w-4" />
            <AlertTitle>Instalação necessária</AlertTitle>
            <AlertDescription>
              Instale o app gratuitamente para liberar a configuração desta integração na sua conta.
            </AlertDescription>
          </Alert>

          <template v-else>
            <Alert
              v-if="isModuleConfigured(moduloSelecionado) && !(moduloSelecionado.codigo === 'mercado-pago' && mercadoPagoConectado)"
            >
              <CircleCheck class="h-4 w-4" />
              <AlertTitle>Configuração salva</AlertTitle>
              <AlertDescription>
                As credenciais desta integração já estão cadastradas e podem ser atualizadas a qualquer momento.
              </AlertDescription>
            </Alert>

            <div class="space-y-4 rounded-lg border border-border bg-card p-4">
              <template v-if="moduloSelecionado.codigo === 'mercado-pago'">
                <div v-if="mercadoPagoConectado" class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <CircleCheck class="h-4 w-4 text-emerald-500" />
                        <span class="font-medium">Conta conectada</span>
                        <Badge variant="outline">MP #{{ mercadoPagoStatus?.mpUserId }}</Badge>
                      </div>
                      <p class="text-sm text-muted-foreground">
                        As cobranças desta conta são criadas direto no seu Mercado Pago. Conectado em
                        {{ getDataFormatada(mercadoPagoStatus?.conectadoEm) }}.
                      </p>
                    </div>

                    <Button variant="outline" :disabled="mercadoPagoLoading" @click="desconectarMercadoPago">
                      <LoaderCircle v-if="mercadoPagoLoading" class="mr-2 h-4 w-4 animate-spin" />
                      <Trash2 v-else class="mr-2 h-4 w-4" />
                      Desconectar
                    </Button>
                  </div>

                  <Alert v-if="mercadoPagoStatus?.liveMode === false">
                    <ShieldAlert class="h-4 w-4" />
                    <AlertTitle>Conta em modo de teste</AlertTitle>
                    <AlertDescription>
                      Esta conexão está em sandbox: os pagamentos gerados não são reais.
                    </AlertDescription>
                  </Alert>

                  <Alert v-if="mercadoPagoStatus?.ultimoErro">
                    <ShieldAlert class="h-4 w-4" />
                    <AlertTitle>Última renovação falhou</AlertTitle>
                    <AlertDescription>
                      {{ mercadoPagoStatus.ultimoErro }} — se as cobranças pararem, desconecte e conecte novamente.
                    </AlertDescription>
                  </Alert>
                </div>

                <div v-else-if="mercadoPagoStatus?.oauthDisponivel !== false" class="space-y-3">
                  <div class="space-y-1">
                    <p class="font-medium">Conecte sua conta do Mercado Pago</p>
                    <p class="text-sm text-muted-foreground">
                      Você será levado ao site do Mercado Pago para autorizar o Gestão Fácil. Não precisa criar
                      chave de API nem informar sua senha aqui — nós recebemos apenas a autorização de cobrança.
                    </p>
                  </div>

                  <Button class="gap-2" :disabled="mercadoPagoLoading" @click="conectarMercadoPago">
                    <LoaderCircle v-if="mercadoPagoLoading" class="h-4 w-4 animate-spin" />
                    <ExternalLink v-else class="h-4 w-4" />
                    Conectar com Mercado Pago
                  </Button>
                </div>

                <div class="space-y-2 border-t border-border pt-4">
                  <button
                    type="button"
                    class="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
                    @click="mostrarChaveManualMp = !mostrarChaveManualMp"
                  >
                    {{ mostrarChaveManualMp ? 'Ocultar' : 'Usar' }} chave de API manual (avançado)
                  </button>

                  <div v-if="mostrarChaveManualMp" class="space-y-2 pt-2">
                    <Label for="store-mercado-pago-key">Mercado Pago API Key</Label>
                    <Input
                      id="store-mercado-pago-key"
                      v-model="(formMercadoPago.MercadoPagoApiKey as string)"
                      autocomplete="off"
                      autocapitalize="off"
                      spellcheck="false"
                      type="password"
                      placeholder="Sua chave de acesso"
                    />
                    <p class="text-sm text-muted-foreground">
                      Só é usada quando não existe conexão pelo botão acima. Mantida para contas que já
                      configuraram a integração dessa forma.
                    </p>
                  </div>
                </div>
              </template>

              <template v-else-if="moduloSelecionado.codigo === 'abacatepay'">
                <div class="space-y-2">
                  <Label for="store-abacatepay-key">AbacatePay API Key</Label>
                  <Input
                    id="store-abacatepay-key"
                    v-model="(formAbacatePay.AbacatePayApiKey as string)"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    type="password"
                    placeholder="Sua chave da AbacatePay"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="store-abacatepay-secret">AbacatePay Webhook Secret</Label>
                  <Input
                    id="store-abacatepay-secret"
                    v-model="(formAbacatePay.AbacatePaySecret as string)"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    type="password"
                    placeholder="Seu secret do webhook"
                  />
                </div>

                <p class="text-sm text-muted-foreground">
                  Essas credenciais pertencem à sua conta e são usadas apenas nas cobranças internas do ERP.
                </p>
              </template>
            </div>
          </template>
        </div>

        <div v-else-if="moduloSelecionado" class="space-y-4">
          <Alert v-if="shouldShowImmediateBillingOptions(moduloSelecionado)">
            <CircleDollarSign class="h-4 w-4" />
            <AlertTitle>Liberação imediata disponível</AlertTitle>
            <AlertDescription>
              Como a assinatura do plano está ativa, você pode gerar uma cobrança avulsa para usar o app ainda neste ciclo. A próxima mensalidade já virá com o valor cheio do plano e dos apps ativos.
            </AlertDescription>
          </Alert>

          <div class="rounded-xl border-2 border-dashed border-primary/20 bg-muted/40 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">Impacto na assinatura</p>
                <p class="text-xs text-muted-foreground">
                  {{ getImpactDescription(moduloSelecionado) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-xl font-black text-primary">
                  {{ getCatalogPriceLabel(moduloSelecionado) }}
                </div>
                <div class="text-xs text-muted-foreground">valor mensal do app</div>
              </div>
            </div>
          </div>

          <div
            v-if="shouldShowImmediateBillingOptions(moduloSelecionado)"
            class="space-y-3 rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p class="text-sm font-medium">Forma de cobrança para liberar agora</p>
              <p class="text-xs text-muted-foreground">
                O valor da recorrência futura será o mesmo nos dois casos: plano base + app na próxima mensalidade.
              </p>
            </div>

            <RadioGroup v-model="billingMode" class="grid gap-3 md:grid-cols-2">
              <label class="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40">
                <RadioGroupItem id="store-proporcional" value="PROPORCIONAL" class="mt-1" />
                <div class="space-y-1">
                  <div class="font-medium">Proporcional até o vencimento</div>
                  <div class="text-sm text-muted-foreground">
                    {{ formatCurrencyBR(moduloSelecionado.valorCobrancaProporcional) }} para usar o app neste ciclo.
                  </div>
                </div>
              </label>

              <label class="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40">
                <RadioGroupItem id="store-mensal" value="MENSAL" class="mt-1" />
                <div class="space-y-1">
                  <div class="font-medium">Primeira mensalidade completa</div>
                  <div class="text-sm text-muted-foreground">
                    {{ formatCurrencyBR(moduloSelecionado.valorCobrancaMensal) }} para liberar o app neste ciclo.
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div class="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <div class="flex items-center justify-between gap-3">
              <span>Próxima mensalidade atual</span>
              <span class="font-semibold text-foreground">
                {{ formatCurrencyBR(resumo?.mensalidadeAtual || 0) }}
              </span>
            </div>
            <div class="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span>
                {{ moduloSelecionado.cancelamentoAgendado
                  ? 'Próximo ciclo já ajustado'
                  : moduloSelecionado.ativo || moduloSelecionado.pendenteAtivacao
                    ? 'Próximo ciclo sem este app'
                    : 'Próximo ciclo com este app' }}
              </span>
              <span class="font-semibold text-foreground">
                {{ formatCurrencyBR(getMonthlyValueAfterAction(moduloSelecionado)) }}
              </span>
            </div>
            <div
              v-if="shouldShowImmediateBillingOptions(moduloSelecionado)"
              class="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3"
            >
              <span>Liberação neste ciclo</span>
              <span class="font-semibold text-foreground">
                {{ formatCurrencyBR(getImmediateChargeValue(moduloSelecionado)) }}
              </span>
            </div>
          </div>

          <div
            v-if="moduloSelecionado.cobrancaAtual?.linkPagamento && !isStoreModuleFree(moduloSelecionado)"
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="font-medium">Cobrança do app pendente</p>
                <p>
                  {{ moduloSelecionado.cobrancaAtual?.tipo === 'MENSAL' ? 'Primeira mensalidade completa' : 'Valor proporcional' }}
                  de {{ formatCurrencyBR(moduloSelecionado.cobrancaAtual?.valor || 0) }} com vencimento em
                  {{ getDataFormatada(moduloSelecionado.cobrancaAtual?.vencimento) }}.
                </p>
              </div>

              <Button variant="outline" class="gap-2" @click="abrirCobranca(moduloSelecionado.cobrancaAtual?.linkPagamento)">
                <ExternalLink class="h-4 w-4" />
                Abrir cobrança
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter class="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" @click="isDialogOpen = false">Fechar</Button>

          <template v-if="moduloSelecionado && selectedIsConfigApp">
            <Button
              v-if="moduloSelecionado.ativo && (moduloSelecionado.codigo !== 'mercado-pago' || mostrarChaveManualMp)"
              class="gap-2 px-8 dark:text-white"
              :disabled="configSavingCode === moduloSelecionado.codigo"
              @click="salvarConfiguracaoIntegracao(moduloSelecionado)"
            >
              <LoaderCircle v-if="configSavingCode === moduloSelecionado.codigo" class="h-4 w-4 animate-spin" />
              <CircleCheck v-else class="h-4 w-4" />
              Salvar configuração
            </Button>

            <Button
              v-if="!moduloSelecionado.ativo"
              class="gap-2 px-8 dark:text-white"
              :disabled="actionLoadingId === moduloSelecionado.id"
              @click="adicionarAoPlano(moduloSelecionado)"
            >
              <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
              <PackagePlus v-else class="h-4 w-4" />
              Instalar app
            </Button>

            <Button
              v-else
              variant="destructive"
              class="gap-2 px-8"
              :disabled="actionLoadingId === moduloSelecionado.id"
              @click="cancelarModulo(moduloSelecionado)"
            >
              <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
              <Trash2 v-else class="h-4 w-4" />
              Remover app
            </Button>
          </template>

          <template v-else-if="moduloSelecionado">
            <Button
              v-if="moduloSelecionado.cobrancaAtual?.linkPagamento && !isStoreModuleFree(moduloSelecionado)"
              variant="outline"
              class="gap-2"
              @click="abrirCobranca(moduloSelecionado.cobrancaAtual.linkPagamento)"
            >
              <CreditCard class="h-4 w-4" />
              Abrir cobrança
            </Button>

            <Button
              v-if="!moduloSelecionado.ativo && !moduloSelecionado.pendenteAtivacao"
              class="gap-2 px-8 dark:text-white"
              :disabled="actionLoadingId === moduloSelecionado.id"
              @click="adicionarAoPlano(moduloSelecionado)"
            >
              <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
              <ShoppingCart v-else class="h-4 w-4" />
              {{ shouldShowImmediateBillingOptions(moduloSelecionado) ? 'Gerar cobrança do app' : isStoreModuleFree(moduloSelecionado) ? 'Instalar app' : 'Reservar app' }}
            </Button>

            <Button
              v-else-if="moduloSelecionado.pendenteAtivacao"
              variant="destructive"
              class="gap-2 px-8"
              :disabled="actionLoadingId === moduloSelecionado.id"
              @click="cancelarModulo(moduloSelecionado)"
            >
              <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
              <Trash2 v-else class="h-4 w-4" />
              Cancelar solicitação
            </Button>

            <Button
              v-else-if="!moduloSelecionado.cancelamentoAgendado"
              variant="destructive"
              class="gap-2 px-8"
              :disabled="actionLoadingId === moduloSelecionado.id"
              @click="cancelarModulo(moduloSelecionado)"
            >
              <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
              <Trash2 v-else class="h-4 w-4" />
              Desvincular app
            </Button>

            <Button v-else disabled variant="outline" class="gap-2 px-8">
              <ShieldAlert class="h-4 w-4" />
              Cancelamento agendado
            </Button>
          </template>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.catalog-card {
  @apply rounded-2xl border border-border/70 bg-card/80 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-card;
}

.catalog-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
