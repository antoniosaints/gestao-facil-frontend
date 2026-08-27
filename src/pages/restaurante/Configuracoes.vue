<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useUiStore } from '@/stores/ui/uiStore'
import { IaRepository, isIaQuotaError } from '@/repositories/ia-repository'
import {
  ContaRepository,
  type MercadoPagoIntegracaoStatus,
  type WhatsAppNotificationInstanceOption,
} from '@/repositories/conta-repository'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import HelpTooltip from './components/HelpTooltip.vue'
import { buildPublicMenuUrl } from './publicMenuUrl'
import {
  RestauranteRepository,
  type RestauranteConfig,
  type RestauranteHorarioFuncionamento,
  type RestauranteLocalizacao,
  type RestauranteZonaEntrega,
  type RestauranteZonaPayload,
  type RestauranteWhatsAppNotifications,
  type RestaurantePapel,
  type RestauranteUsuarioPapeis,
} from '@/repositories/restaurante-repository'
import {
  CircleCheck,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  LoaderCircle,
  LocateFixed,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Truck,
  Sparkles,
  Link2,
  Clock12Icon,
  Clock6,
} from 'lucide-vue-next'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const storeUi = useUiStore()
const loading = ref(true)
const saving = ref(false)
const savingZone = ref(false)
const zoneDialogOpen = ref(false)
const editingZoneId = ref<number | undefined>()
const zones = ref<RestauranteZonaEntrega[]>([])
const users = ref<RestauranteUsuarioPapeis[]>([])
const savingUserId = ref<number | null>(null)
const gerandoMensagemIa = ref<keyof RestauranteWhatsAppNotifications | null>(null)
const iaMensagemDialogOpen = ref(false)
const iaMensagemEvento = ref<keyof RestauranteWhatsAppNotifications | null>(null)
const iaMensagemTitulo = ref('')
const iaMensagemDetalhes = ref('')
const localizandoEmpresa = ref(false)
const mercadoPagoStatus = ref<MercadoPagoIntegracaoStatus | null>(null)
const mercadoPagoDialogOpen = ref(false)
const conectandoMercadoPago = ref(false)
const whatsappInstances = ref<WhatsAppNotificationInstanceOption[]>([])
const empresaLatitude = ref('')
const empresaLongitude = ref('')
const roleOptions: Array<{ value: RestaurantePapel; label: string }> = [
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'GARCOM', label: 'Garçom' },
  { value: 'COZINHA', label: 'Cozinha' },
  { value: 'EXPEDICAO', label: 'Expedição' },
  { value: 'ENTREGADOR', label: 'Entregador' },
]
const diasFuncionamento: Array<{ dia: RestauranteHorarioFuncionamento['dia']; label: string }> = [
  { dia: 'SEGUNDA', label: 'Segunda-feira' },
  { dia: 'TERCA', label: 'Terça-feira' },
  { dia: 'QUARTA', label: 'Quarta-feira' },
  { dia: 'QUINTA', label: 'Quinta-feira' },
  { dia: 'SEXTA', label: 'Sexta-feira' },
  { dia: 'SABADO', label: 'Sábado' },
  { dia: 'DOMINGO', label: 'Domingo' },
]
const whatsappNotificationEvents: Array<{
  key: keyof RestauranteWhatsAppNotifications
  title: string
  hint: string
}> = [
    {
      key: 'PEDIDO_FEITO',
      title: 'Pedido feito',
      hint: 'Confirma que o pedido chegou ao restaurante.',
    },
    { key: 'EM_PREPARO', title: 'Em preparo', hint: 'Enviada quando a produção inicia no KDS.' },
    {
      key: 'SAIU_ENTREGA',
      title: 'Saiu para entrega',
      hint: 'Enviada quando o pedido entra em rota.',
    },
    { key: 'PRONTO', title: 'Pedido pronto', hint: 'Enviada quando todos os itens ficam prontos.' },
    { key: 'ENTREGUE', title: 'Pedido entregue', hint: 'Enviada ao concluir a entrega ou retirada.' },
    { key: 'FIDELIDADE', title: 'Fidelidade atualizada', hint: 'Enviada quando um pedido concluído atualiza o progresso.' },
    { key: 'POS_PEDIDO', title: 'Pós-pedido', hint: 'Agradecimento enviado após a conclusão.' },
  ]
const whatsappMessageVariables = [
  { token: '{cliente}', label: 'Cliente' },
  { token: '{primeiroNome}', label: 'Primeiro nome' },
  { token: '{nomeAbreviado}', label: 'Nome abreviado' },
  { token: '{empresa}', label: 'Empresa' },
  { token: '{pedido}', label: 'Código' },
  { token: '{idPedido}', label: 'ID do pedido' },
  { token: '{numeroPedido}', label: 'Nº pedido' },
  { token: '{itens}', label: 'Itens' },
  { token: '{endereco}', label: 'Endereço' },
  { token: '{pagamento}', label: 'Pagamento' },
  { token: '{entrega}', label: 'Entrega' },
  { token: '{frete}', label: 'Frete' },
  { token: '{total}', label: 'Total' },
  { token: '{fidelidade}', label: 'Progresso da fidelidade' },
  { token: '{urlPagamento}', label: 'Link de pagamento' },
] as const

const iaMensagensAtiva = computed(() => storeUi.hasActiveModule('core-ia'))

function notificacoesWhatsAppPadrao(): RestauranteWhatsAppNotifications {
  return {
    PEDIDO_FEITO: {
      ativo: false,
      mensagem:
        'Pedido nº {idPedido}\n\nItens:\n{itens}\n\n{pagamento}\n\n{entrega}\n🏠 {endereco}\n\nTotal: {total}\n\nObrigado pela preferência, se precisar de algo é só chamar! 😉',
    },
    EM_PREPARO: {
      ativo: false,
      mensagem: 'Olá, {cliente}! Seu pedido {pedido} já está em preparo.',
    },
    SAIU_ENTREGA: {
      ativo: false,
      mensagem: 'Olá, {cliente}! Seu pedido {pedido} saiu para entrega.',
    },
    PRONTO: { ativo: false, mensagem: 'Olá, {cliente}! Seu pedido {pedido} está pronto.' },
    ENTREGUE: {
      ativo: false,
      mensagem: 'Olá, {cliente}! Seu pedido {pedido} foi entregue. Bom apetite!',
    },
    FIDELIDADE: {
      ativo: false,
      mensagem: 'Olá, {cliente}! Sua fidelidade foi atualizada: {fidelidade}',
    },
    POS_PEDIDO: {
      ativo: false,
      mensagem: 'Olá, {cliente}! Obrigado por pedir na {empresa}. Esperamos que tenha gostado!',
    },
  }
}

function normalizarNotificacoes(value?: RestauranteWhatsAppNotifications | null) {
  const padrao = notificacoesWhatsAppPadrao()
  for (const item of whatsappNotificationEvents) {
    const current = value?.[item.key]
    if (current)
      padrao[item.key] = {
        ativo: Boolean(current.ativo),
        mensagem: current.mensagem || padrao[item.key].mensagem,
      }
  }
  return padrao
}

async function adicionarVariavelMensagem(
  event: keyof RestauranteWhatsAppNotifications,
  token: string,
) {
  const message = form.whatsappNotificacoesJson?.[event]
  if (!message) return
  const textarea = document.getElementById(
    `whatsapp-template-${event}`,
  ) as HTMLTextAreaElement | null
  const start = textarea?.selectionStart ?? message.mensagem.length
  const end = textarea?.selectionEnd ?? start
  message.mensagem = `${message.mensagem.slice(0, start)}${token}${message.mensagem.slice(end)}`
  await nextTick()
  textarea?.focus()
  textarea?.setSelectionRange(start + token.length, start + token.length)
}

function abrirCriadorMensagemIa(event: keyof RestauranteWhatsAppNotifications, title: string) {
  if (!iaMensagensAtiva.value || gerandoMensagemIa.value) return
  iaMensagemEvento.value = event
  iaMensagemTitulo.value = title
  iaMensagemDetalhes.value = ''
  iaMensagemDialogOpen.value = true
}

async function gerarMensagemComIa() {
  const event = iaMensagemEvento.value
  const message = event ? form.whatsappNotificacoesJson?.[event] : null
  const title = iaMensagemTitulo.value
  if (!event || !message || !iaMensagensAtiva.value || gerandoMensagemIa.value) return
  try {
    gerandoMensagemIa.value = event
    const variables = whatsappMessageVariables
      .filter((item) => item.token !== '{empresa}')
      .map((item) => item.token)
      .join(', ')
    const detalhes = iaMensagemDetalhes.value.trim()
    const textoAtual = message.mensagem.replace(/\{empresa\}/g, '').replace(/\s{2,}/g, ' ').trim()
    const result = await IaRepository.texto({
      modo: textoAtual ? 'melhorar' : 'gerar',
      texto: detalhes
        ? `${textoAtual}\n\nOrienta\u00e7\u00f5es do usu\u00e1rio: ${detalhes}\nN\u00e3o mencione o nome da empresa. Use emojis quando forem apropriados, sem exageros.`
        : `${textoAtual}\n\nN\u00e3o mencione o nome da empresa. Use emojis quando forem apropriados, sem exageros.`,
      contexto: `Crie uma mensagem curta de WhatsApp para o evento "${title}" de um restaurante. Use português do Brasil, tom cordial e objetivo. Preserve exatamente as variáveis já presentes no texto e use somente estas variáveis quando fizer sentido: ${variables}. Nunca invente outras variáveis, não use chaves fora dessa lista e responda apenas com a mensagem final.`,
    })
    if (result.text?.trim()) {
      message.mensagem = result.text.trim()
      iaMensagemDialogOpen.value = false
    }
  } catch (error: any) {
    toast.error(isIaQuotaError(error) ? 'Limite mensal de IA do plano atingido.' : error?.response?.data?.message || 'Não foi possível gerar a mensagem com IA.')
  } finally {
    gerandoMensagemIa.value = null
  }
}

function horariosPadrao(): RestauranteHorarioFuncionamento[] {
  return diasFuncionamento.map(({ dia }) => ({
    dia,
    ativo: dia !== 'DOMINGO',
    abertura: '08:00',
    fechamento: '18:00',
  }))
}

function normalizarHorarios(value?: RestauranteHorarioFuncionamento[] | null) {
  const existentes = Array.isArray(value) ? value : []
  return horariosPadrao().map((padrao) => {
    const encontrado = existentes.find((horario) => horario?.dia === padrao.dia)
    return encontrado
      ? {
        ...padrao,
        ativo: Boolean(encontrado.ativo),
        abertura: encontrado.abertura || padrao.abertura,
        fechamento: encontrado.fechamento || padrao.fechamento,
      }
      : padrao
  })
}

const form = reactive<RestauranteConfig & { horariosJson: RestauranteHorarioFuncionamento[] }>({
  slug: '',
  nomePublico: '',
  ativo: false,
  aceitarPedidosOnline: true,
  pedidosQrDireto: false,
  modoFrete: 'FIXO',
  taxaFixa: 0,
  freteGratisAcima: null,
  taxaContingencia: null,
  pedidoMinimo: 0,
  retiradaAtiva: true,
  deliveryAtivo: true,
  pagamentoOnlineAtivo: false,
  pagamentoNaEntregaAtivo: true,
  localizacaoJson: null,
  horariosJson: horariosPadrao(),
  whatsappNotificacoesInstanciaId: null,
  whatsappNotificacoesJson: notificacoesWhatsAppPadrao(),
})

const emptyZone = (): RestauranteZonaPayload => ({
  nome: '',
  cidade: null,
  bairros: [],
  cepInicial: null,
  cepFinal: null,
  taxa: 0,
  pedidoMinimo: 0,
  freteGratisAcima: null,
  prioridade: 0,
  ativa: true,
})
const zoneForm = ref<RestauranteZonaPayload>(emptyZone())
const freteGratis = computed<string | number>({
  get: () => form.freteGratisAcima ?? '',
  set: (value) => {
    form.freteGratisAcima = value === '' ? null : Number(value)
  },
})
const contingencia = computed<string | number>({
  get: () => form.taxaContingencia ?? '',
  set: (value) => {
    form.taxaContingencia = value === '' ? null : Number(value)
  },
})
const bairrosText = computed({
  get: () => zoneForm.value.bairros.join(', '),
  set: (value: string) => {
    zoneForm.value.bairros = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  },
})
const nomeValido = computed(() => form.nomePublico.trim().length >= 2)
const slugValido = computed(
  () => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim()) && form.slug.trim().length >= 3,
)
const dadosPublicacaoValidos = computed(() => nomeValido.value && slugValido.value)
const publicMenuUrl = computed(() =>
  slugValido.value ? buildPublicMenuUrl(window.location.origin, form.slug) : '',
)

async function copiarLinkCardapio() {
  if (!publicMenuUrl.value) return toast.info('Informe um slug válido para gerar o link.')
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(publicMenuUrl.value)
    } else {
      const input = document.createElement('textarea')
      input.value = publicMenuUrl.value
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    toast.success('Link do cardápio copiado')
  } catch {
    toast.error('Não foi possível copiar o link.')
  }
}

async function carregar() {
  try {
    const [data, deliveryZones, restaurantUsers, mercadoPago, instances] = await Promise.all([
      RestauranteRepository.configuracao(),
      RestauranteRepository.zonasEntrega(),
      RestauranteRepository.usuariosPapeis(),
      ContaRepository.statusMercadoPago(),
      ContaRepository.listarInstanciasWhatsappNotificacao().catch(() => []),
    ])
    if (data) {
      Object.assign(form, data, {
        horariosJson: normalizarHorarios(data.horariosJson),
        whatsappNotificacoesJson: normalizarNotificacoes(data.whatsappNotificacoesJson),
      })
      empresaLatitude.value = data.localizacaoJson?.latitude?.toString() || ''
      empresaLongitude.value = data.localizacaoJson?.longitude?.toString() || ''
    }
    zones.value = deliveryZones
    users.value = restaurantUsers
    mercadoPagoStatus.value = mercadoPago
    whatsappInstances.value = instances
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível carregar a configuração.',
    )
  } finally {
    loading.value = false
  }
}

const mercadoPagoConfigurado = computed(
  () => Boolean(mercadoPagoStatus.value?.conectado || mercadoPagoStatus.value?.possuiChaveManual),
)

function alterarPagamentoOnline(ativar: boolean) {
  if (!ativar || mercadoPagoConfigurado.value) {
    form.pagamentoOnlineAtivo = ativar
    return
  }

  form.pagamentoOnlineAtivo = false
  mercadoPagoDialogOpen.value = true
}

async function conectarMercadoPago() {
  try {
    conectandoMercadoPago.value = true
    const { url } = await ContaRepository.conectarMercadoPago('/restaurante/configuracoes')
    window.location.assign(url)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível iniciar a conexão com o Mercado Pago.')
  } finally {
    conectandoMercadoPago.value = false
  }
}

async function tratarRetornoMercadoPago() {
  const resultado = typeof route.query.mercadopago === 'string' ? route.query.mercadopago : null
  if (!resultado) return

  const query = { ...route.query }
  delete query.mercadopago
  delete query.motivo
  await router.replace({ query })

  if (resultado !== 'conectado') {
    toast.error('A conexão com o Mercado Pago não foi concluída. Tente novamente.')
    return
  }

  mercadoPagoStatus.value = await ContaRepository.statusMercadoPago()
  if (!mercadoPagoConfigurado.value) {
    toast.error('O Mercado Pago foi conectado, mas não foi possível confirmar a integração.')
    return
  }

  form.pagamentoOnlineAtivo = true
  if (!dadosPublicacaoValidos.value) {
    toast.info('Mercado Pago conectado. Complete os dados públicos do cardápio e salve para ativar o pagamento online.')
    return
  }

  await salvar()
  toast.success('Mercado Pago conectado e pagamento online ativado.')
}

function toggleRole(user: RestauranteUsuarioPapeis, role: RestaurantePapel, checked: boolean) {
  user.papeis = checked
    ? [...new Set([...user.papeis, role])]
    : user.papeis.filter((item) => item !== role)
}

async function saveUserRoles(user: RestauranteUsuarioPapeis) {
  try {
    savingUserId.value = user.id
    const result = await RestauranteRepository.salvarUsuarioPapeis(user.id, user.papeis)
    user.papeis = result.papeis
    toast.success(`Papéis de ${user.nome} atualizados`)
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      'Não foi possível atualizar os papéis.',
    )
  } finally {
    savingUserId.value = null
  }
}

async function salvar() {
  if (saving.value) return
  if (!dadosPublicacaoValidos.value)
    return toast.info('Revise o nome público e o endereço do cardápio antes de salvar.')
  const localizacao = localizacaoEmpresa()
  if (localizacao === undefined) return
  try {
    saving.value = true
    const saved = await RestauranteRepository.salvarConfiguracao({
      ...form,
      localizacaoJson: localizacao,
      horariosJson: normalizarHorarios(form.horariosJson),
      whatsappNotificacoesJson: normalizarNotificacoes(form.whatsappNotificacoesJson),
    })
    Object.assign(form, saved, {
      horariosJson: normalizarHorarios(saved.horariosJson),
      whatsappNotificacoesJson: normalizarNotificacoes(saved.whatsappNotificacoesJson),
    })
    empresaLatitude.value = saved.localizacaoJson?.latitude?.toString() || ''
    empresaLongitude.value = saved.localizacaoJson?.longitude?.toString() || ''
    toast.success('Configuração salva')
  } catch (error: any) {
    if (error?.response?.data?.error?.code === 'version_conflict') {
      await carregar()
      toast.info('A configuração foi atualizada e recarregada. Revise os dados antes de salvar novamente.')
      return
    }
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a configuração.')
  } finally {
    saving.value = false
  }
}

function localizacaoEmpresa(): RestauranteLocalizacao | null | undefined {
  const latitude = empresaLatitude.value.trim()
  const longitude = empresaLongitude.value.trim()
  if (!latitude && !longitude) return null
  if (!latitude || !longitude) {
    toast.info('Informe latitude e longitude da empresa, ou limpe os dois campos.')
    return undefined
  }
  const location = { latitude: Number(latitude), longitude: Number(longitude) }
  if (
    !Number.isFinite(location.latitude) ||
    location.latitude < -90 ||
    location.latitude > 90 ||
    !Number.isFinite(location.longitude) ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    toast.info('Revise a latitude e a longitude informadas.')
    return undefined
  }
  return location
}

function usarLocalizacaoEmpresa() {
  if (!navigator.geolocation) return toast.info('Geolocalização não disponível neste navegador.')
  localizandoEmpresa.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      empresaLatitude.value = coords.latitude.toFixed(6)
      empresaLongitude.value = coords.longitude.toFixed(6)
      localizandoEmpresa.value = false
      toast.success('Localização da empresa preenchida. Salve para usar nas rotas.')
    },
    () => {
      localizandoEmpresa.value = false
      toast.error('Não foi possível obter a localização da empresa.')
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

function newZone() {
  editingZoneId.value = undefined
  zoneForm.value = emptyZone()
  zoneDialogOpen.value = true
}

function editZone(zone: RestauranteZonaEntrega) {
  editingZoneId.value = zone.id
  zoneForm.value = {
    nome: zone.nome,
    cidade: zone.cidade,
    bairros: [...zone.bairros],
    cepInicial: zone.cepInicial,
    cepFinal: zone.cepFinal,
    taxa: zone.taxa,
    pedidoMinimo: zone.pedidoMinimo,
    freteGratisAcima: zone.freteGratisAcima,
    prioridade: zone.prioridade,
    ativa: zone.ativa,
    version: zone.version,
  }
  zoneDialogOpen.value = true
}

async function saveZone() {
  if (zoneForm.value.nome.trim().length < 2) return toast.info('Informe o nome da zona.')
  try {
    savingZone.value = true
    await RestauranteRepository.salvarZonaEntrega(zoneForm.value, editingZoneId.value)
    zones.value = await RestauranteRepository.zonasEntrega()
    zoneDialogOpen.value = false
    toast.success(editingZoneId.value ? 'Zona atualizada' : 'Zona criada')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a zona.')
  } finally {
    savingZone.value = false
  }
}

onMounted(async () => {
  await carregar()
  await tratarRetornoMercadoPago()
})
</script>

<template>
  <section class="mx-auto space-y-5">
    <header class="flex items-start gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings2 class="h-6 w-6 text-primary" />Configurações gerais
        </h1>
        <p class="text-sm text-muted-foreground">
          Organize a publicação, o atendimento, as entregas e os acessos da equipe.
        </p>
      </div>
    </header>

    <Tabs default-value="cardapio" class="space-y-4">
      <TabsList class="grid h-auto w-full grid-cols-2 rounded-md gap-1 p-1 sm:grid-cols-5">
        <TabsTrigger value="cardapio">
          <Globe2 class="mr-2 h-4 w-4 inline-flex" />Cardápio e pedidos
        </TabsTrigger>
        <TabsTrigger value="funcionamento">
          <Clock3 class="mr-2 h-4 w-4 inline-flex" />Funcionamento
        </TabsTrigger>
        <TabsTrigger value="entregas">
          <Truck class="mr-2 h-4 w-4 inline-flex" />Zonas de entrega
        </TabsTrigger>
        <TabsTrigger value="mensagens">
          <MessageCircle class="mr-2 h-4 w-4 inline-flex" />Mensagens
        </TabsTrigger>
        <TabsTrigger value="equipe">
          <ShieldCheck class="mr-2 h-4 w-4 inline-flex" />Equipe e acessos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="equipe" class="mt-0">
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <ShieldCheck class="h-5 w-5 text-primary" />Equipe e papéis
                </CardTitle>
                <CardDescription>Defina quais telas e operações cada pessoa pode acessar. Administradores
                  continuam com acesso de gestor.</CardDescription>
              </div>
              <HelpTooltip
                text="Os papéis limitam somente as funções do módulo Restaurante. Administradores da conta mantêm acesso completo." />
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <Alert>
              <AlertDescription>Usuários sem papel não acessam o Restaurante. Administradores continuam com acesso
                de gestor.</AlertDescription>
            </Alert>
            <div class="grid gap-3 lg:grid-cols-2">
              <div v-for="user in users" :key="user.id" class="rounded-xl border p-3">
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ user.nome }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ user.email }}</p>
                  </div>
                  <Badge :variant="user.status === 'ATIVO' ? 'secondary' : 'outline'">{{
                    user.status === 'ATIVO' ? 'Ativo' : 'Inativo'
                    }}</Badge>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-2">
                  <label v-for="role in roleOptions" :key="role.value"
                    class="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox :model-value="user.papeis.includes(role.value)"
                      @update:model-value="toggleRole(user, role.value, Boolean($event))" />
                    {{ role.label }}
                  </label>
                </div>
                <div class="mt-3 flex justify-end">
                  <Button size="sm" :disabled="savingUserId === user.id" @click="saveUserRoles(user)">
                    <LoaderCircle v-if="savingUserId === user.id" class="mr-2 h-4 w-4 animate-spin" />
                    <Save v-else class="mr-2 h-4 w-4" />Salvar papéis
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="funcionamento" class="mt-0">
        <Card v-if="loading">
          <CardContent class="flex justify-center p-10">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
        <Card v-else>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock3 class="h-5 w-5 text-primary" />Funcionamento e localização
            </CardTitle>
            <CardDescription>Informe os horários da equipe e o ponto de saída usado para calcular a rota do
              delivery.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <section class="rounded-xl border p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Label class="flex items-center gap-2">
                    <MapPin class="h-4 w-4 text-primary" />Localização da empresa
                  </Label>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Opcional. Quando salva, a rota do pedido sai daqui até o endereço do cliente.
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" :disabled="localizandoEmpresa"
                  @click="usarLocalizacaoEmpresa">
                  <LoaderCircle v-if="localizandoEmpresa" class="mr-2 h-4 w-4 animate-spin" />
                  <LocateFixed v-else class="mr-2 h-4 w-4" />Usar minha localização
                </Button>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                  <Label for="empresa-latitude">Latitude</Label><Input :icon-label="MapPin" id="empresa-latitude" v-model="empresaLatitude"
                    inputmode="decimal" placeholder="Ex.: -23.550520" />
                </div>
                <div class="space-y-2">
                  <Label for="empresa-longitude">Longitude</Label><Input :icon-label="MapPin" id="empresa-longitude"
                    v-model="empresaLongitude" inputmode="decimal" placeholder="Ex.: -46.633308" />
                </div>
              </div>
            </section>

            <section class="rounded-xl border p-4">
              <div class="mb-4">
                <Label class="flex items-center gap-2">
                  <Clock3 class="h-4 w-4 text-primary" />Horários de funcionamento
                </Label>
                <p class="mt-1 text-xs text-muted-foreground">
                  Defina em quais dias o restaurante atende e o período normal de funcionamento.
                </p>
              </div>
              <div class="space-y-3">
                <div v-for="horario in form.horariosJson" :key="horario.dia"
                  class="grid items-center gap-3 rounded-lg border px-3 py-3 md:py-1 sm:grid-cols-4">
                  <label class="flex cursor-pointer items-center gap-2 text-sm font-medium col-span-1 md:col-span-2">
                    <Checkbox :model-value="horario.ativo" @update:model-value="horario.ativo = Boolean($event)" />{{
                      diasFuncionamento.find((dia) => dia.dia === horario.dia)?.label }}
                      <span class="ml-2 rounded-md px-2 py-0.5 text-xs font-medium" 
                      :class="{
                        'bg-green-200 border-green-300 text-green-900 dark:bg-green-900 dark:border-green-600 dark:text-green-100': horario.ativo,
                        'bg-red-200 border-red-300 text-red-900 dark:bg-red-900 dark:border-red-600 dark:text-red-100': !horario.ativo
                      }">
                        {{ horario.ativo ? 'Aberto' : 'Fechado' }}
                      </span>
                  </label>
                  
                  <div class="space-y-1 flex items-center gap-2">
                    <Label class="text-xs">Abre</Label><Input :icon-label="Clock12Icon" v-model="horario.abertura" type="time"
                      :disabled="!horario.ativo" />
                  </div>
                  <div class="space-y-1 flex items-center gap-2">
                    <Label class="text-xs">Fecha</Label><Input :icon-label="Clock6" v-model="horario.fechamento" type="time"
                      :disabled="!horario.ativo" />
                  </div>
                </div>
              </div>
            </section>
            <div class="flex justify-end">
              <Button :disabled="saving || !dadosPublicacaoValidos" @click="salvar">
                <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
                <Save v-else class="mr-2 h-4 w-4" />Salvar funcionamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="mensagens" class="mt-0">
        <Card v-if="loading">
          <CardContent class="flex justify-center p-10">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
        <Card v-else>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <MessageCircle class="h-5 w-5 text-primary" />Mensagens de acompanhamento
            </CardTitle>
            <CardDescription>Escolha abaixo a instância responsável pelos avisos do restaurante. As mensagens só são
              enviadas quando o módulo WhatsApp estiver ativo e o pedido tiver telefone.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="rounded-xl border p-4">
              <Label for="restaurant-whatsapp-instance">Instância responsável pelo envio</Label>
              <p class="mt-1 text-xs text-muted-foreground">Esta escolha vale apenas para as mensagens de acompanhamento do Restaurante.</p>
              <Select :model-value="form.whatsappNotificacoesInstanciaId ? String(form.whatsappNotificacoesInstanciaId) : ''"
                @update:model-value="form.whatsappNotificacoesInstanciaId = $event ? Number($event) : null">
                <SelectTrigger id="restaurant-whatsapp-instance" class="mt-2 max-w-xl">
                  <SelectValue placeholder="Selecione uma instância WhatsApp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="instance in whatsappInstances" :key="instance.id" :value="String(instance.id)">
                    {{ instance.nome }}{{ instance.numeroConectado ? ` · ${instance.numeroConectado}` : '' }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="!whatsappInstances.length" class="mt-2 text-xs text-muted-foreground">Nenhuma instância WhatsApp ativa está disponível nesta conta.</p>
            </div>
            <Alert>
              <AlertDescription>Clique em uma variável para inseri-la no ponto atual do texto. {itens} organiza
                itens, tamanhos, sabores e complementos em linhas. Ative somente as etapas que
                deseja comunicar.</AlertDescription>
            </Alert>
            <div class="grid gap-4 lg:grid-cols-2">
              <section v-for="item in whatsappNotificationEvents" :key="item.key" class="rounded-xl border p-4">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <Label :for="`whatsapp-${item.key}`" class="text-sm font-semibold">{{
                      item.title
                      }}</Label>
                    <p class="mt-1 text-xs text-muted-foreground">{{ item.hint }}</p>
                  </div>
                  <Switch :id="`whatsapp-${item.key}`" v-model="form.whatsappNotificacoesJson![item.key].ativo"
                    :aria-label="`Ativar mensagem ${item.title}`" />
                </div>
                <div class="mt-4 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <Label :for="`whatsapp-template-${item.key}`" class="text-xs">Mensagem</Label>
                    <Button v-if="iaMensagensAtiva" type="button" size="sm" variant="outline" class="h-7 px-2 text-xs"
                      :disabled="!form.whatsappNotificacoesJson![item.key].ativo || gerandoMensagemIa !== null"
                      @click="abrirCriadorMensagemIa(item.key, item.title)">
                      <LoaderCircle v-if="gerandoMensagemIa === item.key" class="mr-1 h-3.5 w-3.5 animate-spin" />
                      <Sparkles v-else class="mr-1 h-3.5 w-3.5" />Criar com IA
                    </Button>
                  </div>
                  <Textarea :id="`whatsapp-template-${item.key}`"
                    v-model="form.whatsappNotificacoesJson![item.key].mensagem" class="min-h-28"
                    :disabled="!form.whatsappNotificacoesJson![item.key].ativo"
                    :placeholder="`Mensagem de ${item.title.toLowerCase()}`" />
                </div>
                <div class="mt-3 space-y-2">
                  <p class="text-xs font-medium text-muted-foreground">Adicionar variável</p>
                  <div class="flex flex-wrap gap-1.5">
                    <Button v-for="variable in whatsappMessageVariables" :key="variable.token" type="button" size="sm"
                      variant="outline" class="h-7 px-2 text-xs"
                      :disabled="!form.whatsappNotificacoesJson![item.key].ativo"
                      @click="adicionarVariavelMensagem(item.key, variable.token)">{{ variable.label }}</Button>
                  </div>
                </div>
              </section>
            </div>
            <div class="flex justify-end">
              <Button :disabled="saving || !dadosPublicacaoValidos" @click="salvar">
                <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
                <Save v-else class="mr-2 h-4 w-4" />Salvar mensagens
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cardapio" class="mt-0">
        <Card>
          <CardHeader>
            <div class="flex items-start justify-between gap-3">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <Globe2 class="h-5 w-5 text-primary" />Cardápio e atendimento
                </CardTitle>
                <CardDescription>Defina como o cliente encontra o cardápio, faz o pedido e escolhe o
                  pagamento.</CardDescription>
              </div>
              <HelpTooltip
                text="Publicar o cardápio não ativa nem desativa o módulo na conta. Essa opção controla apenas o acesso dos clientes ao endereço público." />
            </div>
          </CardHeader>
          <CardContent v-if="loading" class="flex justify-center p-10">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </CardContent>
          <CardContent v-else class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="nome">Nome público</Label><Input id="nome" v-model="form.nomePublico"
                :aria-invalid="!nomeValido" />
              <p v-if="!nomeValido" class="text-xs text-destructive">
                Informe pelo menos dois caracteres.
              </p>
            </div>
            <div class="space-y-2">
              <Label for="slug">Slug</Label><Input id="slug" v-model="form.slug" :aria-invalid="!slugValido"
                placeholder="minha-pizzaria" />
              <p v-if="!slugValido" class="text-xs text-destructive">
                Use letras minúsculas, números e hífens, sem espaços.
              </p>
            </div>
            <div class="rounded-xl border bg-muted/30 p-4 sm:col-span-2">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <Label for="public-menu-url">Link público do cardápio</Label>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Copie para enviar aos clientes ou divulgar nas redes sociais.
                  </p>
                </div>
                <Badge :variant="form.ativo ? 'secondary' : 'outline'">{{
                  form.ativo ? 'Publicado' : 'Não publicado'
                  }}</Badge>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <Input :icon-label="Link2" :icon-label-position="'left'" id="public-menu-url" :model-value="publicMenuUrl" readonly placeholder="Preencha um slug válido"
                  class="text-sm" />
                <Button type="button" variant="outline" :disabled="!publicMenuUrl" @click="copiarLinkCardapio">
                  <Copy class="mr-2 h-4 w-4" />Copiar link
                </Button>
                <Button v-if="publicMenuUrl" as-child type="button" variant="outline">
                  <a :href="publicMenuUrl" target="_blank" rel="noopener noreferrer">
                    <ExternalLink class="mr-2 h-4 w-4" />Abrir
                  </a>
                </Button>
              </div>
            </div>
            <div class="rounded-lg bg-muted/40 p-3 sm:col-span-2">
              <div class="flex items-center gap-2 text-sm font-medium">
                <CreditCard class="h-4 w-4 text-primary" />Regras do pedido
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
                Valores, entrega e formas de pagamento disponíveis no checkout.
              </p>
            </div>
            <div class="space-y-2">
              <Label for="minimo">Pedido mínimo (R$)</Label><Input :icon-label="'R$'" :icon-label-position="'left'" id="minimo" v-model.number="form.pedidoMinimo"
                type="number" min="0" step="0.01" />
            </div>
            <div class="space-y-2">
              <Label>Modelo de frete</Label>
              <Select v-model="form.modoFrete">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXO">Taxa fixa</SelectItem>
                  <SelectItem value="ZONAS">Zonas por endereço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-if="form.modoFrete === 'FIXO'" class="space-y-2">
              <Label for="taxa">Taxa fixa de delivery (R$)</Label><Input :icon-label="CreditCard" :icon-label-position="'left'" id="taxa" v-model.number="form.taxaFixa"
                type="number" min="0" step="0.01" />
            </div>
            <div v-if="form.modoFrete === 'FIXO'" class="space-y-2">
              <Label for="gratis">Frete grátis acima de (R$)</Label><Input :icon-label="Truck" :icon-label-position="'left'" id="gratis" v-model="freteGratis"
                type="number" min="0" step="0.01" />
            </div>
            <div v-else class="space-y-2 sm:col-span-2">
              <Label for="contingencia">Taxa de contingência (R$)</Label><Input :icon-label="'R$'" :icon-label-position="'left'" id="contingencia" v-model="contingencia"
                type="number" min="0" step="0.01" />
              <p class="text-xs text-muted-foreground">
                Deixe vazio para recusar endereços fora das zonas.
              </p>
            </div>

            <div class="flex min-h-20 items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Label>Cardápio publicado</Label>
                <p class="text-pretty text-xs text-muted-foreground">
                  Clientes poderão consultar o menu e criar pedidos pelo endereço público.
                </p>
              </div>
              <Switch v-model="form.ativo" :disabled="!dadosPublicacaoValidos" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>QR direto para produção</Label>
                <p class="text-xs text-muted-foreground">
                  Desative para exigir aprovação da equipe.
                </p>
              </div>
              <Switch v-model="form.pedidosQrDireto" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Retirada</Label>
                <p class="text-xs text-muted-foreground">Permitir retirada no local.</p>
              </div>
              <Switch v-model="form.retiradaAtiva" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Delivery</Label>
                <p class="text-xs text-muted-foreground">Permitir entrega própria.</p>
              </div>
              <Switch v-model="form.deliveryAtivo" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div class="flex items-center gap-2">
                  <Label>Pagamento online</Label>
                  <Badge v-if="mercadoPagoConfigurado" variant="secondary">Mercado Pago conectado</Badge>
                </div>
                <p class="text-xs text-muted-foreground">Pix pelo Mercado Pago.</p>
              </div>
              <Switch :model-value="form.pagamentoOnlineAtivo" @update:model-value="alterarPagamentoOnline" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Pagamento no local</Label>
                <p class="text-xs text-muted-foreground">Pagar na entrega ou retirada.</p>
              </div>
              <Switch v-model="form.pagamentoNaEntregaAtivo" />
            </div>
            <div class="flex justify-end sm:col-span-2">
              <Button :disabled="saving || !dadosPublicacaoValidos" @click="salvar">
                <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
                <Save v-else class="mr-2 h-4 w-4" />Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="entregas" class="mt-0 space-y-4">
        <Card v-if="form.modoFrete === 'ZONAS'">
          <CardHeader class="flex-row items-start justify-between gap-4">
            <div class="flex min-w-0 items-start gap-1">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <MapPin class="h-5 w-5 text-primary" />Zonas de entrega
                </CardTitle>
                <CardDescription>A maior prioridade vence quando mais de uma zona corresponde ao
                  endereço.</CardDescription>
              </div>
              <HelpTooltip
                text="Crie uma zona para cada região atendida. Se duas zonas aceitarem o mesmo endereço, será usada a de maior prioridade." />
            </div>
            <Button size="sm" @click="newZone">
              <Plus class="mr-2 h-4 w-4" />Nova zona
            </Button>
          </CardHeader>
          <CardContent>
            <div v-if="!zones.length" class="rounded-xl border border-dashed p-8 text-center">
              <MapPin class="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p class="font-medium">Nenhuma zona cadastrada</p>
              <p class="text-sm text-muted-foreground">
                Sem contingência, pedidos de delivery serão recusados.
              </p>
            </div>
            <div v-else class="grid gap-3 md:grid-cols-2">
              <button v-for="zone in zones" :key="zone.id" type="button"
                class="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                @click="editZone(zone)">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-medium">{{ zone.nome }}</p>
                    <p class="text-xs text-muted-foreground">Prioridade {{ zone.prioridade }}</p>
                  </div>
                  <Badge :variant="zone.ativa ? 'secondary' : 'outline'">{{
                    zone.ativa ? 'Ativa' : 'Inativa'
                    }}</Badge>
                </div>
                <p class="mt-3 text-sm text-muted-foreground">
                  {{ zone.cidade || 'Qualquer cidade' }}
                  <span v-if="zone.bairros.length"> · {{ zone.bairros.join(', ') }}</span>
                </p>
                <div class="mt-3 flex items-center justify-between text-sm">
                  <span>Taxa
                    {{
                      Number(zone.taxa).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    }}</span>
                  <Pencil class="h-4 w-4" />
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
        <Card v-else>
          <CardContent class="flex flex-col items-center justify-center p-10 text-center">
            <Truck class="mb-3 h-9 w-9 text-muted-foreground" />
            <p class="font-medium">O frete está configurado como taxa fixa</p>
            <p class="mt-1 max-w-md text-pretty text-sm text-muted-foreground">
              Selecione “Zonas por endereço” na aba Cardápio e pedidos e salve para cadastrar
              regiões com taxas diferentes.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="mercadoPagoDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <CreditCard class="h-5 w-5 text-primary" />Conecte seu Mercado Pago
          </DialogTitle>
          <DialogDescription>
            Para ativar Pix no cardápio, conecte a conta que receberá os pagamentos.
          </DialogDescription>
        </DialogHeader>
        <div class="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          Você será direcionado ao Mercado Pago para autorizar o acesso e voltará automaticamente para esta
          configuração.
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="conectandoMercadoPago" @click="mercadoPagoDialogOpen = false">
            Agora não
          </Button>
          <Button :disabled="conectandoMercadoPago" @click="conectarMercadoPago">
            <LoaderCircle v-if="conectandoMercadoPago" class="mr-2 h-4 w-4 animate-spin" />
            <ExternalLink v-else class="mr-2 h-4 w-4" />Conectar Mercado Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="iaMensagemDialogOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Sparkles class="h-5 w-5 text-primary" />Criar mensagem com IA
          </DialogTitle>
          <DialogDescription>
            {{ form.whatsappNotificacoesJson?.[iaMensagemEvento!]?.mensagem.trim()
              ? `A IA vai aprimorar a mensagem de ${iaMensagemTitulo.toLowerCase()} sem perder as variáveis.`
              : `Descreva como deve ser a mensagem de ${iaMensagemTitulo.toLowerCase()}.` }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2 py-2">
          <Label for="ia-mensagem-detalhes">Detalhes que deseja na mensagem</Label>
          <Textarea id="ia-mensagem-detalhes" v-model="iaMensagemDetalhes" class="min-h-32"
            placeholder="Ex.: avise que o pedido está a caminho, seja acolhedor e inclua prazo estimado." />
          <p class="text-xs text-muted-foreground">Você pode deixar em branco para a IA criar ou melhorar
            automaticamente.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="gerandoMensagemIa !== null"
            @click="iaMensagemDialogOpen = false">Cancelar</Button>
          <Button :disabled="gerandoMensagemIa !== null" @click="gerarMensagemComIa">
            <LoaderCircle v-if="gerandoMensagemIa !== null" class="mr-2 h-4 w-4 animate-spin" />
            <Sparkles v-else class="mr-2 h-4 w-4" />Gerar mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="zoneDialogOpen">
      <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingZoneId ? 'Editar zona' : 'Nova zona de entrega' }}</DialogTitle>
          <DialogDescription>Combine cidade, bairros e intervalo de CEP. Campos vazios não restringem a
            correspondência.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>Nome</Label><Input v-model="zoneForm.nome" placeholder="Ex.: Centro" />
          </div>
          <div class="space-y-2">
            <Label>Cidade</Label><Input :model-value="zoneForm.cidade ?? ''"
              @update:model-value="zoneForm.cidade = String($event) || null" />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label>Bairros</Label><Input v-model="bairrosText" placeholder="Centro, Bela Vista, Jardins" />
            <p class="text-xs text-muted-foreground">Separe os bairros por vírgula.</p>
          </div>
          <div class="space-y-2">
            <Label>CEP inicial</Label><Input :model-value="zoneForm.cepInicial ?? ''" placeholder="00000000"
              @update:model-value="zoneForm.cepInicial = String($event) || null" />
          </div>
          <div class="space-y-2">
            <Label>CEP final</Label><Input :model-value="zoneForm.cepFinal ?? ''" placeholder="99999999"
              @update:model-value="zoneForm.cepFinal = String($event) || null" />
          </div>
          <div class="space-y-2">
            <Label>Taxa (R$)</Label><Input v-model.number="zoneForm.taxa" type="number" min="0" step="0.01" />
          </div>
          <div class="space-y-2">
            <Label>Pedido mínimo (R$)</Label><Input v-model.number="zoneForm.pedidoMinimo" type="number" min="0"
              step="0.01" />
          </div>
          <div class="space-y-2">
            <Label>Frete grátis acima de (R$)</Label><Input :model-value="zoneForm.freteGratisAcima ?? ''" type="number"
              min="0" step="0.01" @update:model-value="
                zoneForm.freteGratisAcima = $event === '' ? null : Number($event)
                " />
          </div>
          <div class="space-y-2">
            <Label>Prioridade</Label><Input v-model.number="zoneForm.prioridade" type="number" />
          </div>
          <div class="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
            <div>
              <Label>Zona ativa</Label>
              <p class="text-xs text-muted-foreground">
                Somente zonas ativas participam do checkout.
              </p>
            </div>
            <Switch v-model="zoneForm.ativa" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" @click="zoneDialogOpen = false">Cancelar</Button><Button
            :disabled="savingZone || zoneForm.nome.trim().length < 2" @click="saveZone">
            <LoaderCircle v-if="savingZone" class="mr-2 h-4 w-4 animate-spin" />Salvar zona
          </Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
