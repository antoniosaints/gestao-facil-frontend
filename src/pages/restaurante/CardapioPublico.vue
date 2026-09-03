<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type CSSProperties } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMediaQuery } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Banknote, Bike, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Clipboard, Clock3, CreditCard, Flame, Gift, History, LoaderCircle, LocateFixed, LucideBadgePlus, MapPin, Minus, Moon, Navigation, PackageCheck, Plus, QrCode, Search, ShoppingBag, ShoppingCart, Store, Sun, Timer, Trash2, Truck, UserRound, UtensilsCrossed, WalletCards, X } from 'lucide-vue-next'
import { RestauranteRepository, type RestauranteCheckoutPreview, type RestauranteClienteConta, type RestauranteClienteEndereco, type RestaurantePublicOrderTracking } from '@/repositories/restaurante-repository'
import { useStorefrontLightTheme } from '@/composables/useStorefrontLightTheme'
import { useConfirm } from '@/composables/useConfirm'
import ConfirmModal from '@/components/hooks/ConfirmModal.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import { getThemePalette, hexToHslValue, normalizeThemeCustomization } from '@/utils/themeCustomization'
import { cepMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { calculateMenuItemUnitPrice, hasSameMenuSelections, updateMenuGroupSelection } from './publicMenuCart'
import { isActiveRestaurantOrder, parseTrackingTokens, prependTrackingToken, restaurantOrderStatusBadgeClass, restaurantOrderStatusLabel } from './publicMenuHistory'
import { menuCategoryItems, uniquePublicMenuItems } from './publicMenuDisplay'
import { restaurantMapIcons } from './restaurantMapIcons'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
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
const itemAddedOpen = ref(false)
const suggestionsOpen = ref(false)
const suggestionSource = ref<any>(null)
const suggestionAddedItemId = ref<number | null>(null)
const cardapio = ref<any>(null)
const menuDarkMode = ref(false)
const currentYear = new Date().getFullYear()
type CartLine = {
  id: string
  item: any
  quantidade: number
  selecaoIds: number[]
}
const cartLines = ref<CartLine[]>([])
const quote = ref<RestauranteCheckoutPreview | null>(null)
const selectedFidelityProgramIds = ref<number[]>([])
const orderResult = ref<any>(null)
const historyOpen = ref(false)
const trackingDetailsOpen = ref(false)
const cancelandoPedido = ref(false)
const promotionCarouselIndex = ref(0)
const menuToolbarSentinel = ref<HTMLElement | null>(null)
const menuToolbarElement = ref<HTMLElement | null>(null)
const menuToolbarFixed = ref(false)
const menuToolbarHeight = ref(0)
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
const pagamento = ref<'NA_ENTREGA' | 'PIX'>('NA_ENTREGA')
const pagamentoNaEntrega = ref<'DINHEIRO' | 'CREDITO' | 'DEBITO'>('DINHEIRO')
const precisaTroco = ref(false)
const trocoPara = ref('')
const obtendoLocalizacao = ref(false)
const pixCopied = ref(false)
const paymentClock = ref(Date.now())
let previewTimer: ReturnType<typeof setTimeout> | null = null
let previewSequence = 0
let trackingSocket: Socket | null = null
let publicMenuSocket: Socket | null = null
let trackingMap: L.Map | null = null
let trackingMapLayers: L.LayerGroup | null = null
let promotionCarouselTimer: ReturnType<typeof setInterval> | null = null
let menuToolbarResizeObserver: ResizeObserver | null = null
let paymentClockTimer: ReturnType<typeof setInterval> | null = null
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
  return item.nomePublico || item.Produto?.nome || 'Item do cardápio'
}

function itemDescription(item: any) {
  return item.descricao || 'Feito com cuidado e ingredientes selecionados.'
}

function itemImage(item: any) {
  return resolveFileUrl(item.imagem || item.Produto?.imagem)
}

function clearCart() {
  cartLines.value = []
  invalidateCart()
}

function categoryInfo(item: any) {
  const category = item.Categoria || item.Produto?.ProdutoBase?.Categoria
  return category ? { key: String(category.id), name: category.nome } : { key: 'destaques', name: 'Destaques' }
}

const categoryGroups = computed(() => {
  const groups = new Map<string, { key: string; name: string; items: any[] }>()
  for (const item of publicMenuItems.value) {
    const category = categoryInfo(item)
    if (!groups.has(category.key)) groups.set(category.key, { ...category, items: [] })
    groups.get(category.key)!.items.push(item)
  }
  return [...groups.values()]
})
const publicMenuItems = computed(() => uniquePublicMenuItems(cardapio.value?.itens || []))
const mostOrderedItems = computed(() => publicMenuItems.value.filter((item: any) => item.maisPedido))
const showingHighlights = computed(() => activeCategory.value === 'todos' && !searchTerm.value.trim())
const suggestedItems = computed(() => {
  const categoryId = suggestionSource.value?.categoriaSugestaoId
  if (!categoryId) return []
  return publicMenuItems.value.filter((item: any) =>
    item.id !== suggestionSource.value?.id && Number(categoryInfo(item).key) === Number(categoryId),
  )
})

const fidelities = computed(() => cardapio.value?.restaurante?.fidelidades || [])
function fidelityEligibleLabels(program: any) {
  const labels: string[] = []
  const categoryNames = new Map<number, string>((program.categorias || []).map((category: any) => [category.id, category.nome]))

  for (const item of publicMenuItems.value) {
    if (program.catalogoItemIds.includes(item.id)) labels.push(`Produto: ${itemName(item)}`)
    const category = categoryInfo(item)
    if (Number(category.key) && program.categoriaIds.includes(Number(category.key))) categoryNames.set(Number(category.key), category.name)
  }

  labels.push(...program.categoriaIds.map((id: number) => `Categoria: ${categoryNames.get(id) || 'Categoria selecionada'}`))
  return labels.length ? [...new Set(labels)] : ['Qualquer item do cardápio']
}
function fidelityProgress(program: any) {
  const meta = Math.max(Number(program?.pedidosMeta || 1), 1)
  const progress = program?.progresso
  const remainder = Number(progress?.itensElegiveis || 0) % meta
  const rewardAvailable = Number(progress?.recompensasDisponiveis || 0) > 0
  const current = rewardAvailable && remainder === 0 ? meta : remainder
  return { meta, current, percentage: (current / meta) * 100, rewardAvailable }
}
const checkoutFidelities = computed(() => quote.value?.fidelidades || fidelities.value)
const availableCheckoutRewards = computed(() => checkoutFidelities.value.filter((program: any) => fidelityProgress(program).rewardAvailable))
function rewardItem(program: any) {
  return publicMenuItems.value.find((item: any) => item.id === program.premio?.catalogoItemId) || null
}
function rewardIsInCart(program: any) {
  return cartLines.value.some((line) => line.item.id === program.premio?.catalogoItemId)
}
function rewardIsSelected(program: any) {
  return selectedFidelityProgramIds.value.includes(program.id)
}
function toggleReward(program: any) {
  if (!rewardIsInCart(program)) return
  selectedFidelityProgramIds.value = rewardIsSelected(program)
    ? selectedFidelityProgramIds.value.filter((id) => id !== program.id)
    : [...new Set([...selectedFidelityProgramIds.value, program.id])]
  scheduleCheckoutPreview()
}
function addRewardToCart(program: any) {
  const item = rewardItem(program)
  if (!item) return toast.info('O item desta recompensa não está disponível no cardápio agora.')
  if (item.grupos?.length) {
    checkoutOpen.value = false
    nextTick(() => openItem(item))
    return toast.info('Escolha as opções do item premiado para usar sua recompensa.')
  }
  const existing = findMatchingCartLine(item, [])
  if (existing) change(existing.id, 1)
  else cartLines.value.push({ id: `${item.id}-${Date.now()}-${Math.random()}`, item, quantidade: 1, selecaoIds: [] })
  if (!rewardIsSelected(program)) selectedFidelityProgramIds.value = [...new Set([...selectedFidelityProgramIds.value, program.id])]
  invalidateCart()
  scheduleCheckoutPreview()
  toast.success(`${itemName(item)} adicionado com a recompensa selecionada.`)
}
const selectedRewardDiscount = computed(() => {
  const rewardedItemIds = new Set<number>()
  return selectedFidelityProgramIds.value.reduce((total, programId) => {
    const program = checkoutFidelities.value.find((entry: any) => entry.id === programId)
    if (!program?.premio?.catalogoItemId || rewardedItemIds.has(program.premio.catalogoItemId)) return total
    const line = cartLines.value.find((entry) => entry.item.id === program.premio.catalogoItemId && entry.quantidade > 0)
    if (!line) return total
    rewardedItemIds.add(program.premio.catalogoItemId)
    return total + ((lineTotal(line) / line.quantidade) * Number(program.descontoPercentual || 0) / 100)
  }, 0)
})
const displayedRewardDiscount = computed(() => Math.max(Number(quote.value?.desconto || 0), selectedRewardDiscount.value))
const displayedQuoteTotal = computed(() => {
  if (!quote.value) return null
  return Number(quote.value.total) - Math.max(0, selectedRewardDiscount.value - Number(quote.value.desconto || 0))
})
const freeShippingThreshold = computed(() => {
  const value = Number(cardapio.value?.restaurante?.freteGratisAcima)
  return cardapio.value?.restaurante?.deliveryAtivo && Number.isFinite(value) && value > 0 ? value : null
})
const minimumOrder = computed(() => {
  const value = Number(cardapio.value?.restaurante?.pedidoMinimo)
  return Number.isFinite(value) && value > 0 ? value : null
})
const promotionCards = computed(() => {
  const cards: Array<{ key: string; type: 'pedido-minimo' | 'fidelidade' | 'frete'; title: string; description: string }> = []
  if (minimumOrder.value !== null) {
    cards.push({
      key: 'pedido-minimo',
      type: 'pedido-minimo',
      title: `Pedido mínimo de ${formatCurrencyBR(minimumOrder.value)}`,
      description: 'Valor mínimo para finalizar o pedido online.',
    })
  }
  for (const fidelity of fidelities.value) {
    const progress = fidelityProgress(fidelity)
    cards.push({
      key: `fidelidade-${fidelity.premio?.catalogoItemId || fidelity.pedidosMeta}`,
      type: 'fidelidade',
      title: progress.rewardAvailable ? 'Recompensa liberada' : `${fidelity.descontoPercentual}% de desconto para você`,
      description: progress.rewardAvailable ? 'Veja como usar sua recompensa.' : `Ganhe desconto em ${fidelity.premio?.nome || 'um produto'}.`,
    })
  }
  if (freeShippingThreshold.value !== null) {
    cards.push({
      key: 'frete',
      type: 'frete',
      title: `Frete grátis acima de ${formatCurrencyBR(freeShippingThreshold.value)}`,
      description: 'Válido para pedidos por delivery.',
    })
  }
  return cards
})
const promotionDetailCards = computed(() => promotionCards.value.filter((card) => card.type !== 'pedido-minimo'))
const isPromotionsPage = computed(() => route.name === 'restaurante-promocoes-publica')

const aceitaPedidos = computed(() => cardapio.value?.restaurante.atendimento?.aberto !== false)
const mensagemAtendimento = computed(() => cardapio.value?.restaurante.atendimento?.mensagem || 'Recebendo pedidos')
const tracking = computed(() => orderHistory.value.find((order) => isActiveRestaurantOrder(order.status)) || null)
const trackingStatusLabel = computed(() => (tracking.value ? restaurantOrderStatusLabel(tracking.value.status) : ''))
const trackingBadgeClass = computed(() => tracking.value ? restaurantOrderStatusBadgeClass(tracking.value.status) : '')
const trackingDetails = computed(() => orderHistory.value.find((order) => order.trackingToken === selectedTrackingToken.value) || null)
const checkoutOrderTracking = computed(() => orderHistory.value.find((order) => order.trackingToken === orderResult.value?.trackingToken) || null)
const checkoutPaymentAction = computed(() => checkoutOrderTracking.value?.paymentAction || orderResult.value?.paymentAction || null)
const checkoutPaymentCompleted = computed(() => checkoutOrderTracking.value?.pagamentoStatus === 'PAGO')
const checkoutPaymentCancelled = computed(() => ['FALHOU', 'ESTORNADO'].includes(String(checkoutOrderTracking.value?.pagamentoStatus || '')))
const pixTimeRemaining = computed(() => {
  const expiresAt = checkoutPaymentAction.value?.expiresAt
  if (!expiresAt) return null
  return Math.max(0, new Date(expiresAt).getTime() - paymentClock.value)
})
const pixExpired = computed(() => pixTimeRemaining.value === 0)

const categories = computed(() => [{ key: 'todos', name: 'Todos' }, ...categoryGroups.value.map(({ key, name }) => ({ key, name }))])

const visibleGroups = computed(() => {
  const term = normalize(searchTerm.value.trim())
  return categoryGroups.value
    .filter((group) => activeCategory.value === 'todos' || group.key === activeCategory.value)
    .map((group) => ({
      ...group,
      items: menuCategoryItems(
        group.items.filter((item) => !term || normalize(`${itemName(item)} ${itemDescription(item)} ${group.name}`).includes(term)),
        showingHighlights.value,
      ),
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
  const palette = getThemePalette(theme, menuDarkMode.value ? 'dark' : 'light')
  return {
    '--background': hexToHslValue(palette.background),
    '--foreground': hexToHslValue(palette.foreground),
    '--card': hexToHslValue(palette.card),
    '--card-foreground': hexToHslValue(palette.foreground),
    '--popover': hexToHslValue(palette.popover),
    '--popover-foreground': hexToHslValue(palette.foreground),
    '--secondary': hexToHslValue(palette.secondary),
    '--secondary-foreground': hexToHslValue(palette.foreground),
    '--muted': hexToHslValue(palette.muted),
    '--muted-foreground': hexToHslValue(palette.mutedForeground),
    '--accent': hexToHslValue(palette.accent),
    '--accent-foreground': hexToHslValue(palette.foreground),
    '--border': hexToHslValue(palette.border),
    '--input': hexToHslValue(palette.input),
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
  const palette = getThemePalette(cardapio.value?.restaurante.temaPersonalizado, menuDarkMode.value ? 'dark' : 'light')
  return {
    backgroundColor: palette.primary,
    color: palette.primaryForeground,
  }
})
const addressComplete = computed(() => origem.value === 'RETIRADA' || [form.cep.replace(/\D/g, ''), form.cidade, form.bairro, form.logradouro, form.numero].every((value) => value.trim().length > 0))
const trocoValido = computed(() => {
  if (pagamento.value !== 'NA_ENTREGA' || pagamentoNaEntrega.value !== 'DINHEIRO' || !precisaTroco.value) return true
  const valor = Number(trocoPara.value.replace(',', '.'))
  return Number.isFinite(valor) && valor > 0 && (!quote.value || valor >= Number(quote.value.total))
})
const checkoutValid = computed(() => form.nome.trim().length >= 2 && form.telefone.replace(/\D/g, '').length >= 8 && addressComplete.value && selecionados.value.length > 0 && trocoValido.value)
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

type GuestCheckoutData = Pick<
  typeof form,
  'nome' | 'telefone' | 'email' | 'cep' | 'cidade' | 'bairro' | 'logradouro' | 'numero' | 'complemento' | 'referencia'
>

function guestCheckoutStorageKey() {
  return `restaurante:cliente:${String(route.params.slug)}:dados-checkout`
}

function saveGuestCheckoutData() {
  if (customerAccount.value) return

  const data: GuestCheckoutData = {
    nome: form.nome,
    telefone: form.telefone,
    email: form.email,
    cep: form.cep,
    cidade: form.cidade,
    bairro: form.bairro,
    logradouro: form.logradouro,
    numero: form.numero,
    complemento: form.complemento,
    referencia: form.referencia,
  }

  try {
    if (Object.values(data).every((value) => !value.trim())) {
      localStorage.removeItem(guestCheckoutStorageKey())
      return
    }
    localStorage.setItem(guestCheckoutStorageKey(), JSON.stringify(data))
  } catch {
    // O cardápio continua funcionando mesmo em navegadores com armazenamento indisponível.
  }
}

function restoreGuestCheckoutData() {
  if (customerAccount.value) return

  try {
    const rawData = localStorage.getItem(guestCheckoutStorageKey())
    if (!rawData) return
    const storedData = JSON.parse(rawData) as Partial<GuestCheckoutData>
    const fields = Object.keys(storedData) as Array<keyof GuestCheckoutData>
    const validData = Object.fromEntries(
      fields
        .filter((field) => field in form && typeof storedData[field] === 'string')
        .map((field) => [field, storedData[field]!.trim()]),
    )
    Object.assign(form, validData)
  } catch {
    localStorage.removeItem(guestCheckoutStorageKey())
  }
}

function menuThemeStorageKey() {
  return `restaurante:tema:${String(route.params.slug)}`
}

function toggleMenuTheme() {
  menuDarkMode.value = !menuDarkMode.value
  localStorage.setItem(menuThemeStorageKey(), menuDarkMode.value ? 'dark' : 'light')
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

function selectAccountAddress(value: string) {
  if (value === 'MANUAL') {
    selectedAccountAddressId.value = null
    return
  }
  const address = customerAccount.value?.enderecos.find((item) => item.id === Number(value))
  if (address) applyAccountAddress(address)
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
    restoreGuestCheckoutData()
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
    restoreGuestCheckoutData()
    if (!silent) toast.info('Entre novamente para acessar sua conta.')
  } finally {
    accountLoading.value = false
  }
}

async function openCustomerAccount() {
  releaseTriggerFocus()
  accountOpen.value = true
  await loadCustomerAccount()
}

function releaseTriggerFocus() {
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement) activeElement.blur()
}

function openOrderHistory() {
  releaseTriggerFocus()
  historyOpen.value = true
}

function openPromotions() {
  void router.push({ name: 'restaurante-promocoes-publica', params: { slug: String(route.params.slug) } })
}

function backToMenu() {
  void router.push({ name: 'restaurante-cardapio-publico', params: { slug: String(route.params.slug) } })
}

function stopPromotionCarousel() {
  if (!promotionCarouselTimer) return
  clearInterval(promotionCarouselTimer)
  promotionCarouselTimer = null
}

function startPromotionCarousel() {
  stopPromotionCarousel()
  if (promotionCards.value.length <= 1) return
  promotionCarouselTimer = setInterval(() => {
    promotionCarouselIndex.value = (promotionCarouselIndex.value + 1) % promotionCards.value.length
  }, 5000)
}

function openCartDrawer() {
  releaseTriggerFocus()
  cartDrawerOpen.value = true
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
    .filter((order) => order.cardapioSlug === String(route.params.slug))
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
  localStorage.setItem(trackingStorageKey(), JSON.stringify(orderHistory.value.map((order) => order.trackingToken)))
  historyLoading.value = false
}

function openTrackingDetails(order: RestaurantePublicOrderTracking & { trackingToken: string }) {
  releaseTriggerFocus()
  selectedTrackingToken.value = order.trackingToken
  historyOpen.value = false
  trackingDetailsOpen.value = true
}

async function cancelarPedidoPublico() {
  const order = trackingDetails.value
  if (!order?.podeCancelar) return
  const confirmed = await confirm.confirm({
    title: 'Cancelar pedido',
    message: `Deseja cancelar o pedido ${order.codigo}? Esta ação não pode ser desfeita.`,
    confirmText: 'Cancelar pedido',
  })
  if (!confirmed) return
  try {
    cancelandoPedido.value = true
    const updated = await RestauranteRepository.cancelarPedidoPublico(order.trackingToken)
    orderHistory.value = orderHistory.value.map((item) => item.trackingToken === order.trackingToken ? { ...updated, trackingToken: order.trackingToken } : item)
    toast.success('Pedido cancelado.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível cancelar o pedido.')
    await loadOrderHistory()
  } finally {
    cancelandoPedido.value = false
  }
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
  L.marker(originPoint, { icon: restaurantMapIcons.restaurante })
    .bindTooltip('Restaurante', { direction: 'top' })
    .addTo(trackingMapLayers)
  L.marker(driverPoint, { icon: restaurantMapIcons.entregador })
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
    auth: { restaurantTrackingTokens: tokens, restaurantPublicSlug: String(route.params.slug) },
  })
  trackingSocket.on('restaurante:pedido-publico', () => {
    void loadOrderHistory(tokens)
  })
  trackingSocket.on('restaurante:entrega-localizacao', (payload: { pedidoId?: number; latitude?: number; longitude?: number; updatedAt?: string }) => {
    if (!Number.isInteger(payload?.pedidoId) || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return
    orderHistory.value = orderHistory.value.map((order) => order.id !== payload.pedidoId
      ? order
      : {
          ...order,
          acompanhamentoEntrega: order.acompanhamentoEntrega
            ? { ...order.acompanhamentoEntrega, entregador: { latitude: Number(payload.latitude), longitude: Number(payload.longitude), updatedAt: payload.updatedAt || new Date().toISOString() } }
            : order.acompanhamentoEntrega,
        })
    void loadOrderHistory(orderHistory.value.map((order) => order.trackingToken))
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
  releaseTriggerFocus()
  activeItem.value = item
  activeCartLineId.value = null
  draftQuantity.value = 1
  draftSelections.value = []
  itemDialogOpen.value = true
}

function editCartLine(line: CartLine) {
  releaseTriggerFocus()
  cartDrawerOpen.value = false
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
  showPostAddFlow(item)
}

function showPostAddFlow(item: any) {
  suggestionSource.value = item
  suggestionAddedItemId.value = null
  if (suggestedItems.value.length) {
    suggestionsOpen.value = true
    return
  }
  itemAddedOpen.value = true
}

function addSuggestedItem(item: any) {
  if (item.grupos.length) {
    closeSuggestions()
    openItem(item)
    return
  }
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
  suggestionAddedItemId.value = item.id
  toast.success(`${itemName(item)} adicionado ao carrinho.`)
}

function closeSuggestions() {
  suggestionsOpen.value = false
  suggestionSource.value = null
  suggestionAddedItemId.value = null
}

function onSuggestionsOpenChange(open: boolean) {
  if (!open) return closeSuggestions()
  suggestionsOpen.value = true
}

function continueShoppingAfterSuggestions() {
  closeSuggestions()
}

function goToCartAfterSuggestions() {
  closeSuggestions()
  nextTick(openCartDrawer)
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
  if (!editing) nextTick(() => { showPostAddFlow(activeItem.value) })
}

function continueShoppingAfterAdd() {
  itemAddedOpen.value = false
}

function goToCartAfterAdd() {
  itemAddedOpen.value = false
  nextTick(openCartDrawer)
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
    ...(form.telefone.replace(/\D/g, '').length >= 8 ? { clienteTelefone: form.telefone } : {}),
    fidelidadeProgramaIds: selectedFidelityProgramIds.value,
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

function checkoutPaymentPayload() {
  const isCashWithChange = pagamento.value === 'NA_ENTREGA' && pagamentoNaEntrega.value === 'DINHEIRO' && precisaTroco.value
  return {
    pagamento: pagamento.value === 'NA_ENTREGA' ? pagamentoNaEntrega.value : pagamento.value,
    ...(isCashWithChange ? { trocoPara: Number(trocoPara.value.replace(',', '.')) } : {}),
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
    sincronizarAcompanhamentoEmTempoReal(orderHistory.value.map((order) => order.trackingToken))
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
  releaseTriggerFocus()
  cartDrawerOpen.value = false
  checkoutOpen.value = true
  if (addressComplete.value && !quote.value) await previewCheckout(false)
}

async function pedir() {
  if (!aceitaPedidos.value) return toast.info(mensagemAtendimento.value)
  if (!checkoutValid.value) return toast.info('Preencha os dados necessários para finalizar.')
  // Recalcula no momento da confirmação para nunca enviar um orçamento anterior
  // à aplicação ou remoção de uma recompensa.
  const currentQuote = await previewCheckout()
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
        ...checkoutPaymentPayload(),
        fidelidadeProgramaIds: selectedFidelityProgramIds.value,
      },
      crypto.randomUUID(),
      customerToken(),
    )
    orderResult.value = result
    const tokens = saveTrackingToken(result.trackingToken)
    await loadOrderHistory(tokens)
    sincronizarAcompanhamentoEmTempoReal(orderHistory.value.map((order) => order.trackingToken))
    cartLines.value = []
    selectedFidelityProgramIds.value = []
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

async function copyPix(action = orderResult.value?.paymentAction) {
  const code = action?.pixCopiaCola
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    pixCopied.value = true
    toast.success('Pix copiado')
    window.setTimeout(() => { pixCopied.value = false }, 2200)
  } catch {
    toast.error('Não foi possível copiar o Pix. Tente novamente.')
  }
}

function truncatePixCode(code?: string | null) {
  if (!code) return ''
  return code.length <= 32 ? code : `${code.slice(0, 28)}...`
}

function formatPixTimeRemaining(milliseconds: number | null) {
  if (milliseconds === null) return ''
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function humanize(value: string) {
  return value.split('_').join(' ').toLocaleLowerCase('pt-BR')
}

watch(pagamentoNaEntrega, (method) => {
  if (method !== 'DINHEIRO') {
    precisaTroco.value = false
    trocoPara.value = ''
  }
})

watch(precisaTroco, (needed) => {
  if (!needed) trocoPara.value = ''
})

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

function updateMenuToolbarPosition() {
  const sentinel = menuToolbarSentinel.value
  const toolbar = menuToolbarElement.value
  if (!sentinel || !toolbar) return
  menuToolbarHeight.value = toolbar.offsetHeight
  menuToolbarFixed.value = sentinel.getBoundingClientRect().top < 0
}

function setupMenuToolbar() {
  menuToolbarResizeObserver?.disconnect()
  menuToolbarResizeObserver = null
  menuToolbarFixed.value = false

  const toolbar = menuToolbarElement.value
  if (!toolbar) return

  menuToolbarResizeObserver = new ResizeObserver(updateMenuToolbarPosition)
  menuToolbarResizeObserver.observe(toolbar)
  window.addEventListener('scroll', updateMenuToolbarPosition, { passive: true })
  window.addEventListener('resize', updateMenuToolbarPosition)
  updateMenuToolbarPosition()
}

function teardownMenuToolbar() {
  menuToolbarResizeObserver?.disconnect()
  menuToolbarResizeObserver = null
  window.removeEventListener('scroll', updateMenuToolbarPosition)
  window.removeEventListener('resize', updateMenuToolbarPosition)
  menuToolbarFixed.value = false
}

watch(searchTerm, () => {
  activeCategory.value = 'todos'
})
watch(promotionCards, () => {
  promotionCarouselIndex.value = 0
  startPromotionCarousel()
})
watch(isPromotionsPage, async () => {
  teardownMenuToolbar()
  await nextTick()
  setupMenuToolbar()
})
watch(() => [origem.value, form.telefone, form.cep, form.cidade, form.bairro, form.logradouro, form.numero, form.complemento, form.referencia, JSON.stringify(payloadItems.value), JSON.stringify(selectedFidelityProgramIds.value)], scheduleCheckoutPreview)
watch(
  () => [form.nome, form.telefone, form.email, form.cep, form.cidade, form.bairro, form.logradouro, form.numero, form.complemento, form.referencia],
  saveGuestCheckoutData,
)
watch(useAccountData, (enabled) => { if (enabled && customerAccount.value) applyCustomerAccount(customerAccount.value) })
watch([trackingDetailsOpen, trackingDetails], async ([open, order]) => {
  if (!open || !order?.acompanhamentoEntrega) return clearTrackingMap()
  await nextTick()
  renderTrackingMap()
})

onMounted(async () => {
  menuDarkMode.value = localStorage.getItem(menuThemeStorageKey()) === 'dark'
  paymentClockTimer = setInterval(() => { paymentClock.value = Date.now() }, 1000)
  await carregar()
  if (customerToken()) await loadCustomerAccount(true)
  if (!customerAccount.value) restoreGuestCheckoutData()
  if (route.name === 'restaurante-conta-publica') await openCustomerAccount()
  await nextTick()
  setupMenuToolbar()
})
onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer)
  if (paymentClockTimer) clearInterval(paymentClockTimer)
  trackingSocket?.disconnect()
  publicMenuSocket?.disconnect()
  stopPromotionCarousel()
  teardownMenuToolbar()
  clearTrackingMap()
})
</script>

<template>
  <main class="restaurant-menu min-h-screen" :class="{ dark: menuDarkMode }" :style="menuThemeStyle">
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
      <div ref="menuToolbarSentinel" class="h-px" aria-hidden="true" />
      <div class="menu-toolbar-anchor" :style="menuToolbarFixed ? { height: `${menuToolbarHeight}px` } : undefined">
        <div ref="menuToolbarElement" class="menu-public-header" :class="{ 'menu-toolbar--fixed': menuToolbarFixed }">
      <section class="menu-hero">
        <div class="menu-hero-pattern" />
        <div class="relative mx-auto flex min-h-[100px] max-w-7xl items-end px-4 pb-7 pt-10 sm:px-6 sm:pb-9">
          <div class="flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div class="flex min-w-0 items-center gap-4 sm:gap-5">
              <div class="logo-shell shrink-0">
                <img :src="logo" :alt="`Logo de ${cardapio.restaurante.nome}`" class="h-full w-full rounded-[18px] object-contain" />
              </div>
              <div class="min-w-0 text-white">
                <div class="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80"><span>Cardápio online</span><span class="h-1 w-1 rounded-full bg-white/70" /><span>Pedido seguro</span></div>
                <h1 class="menu-title truncate text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  {{ cardapio.restaurante.nome }}
                </h1>
                <div class="no-scrollbar mt-1 flex flex-nowrap items-center gap-x-4 overflow-x-auto text-[11px] text-stone-200 sm:flex-wrap sm:overflow-visible">
                  <span v-if="cardapio.restaurante.deliveryAtivo" class="flex items-center gap-1.5"><Bike class="h-4 w-4 text-white/80" />Delivery</span>
                  <span v-if="cardapio.restaurante.retiradaAtiva" class="flex items-center gap-1.5"><Store class="h-4 w-4 text-white/80" />Retirada</span>
                  <span class="flex items-center gap-1.5 sm:hidden" :class="aceitaPedidos ? 'text-emerald-100' : 'text-amber-100'">
                    <span class="relative flex h-2.5 w-2.5"><span v-if="aceitaPedidos" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" /><span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="aceitaPedidos ? 'bg-emerald-400' : 'bg-amber-300'" /></span>
                    {{ aceitaPedidos ? 'Aberto' : 'Fechado' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="hero-actions flex shrink-0 flex-wrap items-center gap-2">
              <button type="button" class="hero-action hero-theme-toggle" :aria-label="menuDarkMode ? 'Ativar tema claro' : 'Ativar tema escuro'" :title="menuDarkMode ? 'Tema claro' : 'Tema escuro'" @click="toggleMenuTheme">
                <Sun v-if="menuDarkMode" class="h-4 w-4" />
                <Moon v-else class="h-4 w-4" />
                <span>{{ menuDarkMode ? 'Claro' : 'Escuro' }}</span>
              </button>
              <button type="button" class="hero-action" @click="openOrderHistory">
                <History class="h-4 w-4" />
                <span>Meus pedidos</span>
                <span v-if="orderHistory.length" class="hero-action-count">{{ orderHistory.length }}</span>
              </button>
              <div class="hero-action cursor-default" :class="!aceitaPedidos && 'bg-amber-500/20 text-amber-50'">
                <span class="relative flex h-2.5 w-2.5">
                  <span v-if="aceitaPedidos" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                  <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="aceitaPedidos ? 'bg-emerald-400' : 'bg-amber-300'" />
                </span>
                <span>{{ aceitaPedidos ? 'Aberto' : 'Fechado' }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="menu-theme-mobile" :aria-label="menuDarkMode ? 'Ativar tema claro' : 'Ativar tema escuro'" @click="toggleMenuTheme">
            <Sun v-if="menuDarkMode" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
        </div>
      </section>
          <div v-if="!isPromotionsPage" class="menu-toolbar">
            <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div class="relative lg:w-80">
                  <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input v-model="searchTerm" class="h-11 rounded-xl border bg-stone-100 dark:bg-gray-900 pl-10 shadow-none focus-visible:ring-primary/30" placeholder="Buscar no cardápio" />
                </div>
                <div class="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                  <button v-for="category in categories" :key="category.key" type="button" class="category-chip" :class="{ active: activeCategory === category.key }" @click="activeCategory = category.key">
                    {{ category.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template v-if="isPromotionsPage">
        <section class="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10" aria-labelledby="promotions-title">
          <button type="button" class="promotion-back" @click="backToMenu"><ChevronLeft class="h-4 w-4" />Voltar ao cardápio</button>
          <div class="mt-6">
            <p class="loyalty-eyebrow">VANTAGENS DO RESTAURANTE</p>
            <h2 id="promotions-title" class="menu-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Promoções</h2>
            <p class="mt-2 text-sm text-stone-500">Aproveite as condições disponíveis antes de finalizar seu pedido.</p>
          </div>

          <div v-if="promotionDetailCards.length" class="mt-7 space-y-5">
            <section v-if="freeShippingThreshold !== null" class="promotion-detail-card promotion-detail-card--shipping" aria-label="Promoção de frete grátis">
              <span class="promotion-detail-icon"><Truck class="h-6 w-6" /></span>
              <div>
                <p class="loyalty-eyebrow">PARA DELIVERY</p>
                <h3>Frete grátis acima de {{ formatCurrencyBR(freeShippingThreshold) }}</h3>
                <p>Ao atingir esse valor em produtos, a taxa de entrega fica por conta da casa.</p>
              </div>
            </section>

            <section v-for="fidelity in fidelities" :key="`fidelidade-${fidelity.premio?.catalogoItemId || fidelity.pedidosMeta}`" class="loyalty-banner" aria-label="Como funciona a fidelidade">
              <div class="loyalty-banner-heading">
                <span class="loyalty-banner-icon"><Gift class="h-5 w-5" /></span>
                <div>
                  <p class="loyalty-eyebrow">PROGRAMA DE FIDELIDADE</p>
                  <h3>{{ fidelityProgress(fidelity).rewardAvailable ? 'Sua recompensa já está liberada!' : 'Compre, acumule e ganhe' }}</h3>
                </div>
              </div>

              <div class="loyalty-reward">
                <span>VOCÊ GANHA</span>
                <strong>{{ fidelity.descontoPercentual }}% de desconto</strong>
                <p>em <b>{{ fidelity.premio?.nome || 'um produto selecionado' }}</b></p>
              </div>

              <ol class="loyalty-steps">
                <li>
                  <span>1</span>
                  <div><b>Escolha um item participante</b><div class="loyalty-eligible-items"><em v-for="label in fidelityEligibleLabels(fidelity)" :key="label">{{ label }}</em></div></div>
                </li>
                <li>
                  <span>2</span>
                  <div><b>Acumule {{ fidelityProgress(fidelity).meta }} itens participantes</b><p>Cada unidade elegível de pedidos concluídos soma automaticamente na sua conta.</p></div>
                </li>
              </ol>

              <div class="loyalty-progress" :class="{ 'reward-available': fidelityProgress(fidelity).rewardAvailable }">
                <div class="loyalty-progress-heading"><span>Seu progresso</span><strong>{{ fidelityProgress(fidelity).current }} de {{ fidelityProgress(fidelity).meta }} itens</strong></div>
                <div class="loyalty-progress-track" role="progressbar" aria-label="Progresso da fidelidade" :aria-valuenow="fidelityProgress(fidelity).current" :aria-valuemin="0" :aria-valuemax="fidelityProgress(fidelity).meta"><span :style="{ width: `${fidelityProgress(fidelity).percentage}%` }"></span></div>
                <p v-if="fidelityProgress(fidelity).rewardAvailable">Recompensa disponível para usar no próximo pedido.</p>
                <p v-else-if="customerAccount">Faltam {{ fidelityProgress(fidelity).meta - fidelityProgress(fidelity).current }} item(ns) participante(s) para liberar seu desconto.</p>
                <button v-else type="button" class="loyalty-login" @click="openCustomerAccount"><UserRound class="h-4 w-4" />Entre na sua conta para acompanhar seus pedidos</button>
              </div>
            </section>
          </div>

          <div v-else class="mt-7 rounded-[22px] border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
            <Gift class="mx-auto h-8 w-8 text-stone-300" />
            <h3 class="mt-3 font-semibold">Nenhuma promoção disponível</h3>
            <p class="mt-1 text-sm text-stone-500">Volte em breve para conferir as novidades.</p>
          </div>
        </section>
      </template>

      <template v-else>
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div v-if="!aceitaPedidos" class="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-[0_0_0_1px_rgba(217,119,6,.08)]">
          <Clock3 class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p class="font-semibold">Restaurante fechado no momento</p>
            <p class="mt-1 text-sm text-amber-900/80">{{ mensagemAtendimento }} Você pode consultar o cardápio, mas novos pedidos estão indisponíveis.</p>
          </div>
        </div>
        <section v-if="promotionCards.length" class="promo-carousel mb-6" aria-label="Avisos e promoções disponíveis" @mouseenter="stopPromotionCarousel" @mouseleave="startPromotionCarousel">
          <div class="promo-carousel-viewport">
            <div class="promo-carousel-track" :style="{ transform: `translateX(-${promotionCarouselIndex * 100}%)` }">
              <component :is="card.type === 'pedido-minimo' ? 'div' : 'button'" v-for="card in promotionCards" :key="card.key" :type="card.type === 'pedido-minimo' ? undefined : 'button'" class="promo-summary-card" :class="`promo-summary-card--${card.type}`" @click="card.type !== 'pedido-minimo' && openPromotions()">
                <span class="promo-summary-icon"><CircleDollarSign v-if="card.type === 'pedido-minimo'" class="h-5 w-5" /><Gift v-else-if="card.type === 'fidelidade'" class="h-5 w-5" /><Truck v-else class="h-5 w-5" /></span>
                <span class="min-w-0 flex-1 text-left"><small>{{ card.type === 'pedido-minimo' ? 'PEDIDO ONLINE' : card.type === 'fidelidade' ? 'FIDELIDADE' : 'DELIVERY' }}</small><strong>{{ card.title }}</strong><em>{{ card.description }}</em></span>
                <ChevronRight v-if="card.type !== 'pedido-minimo'" class="h-5 w-5 shrink-0" />
              </component>
            </div>
          </div>
          <div v-if="promotionCards.length > 1" class="promo-carousel-dots" aria-label="Selecionar promoção">
            <button v-for="(card, index) in promotionCards" :key="card.key" type="button" :class="{ active: promotionCarouselIndex === index }" :aria-label="`Exibir ${card.title}`" @click="promotionCarouselIndex = index" />
          </div>
        </section>
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
            <section v-if="showingHighlights && mostOrderedItems.length" class="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4 shadow-[0_0_0_1px_rgba(217,119,6,.08)] dark:border-amber-900/50 dark:bg-amber-950/15 sm:p-5">
              <div class="mb-4 flex items-end justify-between gap-4">
                <div>
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"><Flame class="h-3.5 w-3.5" />Mais pedidos</span>
                  <h2 class="menu-heading mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">Favoritos de quem pede aqui</h2>
                </div>
                <span class="text-sm text-amber-800/70 dark:text-amber-200/70">{{ mostOrderedItems.length }} {{ mostOrderedItems.length === 1 ? 'opção' : 'opções' }}</span>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <article v-for="item in mostOrderedItems" :key="`mais-pedido-${item.id}`" class="product-card group border-amber-200 bg-white dark:border-amber-900/50 dark:bg-zinc-900" :class="{ 'product-card--closed': !aceitaPedidos }" :aria-disabled="!aceitaPedidos" @click="openItem(item)">
                  <div class="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <Badge class="mb-2 w-fit border-0 bg-amber-500 text-amber-950 hover:bg-amber-500"><Flame class="mr-1 h-3 w-3" />Mais pedidos</Badge>
                    <h3 class="text-balance text-base font-semibold leading-snug sm:text-lg">{{ itemName(item) }}</h3>
                    <p class="line-clamp-2 text-pretty text-xs leading-relaxed text-stone-500 dark:text-stone-400">{{ itemDescription(item) }}</p>
                    <div class="mt-auto flex items-end justify-between gap-3 pt-2">
                      <div><p v-if="item.grupos.length" class="text-[11px] font-medium uppercase tracking-wide text-stone-400">A partir de</p><p class="price text-base font-bold text-stone-950 dark:text-white">{{ formatCurrencyBR(Number(item.Produto?.preco ?? item.preco)) }}</p></div>
                      <button type="button" class="add-button" :aria-label="`Adicionar ${itemName(item)}`" :disabled="!aceitaPedidos" @click.stop="quickAdd(item)"><Plus class="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div v-if="itemImage(item)" class="product-image-wrap"><img :src="itemImage(item)" :alt="itemName(item)" class="product-image" /></div>
                  <div v-else class="product-placeholder"><UtensilsCrossed class="h-8 w-8" /><span>Feito na casa</span></div>
                </article>
              </div>
            </section>
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
                    <Badge v-if="item.maisPedido" class="mb-2 w-fit border-0 bg-amber-500 text-amber-950 hover:bg-amber-500"><Flame class="mr-1 h-3 w-3" />Mais pedidos</Badge>
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
                          {{ formatCurrencyBR(Number(item.Produto?.preco ?? item.preco)) }}
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
                    <button type="button" class="cart-line-thumb" :aria-label="`Editar ${itemName(line.item)}`" @click="editCartLine(line)">
                      <img v-if="itemImage(line.item)" :src="itemImage(line.item) || ''" :alt="itemName(line.item)" />
                      <UtensilsCrossed v-else class="h-5 w-5" />
                    </button>
                    <div class="cart-line-copy">
                      <button type="button" class="brand-hover block w-full truncate text-left text-sm font-semibold" @click="editCartLine(line)">
                        {{ itemName(line.item) }}
                      </button>
                      <p v-if="selectedOptionNames(line).length" class="mt-0.5 truncate text-xs text-stone-500">
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
        <button type="button" class="mobile-cart-bar" @click="openCartDrawer">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><ShoppingCart class="h-5 w-5" /></span>
          <span class="min-w-0 flex-1 text-left"
            ><span class="block text-xs opacity-80">{{ cartUnits }} {{ cartUnits === 1 ? 'item' : 'itens' }}</span
            ><strong class="price block truncate text-base">Ver carrinho · {{ formatCurrencyBR(estimatedSubtotal) }}</strong></span
          >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>
      <div class="mobile-bottom-bar lg:hidden">
        <button type="button" class="bottom-bar-action" @click="openOrderHistory"><History class="h-5 w-5" /><span>Pedidos</span><b v-if="orderHistory.length" class="bottom-bar-count">{{ orderHistory.length }}</b></button>
        <button type="button" class="bottom-bar-action bottom-bar-cart" :class="{ 'has-items': cartUnits }" @click="openCartDrawer"><span class="relative"><ShoppingCart class="h-5 w-5" /><b v-if="cartUnits" class="bottom-bar-count cart-count">{{ cartUnits }}</b></span><span>{{ cartUnits ? formatCurrencyBR(estimatedSubtotal) : 'Carrinho' }}</span></button>
        <button type="button" class="bottom-bar-action" @click="openCustomerAccount"><UserRound class="h-5 w-5" /><span>Conta</span></button>
      </div>
      </template>
    </template>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="itemDialogOpen">
      <component :is="menuModalContent" class="menu-overlay h-auto max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-auto lg:max-h-[92vh] lg:max-w-2xl lg:flex-col lg:rounded-[24px]" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
        <template v-if="activeItem">
          <div class="min-h-0 flex-1 overflow-y-auto relative overscroll-contain touch-pan-y">
            <div
              v-if="itemImage(activeItem)"
              class="h-64 overflow-hidden rounded-t-[24px] pt-4 md:pt-0 sm:h-80 lg:h-96"
            >
              <img
                :src="itemImage(activeItem)"
                :alt="itemName(activeItem)"
                class="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10"
              />
            </div>

            <div class="p-5 sm:p-7">
            <component :is="menuModalHeader" class="text-left pb-4 sm:pb-5" :class="{ 'border-b md:border-none': activeItem.grupos.length }">
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
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button v-for="option in link.Grupo.opcoes" :key="option.id" type="button" class="option-row" :class="{ selected: draftSelections.includes(option.id) }" @click="toggleDraft(link.Grupo, option.id)">
                    <span class="option-check"><Check class="h-3.5 w-3.5" /></span>
                    <span class="min-w-0 flex-1 text-left text-sm font-medium">{{ option.nome }}</span>
                    <span v-if="Number(option.precoAdicional) > 0" class="price text-sm font-semibold text-stone-600 dark:text-stone-300">+ {{ formatCurrencyBR(Number(option.precoAdicional)) }}</span>
                  </button>
                </div>
              </section>
            </div>
            </div>
          </div>
          <div class="shrink-0 border-t bg-white p-5 dark:bg-zinc-950 sm:px-7">
            <div class="grid grid-cols-4 gap-3 sm:flex-row sm:items-center">
              <div class="flex h-12 col-span-2 items-center justify-between rounded-xl bg-stone-100 p-1 dark:bg-zinc-800 sm:w-36">
                <button type="button" class="quantity-button h-10 w-10 bg-white dark:bg-zinc-900" :disabled="draftQuantity <= 1" @click="draftQuantity--">
                  <Minus class="h-4 w-4" />
                </button>
                <strong class="tabular-nums dark:text-zinc-100">{{ draftQuantity }}</strong>
                <button type="button" class="quantity-button h-10 w-10 bg-white dark:bg-zinc-900" @click="draftQuantity++">
                  <Plus class="h-4 w-4" />
                </button>
              </div>
              <span class="tap-button col-span-2 h-12 flex items-center px-4 rounded-xl text-base" :style="primaryButtonStyle" :disabled="!activeSelectionsValid" @click="saveActiveItem">
                <LucideBadgePlus class="mr-2 h-6 w-6" />
                <span class="hidden sm:inline" >Adicionar</span>
                <span class="price ml-auto">{{ formatCurrencyBR(activeUnitPrice * draftQuantity) }}</span>
              </span>
            </div>
            <Button type="button" variant="ghost" class="mobile-modal-close lg:hidden mt-2" @click="itemDialogOpen = false"><X class="h-4 w-4" />Fechar</Button>
          </div>
        </template>
      </component>
    </component>

    <Dialog v-model:open="itemAddedOpen">
      <DialogContent class="menu-overlay max-w-sm rounded-3xl p-6" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
        <DialogHeader class="text-left">
          <DialogTitle class="menu-heading text-xl">Item adicionado ao carrinho</DialogTitle>
          <DialogDescription>Deseja conferir o carrinho ou continuar escolhendo?</DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-2 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <Button type="button" variant="outline" class="order-2 sm:order-1" @click="continueShoppingAfterAdd">Continuar no cardápio</Button>
          <Button type="button" class="order-1 sm:order-2" :style="primaryButtonStyle" @click="goToCartAfterAdd"><ShoppingCart class="mr-2 h-4 w-4" />Ir ao carrinho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-if="suggestionsOpen" :default-open="true" @update:open="onSuggestionsOpenChange">
      <DialogContent class="menu-overlay max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl p-6" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
        <DialogHeader class="text-left">
          <DialogTitle class="menu-heading text-xl">Que tal complementar seu pedido?</DialogTitle>
          <DialogDescription>Você adicionou {{ itemName(suggestionSource) }}. Escolha uma opção para incluir agora, se quiser.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-3 sm:grid-cols-2">
          <article v-for="item in suggestedItems" :key="item.id" class="flex min-w-0 items-center gap-3 rounded-2xl border bg-white/70 p-3 dark:bg-zinc-900/70">
            <img v-if="itemImage(item)" :src="itemImage(item)" :alt="itemName(item)" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 dark:bg-zinc-800"><UtensilsCrossed class="h-5 w-5" /></div>
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-sm font-semibold">{{ itemName(item) }}</p>
              <p class="price mt-1 text-sm font-bold">{{ formatCurrencyBR(Number(item.Produto?.preco ?? item.preco)) }}</p>
              <p v-if="suggestionAddedItemId === item.id" class="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><Check class="h-3.5 w-3.5" />Adicionado ao carrinho</p>
            </div>
            <Button type="button" size="icon" class="shrink-0 rounded-xl" :class="{ 'bg-emerald-600 text-white hover:bg-emerald-700': suggestionAddedItemId === item.id }" :style="suggestionAddedItemId === item.id ? undefined : primaryButtonStyle" :aria-label="`Adicionar ${itemName(item)}`" @click="addSuggestedItem(item)"><Check v-if="suggestionAddedItemId === item.id" class="h-4 w-4" /><Plus v-else class="h-4 w-4" /></Button>
          </article>
        </div>
        <DialogFooter class="mt-2 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <Button type="button" variant="outline" class="order-2 sm:order-1" @click="continueShoppingAfterSuggestions">Continuar no cardápio</Button>
          <Button type="button" class="order-1 sm:order-2" :style="primaryButtonStyle" @click="goToCartAfterSuggestions"><ShoppingCart class="mr-2 h-4 w-4" />Ir ao carrinho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="cartDrawerOpen">
      <component :is="menuModalContent" class="menu-overlay max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:max-h-[90vh] lg:max-w-2xl lg:overflow-y-auto lg:rounded-[24px]" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
        <component :is="menuModalHeader" class="shrink-0 text-left lg:px-7 lg:pt-6"
          ><component :is="menuModalTitle" class="menu-heading text-xl justify-between w-full flex">Seu carrinho <Button @click="clearCart" class="text-red-500 bg-transparent rounded-lg" variant="outline"><Trash2 class="h-4 w-4" /></Button></component><component :is="menuModalDescription">{{ cartUnits }} {{ cartUnits === 1 ? 'item selecionado' : 'itens selecionados' }}</component></component
        >
        <div class="max-h-[calc(88dvh-10rem)] overflow-y-auto overscroll-contain touch-pan-y px-4">
          <div v-for="line in selecionados" :key="line.id" class="cart-line border-b py-4 last:border-0">
            <button type="button" class="cart-line-thumb" :aria-label="`Editar ${itemName(line.item)}`" @click="editCartLine(line)">
              <img v-if="itemImage(line.item)" :src="itemImage(line.item) || ''" :alt="itemName(line.item)" />
              <UtensilsCrossed v-else class="h-5 w-5" />
            </button>
            <div class="cart-line-copy">
              <button type="button" class="brand-hover block w-full truncate text-left text-sm font-semibold" @click="editCartLine(line)">
                {{ itemName(line.item) }}
              </button>
              <p v-if="selectedOptionNames(line).length" class="mt-0.5 truncate text-xs text-stone-500">
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
          <Button type="button" variant="ghost" class="mobile-modal-close lg:hidden" @click="cartDrawerOpen = false"><X class="h-4 w-4" />Fechar</Button>
        </component>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="checkoutOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-4xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
        <template v-if="orderResult">
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [scrollbar-gutter:stable] p-6 sm:p-9">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-700">
              <CheckCircle2 class="h-8 w-8" />
            </div>
            <component :is="menuModalHeader" class="mt-5 flex flex-col items-center justify-center text-center"
              ><component :is="menuModalTitle" class="menu-heading text-3xl">Pedido {{ orderResult.pedido.codigo }} recebido!</component><component :is="menuModalDescription">Agora é só acompanhar o pagamento e o preparo por este navegador.</component></component
            >
            <div class="mx-auto mt-7 max-w-lg space-y-4">
              <div class="flex justify-between rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
                <span>Total do pedido</span><strong class="price text-lg">{{ formatCurrencyBR(Number(orderResult.pedido.total)) }}</strong>
              </div>
              <div v-if="checkoutPaymentCompleted" class="space-y-2 rounded-2xl bg-emerald-50 p-5 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                <div class="flex items-center gap-2 font-semibold"><CheckCircle2 class="h-5 w-5" />Pagamento confirmado</div>
                <p class="text-sm">Recebemos seu Pix. O restaurante já pode seguir com o preparo do pedido.</p>
              </div>
              <div v-else-if="checkoutPaymentCancelled" class="space-y-2 rounded-2xl bg-amber-50 p-5 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                <p class="font-semibold">Pagamento indisponível</p>
                <p class="text-sm">Este Pix não está mais disponível. Consulte o restaurante para continuar.</p>
              </div>
              <div v-else-if="checkoutPaymentAction?.type === 'PIX'" class="brand-soft space-y-4 rounded-2xl p-5">
                <div class="flex items-start justify-between gap-3"><div><p class="font-semibold">Pague com Pix</p><p class="mt-1 text-sm text-stone-600 dark:text-stone-300">Escaneie o QR Code ou copie o código.</p></div><span v-if="pixTimeRemaining !== null" class="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold tabular-nums dark:bg-zinc-950/50" :class="{ 'text-red-600': pixExpired }"><Timer class="h-3.5 w-3.5" />{{ pixExpired ? 'Expirado' : `${formatPixTimeRemaining(pixTimeRemaining)} para pagar` }}</span></div>
                <div class="flex justify-center rounded-2xl bg-white p-3 dark:bg-zinc-950"><img v-if="checkoutPaymentAction.qrCodeDataUrl" :src="checkoutPaymentAction.qrCodeDataUrl" width="220" height="220" class="h-[220px] w-[220px] rounded-lg" alt="QR Code para pagamento Pix" /></div>
                <div class="flex min-w-0 items-center gap-2 rounded-xl border bg-white/65 p-2 dark:bg-zinc-950/40"><code class="min-w-0 flex-1 truncate px-2 text-xs text-stone-600 dark:text-stone-300">{{ truncatePixCode(checkoutPaymentAction.pixCopiaCola) }}</code><Button class="tap-button shrink-0" size="sm" :disabled="pixExpired" @click="copyPix(checkoutPaymentAction)"><Check v-if="pixCopied" class="mr-1.5 h-4 w-4" /><Clipboard v-else class="mr-1.5 h-4 w-4" />{{ pixCopied ? 'Copiado' : 'Copiar Pix' }}</Button></div>
                <p v-if="pixExpired" class="text-sm font-medium text-red-600">Este código expirou. Gere um novo pedido para receber outro Pix.</p>
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
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y lg:overflow-hidden">
            <div class="grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-6 p-6 sm:p-8 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
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
                  <div class="space-y-2"><Label for="customer-phone">Telefone</Label><Input id="customer-phone" v-model="form.telefone" v-maska="phoneMaskOptions" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" /></div>
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
                <p class="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-900 px-3 py-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-100">
                  <LocateFixed class="mt-0.5 h-4 w-4 shrink-0" />
                  Usar sua localização ajuda o entregador a encontrar sua casa no mapa e na rota. Os campos de endereço continuam obrigatórios para calcular a entrega.
                </p>
                <p v-if="form.latitude !== null && form.longitude !== null" class="flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 class="h-3.5 w-3.5" />Localização adicionada ao pedido para a rota do entregador.</p>
                <div v-if="customerAccount?.enderecos.length" class="space-y-1"><Label>Endereço salvo</Label><Select :model-value="selectedAccountAddressId ? String(selectedAccountAddressId) : 'MANUAL'" @update:model-value="selectAccountAddress(String($event))"><SelectTrigger class="w-full bg-white dark:bg-zinc-950"><SelectValue placeholder="Preencher manualmente" /></SelectTrigger><SelectContent><SelectItem value="MANUAL">Preencher manualmente</SelectItem><SelectItem v-for="address in customerAccount.enderecos" :key="address.id" :value="String(address.id)">{{ address.rotulo || address.logradouro }} · {{ address.numero }}</SelectItem></SelectContent></Select></div>
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
                <RadioGroup v-model="pagamento" class="grid gap-3 sm:grid-cols-2"
                  ><label v-if="cardapio?.restaurante.pagamentoNaEntregaAtivo" class="choice-card compact" :class="{ selected: pagamento === 'NA_ENTREGA' }"><RadioGroupItem value="NA_ENTREGA" /><Banknote class="h-4 w-4 shrink-0" /><span class="text-sm font-medium">Na entrega</span></label
                  ><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="choice-card compact" :class="{ selected: pagamento === 'PIX' }"><RadioGroupItem value="PIX" /><QrCode class="h-4 w-4 shrink-0" /><span class="text-sm font-medium">Pix</span></label></RadioGroup
                >
                <div v-if="pagamento === 'NA_ENTREGA'" class="space-y-3 rounded-xl border bg-stone-50 p-3 dark:bg-zinc-900">
                  <div>
                    <p class="text-sm font-medium">Como vai pagar na {{ origem === 'DELIVERY' ? 'entrega' : 'retirada' }}?</p>
                    <p class="mt-0.5 text-xs text-stone-500">Informe para a equipe preparar a cobrança.</p>
                  </div>
                  <RadioGroup v-model="pagamentoNaEntrega" class="grid gap-2 sm:grid-cols-3">
                    <label class="choice-card compact" :class="{ selected: pagamentoNaEntrega === 'DINHEIRO' }"><RadioGroupItem value="DINHEIRO" /><Banknote class="h-4 w-4 shrink-0" /><span class="text-sm font-medium">Dinheiro</span></label>
                    <label class="choice-card compact" :class="{ selected: pagamentoNaEntrega === 'CREDITO' }"><RadioGroupItem value="CREDITO" /><CreditCard class="h-4 w-4 shrink-0" /><span class="text-sm font-medium">Cartão de crédito</span></label>
                    <label class="choice-card compact" :class="{ selected: pagamentoNaEntrega === 'DEBITO' }"><RadioGroupItem value="DEBITO" /><WalletCards class="h-4 w-4 shrink-0" /><span class="text-sm font-medium">Cartão de débito</span></label>
                  </RadioGroup>
                  <template v-if="pagamentoNaEntrega === 'DINHEIRO'">
                    <label class="flex items-center gap-2 text-sm font-medium"><input v-model="precisaTroco" type="checkbox" class="h-4 w-4 rounded border-input" />Preciso de troco</label>
                    <div v-if="precisaTroco" class="space-y-1">
                      <Label for="change-for">Levar troco para</Label>
                      <Input id="change-for" v-model="trocoPara" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 100,00" />
                      <p v-if="quote && trocoPara && !trocoValido" class="text-xs text-destructive">Informe um valor igual ou maior que o total de {{ formatCurrencyBR(Number(quote.total)) }}.</p>
                    </div>
                  </template>
                </div>
              </section>
              <section v-if="availableCheckoutRewards.length" class="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
                <div><h3 class="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100"><Gift class="h-4 w-4" />Recompensas disponíveis</h3><p class="mt-1 text-xs text-amber-900/75 dark:text-amber-100/75">Adicione o item premiado e aplique seu desconto antes de confirmar o pedido.</p></div>
                <div v-for="program in availableCheckoutRewards" :key="program.id" class="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/80 p-3 dark:border-amber-900 dark:bg-zinc-950/50 sm:flex-row sm:items-center sm:justify-between"><div class="min-w-0"><p class="font-medium text-sm">{{ program.descontoPercentual }}% de desconto em {{ program.premio?.nome }}</p><p v-if="rewardIsSelected(program)" class="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><Check class="h-3.5 w-3.5" />Recompensa aplicada a este pedido</p><p v-else class="mt-0.5 text-xs text-muted-foreground">{{ rewardIsInCart(program) ? 'O item já está no carrinho. Aplique o desconto.' : 'Adicione o item premiado ao carrinho para usar.' }}</p></div><Button size="sm" class="tap-button shrink-0" :variant="rewardIsSelected(program) ? 'outline' : 'default'" @click="rewardIsInCart(program) ? toggleReward(program) : addRewardToCart(program)"><Check v-if="rewardIsSelected(program)" class="mr-1.5 h-4 w-4" />{{ rewardIsSelected(program) ? 'Remover' : rewardIsInCart(program) ? 'Aplicar desconto' : 'Adicionar e aplicar' }}</Button></div>
              </section>
              <div class="space-y-2"><Label for="order-note">Observação do pedido</Label><Textarea id="order-note" v-model="form.observacao" rows="3" placeholder="Ex.: tirar cebola, chamar no portão..." /></div>
            </div>

            <aside class="border-t bg-stone-50 p-6 dark:bg-zinc-900 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:border-l lg:border-t-0 sm:p-7">
              <h3 class="menu-heading shrink-0 text-lg font-semibold">Resumo do pedido</h3>
              <div
                class="mt-4 space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-0 lg:[scrollbar-gutter:stable]"
                aria-label="Itens do carrinho"
              >
                <div v-for="line in selecionados" :key="line.id" class="flex gap-3 text-sm bg-stone-100 dark:bg-slate-900 p-2 border rounded-md">
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
              <div class="shrink-0">
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
                  <div v-if="displayedRewardDiscount > 0" class="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Recompensa</span><span class="price">- {{ formatCurrencyBR(displayedRewardDiscount) }}</span></div>
                  <div class="flex justify-between text-lg">
                    <strong>Total</strong><strong class="price">{{ formatCurrencyBR(displayedQuoteTotal ?? Number(quote.total)) }}</strong>
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
              </div>
            </aside>
            </div>
          </div>
          <component :is="menuModalFooter" class="shrink-0 border-t bg-white dark:bg-zinc-950 lg:hidden">
            <Button type="button" variant="ghost" class="mobile-modal-close" @click="checkoutOpen = false"><X class="h-4 w-4" />Fechar</Button>
          </component>
        </template>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="historyOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-2xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
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
        <component :is="menuModalFooter" class="shrink-0 border-t bg-white dark:bg-zinc-950 lg:hidden">
          <Button type="button" variant="ghost" class="mobile-modal-close" @click="historyOpen = false"><X class="h-4 w-4" />Fechar</Button>
        </component>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="trackingDetailsOpen">
      <component :is="menuModalContent" class="menu-overlay h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:h-[min(90vh,760px)] lg:max-h-[90vh] lg:max-w-2xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]" :class="{ dark: menuDarkMode, 'text-zinc-100': menuDarkMode }" :content-style="menuThemeStyle">
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

            <section v-if="trackingDetails.paymentAction" class="tracking-section">
              <div class="tracking-section-heading"><CreditCard class="brand-text h-4 w-4" /><h3>Pagamento online</h3></div>
              <div class="rounded-2xl border p-4">
                <p class="text-sm font-semibold">Aguardando pagamento</p>
                <p class="mt-1 text-xs text-stone-500">Use este link para retomar o pagamento do pedido.</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <Button v-if="trackingDetails.paymentAction.type === 'PIX'" size="sm" variant="outline" @click="copyPix(trackingDetails.paymentAction)"><Clipboard class="mr-1.5 h-4 w-4" />Copiar Pix</Button>
                </div>
              </div>
            </section>

            <section v-if="trackingDetails.podeCancelar" class="tracking-section">
              <div class="tracking-section-heading"><X class="h-4 w-4 text-red-600" /><h3>Precisa cancelar?</h3></div>
              <div class="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20">
                <p class="text-sm font-semibold text-red-950 dark:text-red-100">O cancelamento está disponível até a cozinha iniciar o preparo.</p>
                <p class="mt-1 text-xs text-red-800/80 dark:text-red-200/80">Depois do início do preparo, fale diretamente com o restaurante.</p>
                <Button variant="destructive" size="sm" class="mt-3" :disabled="cancelandoPedido" @click="cancelarPedidoPublico"><LoaderCircle v-if="cancelandoPedido" class="mr-1.5 h-4 w-4 animate-spin" /><X v-else class="mr-1.5 h-4 w-4" />Cancelar pedido</Button>
              </div>
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
        <component :is="menuModalFooter" class="shrink-0 border-t bg-white dark:bg-zinc-950 lg:hidden">
          <Button type="button" variant="ghost" class="mobile-modal-close" @click="trackingDetailsOpen = false"><X class="h-4 w-4" />Fechar</Button>
        </component>
      </component>
    </component>

    <component :is="menuModalRoot" v-bind="menuModalRootProps" v-model:open="accountOpen">
      <component :is="menuModalContent"
        class="menu-overlay max-h-[88dvh] overflow-hidden rounded-t-[24px] border-0 p-0 lg:flex lg:max-h-[90vh] lg:max-w-2xl lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-[24px]"
        :class="[
          accountMode === 'profile' ? 'h-[88dvh] lg:h-[min(90vh,760px)]' : 'h-auto lg:h-auto',
          { dark: menuDarkMode, 'text-zinc-100': menuDarkMode },
        ]"
        :content-style="menuThemeStyle">
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
        <component :is="menuModalFooter" class="shrink-0 border-t bg-white dark:bg-zinc-950 lg:hidden">
          <Button type="button" variant="outline" class="mobile-modal-close" @click="accountOpen = false"><X class="h-4 w-4" />Fechar</Button>
        </component>
      </component>
    </component>
    <footer v-if="cardapio" class="menu-system-footer" aria-label="Informações do sistema">
      <a href="https://www.instagram.com/nexosistemas.br?igsh=ZGE1MmZibDJtb29z" target="_blank" rel="noopener noreferrer">
        Criado por Nexo Sistemas <span aria-hidden="true">·</span> {{ currentYear }}
      </a>
    </footer>
    <ConfirmModal />
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
  /* Área após o footer mantém o fundo do cardápio até a barra fixa. */
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.menu-system-footer {
  margin: 1.5rem auto 0;
  padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
  border-top: 1px solid color-mix(in srgb, var(--menu-ink) 10%, transparent);
  color: color-mix(in srgb, var(--menu-muted) 82%, transparent);
  font-size: 0.65rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
}

.menu-system-footer span { margin-inline: 0.45rem; opacity: 0.55; }

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

.menu-theme-mobile {
  display: none;
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
.menu-toolbar--fixed {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
}
.promotion-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 2px;
  color: var(--menu-muted);
  font-size: 0.84rem;
  font-weight: 750;
}
.promotion-back:hover { color: var(--menu-accent); }
.promo-carousel {
  overflow: hidden;
}
.promo-carousel-viewport {
  overflow: hidden;
  border-radius: 18px;
}
.promo-carousel-track {
  display: flex;
  transition: transform 440ms cubic-bezier(.2,.8,.2,1);
}
.promo-summary-card {
  display: flex;
  min-width: 100%;
  min-height: 90px;
  align-items: center;
  gap: 12px;
  padding: 14px 15px;
  border: 1px solid color-mix(in srgb, var(--menu-accent) 24%, transparent);
  color: var(--menu-ink);
  text-align: left;
  background:
    radial-gradient(circle at 100% 0, color-mix(in srgb, var(--menu-accent) 16%, transparent), transparent 50%),
    linear-gradient(120deg, color-mix(in srgb, var(--menu-accent) 8%, var(--menu-surface)), var(--menu-surface));
  box-shadow: 0 7px 20px color-mix(in srgb, var(--menu-accent) 7%, transparent);
}
.promo-summary-card--frete {
  border-color: rgba(5, 150, 105, 0.28);
  background: radial-gradient(circle at 100% 0, rgba(5,150,105,.15), transparent 50%), linear-gradient(120deg, rgba(5,150,105,.07), var(--menu-surface));
}
.promo-summary-card--pedido-minimo {
  border-color: rgba(180, 83, 9, 0.3);
  background: radial-gradient(circle at 100% 0, rgba(245, 158, 11, .18), transparent 50%), linear-gradient(120deg, rgba(245, 158, 11, .09), var(--menu-surface));
}
.promo-summary-card:active { scale: .985; }
.promo-summary-icon,
.promotion-detail-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 13px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 7px 16px color-mix(in srgb, var(--menu-accent) 26%, transparent);
}
.promo-summary-card--frete .promo-summary-icon,
.promotion-detail-card--shipping .promotion-detail-icon {
  background: #059669;
  box-shadow: 0 7px 16px rgba(5,150,105,.22);
}
.promo-summary-card--pedido-minimo .promo-summary-icon {
  color: #fffbeb;
  background: #b45309;
  box-shadow: 0 7px 16px rgba(180, 83, 9, .24);
}
.promo-summary-card small,
.promo-summary-card strong,
.promo-summary-card em {
  display: block;
}
.promo-summary-card small {
  color: var(--menu-accent);
  font-size: .61rem;
  font-weight: 850;
  letter-spacing: .12em;
}
.promo-summary-card--frete small { color: #047857; }
.promo-summary-card--pedido-minimo small { color: #92400e; }
.promo-summary-card strong {
  margin-top: 1px;
  font-size: .92rem;
  font-weight: 800;
  line-height: 1.25;
}
.promo-summary-card em {
  overflow: hidden;
  margin-top: 2px;
  color: var(--menu-muted);
  font-size: .75rem;
  font-style: normal;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.promo-carousel-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-top: 9px;
}
.promo-carousel-dots button {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--menu-muted) 28%, transparent);
  transition: width 180ms ease, background-color 180ms ease;
}
.promo-carousel-dots button.active {
  width: 22px;
  background: var(--menu-accent);
}
.promotion-detail-card {
  display: flex;
  gap: 14px;
  border: 1px solid rgba(5,150,105,.28);
  border-radius: 22px;
  padding: 18px;
  background: radial-gradient(circle at 100% 0, rgba(5,150,105,.14), transparent 52%), linear-gradient(120deg, rgba(5,150,105,.08), var(--menu-surface));
  box-shadow: 0 8px 24px rgba(5,150,105,.08);
}
.promotion-detail-card h3 {
  margin: 1px 0 0;
  color: var(--menu-ink);
  font-size: 1.1rem;
  font-weight: 850;
}
.promotion-detail-card p:last-child {
  margin: 5px 0 0;
  color: var(--menu-muted);
  font-size: .84rem;
  line-height: 1.4;
}
.loyalty-banner {
  display: grid;
  gap: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--menu-accent) 34%, transparent);
  border-radius: 22px;
  padding: 17px;
  color: color-mix(in srgb, var(--menu-ink) 90%, var(--menu-accent));
  background:
    radial-gradient(circle at 100% 0, color-mix(in srgb, var(--menu-accent) 16%, transparent), transparent 45%),
    linear-gradient(120deg, color-mix(in srgb, var(--menu-accent) 10%, var(--menu-surface)), var(--menu-surface));
  box-shadow: 0 8px 24px color-mix(in srgb, var(--menu-accent) 9%, transparent);
}
.loyalty-banner-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}
.loyalty-banner-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 13px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: 0 7px 16px color-mix(in srgb, var(--menu-accent) 26%, transparent);
}
.loyalty-eyebrow {
  margin: 0 0 1px;
  color: var(--menu-accent);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.loyalty-banner h2,
.loyalty-banner h3 {
  margin: 0;
  color: var(--menu-ink);
  font-size: 1rem;
  font-weight: 800;
}
.loyalty-reward {
  border-radius: 15px;
  padding: 13px 14px;
  color: var(--menu-accent-foreground);
  background: var(--menu-accent);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.22);
}
.loyalty-reward > span {
  display: block;
  font-size: 0.61rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  opacity: 0.78;
}
.loyalty-reward strong {
  display: block;
  margin-top: 2px;
  font-size: 1.3rem;
  line-height: 1.1;
}
.loyalty-reward p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  opacity: 0.9;
}
.loyalty-steps {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.loyalty-steps li {
  display: flex;
  gap: 9px;
  color: var(--menu-ink);
  font-size: 0.82rem;
}
.loyalty-steps li > span {
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border-radius: 999px;
  color: var(--menu-accent-foreground);
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--menu-accent);
}
.loyalty-steps b {
  display: block;
  font-size: 0.82rem;
}
.loyalty-steps p {
  margin: 2px 0 0;
  color: var(--menu-muted);
  line-height: 1.35;
}
.loyalty-eligible-items {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}
.loyalty-eligible-items em {
  border: 1px solid color-mix(in srgb, var(--menu-accent) 22%, transparent);
  border-radius: 999px;
  padding: 3px 7px;
  color: color-mix(in srgb, var(--menu-ink) 84%, var(--menu-accent));
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 700;
  background: color-mix(in srgb, var(--menu-accent) 8%, var(--menu-surface));
}
.loyalty-progress {
  border-top: 1px solid color-mix(in srgb, var(--menu-accent) 18%, transparent);
  padding-top: 13px;
}
.loyalty-progress-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--menu-muted);
  font-size: 0.75rem;
}
.loyalty-progress-heading strong {
  color: var(--menu-ink);
  font-size: 0.78rem;
}
.loyalty-progress-track {
  height: 8px;
  overflow: hidden;
  margin-top: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--menu-accent) 13%, var(--menu-surface));
}
.loyalty-progress-track span {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: var(--menu-accent);
  transition: width 300ms ease-out;
}
.loyalty-progress.reward-available .loyalty-progress-track span {
  background: #059669;
}
.loyalty-progress > p,
.loyalty-login {
  margin: 8px 0 0;
  color: var(--menu-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}
.loyalty-login {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  color: var(--menu-accent);
  font-weight: 800;
  text-align: left;
}
.loyalty-login:hover {
  text-decoration: underline;
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
.cart-line-thumb {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  overflow: hidden;
  place-items: center;
  border-radius: 12px;
  color: var(--menu-muted);
  background: rgba(120, 113, 108, 0.09);
}
.cart-line-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cart-line-copy {
  min-width: 0;
  flex: 1 1 0%;
  overflow: hidden;
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
.menu-overlay.dark {
  color: #f8fafc !important;
  background: #020617;
}
.menu-overlay.dark .menu-heading,
.menu-overlay.dark .history-order,
.menu-overlay.dark .tracking-summary,
.menu-overlay.dark .tracking-average,
.menu-overlay.dark .tracking-item {
  color: #f8fafc !important;
}
.menu-overlay.dark .text-stone-600,
.menu-overlay.dark .text-stone-500,
.menu-overlay.dark .text-stone-400 {
  color: #a1a1aa !important;
}
.menu-overlay.dark :deep(.text-stone-950),
.menu-overlay.dark :deep(.text-red-950),
.menu-overlay.dark :deep(.text-amber-950) {
  color: #f8fafc;
}
.menu-overlay.dark :deep(.text-stone-600),
.menu-overlay.dark :deep(.text-stone-500),
.menu-overlay.dark :deep(.text-stone-400) {
  color: #a1a1aa;
}
.menu-overlay.dark :deep(.bg-white),
.menu-overlay.dark :deep(.bg-white\/65),
.menu-overlay.dark :deep(.bg-stone-50),
.menu-overlay.dark :deep(.bg-stone-100),
.menu-overlay.dark :deep(.bg-gray-100) {
  background-color: #111827;
}
.menu-overlay.dark :deep(input),
.menu-overlay.dark :deep(textarea),
.menu-overlay.dark :deep(select) {
  color: #f8fafc;
  border-color: #334155;
  background-color: #111827;
}
.menu-overlay.dark :deep(input::placeholder),
.menu-overlay.dark :deep(textarea::placeholder) { color: #71717a; }
.menu-overlay.dark :deep(.border),
.menu-overlay.dark :deep(.border-t),
.menu-overlay.dark :deep(.border-b),
.menu-overlay.dark :deep(.border-l) { border-color: #273449; }
.menu-overlay.dark .option-row,
.menu-overlay.dark .choice-card,
.menu-overlay.dark .tracking-item {
  color: #f8fafc;
  background: #111827;
  box-shadow: inset 0 0 0 1px #273449;
}
.menu-overlay.dark .option-row:hover,
.menu-overlay.dark .choice-card:hover { background: #172033; }
.menu-overlay.dark .option-row.selected,
.menu-overlay.dark .choice-card.selected {
  color: #f8fafc;
  border-color: color-mix(in srgb, var(--menu-accent) 72%, #f8fafc);
  background: color-mix(in srgb, var(--menu-accent) 20%, #111827);
}
.menu-overlay.dark .option-check,
.menu-overlay.dark .choice-icon {
  color: #f8fafc;
  background: #1f2937;
  box-shadow: inset 0 0 0 1px #475569;
}
.menu-overlay.dark .option-row.selected .option-check { color: var(--menu-accent-foreground); }
.menu-overlay.dark .quantity-button {
  color: #f8fafc;
  background: #1f2937;
}
.menu-overlay.dark .mobile-modal-close {
  color: #e4e4e7;
  border-color: #334155;
  background: #111827;
}
.menu-overlay.dark .history-order,
.menu-overlay.dark .tracking-average,
.menu-overlay.dark .tracking-map-shell {
  border-color: #334155;
  background: #111827;
  box-shadow: none;
}
.menu-overlay.dark .tracking-map-wait { border-color: #334155; color: #a1a1aa; }
.mobile-modal-close {
  min-width: 104px;
  width: 100%;
  min-height: 44px;
  margin-inline: auto;
  border: 1px solid rgba(43, 37, 32, 0.08);
  border-radius: 12px;
  background: color-mix(in srgb, var(--menu-accent) 3%, white);
  color: var(--menu-muted);
  font-size: 0.8125rem;
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
  .menu-theme-mobile {
    position: absolute;
    top: 14px;
    right: 16px;
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 11px;
    color: white;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);
  }
  .menu-hero > .relative { min-height: 84px; padding-top: 18px; padding-bottom: 18px; }
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
