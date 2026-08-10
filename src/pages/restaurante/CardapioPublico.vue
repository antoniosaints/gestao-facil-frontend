<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type CSSProperties } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMediaQuery } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { POSITION, useToast } from 'vue-toastification'
import { io, type Socket } from 'socket.io-client'
import { vMaska } from 'maska/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Bike, Check, CheckCircle2, ChevronRight, Clipboard, Clock3, Gift, History, LoaderCircle, LocateFixed, MapPin, Menu, Minus, Navigation, PackageCheck, Plus, Search, ShoppingBag, ShoppingCart, Store, Timer, Trash2, Truck, UserRound, UtensilsCrossed } from 'lucide-vue-next'
import { RestauranteRepository, type RestauranteCheckoutPreview, type RestauranteClienteConta, type RestauranteClienteEndereco, type RestaurantePublicOrderTracking } from '@/repositories/restaurante-repository'
import { useStorefrontLightTheme } from '@/composables/useStorefrontLightTheme'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import { getThemePalette, hexToHslValue, normalizeThemeCustomization } from '@/utils/themeCustomization'
import { cepMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { calculateMenuItemUnitPrice, hasSameMenuSelections, updateMenuGroupSelection } from './publicMenuCart'
import { isActiveRestaurantOrder, parseTrackingTokens, prependTrackingToken, restaurantOrderStatusBadgeClass, restaurantOrderStatusLabel } from './publicMenuHistory'

const route = useRoute()
const toast = useToast()
useStorefrontLightTheme()
const useDesktopMenuModal = useMediaQuery('(min-width: 1024px)')
const menuModalRoot = computed(() => useDesktopMenuModal.value ? Dialog : Drawer)
const menuModalRootProps = computed(() => useDesktopMenuModal.value ? {} : { handleOnly: true })
const menuModalContent = computed(() => useDesktopMenuModal.value ? DialogContent : DrawerContent)
const menuModalHeader = computed(() => useDesktopMenuModal.value ? DialogHeader : DrawerHeader)
const menuModalTitle = computed(() => useDesktopMenuModal.value ? DialogTitle : DrawerTitle)
const menuModalDescription = computed(() => useDesktopMenuModal.value ? DialogDescription : DrawerDescription)
const menuModalFooter = computed(() => useDesktopMenuModal.value ? DialogFooter : DrawerFooter)
const loading = ref(true)
const sending = ref(false)
const previewing = ref(false)
const checkoutOpen = ref(false)
const cartDrawerOpen = ref(false)
const itemDialogOpen = ref(false)
const cardapio = ref<any>(null)
type CartLine = {
  id: string
  item: any
  quantidade: number
  selecaoIds: number[]
}
const cartLines = ref<CartLine[]>([])
const quote = ref<RestauranteCheckoutPreview | null>(null)
const orderResult = ref<any>(null)
const historyOpen = ref(false)
const trackingDetailsOpen = ref(false)
const selectedTrackingToken = ref<string | null>(null)
const trackingMapElement = ref<HTMLElement | null>(null)
const accountOpen = ref(false)
const accountLoading = ref(false)
const accountSubmitting = ref(false)
const accountMode = ref<'login' | 'register' | 'profile'>('login')
const customerAccount = ref<RestauranteClienteConta | null>(null)
const useAccountData = ref(true)
const selectedAccountAddressId = ref<number | null>(null)
const historyLoading = ref(false)
const orderHistory = ref<Array<RestaurantePublicOrderTracking & { trackingToken: string }>>([])
const searchTerm = ref('')
const activeCategory = ref('todos')
const activeItem = ref<any>(null)
const activeCartLineId = ref<string | null>(null)
const draftQuantity = ref(1)
const draftSelections = ref<number[]>([])
const origem = ref<'RETIRADA' | 'DELIVERY'>('RETIRADA')
const pagamento = ref<'NA_ENTREGA' | 'PIX' | 'CHECKOUT_PRO'>('NA_ENTREGA')
const obtendoLocalizacao = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null
let previewSequence = 0
let trackingSocket: Socket | null = null
let publicMenuSocket: Socket | null = null
let trackingMap: L.Map | null = null
let trackingMapLayers: L.LayerGroup | null = null
const form = reactive({
  nome: '',
  telefone: '',
  email: '',
  observacao: '',
  cep: '',
  cidade: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
  referencia: '',
  latitude: null as number | null,
  longitude: null as number | null,
})
const accountForm = reactive({ nome: '', telefone: '', email: '', senha: '', confirmacaoSenha: '' })
type AccountFieldName = 'nome' | 'telefone' | 'email' | 'senha' | 'confirmacaoSenha'
const accountFieldErrors = reactive<Record<AccountFieldName, string[]>>({ nome: [], telefone: [], email: [], senha: [], confirmacaoSenha: [] })
const accountAddressForm = reactive({ rotulo: '', cep: '', cidade: '', bairro: '', logradouro: '', numero: '', complemento: '', referencia: '', principal: false })
type AccountAddressFieldName = 'rotulo' | 'cep' | 'cidade' | 'bairro' | 'logradouro' | 'numero' | 'complemento' | 'referencia'
const accountAddressFieldErrors = reactive<Record<AccountAddressFieldName, string[]>>({ rotulo: [], cep: [], cidade: [], bairro: [], logradouro: [], numero: [], complemento: [], referencia: [] })

function normalize(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function itemName(item: any) {
  return item.nomePublico || item.Produto.nome
}

function itemDescription(item: any) {
  return item.descricao || 'Feito com cuidado e ingredientes selecionados.'
}

function itemImage(item: any) {
  return resolveFileUrl(item.imagem || item.Produto.imagem)
}

function categoryInfo(item: any) {
  const category = item.Produto?.ProdutoBase?.Categoria
  return category ? { key: String(category.id), name: category.nome } : { key: 'destaques', name: 'Destaques' }
}

const categoryGroups = computed(() => {
  const groups = new Map<string, { key: string; name: string; items: any[] }>()
  for (const item of cardapio.value?.itens || []) {
    const category = categoryInfo(item)
    if (!groups.has(category.key)) groups.set(category.key, { ...category, items: [] })
    groups.get(category.key)!.items.push(item)
  }
  return [...groups.values()]
})

const aceitaPedidos = computed(() => cardapio.value?.restaurante.atendimento?.aberto !== false)
const mensagemAtendimento = computed(() => cardapio.value?.restaurante.atendimento?.mensagem || 'Recebendo pedidos')
const tracking = computed(() => orderHistory.value.find((order) => isActiveRestaurantOrder(order.status)) || null)
const trackingStatusLabel = computed(() => (tracking.value ? restaurantOrderStatusLabel(tracking.value.status) : ''))
const trackingBadgeClass = computed(() => tracking.value ? restaurantOrderStatusBadgeClass(tracking.value.status) : '')
const trackingDetails = computed(() => orderHistory.value.find((order) => order.trackingToken === selectedTrackingToken.value) || null)

const categories = computed(() => [{ key: 'todos', name: 'Todos' }, ...categoryGroups.value.map(({ key, name }) => ({ key, name }))])

const visibleGroups = computed(() => {
  const term = normalize(searchTerm.value.trim())
  return categoryGroups.value
    .filter((group) => activeCategory.value === 'todos' || group.key === activeCategory.value)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !term || normalize(`${itemName(item)} ${itemDescription(item)} ${group.name}`).includes(term)),
    }))
    .filter((group) => group.items.length)
})

const selecionados = computed(() => cartLines.value)
const cartUnits = computed(() => selecionados.value.reduce((total, line) => total + line.quantidade, 0))
const logo = computed(() => resolveFileUrl(cardapio.value?.restaurante.logo))
const payloadItems = computed(() =>
  selecionados.value.map((line) => ({
    catalogoItemId: line.item.id,
    quantidade: line.quantidade,
    selecaoIds: line.selecaoIds,
  })),
)
const estimatedSubtotal = computed(() =>
  selecionados.value.reduce(
    (total, line) => total + calculateMenuItemUnitPrice(line.item, line.selecaoIds) * line.quantidade,
    0,
  ),
)
const activeUnitPrice = computed(() => (activeItem.value ? calculateMenuItemUnitPrice(activeItem.value, draftSelections.value) : 0))
const menuThemeStyle = computed<CSSProperties>(() => {
  const theme = normalizeThemeCustomization(cardapio.value?.restaurante.temaPersonalizado)
  const palette = getThemePalette(theme, 'light')
  return {
    '--menu-bg': palette.body,
    '--menu-surface': palette.card,
    '--menu-ink': palette.foreground,
    '--menu-muted': palette.mutedForeground,
    '--menu-accent': palette.primary,
    '--menu-accent-foreground': palette.primaryForeground,
    '--menu-secondary': palette.sidebar,
    '--menu-secondary-foreground': palette.sidebarForeground,
    '--primary': hexToHslValue(palette.primary),
    '--primary-foreground': hexToHslValue(palette.primaryForeground),
    '--ring': hexToHslValue(palette.primary),
    '--app-font': theme.fonte,
  } as CSSProperties
})
const primaryButtonStyle = computed<CSSProperties>(() => {
  const palette = getThemePalette(cardapio.value?.restaurante.temaPersonalizado, 'light')
  return {
    backgroundColor: palette.primary,
    color: palette.primaryForeground,
  }
})
const addressComplete = computed(() => origem.value === 'RETIRADA' || [form.cep.replace(/\D/g, ''), form.cidade, form.bairro, form.logradouro, form.numero].every((value) => value.trim().length > 0))
const checkoutValid = computed(() => form.nome.trim().length >= 2 && form.telefone.replace(/\D/g, '').length >= 8 && addressComplete.value && selecionados.value.length > 0)
const activeSelectionsValid = computed(
  () =>
    !activeItem.value ||
    activeItem.value.grupos.every((link: any) => {
      const selected = link.Grupo.opcoes.filter((option: any) => draftSelections.value.includes(option.id)).length
      return selected >= link.Grupo.minimo && selected <= link.Grupo.maximo
    }),
)

function invalidateCart() {
  quote.value = null
  orderResult.value = null
}

function trackingStorageKey() {
  return `restaurante:trackingTokens:${String(route.params.slug)}`
}

function customerTokenKey() {
  return `restaurante:cliente:${String(route.params.slug)}:access-token`
}

function customerToken() {
  return localStorage.getItem(customerTokenKey())
}

function applyAccountAddress(address?: RestauranteClienteEndereco) {
  if (!address) return
  selectedAccountAddressId.value = address.id
  Object.assign(form, {
    cep: address.cep,
    cidade: address.cidade,
    bairro: address.bairro,
    logradouro: address.logradouro,
    numero: address.numero,
    complemento: address.complemento || '',
    referencia: address.referencia || '',
  })
}

function applyCustomerAccount(account: RestauranteClienteConta) {
  Object.assign(form, { nome: account.nome, telefone: account.telefone, email: account.email || '' })
  const address = account.enderecos.find((item) => item.principal) || account.enderecos[0]
  if (address && origem.value === 'DELIVERY') applyAccountAddress(address)
}

async function loadCustomerAccount(silent = false) {
  const token = customerToken()
  if (!token) {
    customerAccount.value = null
    accountMode.value = 'login'
    return
  }
  accountLoading.value = true
  try {
    const account = await RestauranteRepository.contaCliente(String(route.params.slug), token)
    customerAccount.value = account
    accountMode.value = 'profile'
    Object.assign(accountForm, { nome: account.nome, telefone: account.telefone, email: account.email || '', senha: '', confirmacaoSenha: '' })
    if (useAccountData.value) applyCustomerAccount(account)
  } catch {
    localStorage.removeItem(customerTokenKey())
    customerAccount.value = null
    accountMode.value = 'login'
    if (!silent) toast.info('Entre novamente para acessar sua conta.')
  } finally {
    accountLoading.value = false
  }
}

async function openCustomerAccount() {
  accountOpen.value = true
  await loadCustomerAccount()
}

function clearAccountFieldErrors() {
  for (const field of Object.keys(accountFieldErrors) as AccountFieldName[]) accountFieldErrors[field] = []
}

function clearAccountFieldError(field: AccountFieldName) {
  accountFieldErrors[field] = []
}

function addAccountFieldError(field: AccountFieldName, message: string) {
  accountFieldErrors[field].push(message)
}

function firstAccountFieldError() {
  return Object.values(accountFieldErrors).flat()[0]
}

function validateCustomerAccount() {
  clearAccountFieldErrors()
  const phoneDigits = accountForm.telefone.replace(/\D/g, '')
  if (phoneDigits.length < 10) addAccountFieldError('telefone', 'Informe um telefone válido com DDD.')
  if (accountMode.value !== 'register') {
    if (!accountForm.senha) addAccountFieldError('senha', 'Informe sua senha.')
    return !firstAccountFieldError()
  }

  if (accountForm.nome.trim().length < 2) addAccountFieldError('nome', 'Informe seu nome completo.')
  if (accountForm.email && !/^\S+@\S+\.\S+$/.test(accountForm.email)) addAccountFieldError('email', 'Informe um e-mail válido.')
  if (accountForm.senha.length < 8) addAccountFieldError('senha', 'A senha deve ter pelo menos 8 caracteres.')
  if (!/[A-Za-z]/.test(accountForm.senha)) addAccountFieldError('senha', 'A senha deve conter letra.')
  if (!/\d/.test(accountForm.senha)) addAccountFieldError('senha', 'A senha deve conter número.')
  if (accountForm.senha !== accountForm.confirmacaoSenha) addAccountFieldError('confirmacaoSenha', 'As senhas não coincidem.')
  return !firstAccountFieldError()
}

function applyAccountApiErrors(fieldErrors: unknown) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return false
  clearAccountFieldErrors()
  for (const [field, messages] of Object.entries(fieldErrors as Record<string, unknown>)) {
    if (!(field in accountFieldErrors) || !Array.isArray(messages)) continue
    accountFieldErrors[field as AccountFieldName] = messages.filter((message): message is string => typeof message === 'string')
  }
  return Boolean(firstAccountFieldError())
}

function clearAccountAddressFieldErrors() {
  for (const field of Object.keys(accountAddressFieldErrors) as AccountAddressFieldName[]) accountAddressFieldErrors[field] = []
}

function clearAccountAddressFieldError(field: AccountAddressFieldName) {
  accountAddressFieldErrors[field] = []
}

function addAccountAddressFieldError(field: AccountAddressFieldName, message: string) {
  accountAddressFieldErrors[field].push(message)
}

function firstAccountAddressFieldError() {
  return Object.values(accountAddressFieldErrors).flat()[0]
}

function validateCustomerAddress() {
  clearAccountAddressFieldErrors()
  if (accountAddressForm.cep.replace(/\D/g, '').length !== 8) addAccountAddressFieldError('cep', 'Informe um CEP com 8 dígitos.')
  if (accountAddressForm.cidade.trim().length < 2) addAccountAddressFieldError('cidade', 'Informe a cidade.')
  if (accountAddressForm.bairro.trim().length < 2) addAccountAddressFieldError('bairro', 'Informe o bairro.')
  if (accountAddressForm.logradouro.trim().length < 2) addAccountAddressFieldError('logradouro', 'Informe a rua ou avenida.')
  if (!accountAddressForm.numero.trim()) addAccountAddressFieldError('numero', 'Informe o número.')
  return !firstAccountAddressFieldError()
}

function applyAccountAddressApiErrors(fieldErrors: unknown) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return false
  clearAccountAddressFieldErrors()
  for (const [field, messages] of Object.entries(fieldErrors as Record<string, unknown>)) {
    if (!(field in accountAddressFieldErrors) || !Array.isArray(messages)) continue
    accountAddressFieldErrors[field as AccountAddressFieldName] = messages.filter((message): message is string => typeof message === 'string')
  }
  return Boolean(firstAccountAddressFieldError())
}

async function submitCustomerAccount() {
  if (!validateCustomerAccount()) return toast.error(firstAccountFieldError() || 'Revise os dados informados.')
  const registering = accountMode.value === 'register'
  try {
    accountSubmitting.value = true
    const result = accountMode.value === 'register'
      ? await RestauranteRepository.cadastrarContaCliente(String(route.params.slug), { nome: accountForm.nome, telefone: accountForm.telefone, email: accountForm.email || null, senha: accountForm.senha })
      : await RestauranteRepository.entrarContaCliente(String(route.params.slug), { telefone: accountForm.telefone, senha: accountForm.senha })
    localStorage.setItem(customerTokenKey(), result.accessToken)
    await loadCustomerAccount()
    toast.success(registering ? 'Conta criada.' : 'Conta acessada.')
  } catch (error: any) {
    const apiError = error?.response?.data?.error
    if (applyAccountApiErrors(apiError?.details?.fieldErrors)) return toast.error(firstAccountFieldError() || apiError?.message)
    toast.error(apiError?.message || 'Não foi possível acessar sua conta.')
  } finally {
    accountSubmitting.value = false
  }
}

async function saveCustomerProfile() {
  const token = customerToken(); if (!token) return
  try {
    accountSubmitting.value = true
    await RestauranteRepository.atualizarContaCliente(String(route.params.slug), token, { nome: accountForm.nome, email: accountForm.email || null })
    await loadCustomerAccount(true)
    toast.success('Dados pessoais atualizados.')
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar seus dados.') } finally { accountSubmitting.value = false }
}

async function saveCustomerAddress() {
  const token = customerToken(); if (!token) return
  if (!validateCustomerAddress()) return toast.error(firstAccountAddressFieldError() || 'Revise os dados do endereço.')
  try {
    accountSubmitting.value = true
    await RestauranteRepository.salvarEnderecoContaCliente(String(route.params.slug), token, { ...accountAddressForm })
    Object.assign(accountAddressForm, { rotulo: '', cep: '', cidade: '', bairro: '', logradouro: '', numero: '', complemento: '', referencia: '', principal: false })
    clearAccountAddressFieldErrors()
    await loadCustomerAccount(true)
    toast.success('Endereço salvo.')
  } catch (error: any) {
    const apiError = error?.response?.data?.error
    if (applyAccountAddressApiErrors(apiError?.details?.fieldErrors)) return toast.error(firstAccountAddressFieldError() || apiError?.message)
    toast.error(apiError?.message || 'Revise os dados do endereço.')
  } finally { accountSubmitting.value = false }
}

async function removeCustomerAddress(id: number) {
  const token = customerToken(); if (!token) return
  try { await RestauranteRepository.removerEnderecoContaCliente(String(route.params.slug), token, id); await loadCustomerAccount(true) } catch { toast.error('Não foi possível remover o endereço.') }
}

function logoutCustomer() {
  localStorage.removeItem(customerTokenKey())
  customerAccount.value = null
  accountMode.value = 'login'
  toast.info('Você saiu da sua conta.')
}

function storedTrackingTokens() {
  return parseTrackingTokens(localStorage.getItem(trackingStorageKey()))
}

function saveTrackingToken(token: string) {
  const tokens = prependTrackingToken(storedTrackingTokens(), token)
  localStorage.setItem(trackingStorageKey(), JSON.stringify(tokens))
  localStorage.setItem('restaurante:trackingToken', token)
  return tokens
}

async function loadOrderHistory(tokens = storedTrackingTokens()) {
  if (!tokens.length) {
    orderHistory.value = []
    return
  }
  historyLoading.value = true
  const results = await Promise.allSettled(
    tokens.map(async (trackingToken) => ({
      ...(await RestauranteRepository.acompanharPedido(trackingToken)),
      trackingToken,
    })),
  )
  orderHistory.value = results
    .filter((result): result is PromiseFulfilledResult<RestaurantePublicOrderTracking & { trackingToken: string }> => result.status === 'fulfilled')
    .map((result) => result.value)
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
  localStorage.setItem(trackingStorageKey(), JSON.stringify(orderHistory.value.map((order) => order.trackingToken)))
  historyLoading.value = false
}

function openTrackingDetails(order: RestaurantePublicOrderTracking & { trackingToken: string }) {
  selectedTrackingToken.value = order.trackingToken
  historyOpen.value = false
  trackingDetailsOpen.value = true
}

function trackingTime(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function trackingElapsed(order: RestaurantePublicOrderTracking) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60_000))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}

function clearTrackingMap() {
  trackingMap?.remove()
  trackingMap = null
  trackingMapLayers = null
}

function renderTrackingMap() {
  const trackingOrder = trackingDetails.value
  const delivery = trackingOrder?.acompanhamentoEntrega
  const origin = delivery?.origem
  if (!trackingMapElement.value || !delivery || origin?.latitude == null || origin.longitude == null) return
  clearTrackingMap()
  trackingMap = L.map(trackingMapElement.value, { zoomControl: true, attributionControl: false }).setView(
    [delivery.entregador.latitude, delivery.entregador.longitude],
    14,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(trackingMap)
  trackingMapLayers = L.layerGroup().addTo(trackingMap)
  const originPoint: L.LatLngTuple = [Number(origin.latitude), Number(origin.longitude)]
  const driverPoint: L.LatLngTuple = [delivery.entregador.latitude, delivery.entregador.longitude]
  L.circleMarker(originPoint, { radius: 8, color: '#9a3412', fillColor: '#f97316', fillOpacity: 1, weight: 3 })
    .bindTooltip('Restaurante', { direction: 'top' })
    .addTo(trackingMapLayers)
  L.circleMarker(driverPoint, { radius: 9, color: '#065f46', fillColor: '#10b981', fillOpacity: 1, weight: 3 })
    .bindTooltip('Seu entregador', { direction: 'top' })
    .addTo(trackingMapLayers)
  trackingMap.fitBounds(L.latLngBounds([originPoint, driverPoint]), { padding: [36, 36], maxZoom: 15 })
}

function sincronizarAcompanhamentoEmTempoReal(tokens = storedTrackingTokens()) {
  trackingSocket?.disconnect()
  trackingSocket = null
  if (!tokens.length) return
  trackingSocket = io((import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000', {
    transports: ['websocket'],
    auth: { restaurantTrackingTokens: tokens },
  })
  trackingSocket.on('restaurante:pedido-publico', () => {
    void loadOrderHistory(tokens)
  })
  trackingSocket.on('restaurante:entrega-localizacao', () => {
    void loadOrderHistory(tokens)
  })
}

function sincronizarComprasPublicas() {
  publicMenuSocket?.disconnect()
  publicMenuSocket = io((import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000', {
    transports: ['websocket'],
    auth: { restaurantPublicSlug: String(route.params.slug) },
  })
  publicMenuSocket.on('restaurante:compra-publica', (sale: { cliente?: string; produto?: string }) => {
    if (!sale?.produto) return
    toast.info(`${sale.cliente || 'Alguém'} acabou de comprar ${sale.produto}.`, { timeout: 4200, position: POSITION.TOP_CENTER })
  })
}

function quantidadeNoCarrinho(catalogoItemId: number) {
  return cartLines.value
    .filter((line) => line.item.id === catalogoItemId)
    .reduce((total, line) => total + line.quantidade, 0)
}

function change(lineId: string, delta: number) {
  const line = cartLines.value.find((current) => current.id === lineId)
  if (!line) return
  line.quantidade = Math.max(0, line.quantidade + delta)
  if (!line.quantidade) cartLines.value = cartLines.value.filter((current) => current.id !== lineId)
  invalidateCart()
}

function removeItem(lineId: string) {
  cartLines.value = cartLines.value.filter((line) => line.id !== lineId)
  invalidateCart()
}

function openItem(item: any) {
  if (!aceitaPedidos.value) return toast.info(mensagemAtendimento.value)
  activeItem.value = item
  activeCartLineId.value = null
  draftQuantity.value = 1
  draftSelections.value = []
  itemDialogOpen.value = true
}

function editCartLine(line: CartLine) {
  activeItem.value = line.item
  activeCartLineId.value = line.id
  draftQuantity.value = line.quantidade
  draftSelections.value = [...line.selecaoIds]
  itemDialogOpen.value = true
}

function findMatchingCartLine(item: any, selecaoIds: number[]) {
  return cartLines.value.find(
    (line) => line.item.id === item.id && hasSameMenuSelections(line.selecaoIds, selecaoIds),
  )
}

function quickAdd(item: any) {
  if (!aceitaPedidos.value) return toast.info(mensagemAtendimento.value)
  if (item.grupos.length) return openItem(item)
  const existing = findMatchingCartLine(item, [])
  if (existing) change(existing.id, 1)
  else {
    cartLines.value.push({
      id: `${item.id}-${Date.now()}-${Math.random()}`,
      item,
      quantidade: 1,
      selecaoIds: [],
    })
    invalidateCart()
  }
}

function toggleDraft(group: any, optionId: number) {
  const groupIds = group.opcoes.map((option: any) => option.id)
  draftSelections.value = updateMenuGroupSelection(draftSelections.value, groupIds, optionId, Number(group.maximo))
}

function saveActiveItem() {
  if (!aceitaPedidos.value) {
    itemDialogOpen.value = false
    return toast.info(mensagemAtendimento.value)
  }
  if (!activeItem.value) return
  if (!activeSelectionsValid.value) {
    return toast.info('Complete as escolhas obrigatórias antes de adicionar.')
  }
  const editing = cartLines.value.find((line) => line.id === activeCartLineId.value)
  if (editing) {
    editing.quantidade = draftQuantity.value
    editing.selecaoIds = [...draftSelections.value]
  } else {
    const existing = findMatchingCartLine(activeItem.value, draftSelections.value)
    if (existing) existing.quantidade += draftQuantity.value
    else {
      cartLines.value.push({
        id: `${activeItem.value.id}-${Date.now()}-${Math.random()}`,
        item: activeItem.value,
        quantidade: draftQuantity.value,
        selecaoIds: [...draftSelections.value],
      })
    }
  }
  invalidateCart()
  itemDialogOpen.value = false
}

function selectedOptionNames(line: CartLine) {
  return line.item.grupos.flatMap((link: any) =>
    link.Grupo.opcoes
      .filter((option: any) => line.selecaoIds.includes(option.id))
      .map((option: any) => option.nome),
  )
}

function selectedCount(group: any) {
  return group.opcoes.filter((option: any) => draftSelections.value.includes(option.id)).length
}

function lineTotal(line: CartLine) {
  return calculateMenuItemUnitPrice(line.item, line.selecaoIds) * line.quantidade
}

function checkoutPayload() {
  return {
    origem: origem.value,
    itens: payloadItems.value,
    ...(origem.value === 'DELIVERY'
      ? {
          endereco: {
            cep: form.cep,
            cidade: form.cidade,
            bairro: form.bairro,
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento || null,
            referencia: form.referencia || null,
            latitude: form.latitude,
            longitude: form.longitude,
          },
        }
      : {}),
  }
}

async function carregar() {
  try {
    cardapio.value = await RestauranteRepository.cardapioPublico(String(route.params.slug), customerToken())
    origem.value = cardapio.value.restaurante.retiradaAtiva ? 'RETIRADA' : 'DELIVERY'
    pagamento.value = cardapio.value.restaurante.pagamentoNaEntregaAtivo ? 'NA_ENTREGA' : 'PIX'
    const routeToken = String(route.query.pedido || '')
    const legacyToken = String(localStorage.getItem('restaurante:trackingToken') || '')
    let tokens = storedTrackingTokens()
    if (legacyToken) tokens = prependTrackingToken(tokens, legacyToken)
    if (routeToken) tokens = prependTrackingToken(tokens, routeToken)
    await loadOrderHistory(tokens)
    sincronizarAcompanhamentoEmTempoReal(tokens)
    sincronizarComprasPublicas()
  } catch {
    toast.error('Cardápio indisponível.')
  } finally {
    loading.value = false
  }
}

async function previewCheckout(showFeedback = true) {
  if (!aceitaPedidos.value) {
    if (showFeedback) toast.info(mensagemAtendimento.value)
    return null
  }
  if (!addressComplete.value) {
    if (showFeedback) toast.info('Preencha o endereço para calcular a entrega.')
    return null
  }
  const sequence = ++previewSequence
  try {
    previewing.value = true
    const nextQuote = await RestauranteRepository.previaCheckoutPublico(String(route.params.slug), checkoutPayload())
    if (sequence !== previewSequence) return null
    quote.value = nextQuote
    return nextQuote
  } catch (error: any) {
    if (sequence !== previewSequence) return null
    quote.value = null
    if (showFeedback) toast.error(error?.response?.data?.error?.message || 'Não foi possível calcular o pedido.')
    return null
  } finally {
    if (sequence === previewSequence) previewing.value = false
  }
}

function scheduleCheckoutPreview() {
  if (previewTimer) clearTimeout(previewTimer)
  previewSequence += 1
  quote.value = null
  previewing.value = false
  if (!checkoutOpen.value || !addressComplete.value || !selecionados.value.length) return
  previewTimer = setTimeout(() => void previewCheckout(false), 350)
}

async function openCheckout() {
  if (!aceitaPedidos.value) {
    cartDrawerOpen.value = false
    return toast.info(mensagemAtendimento.value)
  }
  cartDrawerOpen.value = false
  checkoutOpen.value = true
  if (addressComplete.value && !quote.value) await previewCheckout(false)
}

async function pedir() {
  if (!aceitaPedidos.value) return toast.info(mensagemAtendimento.value)
  if (!checkoutValid.value) return toast.info('Preencha os dados necessários para finalizar.')
  const currentQuote = quote.value || (await previewCheckout())
  if (!currentQuote) return
  if (!currentQuote.minimumReached) {
    return toast.info(`O pedido mínimo é ${formatCurrencyBR(Number(currentQuote.minimumOrder))}.`)
  }
  try {
    sending.value = true
    const result = await RestauranteRepository.criarPedidoPublico(
      String(route.params.slug),
      {
        ...checkoutPayload(),
        cliente: { nome: form.nome, telefone: form.telefone, email: form.email || null },
        observacao: form.observacao || undefined,
        pagamento: pagamento.value,
      },
      crypto.randomUUID(),
      customerToken(),
    )
    orderResult.value = result
    const tokens = saveTrackingToken(result.trackingToken)
    await loadOrderHistory(tokens)
    sincronizarAcompanhamentoEmTempoReal(tokens)
    cartLines.value = []
    if (result.paymentAction?.type === 'REDIRECT' && result.paymentAction.url) {
      window.location.assign(result.paymentAction.url)
      return
    }
    toast.success(`Pedido ${result.pedido.codigo} criado!`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível enviar o pedido.')
  } finally {
    sending.value = false
  }
}

function useLocation() {
  if (!navigator.geolocation) return toast.info('Geolocalização não disponível neste navegador.')
  obtendoLocalizacao.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      form.latitude = coords.latitude
      form.longitude = coords.longitude
      obtendoLocalizacao.value = false
      toast.success('Localização adicionada ao pedido para facilitar a rota do entregador.')
    },
    () => {
      obtendoLocalizacao.value = false
      toast.error('Não foi possível obter sua localização.')
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

async function copyPix() {
  const code = orderResult.value?.paymentAction?.pixCopiaCola
  if (!code) return
  await navigator.clipboard.writeText(code)
  toast.success('Código Pix copiado')
}

function humanize(value: string) {
  return value.split('_').join(' ').toLocaleLowerCase('pt-BR')
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function clearSearch() {
  searchTerm.value = ''
  activeCategory.value = 'todos'
}

function scrollToMenu() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openMenuFromEmptyCart() {
  cartDrawerOpen.value = false
  scrollToMenu()
}

watch(searchTerm, () => {
  activeCategory.value = 'todos'
})
watch(() => [origem.value, form.cep, form.cidade, form.bairro, form.logradouro, form.numero, form.complemento, form.referencia, JSON.stringify(payloadItems.value)], scheduleCheckoutPreview)
watch(useAccountData, (enabled) => { if (enabled && customerAccount.value) applyCustomerAccount(customerAccount.value) })
watch([trackingDetailsOpen, trackingDetails], async ([open, order]) => {
  if (!open || !order?.acompanhamentoEntrega) return clearTrackingMap()
  await nextTick()
  renderTrackingMap()
})

onMounted(async () => {
  await carregar()
  if (customerToken()) await loadCustomerAccount(true)
  if (route.name === 'restaurante-conta-publica') await openCustomerAccount()
})
onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer)
  trackingSocket?.disconnect()
  publicMenuSocket?.disconnect()
  clearTrackingMap()
})
</script>

<template>
  <main class="restaurant-menu min-h-screen pb-28 lg:pb-12" :style="menuThemeStyle">
    <div v-if="loading" class="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <Skeleton class="h-56 rounded-[28px]" />
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="grid gap-4 md:grid-cols-2">
          <Skeleton v-for="n in 6" :key="n" class="h-44 rounded-2xl" />
        </div>
        <Skeleton class="hidden h-[420px] rounded-3xl lg:block" />
      </div>
    </div>

    <div v-else-if="!cardapio" class="mx-auto flex min-h-screen max-w-xl items-center px-6 py-20 text-center">
      <div class="w-full rounded-[28px] bg-white p-10 shadow-[0_0_0_1px_rgba(43,37,32,.06),0_18px_50px_rgba(43,37,32,.08)] dark:bg-zinc-900">
        <Store class="mx-auto mb-4 h-10 w-10 text-stone-400" />
        <h1 class="text-balance text-2xl font-semibold">Cardápio indisponível</h1>
        <p class="mt-2 text-pretty text-sm text-stone-500">Este restaurante ainda não publicou o cardápio ou está temporariamente indisponível.</p>
      </div>
    </div>

    <template v-else>
      <section class="menu-hero">
        <div class="menu-hero-pattern" />
        <div class="relative mx-auto flex min-h-[100px] max-w-7xl items-end px-4 pb-7 pt-10 sm:px-6 sm:pb-9">
          <div class="flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div class="flex min-w-0 items-center gap-4 sm:gap-5">
              <div class="logo-shell shrink-0">
                <img :src="logo" :alt="`Logo de ${cardapio.restaurante.nome}`" class="h-full w-full rounded-[18px] object-contain" />
              </div>
              <div class="min-w-0 text-white">
                <div class="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/80"><span>Cardápio online</span><span class="h-1 w-1 rounded-full bg-white/70" /><span>Pedido seguro</span></div>
                <h1 class="menu-title truncate text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  {{ cardapio.restaurante.nome }}
                </h1>
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-200">
                  <span v-if="cardapio.restaurante.deliveryAtivo" class="flex items-center gap-1.5"><Bike class="h-4 w-4 text-white/80" />Delivery</span>
                  <span v-if="cardapio.restaurante.retiradaAtiva" class="flex items-center gap-1.5"><Store class="h-4 w-4 text-white/80" />Retirada</span>
                  <span class="flex items-center gap-1.5"><Clock3 class="h-4 w-4 text-white/80" />Pedido online</span>
                </div>
              </div>
            </div>
            <div class="hero-actions flex shrink-0 flex-wrap items-center gap-2">
              <button type="button" class="hero-action" @click="historyOpen = true">
                <History class="h-4 w-4" />
                <span>Meus pedidos</span>
                <span v-if="orderHistory.length" class="hero-action-count">{{ orderHistory.length }}</span>
              </button>
              <div class="hero-action cursor-default" :class="!aceitaPedidos && 'bg-amber-500/20 text-amber-50'">
                <span class="relative flex h-2.5 w-2.5">
                  <span v-if="aceitaPedidos" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                  <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="aceitaPedidos ? 'bg-emerald-400' : 'bg-amber-300'" />
                </span>
                <span>{{ aceitaPedidos ? 'Recebendo pedidos' : 'Fechado agora' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="menu-toolbar sticky top-0 z-30">
        <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="relative lg:w-80">
              <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input v-model="searchTerm" class="h-11 rounded-xl border bg-stone-100 pl-10 shadow-none focus-visible:ring-primary/30" placeholder="Buscar no cardápio" />
            </div>
            <div class="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
              <button v-for="category in categories" :key="category.key" type="button" class="category-chip" :class="{ active: activeCategory === category.key }" @click="activeCategory = category.key">
                {{ category.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div v-if="!aceitaPedidos" class="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-[0_0_0_1px_rgba(217,119,6,.08)]">
          <Clock3 class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p class="font-semibold">Restaurante fechado no momento</p>
            <p class="mt-1 text-sm text-amber-900/80">{{ mensagemAtendimento }} Você pode consultar o cardápio, mas os pedidos estarão disponíveis no próximo horário de atendimento.</p>
          </div>
        </div>
        <div v-if="cardapio.restaurante.fidelidade" class="loyalty-banner mb-6">
          <span class="loyalty-banner-icon"><Gift class="h-5 w-5" /></span>
          <div class="min-w-0 flex-1"><p class="font-semibold">{{ cardapio.restaurante.fidelidade.progresso?.recompensasDisponiveis ? 'Você tem uma recompensa disponível!' : `Fidelidade: ganhe ${cardapio.restaurante.fidelidade.descontoPercentual}% em ${cardapio.restaurante.fidelidade.premio?.nome || 'um produto selecionado'}` }}</p><p class="mt-0.5 text-sm opacity-80"><template v-if="cardapio.restaurante.fidelidade.progresso">{{ cardapio.restaurante.fidelidade.progresso.pedidosElegiveis % cardapio.restaurante.fidelidade.pedidosMeta }}/{{ cardapio.restaurante.fidelidade.pedidosMeta }} pedidos elegíveis para a próxima recompensa.</template><template v-else>Entre na sua conta para acompanhar seus pedidos e recompensas.</template></p></div>
        </div>
        <button v-if="tracking" type="button" class="tracking-order mb-6 flex w-full flex-col gap-3 rounded-2xl bg-emerald-50 p-4 text-left shadow-[0_0_0_1px_rgba(5,150,105,.14)] sm:flex-row sm:items-center sm:justify-between dark:bg-emerald-950/30" :aria-label="`Ver detalhes do pedido ${tracking.codigo}`" @click="openTrackingDetails(tracking)">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><Clock3 class="h-5 w-5" /></span>
            <div>
              <p class="font-semibold">Pedido {{ tracking.codigo }}</p>
              <p class="text-sm text-emerald-800/70 dark:text-emerald-200/70">{{ trackingStatusLabel }} · pagamento {{ humanize(tracking.pagamentoStatus) }}</p>
            </div>
          </div>
          <span class="flex items-center gap-2"><Badge class="w-fit" :class="trackingBadgeClass">{{ trackingStatusLabel }}</Badge><ChevronRight class="h-5 w-5 text-emerald-700" /></span>
        </button>

        <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section class="min-w-0 space-y-9">
            <div v-if="!visibleGroups.length" class="rounded-[24px] bg-white px-6 py-16 text-center shadow-[0_0_0_1px_rgba(43,37,32,.06)] dark:bg-zinc-900">
              <Search class="mx-auto mb-3 h-8 w-8 text-stone-300" />
              <h2 class="font-semibold">Nenhum item encontrado</h2>
              <p class="mt-1 text-sm text-stone-500">Tente outro termo ou volte para todas as categorias.</p>
              <Button class="mt-5 tap-button" variant="outline" @click="clearSearch">Limpar busca</Button>
            </div>

            <section v-for="group in visibleGroups" :key="group.key" :id="`categoria-${group.key}`" class="menu-section">
              <div class="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 class="menu-heading text-balance text-xl md:text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                    {{ group.name }}
                  </h2>
                </div>
                <span class="text-sm text-stone-500">{{ group.items.length }} {{ group.items.length === 1 ? 'opção' : 'opções' }}</span>
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <article v-for="item in group.items" :key="item.id" class="product-card group" :class="{ 'product-card--closed': !aceitaPedidos }" :aria-disabled="!aceitaPedidos" @click="openItem(item)">
                  <div class="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div v-if="quantidadeNoCarrinho(item.id)" class="brand-soft mb-2 w-fit rounded-full px-2.5 py-1 text-xs font-semibold">{{ quantidadeNoCarrinho(item.id) }} no carrinho</div>
                    <h3 class="text-balance text-base font-semibold leading-snug sm:text-lg">
                      {{ itemName(item) }}
                    </h3>
                    <p class="line-clamp-2 text-pretty text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                      {{ itemDescription(item) }}
                    </p>
                    <div class="mt-auto flex items-end justify-between gap-3 pt-2">
                      <div>
                        <p v-if="item.grupos.length" class="text-[11px] font-medium uppercase tracking-wide text-stone-400">A partir de</p>
                        <p class="price text-base font-bold text-stone-950 dark:text-white">
                          {{ formatCurrencyBR(Number(item.Produto.preco)) }}
                        </p>
                      </div>
                      <button type="button" class="add-button" :aria-label="`Adicionar ${itemName(item)}`" :disabled="!aceitaPedidos" @click.stop="quickAdd(item)">
                        <Plus class="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div v-if="itemImage(item)" class="product-image-wrap">
                    <img :src="itemImage(item)" :alt="itemName(item)" class="product-image" />
                  </div>
                  <div v-else class="product-placeholder"><UtensilsCrossed class="h-8 w-8" /><span>Feito na casa</span></div>
                </article>
              </div>
            </section>
          </section>

          <aside class="sticky top-[92px] hidden lg:block">
            <div class="cart-card">
              <div class="flex items-center justify-between px-5 pb-4 pt-5">
                <div>
                  <p class="brand-text text-xs font-semibold uppercase tracking-[0.14em]">Seu pedido</p>
                  <h2 class="menu-heading mt-0.5 text-xl font-semibold">Carrinho</h2>
                </div>
                <span class="flex h-9 min-w-9 items-center justify-center rounded-full bg-stone-100 px-2 text-sm font-semibold tabular-nums dark:bg-zinc-800">{{ cartUnits }}</span>
              </div>
              <Separator />
              <div v-if="!selecionados.length" class="px-6 py-12 text-center">
                <span class="brand-soft mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"><ShoppingBag class="h-6 w-6" /></span>
                <p class="mt-4 font-semibold">Seu carrinho está vazio</p>
                <p class="mt-1 text-pretty text-sm text-stone-500">Escolha seus favoritos para começar o pedido.</p>
              </div>
              <div v-else>
                <div class="max-h-[46vh] space-y-1 overflow-y-auto px-3 py-3">
                  <div v-for="line in selecionados" :key="line.id" class="cart-line">
                    <div class="min-w-0 flex-1">
                      <button type="button" class="brand-hover block max-w-full truncate text-left text-sm font-semibold" @click="editCartLine(line)">
                        {{ itemName(line.item) }}
                      </button>
                      <p v-if="selectedOptionNames(line).length" class="mt-0.5 line-clamp-2 text-xs text-stone-500">
                        {{ selectedOptionNames(line).join(', ') }}
                      </p>
                      <p class="price mt-1.5 text-sm font-semibold">
                        {{ formatCurrencyBR(lineTotal(line)) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1">
                      <button type="button" class="quantity-button" :aria-label="`Diminuir ${itemName(line.item)}`" @click="change(line.id, -1)">
                        <Minus class="h-3.5 w-3.5" />
                      </button>
                      <span class="w-7 text-center text-sm font-semibold tabular-nums">{{ line.quantidade }}</span>
                      <button type="button" class="quantity-button" :aria-label="`Aumentar ${itemName(line.item)}`" @click="change(line.id, 1)">
                        <Plus class="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button type="button" class="delete-button" :aria-label="`Remover ${itemName(line.item)}`" @click="removeItem(line.id)">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Separator />
                <div class="space-y-4 p-5">
                  <div class="flex items-end justify-between">
                    <div>
                      <p class="text-xs text-stone-500">Subtotal estimado</p>
                      <p class="price text-xl font-bold">
                        {{ formatCurrencyBR(estimatedSubtotal) }}
                      </p>
                    </div>
                    <span class="text-xs text-stone-400">sem frete</span>
                  </div>
                  <Button class="brand-button tap-button h-12 w-full rounded-xl text-base" :style="primaryButtonStyle" :disabled="!aceitaPedidos" @click="openCheckout">Continuar pedido<ChevronRight class="ml-auto h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div v-if="false" class="fixed inset-x-0 bottom-0 z-40 p-3 lg:hidden">
        <button type="button" class="mobile-cart-bar" @click="cartDrawerOpen = true">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><ShoppingCart class="h-5 w-5" /></span>
          <span class="min-w-0 flex-1 text-left"
            ><span class="block text-xs opacity-80">{{ cartUnits }} {{ cartUnits === 1 ? 'item' : 'itens' }}</span
            ><strong class="price block truncate text-base">Ver carrinho · {{ formatCurrencyBR(estimatedSubtotal) }}</strong></span
          >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>
      <div class="mobile-bottom-bar lg:hidden">
        <button type="button" class="bottom-bar-action" @click="scrollToMenu"><Menu class="h-5 w-5" /><span>Cardápio</span></button>
        <button type="button" class="bottom-bar-action" @click="historyOpen = true"><History class="h-5 w-5" /><span>Pedidos</span><b v-if="orderHistory.length" class="bottom-bar-count">{{ orderHistory.length }}</b></button>
        <button type="button" class="bottom-bar-action bottom-bar-cart" :class="{ 'has-items': cartUnits }" @click="cartDrawerOpen = true"><span class="relative"><ShoppingCart class="h-5 w-5" /><b v-if="cartUnits" class="bottom-bar-count cart-count">{{ cartUnits }}</b></span><span>{{ cartUnits ? formatCurrencyBR(estimatedSubtotal) : 'Carrinho' }}</span></button>
        <button type="button" class="bottom-bar-action" @click="openCustomerAccount"><UserRound class="h-5 w-5" /><span>Conta</span></button>
      </div>
    </template>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="itemDialogOpen">
      <component :is="menuModalContent" class="menu-overlay max-h-[88vh] overflow-y-auto rounded-t-[24px] border-0 p-0 lg:max-h-[92vh] lg:max-w-2xl lg:rounded-[24px]" :style="menuThemeStyle">
        <template v-if="activeItem">
          <div v-if="itemImage(activeItem)" class="h-52 overflow-hidden rounded-t-[24px] sm:h-64 lg:rounded-t-[24px]">
            <img :src="itemImage(activeItem)" :alt="itemName(activeItem)" class="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10" />
          </div>
          <div class="p-5 sm:p-7">
            <component :is="menuModalHeader" class="text-left">
              <component :is="menuModalTitle" class="menu-heading text-balance text-2xl tracking-[-0.025em]">{{ itemName(activeItem) }}</component>
              <component :is="menuModalDescription" class="text-pretty leading-relaxed">{{ itemDescription(activeItem) }}</component>
            </component>

            <div class="mt-6 space-y-6">
              <section v-for="link in activeItem.grupos" :key="link.grupoId">
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 class="font-semibold">{{ link.Grupo.nome }}</h3>
                    <p class="text-xs text-stone-500">Escolha de {{ link.Grupo.minimo }} até {{ link.Grupo.maximo }} · {{ selectedCount(link.Grupo) }} selecionado(s)</p>
                  </div>
                  <Badge :variant="selectedCount(link.Grupo) >= link.Grupo.minimo ? 'secondary' : 'secondary'">{{ link.Grupo.minimo > 0 ? 'Obrigatório' : 'Opcional' }}</Badge>
                </div>
                <div class="space-y-2">
                  <button v-for="option in link.Grupo.opcoes" :key="option.id" type="button" class="option-row" :class="{ selected: draftSelections.includes(option.id) }" @click="toggleDraft(link.Grupo, option.id)">
                    <span class="option-check"><Check class="h-3.5 w-3.5" /></span>
                    <span class="min-w-0 flex-1 text-left text-sm font-medium">{{ option.nome }}</span>
                    <span v-if="Number(option.precoAdicional) > 0" class="price text-sm font-semibold text-stone-600 dark:text-stone-300">+ {{ formatCurrencyBR(Number(option.precoAdicional)) }}</span>
                  </button>
                </div>
              </section>
            </div>

            <div class="mt-7 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
              <div class="flex h-12 items-center justify-between rounded-xl bg-stone-100 p-1 dark:bg-zinc-800 sm:w-36">
                <button type="button" class="quantity-button h-10 w-10 bg-white dark:bg-zinc-900" :disabled="draftQuantity <= 1" @click="draftQuantity--">
                  <Minus class="h-4 w-4" />
                </button>
                <strong class="tabular-nums">{{ draftQuantity }}</strong>
                <button type="button" class="quantity-button h-10 w-10 bg-white dark:bg-zinc-900" @click="draftQuantity++">
                  <Plus class="h-4 w-4" />
                </button>
              </div>
              <Button class="tap-button h-12 flex-1 rounded-xl text-base" :style="primaryButtonStyle" :disabled="!activeSelectionsValid" @click="saveActiveItem">
                {{ activeCartLineId ? 'Atualizar carrinho' : 'Adicionar ao carrinho' }}
                <span class="price ml-auto">{{ formatCurrencyBR(activeUnitPrice * draftQuantity) }}</span>
              </Button>
            </div>
          </div>
        </template>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="cartDrawerOpen">
      <component :is="menuModalContent" class="menu-overlay max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:max-h-[90vh] lg:max-w-2xl lg:overflow-y-auto lg:rounded-[24px]" :style="menuThemeStyle">
        <component :is="menuModalHeader" class="shrink-0 text-left lg:px-7 lg:pt-6"
          ><component :is="menuModalTitle" class="menu-heading text-xl">Seu carrinho</component><component :is="menuModalDescription">{{ cartUnits }} {{ cartUnits === 1 ? 'item selecionado' : 'itens selecionados' }}</component></component
        >
        <div class="max-h-[calc(88dvh-10rem)] overflow-y-auto overscroll-contain touch-pan-y px-4">
          <div v-for="line in selecionados" :key="line.id" class="cart-line border-b py-4 last:border-0">
            <div class="min-w-0 flex-1">
              <button type="button" class="truncate text-left text-sm font-semibold" @click="editCartLine(line)">
                {{ itemName(line.item) }}
              </button>
              <p v-if="selectedOptionNames(line).length" class="mt-0.5 line-clamp-2 text-xs text-stone-500">
                {{ selectedOptionNames(line).join(', ') }}
              </p>
              <p class="price mt-1.5 text-sm font-bold">{{ formatCurrencyBR(lineTotal(line)) }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="quantity-button" @click="change(line.id, -1)">
                <Minus class="h-3.5 w-3.5" /></button
              ><span class="w-7 text-center text-sm font-semibold tabular-nums">{{ line.quantidade }}</span
              ><button type="button" class="quantity-button" @click="change(line.id, 1)">
                <Plus class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        <component :is="menuModalFooter" class="shrink-0 border-t bg-white dark:bg-zinc-950 lg:flex-col lg:items-stretch lg:gap-2 lg:px-7 lg:py-5">
          <div v-if="selecionados.length" class="mb-1 flex items-end justify-between">
            <span class="text-sm text-stone-500">Subtotal</span><strong class="price text-xl">{{ formatCurrencyBR(estimatedSubtotal) }}</strong>
          </div>
          <Button v-if="selecionados.length" class="tap-button h-12 rounded-xl text-base" :style="primaryButtonStyle" :disabled="!aceitaPedidos" @click="openCheckout">Continuar pedido<ChevronRight class="ml-auto" /></Button>
          <Button v-else class="tap-button h-12 rounded-xl text-base" :style="primaryButtonStyle" @click="openMenuFromEmptyCart">Abrir cardápio<UtensilsCrossed class="ml-auto" /></Button>
        </component>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="checkoutOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-4xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :style="menuThemeStyle">
        <template v-if="orderResult">
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [scrollbar-gutter:stable] p-6 sm:p-9">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-700">
              <CheckCircle2 class="h-8 w-8" />
            </div>
            <component :is="menuModalHeader" class="mt-5 flex items-center justify-center text-center"
              ><component :is="menuModalTitle" class="menu-heading text-3xl">Pedido {{ orderResult.pedido.codigo }} recebido!</component><component :is="menuModalDescription">Agora é só acompanhar o pagamento e o preparo por este navegador.</component></component
            >
            <div class="mx-auto mt-7 max-w-lg space-y-4">
              <div class="flex justify-between rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
                <span>Total do pedido</span><strong class="price text-lg">{{ formatCurrencyBR(Number(orderResult.pedido.total)) }}</strong>
              </div>
              <div v-if="orderResult.paymentAction?.type === 'PIX'" class="brand-soft space-y-3 rounded-2xl p-5">
                <p class="font-semibold">Pague com Pix</p>
                <p class="break-all text-sm text-stone-600 dark:text-stone-300">
                  {{ orderResult.paymentAction.pixCopiaCola }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button class="tap-button" @click="copyPix"><Clipboard class="mr-2 h-4 w-4" />Copiar Pix</Button><Button v-if="orderResult.paymentAction.url" as-child variant="outline"><a :href="orderResult.paymentAction.url" target="_blank" rel="noopener noreferrer">Abrir pagamento</a></Button>
                </div>
              </div>
              <p v-else class="rounded-2xl bg-stone-100 p-4 text-sm text-stone-600 dark:bg-zinc-800 dark:text-stone-300">O pagamento será realizado na {{ origem === 'DELIVERY' ? 'entrega' : 'retirada' }}.</p>
            </div>
            <component :is="menuModalFooter" class="mt-7 sm:justify-center"><Button class="tap-button h-11 rounded-xl px-7" @click="checkoutOpen = false">Voltar ao cardápio</Button></component>
          </div>
        </template>

        <template v-else>
          <div class="shrink-0 border-b md:px-6 md:py-5 sm:px-8">
            <component :is="menuModalHeader" class="text-left"><component :is="menuModalTitle" class="menu-heading text-2xl">Finalizar pedido</component><component :is="menuModalDescription">Confirme como deseja receber e seus dados de contato.</component></component>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
            <div class="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-6 p-6 sm:p-8">
              <section class="space-y-3">
                <div>
                  <h3 class="font-semibold">Como deseja receber?</h3>
                  <p class="text-sm text-stone-500">Escolha a opção mais conveniente.</p>
                </div>
                <RadioGroup v-model="origem" class="grid gap-3 sm:grid-cols-2"
                  ><label v-if="cardapio?.restaurante.retiradaAtiva" class="choice-card" :class="{ selected: origem === 'RETIRADA' }"
                    ><RadioGroupItem value="RETIRADA" /><span class="choice-icon"><Store class="h-5 w-5" /></span><span><strong class="block text-sm">Retirar no local</strong><small class="text-stone-500">Sem taxa de entrega</small></span></label
                  ><label v-if="cardapio?.restaurante.deliveryAtivo" class="choice-card" :class="{ selected: origem === 'DELIVERY' }"
                    ><RadioGroupItem value="DELIVERY" /><span class="choice-icon"><Truck class="h-5 w-5" /></span><span><strong class="block text-sm">Receber por delivery</strong><small class="text-stone-500">Entregamos no endereço</small></span></label
                  ></RadioGroup
                >
              </section>

              <section class="space-y-3">
                <div>
                  <h3 class="font-semibold">Seus dados</h3>
                  <p class="text-sm text-stone-500">Usaremos o telefone para atualizações do pedido.</p>
                </div>
                <label v-if="customerAccount" class="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><input v-model="useAccountData" type="checkbox" /> Usar os dados da minha conta</label>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2"><Label for="customer-name">Nome</Label><Input id="customer-name" v-model="form.nome" placeholder="Como podemos chamar você?" /></div>
                  <div class="space-y-2"><Label for="customer-phone">Telefone</Label><Input id="customer-phone" v-model="form.telefone" inputmode="tel" placeholder="(00) 00000-0000" /></div>
                  <div class="space-y-2 sm:col-span-2"><Label for="customer-email">E-mail</Label><Input id="customer-email" v-model="form.email" type="email" placeholder="Necessário para pagamentos online" /></div>
                </div>
              </section>

              <section v-if="origem === 'DELIVERY'" class="space-y-4 rounded-2xl bg-gray-100 p-4 border dark:bg-zinc-900">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 class="flex items-center gap-2 font-semibold"><MapPin class="brand-text h-4 w-4" />Endereço de entrega</h3>
                    <p class="text-xs text-stone-500">Preencha para calcular a taxa. A localização é opcional e não substitui os dados do endereço.</p>
                  </div>
                  <Button size="sm" variant="outline" class="tap-button" :disabled="obtendoLocalizacao" @click="useLocation"><LoaderCircle v-if="obtendoLocalizacao" class="mr-2 h-4 w-4 animate-spin" /><LocateFixed v-else class="mr-2 h-4 w-4" />Usar localização</Button>
                </div>
                <p class="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
                  <LocateFixed class="mt-0.5 h-4 w-4 shrink-0" />
                  Usar sua localização ajuda o entregador a encontrar sua casa no mapa e na rota. Os campos de endereço continuam obrigatórios para calcular a entrega.
                </p>
                <p v-if="form.latitude !== null && form.longitude !== null" class="flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 class="h-3.5 w-3.5" />Localização adicionada ao pedido para a rota do entregador.</p>
                <div v-if="customerAccount?.enderecos.length" class="space-y-1"><Label>Endereço salvo</Label><select v-model="selectedAccountAddressId" class="h-10 w-full rounded-md border bg-white px-3 text-sm" @change="applyAccountAddress(customerAccount.enderecos.find((item) => item.id === selectedAccountAddressId)!)"><option :value="null">Preencher manualmente</option><option v-for="address in customerAccount.enderecos" :key="address.id" :value="address.id">{{ address.rotulo || address.logradouro }} · {{ address.numero }}</option></select></div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="space-y-1"><Label>CEP</Label><Input v-model="form.cep" placeholder="00000-000" /></div>
                  <div class="space-y-1"><Label>Cidade</Label><Input v-model="form.cidade" placeholder="Ex.: São Paulo" /></div>
                  <div class="space-y-1"><Label>Bairro</Label><Input v-model="form.bairro" placeholder="Ex.: Centro" /></div>
                  <div class="space-y-1"><Label>Rua / Avenida</Label><Input v-model="form.logradouro" placeholder="Ex.: Rua das Flores" /></div>
                  <div class="space-y-1"><Label>Número</Label><Input v-model="form.numero" placeholder="Ex.: 123" /></div>
                  <div class="space-y-1"><Label>Complemento</Label><Input v-model="form.complemento" placeholder="Ex.: Casa 2 ou apto. 101" /></div>
                  <div class="space-y-1 sm:col-span-2"><Label>Referência</Label><Input v-model="form.referencia" placeholder="Ex.: Portão azul ao lado da praça" /></div>
                </div>
              </section>

              <section class="space-y-3">
                <div>
                  <h3 class="font-semibold">Pagamento</h3>
                  <p class="text-sm text-stone-500">Selecione como prefere pagar.</p>
                </div>
                <RadioGroup v-model="pagamento" class="grid gap-3 sm:grid-cols-3"
                  ><label v-if="cardapio?.restaurante.pagamentoNaEntregaAtivo" class="choice-card compact" :class="{ selected: pagamento === 'NA_ENTREGA' }"><RadioGroupItem value="NA_ENTREGA" /><span class="text-sm font-medium">Na entrega</span></label
                  ><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="choice-card compact" :class="{ selected: pagamento === 'PIX' }"><RadioGroupItem value="PIX" /><span class="text-sm font-medium">Pix</span></label
                  ><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="choice-card compact" :class="{ selected: pagamento === 'CHECKOUT_PRO' }"><RadioGroupItem value="CHECKOUT_PRO" /><span class="text-sm font-medium">Cartão online</span></label></RadioGroup
                >
              </section>
              <div class="space-y-2"><Label for="order-note">Observação do pedido</Label><Textarea id="order-note" v-model="form.observacao" rows="3" placeholder="Ex.: tirar cebola, chamar no portão..." /></div>
            </div>

            <aside class="border-t bg-stone-50 p-6 dark:bg-zinc-900 lg:border-l lg:border-t-0 sm:p-7">
              <h3 class="menu-heading text-lg font-semibold">Resumo do pedido</h3>
              <div class="mt-4 space-y-2">
                <div v-for="line in selecionados" :key="line.id" class="flex gap-3 text-sm bg-stone-100 p-2 border rounded-md">
                  <span class="flex h-6 min-w-6 items-center justify-center rounded-md text-xs font-bold" :style="primaryButtonStyle">{{ line.quantidade }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium">{{ itemName(line.item) }}</p>
                    <p v-if="selectedOptionNames(line).length" class="mt-0.5 text-xs text-stone-500">
                      {{ selectedOptionNames(line).join(', ') }}
                    </p>
                  </div>
                  <span class="price font-medium">{{ formatCurrencyBR(lineTotal(line)) }}</span>
                </div>
              </div>
              <Separator class="my-3" />
              <div v-if="quote" class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-stone-500">Subtotal</span><span class="price">{{ formatCurrencyBR(Number(quote.subtotal)) }}</span>
                </div>
                <div v-if="origem === 'DELIVERY'" class="flex justify-between">
                  <span class="text-stone-500"
                    >Frete <small v-if="quote.zone">({{ quote.zone.nome }})</small></span
                  ><span class="price">{{ Number(quote.frete) === 0 ? 'Grátis' : formatCurrencyBR(Number(quote.frete)) }}</span>
                </div>
                <div class="flex justify-between text-lg">
                  <strong>Total</strong><strong class="price">{{ formatCurrencyBR(Number(quote.total)) }}</strong>
                </div>
                <p v-if="!quote.minimumReached" class="rounded-lg bg-red-50 p-2 text-xs text-red-700">Pedido mínimo: {{ formatCurrencyBR(Number(quote.minimumOrder)) }}</p>
              </div>
              <div v-else class="space-y-2">
                <div class="flex justify-between text-lg">
                  <strong>{{ previewing ? 'Calculando total' : 'Subtotal' }}</strong
                  ><strong class="price flex items-center gap-2"><LoaderCircle v-if="previewing" class="h-4 w-4 animate-spin" />{{ formatCurrencyBR(estimatedSubtotal) }}</strong>
                </div>
                <p v-if="origem === 'DELIVERY' && !addressComplete" class="text-xs text-stone-500">Preencha o endereço para calcular automaticamente o frete e o total.</p>
              </div>
              <Button class="tap-button mt-5 h-12 w-full rounded-xl text-base" :style="primaryButtonStyle" :disabled="!aceitaPedidos || sending || previewing || !checkoutValid || !quote?.minimumReached" @click="pedir"><LoaderCircle v-if="sending" class="mr-2 h-4 w-4 animate-spin" />Confirmar pedido</Button>
              <p class="mt-3 text-center text-[11px] leading-relaxed text-stone-400">Valores e disponibilidade são confirmados pelo restaurante antes da criação do pedido.</p>
            </aside>
            </div>
          </div>
        </template>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="historyOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-2xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :style="menuThemeStyle">
        <div class="border-b md:px-6 md:py-5 sm:px-8">
          <component :is="menuModalHeader" class="text-left">
            <component :is="menuModalTitle" class="menu-heading flex items-center gap-2 text-2xl"><History class="h-5 w-5 brand-text" />Meus pedidos</component>
            <component :is="menuModalDescription">Pedidos feitos neste restaurante por este navegador.</component>
          </component>
        </div>
        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y p-5 sm:pb-6">
          <div v-if="historyLoading" class="flex items-center justify-center gap-2 py-12 text-sm text-stone-500"><LoaderCircle class="h-5 w-5 animate-spin" />Carregando pedidos...</div>
          <div v-else-if="!orderHistory.length" class="py-12 text-center">
            <ShoppingBag class="mx-auto mb-3 h-9 w-9 text-stone-300" />
            <p class="font-semibold">Nenhum pedido neste navegador</p>
            <p class="mt-1 text-sm text-stone-500">Quando você finalizar um pedido, ele aparecerá aqui.</p>
          </div>
          <template v-else>
            <button v-for="order in orderHistory" :key="order.trackingToken" type="button" class="history-order history-order--action w-full text-left" @click="openTrackingDetails(order)">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="font-semibold">Pedido {{ order.codigo }}</p>
                  <p class="mt-0.5 text-xs text-stone-500">
                    {{ formatOrderDate(order.createdAt) }} ·
                    {{ order.origem === 'DELIVERY' ? 'Delivery' : 'Retirada' }}
                  </p>
                </div>
                <Badge class="border-0" :class="restaurantOrderStatusBadgeClass(order.status)">{{ restaurantOrderStatusLabel(order.status) }}</Badge>
              </div>
              <div class="mt-3 space-y-1.5 text-sm text-stone-600">
                <p v-for="item in order.itens" :key="`${order.codigo}-${item.nomeSnapshot}`" class="flex justify-between gap-3">
                  <span>{{ Number(item.quantidade) }}× {{ item.nomeSnapshot }}</span
                  ><span class="price shrink-0">{{ formatCurrencyBR(Number(item.subtotalSnapshot)) }}</span>
                </p>
              </div>
              <div class="mt-3 flex items-center justify-between border-t pt-3">
                <span class="text-xs text-stone-500">Pagamento {{ humanize(order.pagamentoStatus) }}</span
                ><strong class="price">{{ formatCurrencyBR(Number(order.total)) }}</strong>
              </div>
            </button>
          </template>
        </div>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="trackingDetailsOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-2xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :style="menuThemeStyle">
        <div class="shrink-0 border-b md:px-6 md:py-5 sm:px-8">
          <component :is="menuModalHeader" class="text-left">
            <component :is="menuModalTitle" class="menu-heading flex items-center gap-2 text-2xl"><PackageCheck class="brand-text h-5 w-5" />Acompanhar pedido</component>
            <component :is="menuModalDescription">Atualizações em tempo real do seu pedido.</component>
          </component>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [scrollbar-gutter:stable] p-5 sm:p-7">
          <template v-if="trackingDetails">
            <section class="tracking-summary border border-stone-200">
              <div><span>Pedido {{ trackingDetails.codigo }}</span><h3>{{ restaurantOrderStatusLabel(trackingDetails.status) }}</h3><p>Feito às {{ trackingTime(trackingDetails.createdAt) }} · há {{ trackingElapsed(trackingDetails) }}</p></div>
              <Badge class="border-0" :class="restaurantOrderStatusBadgeClass(trackingDetails.status)">{{ restaurantOrderStatusLabel(trackingDetails.status) }}</Badge>
            </section>
            <section class="tracking-average border border-stone-200">
              <span><Timer class="h-5 w-5" /></span><div><strong>Tempo médio de espera: {{ trackingDetails.tempoMedioEsperaMinutos }} min</strong><p>{{ trackingDetails.tempoMedioBase === 'historico' ? 'Baseado nos pedidos concluídos recentemente.' : 'Estimativa inicial do restaurante.' }}</p></div>
            </section>

            <section class="tracking-section">
              <div class="tracking-section-heading"><Clock3 class="brand-text h-4 w-4" /><h3>Andamento do pedido</h3></div>
              <ol class="tracking-timeline">
                <li v-for="event in trackingDetails.timeline" :key="event.key"><span><Check class="h-3.5 w-3.5" /></span><div><div class="flex items-baseline justify-between gap-3"><strong>{{ event.titulo }}</strong><time>{{ trackingTime(event.ocorreuEm) }}</time></div><p>{{ event.descricao }}</p></div></li>
              </ol>
            </section>

            <section v-if="trackingDetails.origem === 'DELIVERY'" class="tracking-section">
              <div class="tracking-section-heading"><MapPin class="brand-text h-4 w-4" /><h3>Mapa da entrega</h3></div>
              <div v-if="trackingDetails.acompanhamentoEntrega" class="tracking-map-shell"><div ref="trackingMapElement" class="tracking-map" aria-label="Acompanhamento do entregador no mapa" /><p><Navigation class="h-3.5 w-3.5" />Localização atualizada {{ trackingTime(trackingDetails.acompanhamentoEntrega.entregador.updatedAt) }}</p></div>
              <p v-else class="tracking-map-wait"><Truck class="h-5 w-5" />O mapa aparecerá quando o entregador iniciar a rota.</p>
            </section>

            <section class="tracking-section">
              <div class="tracking-section-heading"><ShoppingBag class="brand-text h-4 w-4" /><h3>Itens do pedido</h3></div>
              <div class="space-y-2"><div v-for="item in trackingDetails.itens" :key="`${trackingDetails.codigo}-${item.nomeSnapshot}`" class="tracking-item"><span>{{ Number(item.quantidade) }}×</span><div><strong>{{ item.nomeSnapshot }}</strong><p v-if="Array.isArray(item.selecoesSnapshotJson) && item.selecoesSnapshotJson.length">{{ item.selecoesSnapshotJson.map((option: any) => option.nome).filter(Boolean).join(', ') }}</p></div><strong class="price">{{ formatCurrencyBR(Number(item.subtotalSnapshot)) }}</strong></div></div>
              <div class="tracking-total"><span>Pagamento {{ humanize(trackingDetails.pagamentoStatus) }}</span><strong class="price">{{ formatCurrencyBR(Number(trackingDetails.total)) }}</strong></div>
            </section>
          </template>
        </div>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="accountOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-2xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :style="menuThemeStyle">
        <component :is="menuModalHeader" class="shrink-0 border-b md:px-5 md:py-5 text-left sm:px-7"><component :is="menuModalTitle" class="menu-heading flex items-center gap-2 text-2xl"><UserRound class="brand-text h-5 w-5" />{{ accountMode === 'profile' ? 'Minha conta' : accountMode === 'register' ? 'Criar conta' : 'Entrar na conta' }}</component><component :is="menuModalDescription">{{ accountMode === 'profile' ? 'Seus dados, endereços e histórico neste restaurante.' : 'Entre com telefone e senha para ter seus pedidos sempre com você.' }}</component></component>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [scrollbar-gutter:stable]">
        <div v-if="accountLoading" class="flex justify-center py-16"><LoaderCircle class="h-6 w-6 animate-spin brand-text" /></div>
        <div v-else-if="accountMode !== 'profile'" class="space-y-4 p-5 sm:p-7">
          <div v-if="accountMode === 'register'" class="space-y-1"><Label for="account-name">Nome completo</Label><Input id="account-name" v-model="accountForm.nome" :aria-invalid="Boolean(accountFieldErrors.nome.length)" :class="accountFieldErrors.nome.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" autocomplete="name" placeholder="Como podemos chamar você?" @input="clearAccountFieldError('nome')" /><p v-for="message in accountFieldErrors.nome" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
          <div class="space-y-1"><Label for="account-phone">Telefone</Label><Input id="account-phone" v-model="accountForm.telefone" v-maska="phoneMaskOptions" :aria-invalid="Boolean(accountFieldErrors.telefone.length)" :class="accountFieldErrors.telefone.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" @input="clearAccountFieldError('telefone')" /><p v-for="message in accountFieldErrors.telefone" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
          <div v-if="accountMode === 'register'" class="space-y-1"><Label for="account-email">E-mail (opcional)</Label><Input id="account-email" v-model="accountForm.email" :aria-invalid="Boolean(accountFieldErrors.email.length)" :class="accountFieldErrors.email.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" type="email" autocomplete="email" placeholder="voce@email.com" @input="clearAccountFieldError('email')" /><p v-for="message in accountFieldErrors.email" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
          <div class="space-y-1"><Label for="account-password">Senha</Label><Input id="account-password" v-model="accountForm.senha" :aria-invalid="Boolean(accountFieldErrors.senha.length)" :class="accountFieldErrors.senha.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" type="password" :autocomplete="accountMode === 'register' ? 'new-password' : 'current-password'" placeholder="Mínimo de 8 caracteres" @input="clearAccountFieldError('senha')" /><p v-if="accountMode === 'register'" class="text-xs text-stone-500">Use ao menos 8 caracteres, com letra e número.</p><p v-for="message in accountFieldErrors.senha" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
          <div v-if="accountMode === 'register'" class="space-y-1"><Label for="account-password-confirmation">Confirmar senha</Label><Input id="account-password-confirmation" v-model="accountForm.confirmacaoSenha" :aria-invalid="Boolean(accountFieldErrors.confirmacaoSenha.length)" :class="accountFieldErrors.confirmacaoSenha.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" type="password" autocomplete="new-password" @input="clearAccountFieldError('confirmacaoSenha')" /><p v-for="message in accountFieldErrors.confirmacaoSenha" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
          <Button class="h-12 w-full rounded-xl" :style="primaryButtonStyle" :disabled="accountSubmitting" @click="submitCustomerAccount"><LoaderCircle v-if="accountSubmitting" class="mr-2 h-4 w-4 animate-spin" />{{ accountMode === 'register' ? 'Criar minha conta' : 'Entrar' }}</Button>
          <button type="button" class="mx-auto block text-sm font-semibold brand-text" @click="accountMode = accountMode === 'register' ? 'login' : 'register'; clearAccountFieldErrors()">{{ accountMode === 'register' ? 'Já tenho uma conta' : 'Ainda não tenho conta' }}</button>
        </div>
        <div v-else-if="customerAccount" class="space-y-6 p-5 sm:p-7">
          <section class="rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
            <div class="mb-3 flex items-center justify-between"><h3 class="font-semibold">Dados pessoais</h3><button type="button" class="text-xs font-semibold brand-text" @click="logoutCustomer">Sair</button></div>
            <div class="grid gap-3 sm:grid-cols-2"><div class="space-y-1"><Label>Nome</Label><Input v-model="accountForm.nome" /></div><div class="space-y-1"><Label>Telefone</Label><Input :model-value="accountForm.telefone" disabled /></div><div class="space-y-1 sm:col-span-2"><Label>E-mail</Label><Input v-model="accountForm.email" type="email" /></div></div>
            <Button size="sm" class="mt-3" :style="primaryButtonStyle" :disabled="accountSubmitting" @click="saveCustomerProfile">Salvar dados</Button>
          </section>
          <section class="space-y-3"><div><h3 class="font-semibold">Meus endereços</h3><p class="text-xs text-stone-500">Escolha um endereço salvo no seu próximo delivery.</p></div>
            <div v-for="address in customerAccount.enderecos" :key="address.id" class="rounded-xl border p-3 text-sm"><div class="flex justify-between gap-3"><button type="button" class="min-w-0 text-left" @click="applyAccountAddress(address); accountOpen = false"><strong>{{ address.rotulo || 'Endereço' }} <span v-if="address.principal" class="brand-text">· principal</span></strong><span class="mt-1 block text-stone-500">{{ address.logradouro }}, {{ address.numero }} · {{ address.bairro }}, {{ address.cidade }}</span></button><button type="button" class="shrink-0 text-xs text-red-600" @click="removeCustomerAddress(address.id)">Remover</button></div></div>
            <form class="grid gap-2 rounded-xl border border-dashed p-3 sm:grid-cols-2" novalidate @submit.prevent="saveCustomerAddress">
              <div class="space-y-1"><Input v-model="accountAddressForm.rotulo" :aria-invalid="Boolean(accountAddressFieldErrors.rotulo.length)" :class="accountAddressFieldErrors.rotulo.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" placeholder="Rótulo (Casa, Trabalho)" @input="clearAccountAddressFieldError('rotulo')" /><p v-for="message in accountAddressFieldErrors.rotulo" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1"><Input v-model="accountAddressForm.cep" v-maska="cepMaskOptions" :aria-invalid="Boolean(accountAddressFieldErrors.cep.length)" :class="accountAddressFieldErrors.cep.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" inputmode="numeric" autocomplete="postal-code" placeholder="CEP" @input="clearAccountAddressFieldError('cep')" /><p v-for="message in accountAddressFieldErrors.cep" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1"><Input v-model="accountAddressForm.cidade" :aria-invalid="Boolean(accountAddressFieldErrors.cidade.length)" :class="accountAddressFieldErrors.cidade.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" autocomplete="address-level2" placeholder="Cidade" @input="clearAccountAddressFieldError('cidade')" /><p v-for="message in accountAddressFieldErrors.cidade" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1"><Input v-model="accountAddressForm.bairro" :aria-invalid="Boolean(accountAddressFieldErrors.bairro.length)" :class="accountAddressFieldErrors.bairro.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" autocomplete="address-level3" placeholder="Bairro" @input="clearAccountAddressFieldError('bairro')" /><p v-for="message in accountAddressFieldErrors.bairro" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1 sm:col-span-2"><Input v-model="accountAddressForm.logradouro" :aria-invalid="Boolean(accountAddressFieldErrors.logradouro.length)" :class="accountAddressFieldErrors.logradouro.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" autocomplete="street-address" placeholder="Rua / Avenida" @input="clearAccountAddressFieldError('logradouro')" /><p v-for="message in accountAddressFieldErrors.logradouro" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1"><Input v-model="accountAddressForm.numero" :aria-invalid="Boolean(accountAddressFieldErrors.numero.length)" :class="accountAddressFieldErrors.numero.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" autocomplete="address-line2" placeholder="Número" @input="clearAccountAddressFieldError('numero')" /><p v-for="message in accountAddressFieldErrors.numero" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1"><Input v-model="accountAddressForm.complemento" :aria-invalid="Boolean(accountAddressFieldErrors.complemento.length)" :class="accountAddressFieldErrors.complemento.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" placeholder="Complemento" @input="clearAccountAddressFieldError('complemento')" /><p v-for="message in accountAddressFieldErrors.complemento" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <div class="space-y-1 sm:col-span-2"><Input v-model="accountAddressForm.referencia" :aria-invalid="Boolean(accountAddressFieldErrors.referencia.length)" :class="accountAddressFieldErrors.referencia.length ? 'border-red-500 focus-visible:ring-red-500' : undefined" placeholder="Referência" @input="clearAccountAddressFieldError('referencia')" /><p v-for="message in accountAddressFieldErrors.referencia" :key="message" class="text-xs font-medium text-red-600" role="alert">{{ message }}</p></div>
              <label class="flex items-center gap-2 text-xs sm:col-span-2"><input v-model="accountAddressForm.principal" type="checkbox" /> Usar como endereço principal</label>
              <Button type="submit" size="sm" class="sm:col-span-2" :style="primaryButtonStyle" :disabled="accountSubmitting">Salvar endereço</Button>
            </form>
          </section>
          <section class="space-y-3"><div><h3 class="font-semibold">Histórico de pedidos</h3><p class="text-xs text-stone-500">Todos os pedidos feitos enquanto você esteve nesta conta.</p></div><div v-if="!customerAccount.pedidos.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-stone-500">Você ainda não fez pedidos nesta conta.</div><article v-for="order in customerAccount.pedidos" :key="`${order.codigo}-${order.createdAt}`" class="history-order"><div class="flex justify-between gap-3"><div><p class="font-semibold">Pedido {{ order.codigo }}</p><p class="text-xs text-stone-500">{{ formatOrderDate(order.createdAt) }} · {{ order.origem === 'DELIVERY' ? 'Delivery' : 'Retirada' }}</p></div><Badge class="border-0" :class="restaurantOrderStatusBadgeClass(order.status)">{{ restaurantOrderStatusLabel(order.status) }}</Badge></div><div class="mt-3 flex justify-between border-t pt-3 text-sm"><span>{{ order.itens.length }} {{ order.itens.length === 1 ? 'item' : 'itens' }}</span><strong class="price">{{ formatCurrencyBR(Number(order.total)) }}</strong></div></article></section>
        </div>
        </div>
      </component>
    </component>
  </main>
</template>

<style scoped>
.restaurant-menu {
  --menu-bg: #f6f3ef;
  --menu-surface: #fffdfa;
  --menu-ink: #29231f;
  --menu-muted: #786f68;
  --menu-accent: #c2410c;
  --menu-accent-foreground: #ffffff;
  --menu-secondary: #7c2d12;
  --menu-secondary-foreground: #ffffff;
  background: var(--menu-bg);
  color: var(--menu-ink);
  font-family: var(--app-font, 'Inter'), sans-serif;
  -webkit-font-smoothing: antialiased;
}

.menu-title,
.menu-heading {
  font-family: 'Sora', var(--app-font, sans-serif);
}

.menu-hero {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--menu-accent-foreground) 20%, transparent), transparent 28%), linear-gradient(120deg, var(--menu-secondary) 0%, color-mix(in srgb, var(--menu-secondary) 62%, var(--menu-accent)) 54%, var(--menu-accent) 100%);
}

.hero-action {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  border-radius: 14px;
  padding: 0 14px;
  color: white;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  transition:
    background-color 150ms ease-out,
    scale 150ms ease-out;
}
button.hero-action:hover {
  background: rgba(255, 255, 255, 0.2);
}
button.hero-action:active {
  scale: 0.97;
}
.hero-action-count {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0 6px;
  color: var(--menu-accent);
  background: white;
  font-size: 11px;
  font-weight: 700;
}

.menu-hero-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background-image: radial-gradient(rgba(255, 255, 255, 0.18) 0.8px, transparent 0.8px);
  background-size: 18px 18px;
  mask-image: linear-gradient(to right, black, transparent 85%);
}

.logo-shell {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 16px 32px rgba(0, 0, 0, 0.22);
}

.menu-toolbar {
  border-bottom: 1px solid rgba(43, 37, 32, 0.07);
  background: color-mix(in srgb, var(--menu-surface) 92%, transparent);
  backdrop-filter: blur(16px);
  box-shadow: 0 7px 20px rgba(43, 37, 32, 0.04);
}
.loyalty-banner {
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid color-mix(in srgb, var(--menu-accent) 30%, transparent);
  border-radius: 18px;
  padding: 14px 16px;
  color: color-mix(in srgb, var(--menu-ink) 90%, var(--menu-accent));
  background: linear-gradient(110deg, color-mix(in srgb, var(--menu-accent) 13%, var(--menu-surface)), var(--menu-surface));
  box-shadow: 0 8px 24px color-mix(in srgb, var(--menu-accent) 9%, transparent);
}
.loyalty-banner-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 13px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
}

.category-chip {
  min-height: 40px;
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 0 16px;
  color: var(--menu-muted);
  font-size: 0.875rem;
  font-weight: 600;
  transition-property: color, background-color, box-shadow, scale;
  transition-duration: 160ms;
  transition-timing-function: ease-out;
}

.category-chip:hover {
  color: var(--menu-ink);
  background: rgba(120, 113, 108, 0.09);
}
.category-chip:active {
  scale: 0.96;
}
.category-chip.active {
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
}

.product-card {
  min-height: 172px;
  display: flex;
  cursor: pointer;
  overflow: hidden;
  border-radius: 20px;
  background: var(--menu-surface);
  box-shadow:
    0 0 0 1px rgba(43, 37, 32, 0.06),
    0 2px 5px rgba(43, 37, 32, 0.035);
  transition-property: transform, box-shadow;
  transition-duration: 180ms;
  transition-timing-function: ease-out;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(43, 37, 32, 0.09),
    0 14px 32px rgba(43, 37, 32, 0.09);
}
.product-card:active {
  transform: translateY(0) scale(0.99);
}
.product-card--closed {
  cursor: not-allowed;
  opacity: 0.48;
  filter: grayscale(0.45);
}
.product-card--closed:hover,
.product-card--closed:active {
  transform: none;
  box-shadow: 0 0 0 1px rgba(43, 37, 32, 0.06);
}
.product-card--closed:hover .product-image {
  transform: none;
}

.product-image-wrap,
.product-placeholder {
  width: 144px;
  min-height: 172px;
  flex: 0 0 144px;
}
.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: 1px solid rgba(0, 0, 0, 0.08);
  outline-offset: -1px;
  transition: transform 280ms ease-out;
}
.product-card:hover .product-image {
  transform: scale(1.035);
}
.product-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--menu-accent);
  background: linear-gradient(145deg, color-mix(in srgb, var(--menu-accent) 5%, white), color-mix(in srgb, var(--menu-accent) 13%, white));
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.add-button {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 7px 16px color-mix(in srgb, var(--menu-accent) 24%, transparent);
  transition-property: background-color, scale;
  transition-duration: 150ms;
}
.add-button:hover {
  background: color-mix(in srgb, var(--menu-accent) 88%, black);
}
.add-button:active {
  scale: 0.96;
}

.cart-card {
  overflow: hidden;
  border-radius: 24px;
  background: var(--menu-surface);
  box-shadow:
    0 0 0 1px rgba(43, 37, 32, 0.06),
    0 18px 46px rgba(43, 37, 32, 0.09);
}
.cart-line {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  padding: 11px 10px;
}
.cart-line:hover {
  background: rgba(120, 113, 108, 0.055);
}

.quantity-button,
.delete-button {
  display: flex;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition-property: color, background-color, scale;
  transition-duration: 150ms;
}
.quantity-button {
  color: var(--menu-ink);
  background: rgba(120, 113, 108, 0.09);
}
.delete-button {
  color: #a8a29e;
}
.quantity-button:hover {
  background: rgba(120, 113, 108, 0.16);
}
.delete-button:hover {
  color: #dc2626;
  background: #fef2f2;
}
.quantity-button:active,
.delete-button:active {
  scale: 0.96;
}

.mobile-cart-bar {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  padding: 9px 14px 9px 10px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 16px 42px color-mix(in srgb, var(--menu-accent) 30%, transparent);
  transition-property: scale, background-color;
  transition-duration: 150ms;
}
.mobile-cart-bar:active {
  scale: 0.96;
}

.mobile-bottom-bar {
  position: fixed;
  z-index: 45;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  min-height: calc(64px + env(safe-area-inset-bottom));
  align-items: stretch;
  justify-content: space-around;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(43, 37, 32, 0.09);
  background: color-mix(in srgb, var(--menu-surface) 96%, transparent);
  box-shadow: 0 -8px 22px rgba(43, 37, 32, 0.08);
  backdrop-filter: blur(18px);
}
.bottom-bar-action {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 12px;
  color: var(--menu-muted);
  font-size: 10px;
  font-weight: 700;
}
.bottom-bar-action:active { background: color-mix(in srgb, var(--menu-accent) 12%, transparent); }
.bottom-bar-cart.has-items { color: var(--menu-accent); }
.bottom-bar-count {
  position: absolute;
  top: -7px;
  right: -11px;
  display: grid;
  min-width: 17px;
  height: 17px;
  place-items: center;
  border: 2px solid var(--menu-surface);
  border-radius: 999px;
  color: white;
  background: var(--menu-accent);
  font-size: 9px;
  line-height: 1;
}
.bottom-bar-count:not(.cart-count) { top: 3px; right: calc(50% - 23px); }

.option-row {
  display: flex;
  width: 100%;
  min-height: 55px;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(120, 113, 108, 0.06);
  box-shadow: inset 0 0 0 1px transparent;
  transition-property: background-color, box-shadow, scale;
  transition-duration: 150ms;
}
.option-row:hover {
  background: rgba(120, 113, 108, 0.1);
}

.option-row.selected {
  background: color-mix(in srgb, #b9bcbc 17%, white);
  border: 1px dashed rgb(67, 70, 68);
}
.option-check {
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  color: transparent;
  background: white;
  box-shadow: inset 0 0 0 1px rgba(120, 113, 108, 0.22);
  transition-property: color, background-color, scale;
  transition-duration: 150ms;
}
.option-row.selected .option-check {
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: none;
}

.choice-card {
  display: flex;
  min-height: 76px;
  cursor: pointer;
  align-items: center;
  gap: 12px;
  border-radius: 16px;
  padding: 13px;
  background: rgba(120, 113, 108, 0.055);
  box-shadow: inset 0 0 0 1px rgba(120, 113, 108, 0.12);
  transition-property: background-color, box-shadow, scale;
  transition-duration: 150ms;
}
.choice-card:hover {
  background: rgba(120, 113, 108, 0.09);
}
.choice-card:active {
  scale: 0.98;
}
.choice-card.selected {
  background: color-mix(in srgb, #dbe0dc 26%, white);
  border: 2px dashed rgb(29, 34, 30);
  box-shadow: inset 0 0 0 1.5px var(--menu-accent);
}
.choice-card.compact {
  min-height: 52px;
}
.choice-icon {
  display: flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  color: var(--menu-accent);
  background: white;
  box-shadow: 0 0 0 1px rgba(43, 37, 32, 0.06);
}

.menu-overlay {
  color: var(--menu-ink);
  background: var(--menu-surface);
  font-family: var(--app-font, 'Inter'), sans-serif;
}
.brand-button {
  color: var(--menu-accent-foreground) !important;
  background-color: var(--menu-accent) !important;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--menu-accent) 24%, transparent);
}
.brand-button:hover {
  background: color-mix(in srgb, var(--menu-accent) 88%, black);
}
.brand-text {
  color: var(--menu-accent);
}
.brand-hover:hover {
  color: var(--menu-accent);
}
.brand-soft {
  color: var(--menu-accent);
  background: color-mix(in srgb, var(--menu-accent) 10%, white);
}
.history-order {
  border-radius: 18px;
  border: 1px solid rgba(43, 37, 32, 0.08);
  padding: 14px;
  background: color-mix(in srgb, var(--menu-accent) 3%, white);
  box-shadow: inset 0 0 0 1px rgba(43, 37, 32, 0.08);
}
.history-order--action {
  cursor: pointer;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.history-order--action:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px color-mix(in srgb, var(--menu-accent) 12%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--menu-accent) 30%, transparent);
}
.tracking-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  color: var(--menu-accent-foreground);
  background: linear-gradient(135deg, var(--menu-secondary), var(--menu-accent));
}
.tracking-summary span { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.78; }
.tracking-summary h3 { margin: 4px 0; font-family: 'Sora', var(--app-font, sans-serif); font-size: 21px; }
.tracking-summary p { margin: 0; font-size: 12px; opacity: 0.82; }
.tracking-summary :deep(.badge) { color: var(--menu-ink); background: color-mix(in srgb, white 90%, transparent); }
.tracking-average { display: flex; gap: 11px; margin-top: 14px; padding: 14px; border: 1px solid color-mix(in srgb, var(--menu-accent) 20%, transparent); border-radius: 15px; background: color-mix(in srgb, var(--menu-accent) 7%, white); }
.tracking-average > span { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 11px; color: var(--menu-accent-foreground); background: var(--menu-accent); }
.tracking-average strong { display:block; font-size:13px; }.tracking-average p { margin:3px 0 0; color:var(--menu-muted); font-size:11px; }
.tracking-section { margin-top: 25px; }
.tracking-section-heading { display:flex; align-items:center; gap:7px; margin-bottom:12px; }.tracking-section-heading h3 { margin:0; font-size:15px; font-weight:800; }
.tracking-timeline { display:grid; gap:0; margin:0; padding:0; list-style:none; }.tracking-timeline li { position:relative; display:grid; grid-template-columns:28px minmax(0,1fr); gap:10px; padding-bottom:18px; }.tracking-timeline li:not(:last-child)::before { position:absolute; top:25px; left:13px; bottom:0; width:2px; background:color-mix(in srgb,var(--menu-accent) 22%,transparent); content:''; }.tracking-timeline li>span { z-index:1; display:grid; width:28px; height:28px; place-items:center; border-radius:50%; color:var(--menu-accent-foreground); background:var(--menu-accent); box-shadow:0 0 0 4px color-mix(in srgb,var(--menu-accent) 13%,transparent); }.tracking-timeline strong { font-size:13px; }.tracking-timeline time { flex:0 0 auto; color:var(--menu-muted); font-size:11px; font-weight:700; }.tracking-timeline p { margin:3px 0 0; color:var(--menu-muted); font-size:12px; line-height:1.4; }
.tracking-map-shell { overflow:hidden; border:1px solid rgba(43,37,32,.1); border-radius:16px; background:#f4f1eb; }.tracking-map { height:230px; }.tracking-map-shell p { display:flex; align-items:center; gap:5px; margin:0; padding:9px 11px; color:var(--menu-muted); font-size:11px; }.tracking-map-wait { display:flex; align-items:center; gap:9px; margin:0; padding:18px; border:1px dashed rgba(43,37,32,.18); border-radius:16px; color:var(--menu-muted); font-size:12px; }
.tracking-item { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:start; gap:10px; padding:10px; border-radius:12px; background:rgba(120,113,108,.07); font-size:13px; }.tracking-item>span { display:grid; min-width:25px; height:25px; place-items:center; border-radius:7px; color:var(--menu-accent-foreground); background:var(--menu-accent); font-size:11px; font-weight:800; }.tracking-item p { margin:2px 0 0; color:var(--menu-muted); font-size:11px; }.tracking-total { display:flex; justify-content:space-between; gap:12px; margin-top:12px; padding:13px 2px 0; border-top:1px solid rgba(43,37,32,.12); font-size:12px; }
.tracking-order {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.tracking-order:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(5, 150, 105, 0.12), 0 0 0 1px rgba(5, 150, 105, 0.18);
}
.tracking-order:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--menu-accent) 45%, transparent);
  outline-offset: 3px;
}
.tracking-order:active {
  transform: scale(0.995);
}

.tap-button {
  transition-property: transform, background-color, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.tap-button:active:not(:disabled) {
  transform: scale(0.96);
}
.price {
  font-variant-numeric: tabular-nums;
}
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

@media (max-width: 639px) {
  .hero-actions { display: none; }
  .menu-hero .relative { min-height: 84px; padding-top: 18px; padding-bottom: 18px; }
  .menu-hero .mb-2 { margin-bottom: 4px; }
  .menu-hero .mt-3 { margin-top: 7px; }
  .menu-title { font-size: 1.5rem; line-height: 1.1; }
  .menu-toolbar > div { padding-top: 8px; padding-bottom: 8px; }
  .menu-toolbar .relative { width: 100%; }
  .menu-toolbar input { height: 38px; font-size: 0.875rem; }
  .category-chip { min-height: 34px; padding: 0 12px; font-size: 0.75rem; }
  .menu-section { margin-top: -10px; }
  .menu-heading { font-size: 1.15rem; }
  .logo-shell {
    width: 58px;
    height: 58px;
    border-radius: 17px;
  }
  .product-card {
    min-height: 126px;
    border-radius: 16px;
  }
  .product-image-wrap,
  .product-placeholder {
    width: 100px;
    min-height: 126px;
    flex-basis: 100px;
  }
  .product-card .p-4 { padding: 11px; }
  .product-card h3 { font-size: 0.9rem; }
  .product-card .add-button { width: 34px; height: 34px; border-radius: 10px; }
  .product-card .add-button svg { width: 17px; height: 17px; }
}
</style>
